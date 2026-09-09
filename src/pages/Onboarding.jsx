const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { COUNTRIES, CURRENCIES } from '@/lib/referenceData';
import { Building2, Hotel, BedDouble, Rocket, Check, ArrowLeft, ArrowRight } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Your Organization', desc: 'Company details and defaults', icon: Building2 },
  { id: 2, title: 'Your Property', desc: 'Property profile and operating times', icon: Hotel },
  { id: 3, title: 'Rooms & Rates', desc: 'Room types and starting prices', icon: BedDouble },
  { id: 4, title: 'Launch', desc: 'Review and start operating', icon: Rocket },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState({ name: '', type: 'independent', country: '', currency: 'USD' });
  const [property, setProperty] = useState({ name: '', property_type: 'hotel', city: '', checkin_time: '14:00', checkout_time: '11:00' });
  const [roomTypes, setRoomTypes] = useState([
    { name: 'Standard Double', base_price: 120, capacity: 2 },
  ]);

  const inputCls = "w-full px-3.5 py-2.5 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const finish = async () => {
    setSaving(true);
    try {
      let orgId = null;
      try {
        const orgs = await db.entities.Organization.list();
        orgId = (orgs || [])[0]?.id;
      } catch (e) { /* ignore */ }
      if (!orgId && org.name) {
        const createdOrg = await db.entities.Organization.create({ name: org.name, type: org.type, country: org.country, currency: org.currency, status: 'trial' });
        orgId = createdOrg.id;
      }
      const createdProp = await db.entities.Property.create({
        organization_id: orgId, name: property.name || 'My Property', property_type: property.property_type,
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
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
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
            <h2 className="text-lg font-bold text-brand-ink">You&apos;re ready to launch 🚀</h2>
            <div className="p-5 rounded-2xl bg-brand-bg space-y-2.5 text-sm">
              <p><span className="text-brand-slate">Organization:</span> <span className="font-semibold text-brand-ink">{org.name || '—'}</span></p>
              <p><span className="text-brand-slate">Property:</span> <span className="font-semibold text-brand-ink">{property.name || '—'}</span> {property.city && `· ${property.city}`}</p>
              <p><span className="text-brand-slate">Currency:</span> <span className="font-semibold text-brand-ink">{org.currency}</span></p>
              <p><span className="text-brand-slate">Room types:</span> <span className="font-semibold text-brand-ink">{roomTypes.filter(r => r.name).map(r => r.name).join(', ') || '—'}</span></p>
              <p className="text-xs text-brand-slate-light pt-1">Next steps: add rooms to your types, create rate plans in Rate Plans, and invite your team under Team Access.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-8">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center gap-1.5 px-5 py-2.5 border border-brand-border text-sm font-semibold text-brand-slate rounded-full hover:border-brand-navy disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              <Rocket className="w-4 h-4" /> {saving ? 'Creating…' : 'Launch My Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}