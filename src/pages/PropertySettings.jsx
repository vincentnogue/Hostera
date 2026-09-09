const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Save, Building2, Clock, Globe, DollarSign } from 'lucide-react';

export default function PropertySettings() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', legal_name: '', phone: '', email: '', website: '',
    address: '', city: '', country: '', postal_code: '',
    checkin_time: '14:00', checkout_time: '11:00',
    currency: 'USD', timezone: 'UTC',
  });

  useEffect(() => {
    async function fetchProperty() {
      try {
        const props = await db.entities.Property.list();
        if (props && props.length > 0) {
          const p = props[0];
          setProperty(p);
          setForm({
            name: p.name || '', legal_name: p.legal_name || '', phone: p.phone || '',
            email: p.email || '', website: p.website || '', address: p.address || '',
            city: p.city || '', country: p.country || '', postal_code: p.postal_code || '',
            checkin_time: p.checkin_time || '14:00', checkout_time: p.checkout_time || '11:00',
            currency: p.currency || 'USD', timezone: p.timezone || 'UTC',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      await db.entities.Property.update(property.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy text-brand-ink";
  const labelCls = "text-sm font-medium text-brand-ink mb-1 block";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Property Settings</h1>
          <p className="text-sm text-brand-slate mt-1">Manage your property information and operating preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Property Information */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Property Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Property Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Legal Name</label>
            <input type="text" value={form.legal_name} onChange={e => setForm({...form, legal_name: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Operating Preferences */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Operating Preferences</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Check-In Time</label>
            <input type="time" value={form.checkin_time} onChange={e => setForm({...form, checkin_time: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Check-Out Time</label>
            <input type="time" value={form.checkout_time} onChange={e => setForm({...form, checkout_time: e.target.value})} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Localization</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}><DollarSign className="w-3.5 h-3.5 inline mr-1" />Currency</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className={inputCls}>
              {['USD','EUR','GBP','AED','JPY','CHF','CAD','AUD','SAR','MAD','BRL','INR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})} className={inputCls}>
              {['UTC','Europe/London','Europe/Paris','Europe/Berlin','Asia/Dubai','Asia/Riyadh','America/New_York','America/Los_Angeles','Asia/Tokyo','Africa/Casablanca','Australia/Sydney'].map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}