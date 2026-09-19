import { supabase } from '@/lib/supabaseClient';
import { PLATFORM_OWNERS } from '@/lib/platformAdmins';

// ---------------------------------------------------------------------------
// Entity <-> table name mapping
// ---------------------------------------------------------------------------
// base44 entities are PascalCase (e.g. "RoomType"); Supabase/Postgres tables
// here are expected as snake_case singular (e.g. "room_type"). Adjust
// ENTITY_TABLE_OVERRIDES below if your actual table names differ.
const toSnakeCase = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

const ENTITY_TABLE_OVERRIDES = {
  // EntityName: 'actual_table_name',
};

const tableNameFor = (entity) => ENTITY_TABLE_OVERRIDES[entity] || toSnakeCase(entity);

// Entities that are platform-wide (cross-tenant) rather than scoped to one
// organization. Platform admins operate on these; regular org-scoped
// entities are automatically filtered by organization_id below.
// Review this list against your real data model — it's a best-effort
// classification based on how each entity is used in src/pages/platform/*.
const PLATFORM_LEVEL_ENTITIES = new Set([
  'Organization',
  'User',
  'PlatformAdmin',
  'PlatformAnnouncement',
  'PlatformIncident',
  'PlatformSubscription',
  'CommercialCode',
  'SubscriptionSetting',
  'SubscriptionPaymentMethod',
  'AuditLog',
  'SecurityAlert',
  'FeatureFlag',
  'PlatformCommission',
  'AdPricingSetting',
]);

// ---------------------------------------------------------------------------
// Current-user / organization context
// ---------------------------------------------------------------------------
let cachedUser = null;

const mapSupabaseUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    role: user.user_metadata?.role || user.app_metadata?.role || 'user',
    organization_id: user.user_metadata?.organization_id || null,
    ...user.user_metadata,
  };
};

const getCurrentUser = async () => {
  if (cachedUser) return cachedUser;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  cachedUser = mapSupabaseUser(data.user);
  return cachedUser;
};

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUser = mapSupabaseUser(session?.user || null);
  cachedIsPlatformAdmin = null;
});

// ---------------------------------------------------------------------------
// Platform-admin detection (mirrors PlatformLayout.jsx's own gating check:
// hardcoded owners in PLATFORM_OWNERS, or an explicit platform_admin row).
// Org-scoped entity queries below use this to skip the organization_id
// filter for platform admins, so /platform/* pages actually see cross-
// tenant data instead of only the admin's own organization. RLS enforces
// the same rule server-side (see is_platform_admin() and the updated
// policies in supabase/add-ads-commissions-platform-crosstenant.sql) — this
// client-side check is purely an optimization/UX concern, never the actual
// security boundary.
// ---------------------------------------------------------------------------
let cachedIsPlatformAdmin = null;

const isCurrentUserPlatformAdmin = async () => {
  if (cachedIsPlatformAdmin !== null) return cachedIsPlatformAdmin;
  const user = await getCurrentUser();
  if (!user?.email) return (cachedIsPlatformAdmin = false);
  if (PLATFORM_OWNERS.includes(user.email.toLowerCase())) {
    return (cachedIsPlatformAdmin = true);
  }
  try {
    const { data, error } = await supabase.from('platform_admin').select('email').eq('email', user.email);
    if (error) throw error;
    cachedIsPlatformAdmin = (data || []).length > 0;
  } catch {
    cachedIsPlatformAdmin = false;
  }
  return cachedIsPlatformAdmin;
};

// ---------------------------------------------------------------------------
// data-column flattening
// ---------------------------------------------------------------------------
// The real Postgres tables (see supabase/schema.sql) store almost every
// field inside a single `data jsonb` column — only `id`, `organization_id`,
// `created_at` and `updated_at` (plus a couple of historical exceptions
// below) are real typed columns. Every page in this app, though, reads and
// writes plain flat fields (`property.name`, `roomType.base_price`, ...).
// This layer bridges the two transparently, in one place, so no page has
// to know or care which fields happen to be real columns vs. jsonb.
const STANDARD_COLUMNS = new Set(['id', 'organization_id', 'data', 'created_at', 'updated_at']);

// A few tables were created with some fields promoted to real typed
// columns instead of living inside `data` — reflected here so writes to
// those specific fields target the real column instead of being nested.
const EXTRA_REAL_COLUMNS = {
  organization: new Set(['name']),
  platform_admin: new Set(['user_id', 'email', 'role', 'added_by']),
};

const isRealColumn = (table, key) => STANDARD_COLUMNS.has(key) || (EXTRA_REAL_COLUMNS[table]?.has(key) ?? false);

