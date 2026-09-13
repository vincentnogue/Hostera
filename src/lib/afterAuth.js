const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { PLATFORM_OWNERS } from '@/lib/platformAdmins';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Resolves where a user should land after a successful email login or OTP verify.
 * - Platform super admins go straight to the Platform Control Center.
 * - Individual accounts (guests) go to their own booking dashboard — they
 *   never see the business/property dashboard.
 * - Business accounts with no property yet go to the guided onboarding.
 * - Business accounts that finished onboarding but aren't verified yet
 *   go to the verification waiting screen — reaching the real business
 *   dashboard requires super-admin approval.
 *
 * FAIL-CLOSED BY DESIGN: right after a signup/OTP-verify, there is a real
 * window where the freshly-issued session hasn't fully propagated yet
 * (the same race Layout.jsx's gate was hardened against). If the identity
 * or property/org lookup can't be completed even after one short retry,
 * this must NEVER fall through to `returnTo` — for a fresh business
 * signup returnTo defaults to "/", the public marketing homepage, which
 * has no gate at all and would let onboarding be skipped entirely. When
 * uncertain, default to the most restrictive real destination
 * (/onboarding) instead — Layout.jsx's own gate will correct course
 * further once the session is confirmed, but nothing ungated is ever
 * the fallback.
 */
export async function resolvePostAuthDestination(returnTo) {
  let me = await db.auth.me().catch(() => null);
  if (!me) {
    await sleep(400);
    me = await db.auth.me().catch(() => null);
  }

  const email = (me?.email || '').toLowerCase();
  const owners = PLATFORM_OWNERS.map(e => e.toLowerCase());
  if (email && owners.includes(email)) return '/platform';

  const accountType = me?.account_type || localStorage.getItem('hostera_account_type') || 'business';
  if (accountType === 'individual') {
    return returnTo === '/' ? '/guest' : returnTo;
  }

  const loadBusinessState = async () => {
    const props = await db.entities.Property.list();
    const orgs = await db.entities.Organization.list();
    return { hasProperty: (props || []).length > 0, kycStatus: orgs?.[0]?.kyc_status };
  };

  let state = await loadBusinessState().catch(() => null);
  if (!state) {
    await sleep(400);
    state = await loadBusinessState().catch(() => null);
  }

  if (!state) return '/onboarding'; // fail-closed: never fall through to returnTo
  if (!state.hasProperty) return '/onboarding';
  if (state.kycStatus !== 'verified') return '/pending-verification';

  return returnTo;
}