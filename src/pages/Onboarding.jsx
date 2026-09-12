const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { COUNTRIES, CURRENCIES } from '@/lib/referenceData';
import { Building2, Hotel, BedDouble, Rocket, Check, ArrowLeft, ArrowRight, Quote, ShieldCheck, Upload, Loader2, User, FileText, Camera } from 'lucide-react';
import { HOTEL_PHOTOS, AUTH_VIDEOS } from '@/lib/hotelMedia';

const STEPS = [
  {
    id: 1, title: 'Your Organization', desc: 'Company details and defaults', icon: Building2,
    tip: 'Independent hotel, group or management company — Hostera adapts to how you operate.',
  },
  {
    id: 2, title: 'Your Property', desc: 'Property profile and operating times', icon: Hotel,
    tip: 'From boutique guest houses to full resorts, in 190+ countries.',
  },
  {
    id: 3, title: 'Rooms & Rates', desc: 'Room types and starting prices', icon: BedDouble,
    tip: 'You can always fine-tune rates later from Rate Plans and Revenue Management.',
  },
  {
    id: 4, title: 'Verification', desc: 'Identity & business documents', icon: ShieldCheck,
    tip: 'Required worldwide before you can receive marketplace payments — one manager, verified once.',
  },
  {
    id: 5, title: 'Launch', desc: 'Submit and wait for approval', icon: Rocket,
    tip: 'Your dashboard unlocks the moment our team verifies your documents — usually within one business day.',
  },
];