// Merges the jsonb `data` blob up to the top level so callers can read
// `row.name` regardless of whether `name` is a real column or lives in
// `data`. Real top-level columns win on the rare chance of a name clash.
const flattenRow = (table, row) => {
  if (!row) return row;
  const { data, ...rest } = row;
  return { ...(data || {}), ...rest };
};

// Splits a flat payload into { columns, data } for writing: known real
// columns stay top-level, everything else nests under `data`.
const splitPayload = (table, payload) => {
  const columns = {};
  const data = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (isRealColumn(table, key)) columns[key] = value;
    else data[key] = value;
  }
  return { columns, data };
};

// PostgREST supports filtering/ordering on a jsonb path when the column
// name is passed as e.g. "data->>field". Real columns are referenced
// directly; anything else is redirected into the jsonb blob.
const columnRef = (table, field) => (isRealColumn(table, field) ? field : `data->>${field}`);

// ---------------------------------------------------------------------------
// Generic entity CRUD, backed by Supabase tables
// ---------------------------------------------------------------------------
const buildEntityClient = (entityName) => {
  const table = tableNameFor(entityName);
  const isOrgScoped = !PLATFORM_LEVEL_ENTITIES.has(entityName);

  const scoped = async (query) => {
    if (!isOrgScoped) return query;
    // Platform admins see across every tenant (PlatformOverview,
    // PlatformOrganizations, the Ad Manager moderation queue, etc. all rely
    // on this) — RLS grants the same cross-tenant access, so this filter
    // skip is consistent with what the database will actually return.
    if (await isCurrentUserPlatformAdmin()) return query;
    const user = await getCurrentUser();
    if (user?.organization_id) {
      return query.eq('organization_id', user.organization_id);
    }
    return query;
  };

  return {
    // list(sort, limit) — sort is e.g. "-created_date" (desc) or "created_date" (asc)
    async list(sort, limit = 1000) {
      let query = supabase.from(table).select('*');
      if (sort) {
        const descending = sort.startsWith('-');
        const field = descending ? sort.slice(1) : sort;
        query = query.order(columnRef(table, field), { ascending: !descending });
      }
      if (limit) query = query.limit(limit);
      query = await scoped(query);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => flattenRow(table, row));
    },

    async filter(criteria = {}) {
      let query = supabase.from(table).select('*');
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.eq(columnRef(table, key), value);
      });
      query = await scoped(query);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => flattenRow(table, row));
    },

    async get(id) {
      let query = supabase.from(table).select('*').eq('id', id);
      query = await scoped(query);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return flattenRow(table, data);
    },

    async create(payload) {
      const user = await getCurrentUser();
      const merged = { ...payload };
      if (isOrgScoped && user?.organization_id && merged.organization_id == null) {
        merged.organization_id = user.organization_id;
      }
      const { columns, data } = splitPayload(table, merged);
      const row = { ...columns, data };
      const { data: created, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return flattenRow(table, created);
    },

    async update(id, payload) {
      const { columns, data } = splitPayload(table, payload);
      const updateRow = { ...columns, updated_at: new Date().toISOString() };
      if (Object.keys(data).length > 0) {
        // Merge into the existing `data` blob so a partial update (e.g.
        // { base_price: 120 }) doesn't wipe out sibling fields that were
        // already stored (name, capacity, ...). There's no DB trigger that
        // bumps updated_at on UPDATE (only a default on INSERT), so it's
        // set manually above too.
        let existingQuery = supabase.from(table).select('data').eq('id', id);
        existingQuery = await scoped(existingQuery);
        const { data: existingRow, error: fetchError } = await existingQuery.maybeSingle();
        if (fetchError) throw fetchError;
        updateRow.data = { ...(existingRow?.data || {}), ...data };
      }
      let query = supabase.from(table).update(updateRow).eq('id', id);
      query = await scoped(query);
      const { data: updated, error } = await query.select().maybeSingle();
      if (error) throw error;
      return flattenRow(table, updated);
    },

    async delete(id) {
      let query = supabase.from(table).delete().eq('id', id);
      query = await scoped(query);
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    },

    // Creates several rows in one call — each goes through the same
    // jsonb-wrapping as create() (organization_id auto-attached, etc.).
    async bulkCreate(payloads) {
      return Promise.all((payloads || []).map(payload => this.create(payload)));
    },

    // Finds rows matching `criteria` (same shape as filter()) and applies
    // `{ $set: patch }` to each — Mongo-style call signature kept for
    // call-site compatibility with the rest of the app.
    async updateMany(criteria, { $set: patch } = {}) {
      const matches = await this.filter(criteria || {});
      return Promise.all(matches.map(row => this.update(row.id, patch || {})));
    },
  };
};

