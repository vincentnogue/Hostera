const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Globe, Save, Check, Loader2 } from 'lucide-react';

const toggles = [
  { key: 'direct_bookings_enabled', label: 'Direct bookings', desc: 'Accept reservations directly from your website without OTAs.' },
  { key: 'show_availability', label: 'Show availability calendar', desc: 'Display real-time room availability to potential guests.' },
  { key: 'show_rates_publicly', label: 'Show rates publicly', desc: 'Display nightly prices before the guest selects dates.' },
  { key: 'require_deposit', label: 'Require deposit', desc: 'Collect a deposit percentage at the time of booking.' },
  { key: 'allow_same_day_booking', label: 'Allow same-day bookings', desc: 'Let guests book a room for tonight up to check-in time.' },
];

export default function BookingEngine() {
  const [config, setConfig] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.BookingEngineSetting.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(async ([settings, props]) => {
        setProperties(props || []);
        let s = (settings || [])[0];
        const propertyId = (props || [])[0]?.id;
        if (!s && propertyId) {
          s = await db.entities.BookingEngineSetting.create({ property_id: propertyId });
        }
        setConfig(s || { property_id: propertyId, direct_bookings_enabled: true, show_availability: true, show_rates_publicly: true, require_deposit: false, deposit_percent: 20, min_stay_default: 1, allow_same_day_booking: true, advance_booking_days: 365, cancellation_hours: 48 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      if (config.id) {
        const { id, ...data } = config;
        await db.entities.BookingEngineSetting.update(id, data);
      } else {
        const created = await db.entities.BookingEngineSetting.create(config);
        setConfig(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (key, label, suffix) => (
    <div>
      <label className="text-xs font-medium text-brand-slate block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={config[key] ?? 0}
          onChange={e => setConfig({ ...config, [key]: Number(e.target.value) })}
          className="w-full px-4 py-2.5 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy pr-12"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-brand-slate-light">{suffix}</span>
      </div>
    </div>
  );

  if (loading) {
    return <p className="text-sm text-brand-slate">Loading booking engine settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Booking Engine</h1>
          <p className="text-sm text-brand-slate">Direct reservation settings, availability display and booking rules.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Toggles */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-ink mb-5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-navy" /> Booking Rules
          </h3>
          <div className="space-y-4">
            {toggles.map(t => (
              <div key={t.key} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-brand-bg">
                <div>
                  <p className="text-sm font-medium text-brand-ink">{t.label}</p>
                  <p className="text-[11px] text-brand-slate mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, [t.key]: !config[t.key] })}
                  className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ${config[t.key] ? 'bg-brand-navy' : 'bg-brand-border'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config[t.key] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric settings */}
        <div className="bg-white rounded-xl border border-brand-border p-6 space-y-5">
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-navy" /> Stay & Payment Rules
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {config.require_deposit && numInput('deposit_percent', 'Deposit required', '%')}
            {numInput('min_stay_default', 'Default minimum stay', 'nights')}
            {numInput('advance_booking_days', 'Advance booking window', 'days')}
            {numInput('cancellation_hours', 'Free cancellation until', 'hours')}
          </div>
          <div>
            <label className="text-xs font-medium text-brand-slate block mb-1.5">Cancellation policy (shown to guests)</label>
            <textarea
              value={config.cancellation_policy || ''}
              onChange={e => setConfig({ ...config, cancellation_policy: e.target.value })}
              rows={4}
              placeholder="e.g. Free cancellation up to 48 hours before arrival. After that, the first night is charged…"
              className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none"
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-xs text-brand-navy leading-relaxed">
              These settings govern your direct booking engine: what guests can see, when they can book,
              and the deposit and cancellation rules applied at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}