// Right-hand inspiration panel — a real hotel photo paired with a short,
// step-relevant tip. Purely presentational; it never touches wizard state.
function OnboardingPreviewPanel({ step }) {
  const current = STEPS[step - 1] || STEPS[0];
  const photo = HOTEL_PHOTOS[(step - 1) % HOTEL_PHOTOS.length];
  const video = AUTH_VIDEOS[(step - 1) % AUTH_VIDEOS.length];
  return (
    <div className="hidden lg:block sticky top-8">
      <div className="relative rounded-2xl overflow-hidden border border-brand-border shadow-sm aspect-[4/5] bg-brand-overlay">
        <video
          key={video.src}
          autoPlay
          muted
          loop
          playsInline
          poster={video.poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={video.src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-overlay via-brand-overlay/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6">
          <Quote className="w-5 h-5 text-[#A6FF00] mb-2" aria-hidden="true" />
          <p className="text-white text-sm leading-relaxed">{current.tip}</p>
          <p className="text-white/60 text-xs mt-3">{photo.caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [org, setOrg] = useState({ name: '', type: 'independent', country: '', currency: 'USD' });
  const [property, setProperty] = useState({ name: '', property_type: 'hotel', city: '', checkin_time: '14:00', checkout_time: '11:00' });
  const [roomTypes, setRoomTypes] = useState([
    { name: 'Standard Double', base_price: 120, capacity: 2 },
  ]);
  const [kyc, setKyc] = useState({
    manager_name: '', id_type: 'passport', id_number: '',
    business_doc_url: '', manager_id_url: '', manager_selfie_url: '',
  });
  const [uploading, setUploading] = useState({ business_doc: false, manager_id: false, manager_selfie: false });
  const [uploadError, setUploadError] = useState('');

  const inputCls = "w-full px-3.5 py-2.5 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  // The organization must exist (with a real membership row — see the
  // on_organization_created trigger) before KYC documents can be uploaded,
  // since their storage path is namespaced by organization_id and gated
  // by is_org_member(). Created once, the first time it's actually needed.
  const ensureOrg = async () => {
    if (orgId) return orgId;
    setCreatingOrg(true);
    try {
      const existing = await db.entities.Organization.list().catch(() => []);
      if (existing?.[0]?.id) { setOrgId(existing[0].id); return existing[0].id; }
      const created = await db.entities.Organization.create({
        name: org.name, type: org.type, country: org.country, currency: org.currency, status: 'trial',
      });
      setOrgId(created.id);
      return created.id;
    } finally { setCreatingOrg(false); }
  };

  const canContinue =
    step === 1 ? Boolean(org.name.trim() && org.country) :
    step === 2 ? Boolean(property.name.trim() && property.city.trim()) :
    step === 3 ? roomTypes.some(r => r.name.trim()) :
    step === 4 ? Boolean(kyc.manager_name.trim() && kyc.business_doc_url && kyc.manager_id_url && kyc.manager_selfie_url) :
    true;

  const goNext = async () => {
    if (step === 1) {
      const id = await ensureOrg();
      if (!id) return;
    }
    setStep(s => s + 1);
  };

  const uploadKycFile = async (field, file) => {
    if (!file) return;
    setUploadError('');
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const id = await ensureOrg();
      const { file_url } = await db.integrations.Core.UploadFile({
        file, bucket: 'kyc-documents', isPrivate: true,
        path: `${id}/${field}-${Date.now()}-${file.name}`,
      });
      setKyc(prev => ({ ...prev, [`${field}_url`]: file_url }));
    } catch (e) {
      console.error(e);
      setUploadError('Upload failed — please try again with a clear photo or scan (JPG, PNG or PDF, under 10MB).');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      const id = await ensureOrg();
      const createdProp = await db.entities.Property.create({
        organization_id: id, name: property.name || 'My Property', property_type: property.property_type,
        city: property.city, country: org.country, currency: org.currency, checkin_time: property.checkin_time,
        checkout_time: property.checkout_time, status: 'active',
      });
      const validRooms = roomTypes.filter(r => r.name);
      if (validRooms.length > 0) {
        await db.entities.RoomType.bulkCreate(validRooms.map(r => ({
          property_id: createdProp.id, name: r.name, base_price: Number(r.base_price) || 0, capacity: Number(r.capacity) || 2, currency: org.currency,
        })));
      }
      try {
        const bs = await db.entities.BookingEngineSetting.list();
        if (!(bs || []).length) {
          await db.entities.BookingEngineSetting.create({ property_id: createdProp.id });
        }
      } catch (e) { /* non-blocking */ }

      // Submit for verification — the dashboard stays locked behind
      // /pending-verification until a platform admin approves these
      // documents (see PlatformVerifications.jsx).
      await db.entities.Organization.update(id, {
        kyc_status: 'pending',
        kyc_manager_name: kyc.manager_name,
        kyc_id_type: kyc.id_type,
        kyc_id_number: kyc.id_number,
        kyc_business_doc_url: kyc.business_doc_url,
        kyc_manager_id_url: kyc.manager_id_url,
        kyc_manager_selfie_url: kyc.manager_selfie_url,
        kyc_submitted_at: new Date().toISOString(),
      });
      navigate('/pending-verification');
    } catch (e) {
      console.error(e);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-10 items-start">
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-ink">Welcome to Hostera 👋</h1>
        <p className="text-sm text-brand-slate">Set up your business in a few steps — you can change everything later.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 transition-colors ${active ? 'border-brand-navy bg-blue-50/40' : done ? 'border-green-200 bg-green-50' : 'border-brand-border'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-navy text-white' : 'bg-brand-bg text-brand-slate-light'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className={active || done ? '' : 'hidden md:block'}>
                  <p className="text-xs font-semibold text-brand-ink">{s.title}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step > s.id ? 'bg-green-300' : 'bg-brand-border'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-brand-border p-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-ink">Tell us about your organization</h2>
            <input placeholder="Organization name (e.g. Sunrise Hotels Group)" value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-4">
              <select value={org.type} onChange={e => setOrg({ ...org, type: e.target.value })} className={inputCls}>
                <option value="independent">Independent</option>
                <option value="hotel_group">Hotel Group</option>
                <option value="chain">Chain</option>
                <option value="management_company">Management Company</option>
              </select>
              <select value={org.currency} onChange={e => setOrg({ ...org, currency: e.target.value })} className={inputCls}>
                {CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
              </select>
            </div>
            <select value={org.country} onChange={e => setOrg({ ...org, country: e.target.value })} className={inputCls}>
              <option value="">Select your country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-ink">Your first property</h2>
            <input placeholder="Property name (e.g. Sunrise Boutique Marrakech)" value={property.name} onChange={e => setProperty({ ...property, name: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-4">
              <select value={property.property_type} onChange={e => setProperty({ ...property, property_type: e.target.value })} className={inputCls}>
                {['hotel', 'resort', 'boutique', 'apartment', 'villa', 'guest_house', 'hostel', 'bnb', 'lodge', 'serviced_apartment'].map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
              <input placeholder="City" value={property.city} onChange={e => setProperty({ ...property, city: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">Check-in time</label>
                <input type="time" value={property.checkin_time} onChange={e => setProperty({ ...property, checkin_time: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">Check-out time</label>
                <input type="time" value={property.checkout_time} onChange={e => setProperty({ ...property, checkout_time: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">Room types & starting rates</h2>
              <button onClick={() => setRoomTypes([...roomTypes, { name: '', base_price: 100, capacity: 2 }])} className="text-xs px-3 py-1.5 bg-brand-navy text-white rounded-full font-semibold hover:bg-brand-blue">+ Add type</button>
            </div>
            {roomTypes.map((rt, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input placeholder="Room type (e.g. Deluxe King)" value={rt.name} onChange={e => setRoomTypes(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inputCls} />
                <input type="number" placeholder="Rate" value={rt.base_price} onChange={e => setRoomTypes(prev => prev.map((x, j) => j === i ? { ...x, base_price: Number(e.target.value) } : x))} className={`${inputCls} max-w-28`} />
                <input type="number" placeholder="Guests" value={rt.capacity} onChange={e => setRoomTypes(prev => prev.map((x, j) => j === i ? { ...x, capacity: Number(e.target.value) } : x))} className={`${inputCls} max-w-24`} />
                {roomTypes.length > 1 && (
                  <button onClick={() => setRoomTypes(prev => prev.filter((_, j) => j !== i))} className="text-xs text-red-400 hover:text-red-600 font-medium shrink-0">Remove</button>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-brand-ink flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand-navy" /> Verify your business</h2>
              <p className="text-sm text-brand-slate mt-1">
                Required before you can go live and receive marketplace payments, wherever you operate — one authorized manager, verified once. Our team reviews submissions manually.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-slate block mb-1.5">Manager full name (as shown on ID)</label>
              <input placeholder="Full legal name" value={kyc.manager_name} onChange={e => setKyc({ ...kyc, manager_name: e.target.value })} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">ID document type</label>
                <select value={kyc.id_type} onChange={e => setKyc({ ...kyc, id_type: e.target.value })} className={inputCls}>
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID card</option>
                  <option value="drivers_license">Driver&apos;s license</option>
                  <option value="residence_permit">Residence permit</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">ID number</label>
                <input placeholder="As shown on the document" value={kyc.id_number} onChange={e => setKyc({ ...kyc, id_number: e.target.value })} className={inputCls} />
              </div>
            </div>

            {uploadError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { key: 'business_doc', label: 'Business registration', hint: 'Trade license, commercial register or equivalent', icon: FileText },
                { key: 'manager_id', label: `Manager's ${kyc.id_type.replace('_', ' ')}`, hint: 'Clear photo or scan, all corners visible', icon: User },
                { key: 'manager_selfie', label: 'Manager selfie', hint: 'Holding the same ID, face clearly visible', icon: Camera },
              ].map(f => (
                <label key={f.key} className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${kyc[`${f.key}_url`] ? 'border-green-300 bg-green-50' : 'border-brand-border hover:border-brand-navy'}`}>
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => uploadKycFile(f.key, e.target.files?.[0])} />
                  {uploading[f.key] ? (
                    <Loader2 className="w-6 h-6 text-brand-navy animate-spin" />
                  ) : kyc[`${f.key}_url`] ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <f.icon className="w-6 h-6 text-brand-slate-light" />
                  )}
                  <p className="text-xs font-semibold text-brand-ink capitalize">{f.label}</p>
                  <p className="text-[10px] text-brand-slate">{kyc[`${f.key}_url`] ? 'Uploaded — click to replace' : f.hint}</p>
                  {!kyc[`${f.key}_url`] && !uploading[f.key] && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-navy"><Upload className="w-3 h-3" /> Choose file</span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-brand-slate-light">
              These documents are stored privately and are only ever visible to your own team and Hostera&apos;s verification staff — never shown publicly or to guests.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-brand-ink">Ready to submit for verification</h2>
            <div className="p-5 rounded-2xl bg-brand-bg space-y-2.5 text-sm">
              <p><span className="text-brand-slate">Organization:</span> <span className="font-semibold text-brand-ink">{org.name || '—'}</span></p>
              <p><span className="text-brand-slate">Property:</span> <span className="font-semibold text-brand-ink">{property.name || '—'}</span> {property.city && `· ${property.city}`}</p>
              <p><span className="text-brand-slate">Currency:</span> <span className="font-semibold text-brand-ink">{org.currency}</span></p>
              <p><span className="text-brand-slate">Room types:</span> <span className="font-semibold text-brand-ink">{roomTypes.filter(r => r.name).map(r => r.name).join(', ') || '—'}</span></p>
              <p><span className="text-brand-slate">Verification contact:</span> <span className="font-semibold text-brand-ink">{kyc.manager_name || '—'}</span></p>
              <p className="text-xs text-brand-slate-light pt-1">
                Once submitted, your dashboard stays in review mode until our team verifies your documents — usually within one business day. You&apos;ll be notified by email either way.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-8">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center gap-1.5 px-5 py-2.5 border border-brand-border text-sm font-semibold text-brand-slate rounded-full hover:border-brand-navy disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 5 ? (
            <button onClick={goNext} disabled={!canContinue || creatingOrg} className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-navy">
              {creatingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              <Rocket className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </div>
    </div>

    <OnboardingPreviewPanel step={step} />
    </div>
  );
}