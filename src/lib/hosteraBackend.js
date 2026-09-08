import { supabase } from '@/lib/supabaseClient';

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
});

// ---------------------------------------------------------------------------
// Generic entity CRUD, backed by Supabase tables
// ---------------------------------------------------------------------------
const buildEntityClient = (entityName) => {
  const table = tableNameFor(entityName);
  const isOrgScoped = !PLATFORM_LEVEL_ENTITIES.has(entityName);

  const scoped = async (query) => {
    if (!isOrgScoped) return query;
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
        query = query.order(field, { ascending: !descending });
      }
      if (limit) query = query.limit(limit);
      query = await scoped(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(criteria = {}) {
      let query = supabase.from(table).select('*');
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      query = await scoped(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      let query = supabase.from(table).select('*').eq('id', id);
      query = await scoped(query);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const user = await getCurrentUser();
      const row = { ...payload };
      if (isOrgScoped && user?.organization_id && row.organization_id == null) {
        row.organization_id = user.organization_id;
      }
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      let query = supabase.from(table).update(payload).eq('id', id);
      query = await scoped(query);
      const { data, error } = await query.select().maybeSingle();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      let query = supabase.from(table).delete().eq('id', id);
      query = await scoped(query);
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    },
  };
};

const entities = new Proxy({}, {
  get: (_target, entityName) => buildEntityClient(entityName),
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
    async UploadFile({ file, bucket = 'uploads', path } = {}) {
      if (!file) return { file_url: '' };
      const filePath = path || `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return { file_url: data?.publicUrl || '' };
    },
  },
};

export const db = { auth, app, entities, integrations };

// Every page in this app reads `globalThis.__B44_DB__` (base44's own
// generated pattern) falling back to an empty stub if it isn't set. Setting
// it once here, before React renders (see main.jsx), wires the entire app
// to this Supabase-backed implementation without editing those pages.
globalThis.__B44_DB__ = db;

export default db;
