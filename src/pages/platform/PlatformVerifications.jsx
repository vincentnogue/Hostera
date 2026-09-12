const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, User, Camera, ExternalLink, Loader2 } from 'lucide-react';

const TABS = [
  { key: 'pending', label: 'Pending review' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

// Platform Admin's manual KYC review queue. This is the other half of
// Onboarding.jsx's Verification step — nothing here fakes an automatic
// approval; every business genuinely waits for a human to check these
// documents.
export default function PlatformVerifications() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [active, setActive] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    db.entities.Organization.list('-created_date', 200)
      .then(data => setOrgs((data || []).filter(o => o.kyc_status)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = orgs.filter(o => (o.kyc_status || 'pending') === tab);

  const openReview = async (org) => {
    setActive(org);
    setShowReject(false);
    setRejectReason('');
    setLoadingDocs(true);
    setSignedUrls({});
    try {
      const entries = await Promise.all(
        ['business_doc', 'manager_id', 'manager_selfie'].map(async key => {
          const path = org[`kyc_${key}_url`];
          if (!path) return [key, ''];
          // kyc_*_url already stores a signed URL from upload time (1yr
          // expiry) — re-sign here in case it's aged out, using the
          // stored path portion.
          try {
            const url = new URL(path);
            const objectPath = decodeURIComponent(url.pathname.split('/kyc-documents/')[1] || '');
            if (!objectPath) return [key, path];
            const { file_url } = await db.integrations.Core.getSignedFileUrl({ bucket: 'kyc-documents', path: objectPath, expiresIn: 3600 });
            return [key, file_url || path];
          } catch {
            return [key, path];
          }
        })
      );
      setSignedUrls(Object.fromEntries(entries));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const approve = async () => {
    setSaving(true);
    try {
      await db.entities.Organization.update(active.id, { kyc_status: 'verified', kyc_verified_at: new Date().toISOString() });
      setOrgs(prev => prev.map(o => o.id === active.id ? { ...o, kyc_status: 'verified' } : o));
      setActive(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    try {
      await db.entities.Organization.update(active.id, { kyc_status: 'rejected', kyc_rejection_reason: rejectReason.trim() });
      setOrgs(prev => prev.map(o => o.id === active.id ? { ...o, kyc_status: 'rejected' } : o));
      setActive(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> Business Verifications</h1>
        <p className="text-sm text-white/50 mt-1">Review manager identity and business documents before a hotel can go live and receive marketplace payments.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-navy text-white border border-brand-blue/40' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            {t.label} <span className="opacity-60">({orgs.filter(o => (o.kyc_status || 'pending') === t.key).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">Nothing here.</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
          {filtered.map(o => (
            <button key={o.id} onClick={() => openReview(o)} className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
              <div>
                <p className="text-sm font-semibold text-white">{o.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{o.kyc_manager_name} · {o.country}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <Clock className="w-3.5 h-3.5" /> {o.kyc_submitted_at ? new Date(o.kyc_submitted_at).toLocaleDateString() : '—'}
              </span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-brand-navy-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">{active.name}</h3>
            <p className="text-xs text-white/50 mt-1">{active.kyc_manager_name} · {active.kyc_id_type?.replace('_', ' ')} {active.kyc_id_number}</p>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { key: 'business_doc', label: 'Business doc', icon: FileText },
                { key: 'manager_id', label: 'Manager ID', icon: User },
                { key: 'manager_selfie', label: 'Selfie', icon: Camera },
              ].map(f => (
                <a key={f.key} href={signedUrls[f.key] || '#'} target="_blank" rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10 ${signedUrls[f.key] ? 'hover:border-brand-blue' : 'opacity-40 pointer-events-none'}`}>
                  {loadingDocs ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" /> : <f.icon className="w-5 h-5 text-white/60" />}
                  <span className="text-[10px] text-white/60">{f.label}</span>
                  {signedUrls[f.key] && <ExternalLink className="w-3 h-3 text-white/30" />}
                </a>
              ))}
            </div>

            {active.kyc_status === 'pending' && (
              <>
                {!showReject ? (
                  <div className="flex gap-2 mt-6">
                    <button onClick={approve} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 disabled:opacity-60">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setShowReject(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/5">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-2">
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (shown to the business)" rows={2}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-brand-blue resize-none" />
                    <button onClick={reject} disabled={saving || !rejectReason.trim()} className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-full hover:bg-red-700 disabled:opacity-60">
                      Confirm rejection
                    </button>
                  </div>
                )}
              </>
            )}
            {active.kyc_status === 'rejected' && active.kyc_rejection_reason && (
              <p className="text-xs text-red-300 bg-red-500/10 rounded-lg p-3 mt-5">{active.kyc_rejection_reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
