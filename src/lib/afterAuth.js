const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { PLATFORM_OWNERS } from '@/lib/platformAdmins';

/**
 * Resolves where a user should land after a successful email login or OTP verify.
 * - Platform super admins go straight to the Platform Control Center.
 * - Individual accounts (guests) go to their booking dashboard.
 * - Business accounts with no property yet go to the guided onboarding.
 */
export async function resolvePostAuthDestination(returnTo) {
  let me = null;
  try {
    me = await db.auth.me();
  } catch (e) {
    // Identity lookup failure shouldn't block login
  }

  const email = (me?.email || '').toLowerCase();
  const owners = PLATFORM_OWNERS.map(e => e.toLowerCase());
  if (email && owners.includes(email)) return '/platform';

  const accountType = me?.account_type || localStorage.getItem('hostera_account_type') || 'business';
  if (accountType === 'individual') {
    return returnTo === '/' ? '/guest' : returnTo;
  }

  try {
    const props = await db.entities.Property.list();
    if (!props || props.length === 0) return '/onboarding';
  } catch (e) {
    // Fall through to the normal destination
  }
  return returnTo;
}