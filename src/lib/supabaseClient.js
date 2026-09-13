import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  // Don't throw here — createClient() throws synchronously on an empty URL,
  // and this file is imported before React ever mounts. An uncaught throw
  // at this point halts the whole script with #root left empty: a blank
  // white page with no message, and no ErrorBoundary can catch it because
  // React hasn't started yet. Falling through to a safe stub keeps the app
  // bootable so real errors surface through the normal auth/UI flow.
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
    'This build was likely produced before those env vars were configured — ' +
    'trigger a fresh deploy after setting them (Vite inlines them at build ' +
    'time, not runtime). API calls will fail until then. See .env.example.'
  );
}

// A Supabase-shaped stub: every method that's actually called elsewhere in
// this app resolves the way the real client would on failure, so callers'
// existing `if (error) throw error` handling reports a clean, catchable
// error instead of the whole app crashing at import time.
const configError = { message: 'Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).' };
const failedResult = () => Promise.resolve({ data: null, error: configError });

const unconfiguredStub = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: failedResult,
    signInWithOAuth: failedResult,
    signUp: failedResult,
    verifyOtp: failedResult,
    resend: failedResult,
    updateUser: failedResult,
    resetPasswordForEmail: failedResult,
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => failedResult(),
      maybeSingle: () => failedResult(),
      then: (resolve) => resolve({ data: null, error: configError }),
    };
    return chain;
  },
  storage: {
    from: () => ({
      upload: failedResult,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

// "Remember me" — a real distinction, not just a checkbox for show.
// hostera_remember_me is a plain preference flag (always in localStorage
// so it survives to be read at all); the actual session goes to
// localStorage when true (persists across browser restarts) or
// sessionStorage when false (cleared the moment the tab/browser closes).
// Login.jsx sets the flag before calling signIn; it defaults to
// "remembered" for anyone who never saw/used the checkbox.
export const REMEMBER_ME_KEY = 'hostera_remember_me';

const rememberMeStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    return (remember ? localStorage : sessionStorage).getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: rememberMeStorage,
      },
    })
  : unconfiguredStub;

export const isSupabaseConfigured = isConfigured;
