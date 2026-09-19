const db = globalThis.__B44_DB__ || { entities: new Proxy({}, { get: () => ({ list: async () => [] }) }) };

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isCurrentUserPlatformAdmin } from '@/lib/hosteraBackend';

// PendingVerification.jsx polls the organization's kyc_status and shows a
// wait/rejected screen — but that only ever ran if the person happened to
// be sitting on that one page. Nothing stopped anyone from typing /dashboard
// (or any other PMS route) straight into the address bar and using the
// product before a platform admin ever looked at their documents. This is
// the actual enforcement point: it sits in front of every real dashboard
// route (see App.jsx) and redirects anyone whose organization isn't yet
// 'verified' back to the gate, before Layout/PropertyProvider even mount.
export default function KycGate() {
  const [decision, setDecision] = useState(null); // 'allow' | 'onboarding' | 'pending'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await isCurrentUserPlatformAdmin()) {
          if (!cancelled) setDecision('allow');
          return;
        }
        const orgs = await db.entities.Organization.list().catch(() => []);
        const org = orgs?.[0];
        if (!org) {
          // Authenticated but never even created a business yet — send
          // them to start onboarding rather than an empty dashboard.
          if (!cancelled) setDecision('onboarding');
          return;
        }
        if (!cancelled) setDecision(org.kyc_status === 'verified' ? 'allow' : 'pending');
      } catch (e) {
        console.error(e);
        // Fail closed: an error here should never accidentally grant
        // access to an unverified account.
        if (!cancelled) setDecision('pending');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (decision === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }
  if (decision === 'onboarding') return <Navigate to="/onboarding" replace />;
  if (decision === 'pending') return <Navigate to="/pending-verification" replace />;
  return <Outlet />;
}
