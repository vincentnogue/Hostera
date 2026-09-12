const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';
import { COUNTRIES, CURRENCIES } from '@/lib/referenceData';
import { THEME_PRESETS, applyThemeColors } from '@/lib/theme';

import { Save, Building2, Clock, Globe, DollarSign, Camera, Loader2, X, Palette, Check, Percent } from 'lucide-react';

// Real IANA timezone database via the browser (hundreds of zones, always
// current) — falls back to a representative worldwide set on older
// browsers that don't support Intl.supportedValuesOf.
const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Riyadh',
      'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Africa/Casablanca', 'Australia/Sydney'];
  }
})();

export default function PropertySettings() {
  const { selectedProperty, properties, refreshProperties } = useProperty();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [form, setForm] = useState({
    name: '', legal_name: '', phone: '', email: '', website: '',
    address: '', city: '', country: '', postal_code: '',
    checkin_time: '14:00', checkout_time: '11:00',
    currency: 'USD', timezone: 'UTC', photo_urls: [],
    theme_primary: THEME_PRESETS[0].primary, theme_accent: THEME_PRESETS[0].accent,
    vat_rate: 0, vat_inclusive: true, city_tax_type: 'none', city_tax_amount: 0, tax_id: '',
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
        vat_rate: p.vat_rate ?? 0, vat_inclusive: p.vat_inclusive ?? true,
        city_tax_type: p.city_tax_type || 'none', city_tax_amount: p.city_tax_amount ?? 0,
        tax_id: p.tax_id || '',
        photo_urls: p.photo_urls || [],
        theme_primary: p.theme_primary || THEME_PRESETS[0].primary,
        theme_accent: p.theme_accent || THEME_PRESETS[0].accent,
      });
    }
    setLoading(false);
  }, [selectedProperty, properties]);

  const applyTheme = (primary, accent) => {
    setForm(prev => ({ ...prev, theme_primary: primary, theme_accent: accent }));
    applyThemeColors(primary, accent); // live preview, saved on "Save Changes"
  };

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

  const describeUploadError = (err) => {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('bucket not found') || msg.includes('not found')) {
      return "Upload failed: the 'uploads' storage bucket doesn't exist yet in Supabase. Create a public bucket named \"uploads\" in Supabase Dashboard → Storage.";
    }
    if (msg.includes('row-level security') || msg.includes('permission') || msg.includes('policy') || msg.includes('unauthorized')) {
      return "Upload failed: the 'uploads' bucket exists but isn't public / lacks an upload policy. Check Supabase Dashboard → Storage → uploads → Policies.";
    }
    return `Upload failed: ${err?.message || 'unknown error'}. Try a smaller image or a different file.`;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError('');
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, bucket: 'uploads' });
      if (file_url) {
        setForm(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), file_url] }));
      } else {
        setPhotoError('Upload returned no file URL — the storage bucket may not be configured yet.');
      }
    } catch (err) {
      setPhotoError(describeUploadError(err));
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

      {photoError && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span>{photoError}</span>
          <button onClick={() => setPhotoError('')} className="shrink-0 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

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
            <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} className={inputCls}>
              <option value="">Select a country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
              {CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})} className={inputCls}>
              {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Branding & Theme */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Branding & Theme</h2>
        </div>
        <p className="text-xs text-brand-slate mb-4">
          Choose the colors your team sees across the entire dashboard for this property. Changes preview instantly — click Save Changes to keep them.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {THEME_PRESETS.map(t => {
            const active = form.theme_primary === t.primary && form.theme_accent === t.accent;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTheme(t.primary, t.accent)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${active ? 'border-brand-navy' : 'border-brand-border hover:border-brand-blue/50'}`}
              >
                {active && <Check className="w-3.5 h-3.5 text-white absolute top-1.5 right-1.5 bg-brand-navy rounded-full p-0.5" />}
                <div className="flex -space-x-2">
                  <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ background: t.primary }} />
                  <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ background: t.accent }} />
                </div>
                <span className="text-[11px] font-medium text-brand-ink">{t.name}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Custom primary color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme_primary} onChange={e => applyTheme(e.target.value, form.theme_accent)} className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer" />
              <input type="text" value={form.theme_primary} onChange={e => applyTheme(e.target.value, form.theme_accent)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Custom accent color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme_accent} onChange={e => applyTheme(form.theme_primary, e.target.value)} className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer" />
              <input type="text" value={form.theme_accent} onChange={e => applyTheme(form.theme_primary, e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* Taxes & Fees */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Percent className="w-5 h-5 text-brand-navy" />
          <h2 className="text-base font-semibold text-brand-ink">Taxes & Fees</h2>
        </div>
        <p className="text-xs text-brand-slate mb-4">
          Applied automatically to reservations and the public booking page. Rates vary a lot by
          country — set what applies to this property.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>VAT / GST rate (%)</label>
            <input type="number" min={0} max={100} step="0.1" value={form.vat_rate}
              onChange={e => setForm({ ...form, vat_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tax / VAT registration number</label>
            <input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })}
              placeholder="Shown on invoices" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-brand-ink">
              <input type="checkbox" checked={form.vat_inclusive}
                onChange={e => setForm({ ...form, vat_inclusive: e.target.checked })} className="rounded" />
              Room rates already include VAT/GST (common in the EU, UK, most of Africa)
            </label>
          </div>
          <div>
            <label className={labelCls}>City / tourism tax</label>
            <select value={form.city_tax_type} onChange={e => setForm({ ...form, city_tax_type: e.target.value })} className={inputCls}>
              <option value="none">None</option>
              <option value="flat_per_night">Flat amount per room, per night</option>
              <option value="percent_per_night">Percentage of the room rate, per night</option>
            </select>
          </div>
          {form.city_tax_type !== 'none' && (
            <div>
              <label className={labelCls}>{form.city_tax_type === 'flat_per_night' ? `Amount per night (${form.currency})` : 'Percentage per night (%)'}</label>
              <input type="number" min={0} step="0.01" value={form.city_tax_amount}
                onChange={e => setForm({ ...form, city_tax_amount: Number(e.target.value) })} className={inputCls} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}