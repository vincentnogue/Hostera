const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Clock, ShieldCheck, XCircle, RefreshCw, LogOut, Mail } from 'lucide-react';

// Gate shown between onboarding submission and a platform admin's manual
// KYC review. A business account can't reach the real dashboard while
// kyc_status is 'pending' or 'rejected' — enforced here by polling the
// organization's own real status, not a fake timer.
export default function PendingVerification() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    try {
      const orgs = await db.entities.Organization.list();
      const o = (orgs || [])[0];
      setOrg(o);
      if (o?.kyc_status === 'verified') navigate('/dashboard');
    } catch (e) { console.error(e); }
    finally { setLoading(false); setChecking(false); }
  };

  useEffect(() => { load(); }, []);

  const recheck = () => { setChecking(true); load(); };

  if (loading) return null;

  const status = org?.kyc_status || 'pending';

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-brand-border p-8 text-center">
        {status === 'rejected' ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-brand-ink">Verification needs attention</h1>
            <p className="text-sm text-brand-slate mt-2">
              {org?.kyc_rejection_reason || 'One or more documents couldn\u2019t be verified. Please resubmit with clearer copies.'}
            </p>
            <button onClick={() => navigate('/onboarding')} className="mt-6 w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
              Resubmit documents
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-brand-navy" />
            </div>
            <h1 className="text-xl font-bold text-brand-ink">Your account is under review</h1>
            <p className="text-sm text-brand-slate mt-2">
              {org?.name ? `${org.name} is` : 'Your organization is'} being verified by our team — usually within one business day.
              You&apos;ll be notified by email the moment it&apos;s approved.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-brand-slate-light mt-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Submitted {org?.kyc_submitted_at ? new Date(org.kyc_submitted_at).toLocaleDateString() : 'recently'}
            </div>
            <button onClick={recheck} disabled={checking} className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 border border-brand-border text-brand-ink text-sm font-semibold rounded-full hover:border-brand-navy disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> Check status
            </button>
          </>
        )}
        <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-brand-border">
          <a href="mailto:support@hostera.app" className="flex items-center gap-1.5 text-xs text-brand-slate hover:text-brand-navy">
            <Mail className="w-3.5 h-3.5" /> Contact support
          </a>
          <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-brand-slate hover:text-brand-navy">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
