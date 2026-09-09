const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Palette, Save, Check, Loader2, Smartphone, Sparkles, UtensilsCrossed, MapPin, LogOut, Crown, Brush } from 'lucide-react';

const COLOR_CHOICES = ['#123B63', '#1F5A8A', '#7C3AED', '#B45309', '#0F766E'];
const featureOptions = [
  { key: 'room_service', label: 'Room service ordering', icon: UtensilsCrossed },
  { key: 'housekeeping_requests', label: 'Housekeeping requests', icon: Brush },
  { key: 'spa_booking', label: 'Spa & experiences booking', icon: Sparkles },
  { key: 'local_recommendations', label: 'Local recommendations', icon: MapPin },
  { key: 'digital_checkout', label: 'Digital check-out', icon: LogOut },
  { key: 'loyalty_widget', label: 'Loyalty points widget', icon: Crown },
];

export default function GuestPortalConfig() {
  const [config, setConfig] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.GuestPortalConfig.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(async ([configs, props]) => {
        setProperties(props || []);
        let c = (configs || [])[0];
        const propertyId = (props || [])[0]?.id;
        if (!c && propertyId) {
          c = await db.entities.GuestPortalConfig.create({ property_id: propertyId, header_title: 'Welcome to your stay', welcome_message: 'Everything you need, right from your phone.', brand_color: '#123B63' });
        }
        setConfig(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (config.id) {
        const { id, ...data } = config;
        await db.entities.GuestPortalConfig.update(id, data);
      } else {
        const created = await db.entities.GuestPortalConfig.create(config);
        setConfig(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-brand-slate">Loading portal configuration…</p>;

  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Guest Portal Preview</h1>
          <p className="text-sm text-brand-slate">Customize the branding and features guests see on the mobile portal.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config */}
        <div className="bg-white rounded-xl border border-brand-border p-6 space-y-5">
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-navy" /> Branding
          </h3>
          <div>
            <label className="text-xs font-medium text-brand-slate block mb-1.5">Header title</label>
            <input value={config.header_title || ''} onChange={e => setConfig({ ...config, header_title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-slate block mb-1.5">Welcome message</label>
            <textarea value={config.welcome_message || ''} onChange={e => setConfig({ ...config, welcome_message: e.target.value })} rows={3} className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-slate block mb-1.5">Brand color</label>
            <div className="flex gap-2.5">
              {COLOR_CHOICES.map(c => (
                <button key={c} onClick={() => setConfig({ ...config, brand_color: c })} className={`w-9 h-9 rounded-full transition-transform ${config.brand_color === c ? 'ring-2 ring-offset-2 ring-brand-navy scale-110' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          <h3 className="text-sm font-semibold text-brand-ink pt-3 border-t border-[#F1F5F9]">Portal Features</h3>
          <div className="space-y-2.5">
            {featureOptions.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-brand-navy" />
                    <p className="text-sm text-brand-ink">{f.label}</p>
                  </div>
                  <button onClick={() => setConfig({ ...config, [f.key]: !config[f.key] })} className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ${config[f.key] ? 'bg-brand-navy' : 'bg-brand-border'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config[f.key] ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live preview */}
        <div className="flex items-start justify-center bg-brand-bg rounded-xl border border-brand-border p-8">
          <div className="w-64 rounded-[2.2rem] border-8 border-brand-ink bg-white overflow-hidden shadow-xl">
            <div className="p-4 text-white" style={{ background: config.brand_color || '#123B63' }}>
              <div className="flex items-center justify-between mb-3">
                <Smartphone className="w-4 h-4 opacity-60" />
                <span className="text-[9px] opacity-70">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm font-bold leading-snug">{config.header_title || 'Welcome'}</p>
              <p className="text-[10px] opacity-70 mt-1 leading-snug">{config.welcome_message || ''}</p>
            </div>
            <div className="p-3 space-y-2">
              {featureOptions.map(f => {
                const Icon = f.icon;
                const on = config[f.key];
                return (
                  <div key={f.key} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${on ? 'border-brand-border bg-white' : 'border-dashed border-[#F1F5F9] opacity-40'}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: on ? (config.brand_color || '#123B63') + '14' : '#F6F8FB' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: config.brand_color || '#123B63' }} />
                    </div>
                    <p className="text-[10px] font-medium text-brand-ink">{f.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}