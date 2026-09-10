const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Save, Building2, Clock, Globe, DollarSign, Camera, Loader2, X } from 'lucide-react';

export default function PropertySettings() {
  const { selectedProperty, properties, refreshProperties } = useProperty();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({
    name: '', legal_name: '', phone: '', email: '', website: '',
    address: '', city: '', country: '', postal_code: '',
    checkin_time: '14:00', checkout_time: '11:00',
    currency: 'USD', timezone: 'UTC', photo_urls: [],
  });

  useEffect(() => {
    const p = selectedProperty || properties[0];
    if (p) {
      setProperty(p);
      setForm({
        name: p.name || '', legal_name: p.legal_name || '', phone: p.phone || '',
        email: p.email || '', website: p.website || '', address: p.address || '',
        city: p.city || '', country: p.country || '', postal_code: p.postal_code || '',
        checkin_time: p.checkin_time || '14:00', checkout_time: p.checkout_time || '11:00',
        currency: p.currency || 'USD', timezone: p.timezone || 'UTC',
        photo_urls: p.photo_urls || [],
      });
    }
    setLoading(false);
  }, [selectedProperty, properties]);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      await db.entities.Property.update(property.id, form);
      await refreshProperties();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, bucket: 'uploads' });
      if (file_url) setForm(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), file_url] }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const removePhoto = (url) => {
    setForm(prev => ({ ...prev, photo_urls: (prev.photo_urls || []).filter(u => u !== url) }));
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

      {/* Cover Photos */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Camera className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Cover Photos</h2>
        </div>
        <p className="text-xs text-brand-slate mb-4">
          Shown on your public booking page. The first photo becomes the main cover image.
        </p>
        <div className="flex gap-3 flex-wrap">
          {(form.photo_urls || []).map((url, i) => (
            <div key={url} className="relative w-28 h-20 rounded-lg overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-brand-navy text-white rounded-full font-semibold">Cover</span>
              )}
              <button type="button" onClick={() => removePhoto(url)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          <label className="w-28 h-20 rounded-lg border border-dashed border-brand-border flex items-center justify-center cursor-pointer hover:border-brand-navy text-brand-slate">
            {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>
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