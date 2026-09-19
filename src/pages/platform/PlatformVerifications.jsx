const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, User, Camera, ExternalLink, Loader2, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
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
      db.entities.Notification.create({
        organization_id: active.id,
        title: 'Your account is verified! 🎉',
        message: 'Your business has been approved — the full dashboard is now unlocked.',
        type: 'system',
        read: false,
      }).catch(() => {});
      toast({ title: 'Business approved', description: `${active.name} now has full dashboard access.` });
      setActive(null);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not approve', description: e.message || 'Please try again.', variant: 'destructive' });
    }
    finally { setSaving(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    try {
      await db.entities.Organization.update(active.id, { kyc_status: 'rejected', kyc_rejection_reason: rejectReason.trim() });
      setOrgs(prev => prev.map(o => o.id === active.id ? { ...o, kyc_status: 'rejected' } : o));
      db.entities.Notification.create({
        organization_id: active.id,
        title: 'Verification needs attention',
        message: rejectReason.trim(),
        type: 'system',
        read: false,
      }).catch(() => {});
      toast({ title: 'Business rejected', description: `${active.name} was notified with your reason.` });
      setActive(null);
      load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not reject', description: e.message || 'Please try again.', variant: 'destructive' });
    }
    finally { setSaving(false); }
  };

  const docFields = [
    { key: 'business_doc', label: 'Business registration', icon: FileText },
    { key: 'manager_id', label: 'Manager ID', icon: User },
    { key: 'manager_selfie', label: 'Manager selfie', icon: Camera },
  ];
  const missingDocs = active ? docFields.filter(f => !active[`kyc_${f.key}_url`]) : [];

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
          {tab === 'pending' && (
            <p className="text-xs text-white/30 mt-2">Businesses only land here once they submit documents from onboarding — check the Organizations page for accounts still mid-setup.</p>
          )}
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{active.name}</h3>
                <p className="text-xs text-white/50 mt-1">{active.kyc_manager_name} · {active.kyc_id_type?.replace('_', ' ')} {active.kyc_id_number}</p>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 shrink-0" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              {docFields.map(f => {
                const hasDoc = !!active[`kyc_${f.key}_url`];
                const url = signedUrls[f.key];
                return (
                  <a key={f.key} href={url || undefined} target="_blank" rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${!hasDoc ? 'border-red-500/30 bg-red-500/5' : url ? 'border-white/10 hover:border-brand-blue' : 'border-white/10 opacity-50 pointer-events-none'}`}>
                    {loadingDocs && hasDoc ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" /> : !hasDoc ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <f.icon className="w-5 h-5 text-white/60" />}
                    <span className="text-[10px] text-white/60 text-center">{f.label}</span>
                    {!hasDoc ? (
                      <span className="text-[9px] text-red-400 font-medium">Missing</span>
                    ) : url ? (
                      <ExternalLink className="w-3 h-3 text-white/30" />
                    ) : loadingDocs ? null : (
                      <span className="text-[9px] text-amber-400">Link unavailable</span>
                    )}
                  </a>
                );
              })}
            </div>

            {missingDocs.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 rounded-lg p-3 mt-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{missingDocs.length === docFields.length ? 'No documents were submitted with this application.' : `Missing: ${missingDocs.map(d => d.label).join(', ')}.`} Reject instead of approving until the file is complete.</span>
              </div>
            )}

            {active.kyc_status === 'pending' && (
              <>
                {!showReject ? (
                  <div className="flex gap-2 mt-6">
                    <button onClick={approve} disabled={saving || missingDocs.length > 0} title={missingDocs.length > 0 ? 'Cannot approve — required documents are missing' : undefined}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setShowReject(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/5 disabled:opacity-60">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-2">
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (shown to the business)" rows={2}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-brand-blue resize-none" />
                    <div className="flex gap-2">
                      <button onClick={reject} disabled={saving || !rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-full hover:bg-red-700 disabled:opacity-60">
                        Confirm rejection
                      </button>
                      <button onClick={() => setShowReject(false)} disabled={saving} className="px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/5">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {active.kyc_status === 'rejected' && active.kyc_rejection_reason && (
              <p className="text-xs text-red-300 bg-red-500/10 rounded-lg p-3 mt-5">{active.kyc_rejection_reason}</p>
            )}
            {active.kyc_status === 'verified' && (
              <p className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 rounded-lg p-3 mt-5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified {active.kyc_verified_at ? new Date(active.kyc_verified_at).toLocaleDateString() : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