// `User` doesn't map to a generic table — team members live across two
// real tables (memberships for the org link + role, profiles for name/
// email/avatar), and profiles has no organization_id column at all. This
// mirrors what TeamAccess.jsx and Subscription.jsx actually need: every
// profile belonging to someone who shares an organization with the
// current user.
const userEntityClient = {
  async list() {
    const user = await getCurrentUser();
    if (!user?.organization_id) return [];
    const { data: memberRows, error: memberError } = await supabase
      .from('memberships')
      .select('user_id, role')
      .eq('organization_id', user.organization_id);
    if (memberError) throw memberError;
    const userIds = (memberRows || []).map(m => m.user_id);
    if (userIds.length === 0) return [];
    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .in('id', userIds);
    if (profileError) throw profileError;
    const roleByUserId = Object.fromEntries((memberRows || []).map(m => [m.user_id, m.role]));
    return (profileRows || []).map(p => ({ ...p, role: roleByUserId[p.id] || p.role }));
  },
};

const entities = new Proxy({}, {
  get: (_target, entityName) => (entityName === 'User' ? userEntityClient : buildEntityClient(entityName)),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const auth = {
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  },

  async me() {
    const user = await getCurrentUser();
    if (!user) throw { status: 401, message: 'Not authenticated' };
    return user;
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    cachedUser = mapSupabaseUser(data.user);
    return cachedUser;
  },

  loginWithProvider(provider, returnTo) {
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: returnTo || window.location.origin },
    });
  },

  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw error;
    cachedUser = mapSupabaseUser(data.user);
    return { access_token: data.session?.access_token };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  // Supabase manages the session internally once verifyOtp/signIn resolves,
  // so there is no separate token to set — kept as a no-op for call-site
  // compatibility with the rest of the app.
  setToken() {},

  async updateMe(patch) {
    const { data, error } = await supabase.auth.updateUser({ data: patch });
    if (error) throw error;
    cachedUser = mapSupabaseUser(data.user);
    return cachedUser;
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  // resetToken isn't needed: the recovery link Supabase emails already
  // establishes an authenticated recovery session before this page loads.
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  logout(redirectUrl) {
    cachedUser = null;
    supabase.auth.signOut().then(() => {
      if (redirectUrl) window.location.href = redirectUrl;
    });
  },

  redirectToLogin(returnTo) {
    const suffix = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.href = `/login${suffix}`;
  },
};

// ---------------------------------------------------------------------------
// App-level settings
// ---------------------------------------------------------------------------
// base44 used this to gate access to the whole app before checking the user.
// Supabase apps are open by default (RLS enforces data isolation per-row
// instead), so this just succeeds — kept only so AuthContext's existing
// call site doesn't need special-casing.
const app = {
  async getPublicSettings() {
    return { public_settings: {} };
  },
};

// ---------------------------------------------------------------------------
// File uploads (Supabase Storage)
// ---------------------------------------------------------------------------
const integrations = {
  Core: {
    async UploadFile({ file, bucket = 'uploads', path, isPrivate = false } = {}) {
      if (!file) return { file_url: '' };
      const filePath = path || `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      });
      if (error) throw error;
      if (isPrivate) {
        // Private buckets (e.g. kyc-documents) have no public URL — issue a
        // long-lived signed URL instead. Re-fetch a fresh one on later
        // views via getSignedFileUrl() rather than assuming this one still
        // works indefinitely.
        const { data, error: signError } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60 * 24 * 365);
        if (signError) throw signError;
        return { file_url: data?.signedUrl || '', path: filePath };
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return { file_url: data?.publicUrl || '', path: filePath };
    },
    async getSignedFileUrl({ bucket, path, expiresIn = 3600 } = {}) {
      if (!bucket || !path) return { file_url: '' };
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (error) throw error;
      return { file_url: data?.signedUrl || '' };
    },
  },
};

// Real team-member invitations, backed by the invite-user Supabase Edge
// Function (deployed separately — it holds the service-role key needed
// for auth.admin.inviteUserByEmail, which must never reach the client).
// TeamAccess.jsx previously called db.users.inviteUser(...), a method
// that didn't exist anywhere — every invite attempt threw immediately.
const users = {
  async inviteUser(email, role) {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role },
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.message || data.error);
    return data;
  },
};

export const db = { auth, app, entities, integrations, users };
export { isCurrentUserPlatformAdmin };

// Every page in this app reads `globalThis.__B44_DB__` (base44's own
// generated pattern) falling back to an empty stub if it isn't set. Setting
// it once here, before React renders (see main.jsx), wires the entire app
// to this Supabase-backed implementation without editing those pages.
globalThis.__B44_DB__ = db;

export default db;
