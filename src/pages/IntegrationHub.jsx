const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Plug, Plus, X, Check, Link2, RefreshCw, Receipt, CreditCard, Building2, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/marketing/BrandLogos';

const categories = ['ai', 'accounting', 'payment', 'hospitality', 'communication', 'analytics'];
const categoryIcons = { ai: Sparkles, accounting: Receipt, payment: CreditCard, hospitality: Building2, communication: MessageSquare, analytics: BarChart3 };
const integrationCatalog = [
  { tool_name: 'LiBooks', category: 'accounting', description: 'Liafrik accounting — invoices, payments & tax sync.' },
  { tool_name: 'Stripe', category: 'payment', description: 'Card payments and deposits for direct bookings.' },
  { tool_name: 'Adyen', category: 'payment', description: 'Multi-currency payment gateway.' },
  { tool_name: 'Nutro', category: 'hospitality', description: 'Liafrik F&B — restaurant orders posted to folios.' },
  { tool_name: 'Door Locks API', category: 'hospitality', description: 'Smart lock & keycard systems.' },
  { tool_name: 'SMS Gateway', category: 'communication', description: 'Guest SMS notifications and campaigns.' },
  { tool_name: 'Google Analytics', category: 'analytics', description: 'Booking engine traffic insights.' },
  { tool_name: 'OpenAI', category: 'ai', description: 'Guest-facing AI assistants, content & workflow automation.' },
  { tool_name: 'Claude', category: 'ai', description: 'Revenue analysis and staff copilot workflows.' },
  { tool_name: 'Gemini', category: 'ai', description: 'Multilingual guest communication and insights.' },
  { tool_name: 'ElevenLabs', category: 'ai', description: 'Voice AI for guest services and concierge lines.' },
  { tool_name: 'DeepL', category: 'ai', description: 'Real-time translation for guest messaging.' },
  { tool_name: 'Perplexity', category: 'ai', description: 'Market and demand research copilot.' },
];

export default function IntegrationHub() {
  const { selectedProperty } = useProperty();
  const [settings, setSettings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTool, setNewTool] = useState({ tool_name: '', category: 'accounting', description: '' });

  useEffect(() => {
    Promise.all([
      db.entities.IntegrationSetting.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([s, p]) => { setSettings(s || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const scopedSettings = settings.filter(s => !propertyId || s.property_id === propertyId);
  const filtered = scopedSettings.filter(s => activeCat === 'all' || s.category === activeCat);
  const connectedCount = scopedSettings.filter(s => s.status === 'connected').length;

  const toggle = async (setting) => {
    const next = setting.status === 'connected' ? 'disconnected' : 'connected';
    await db.entities.IntegrationSetting.update(setting.id, {
      status: next,
      last_sync: next === 'connected' ? new Date().toISOString() : setting.last_sync,
    });
    setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, status: next, last_sync: next === 'connected' ? new Date().toISOString() : s.last_sync } : s));
  };

  const resync = async (setting) => {
    await db.entities.IntegrationSetting.update(setting.id, { last_sync: new Date().toISOString() });
    setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, last_sync: new Date().toISOString() } : s));
  };

  const addIntegration = async (e) => {
    e.preventDefault();
    if (!newTool.tool_name || !propertyId) return;
    const created = await db.entities.IntegrationSetting.create({ ...newTool, property_id: propertyId, status: 'disconnected' });
    setSettings(prev => [...prev, created]);
    setNewTool({ tool_name: '', category: 'accounting', description: '' });
    setShowAdd(false);
  };

  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Integration Hub</h1>
          <p className="text-sm text-brand-slate">
            Payments, accounting and hospitality tools for {(selectedProperty || properties[0])?.name || 'this property'} — each property connects its own providers.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Add Integration
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tools', value: scopedSettings.length },
          { label: 'Connected', value: connectedCount },
          { label: 'Available Categories', value: categories.length },
          { label: 'Needs Attention', value: scopedSettings.filter(s => s.status === 'error').length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCat('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${activeCat === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All</button>
        {categories.map(c => {
          const Icon = categoryIcons[c];
          return (
            <button key={c} onClick={() => setActiveCat(c)} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${activeCat === c ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
              <Icon className="w-3.5 h-3.5" /> {c}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading integrations…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Plug className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate mb-4">No integrations in this category yet.</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-brand-navy text-white text-xs font-semibold rounded-full">Add your first</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-brand-border p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <BrandLogo name={s.tool_name} size="sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{s.tool_name}</p>
                    <p className="text-[10px] text-brand-slate capitalize">{s.category}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${s.status === 'connected' ? 'bg-green-50 text-green-700' : s.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  {s.status}
                </span>
              </div>
              {s.description && <p className="text-[12px] text-brand-slate leading-relaxed mb-3 flex-1">{s.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                <span className="text-[10px] text-brand-slate-light flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {s.last_sync ? `Synced ${new Date(s.last_sync).toLocaleString()}` : 'Never synced'}
                </span>
                <div className="flex gap-1.5">
                  {s.status === 'connected' && (
                    <button onClick={() => resync(s)} className="p-2 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy" title="Resync">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggle(s)}
                    className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-full ${s.status === 'connected' ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'bg-brand-navy text-white hover:bg-brand-blue'}`}
                  >
                    {s.status === 'connected' ? <><X className="w-3.5 h-3.5" /> Disconnect</> : <><Check className="w-3.5 h-3.5" /> Connect</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-ink mb-4">Add Integration</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1">Quick pick</label>
                <div className="flex flex-wrap gap-1.5">
                  {integrationCatalog.map(c => (
                    <button key={c.tool_name} onClick={() => setNewTool({ tool_name: c.tool_name, category: c.category, description: c.description })} className={`px-3 py-1.5 text-xs rounded-full border ${newTool.tool_name === c.tool_name ? 'bg-brand-navy text-white border-brand-navy' : 'border-brand-border text-brand-slate'}`}>
                      {c.tool_name}
                    </button>
                  ))}
                </div>
              </div>
              <input placeholder="Tool name" value={newTool.tool_name} onChange={e => setNewTool({ ...newTool, tool_name: e.target.value })} className={inputCls} />
              <select value={newTool.category} onChange={e => setNewTool({ ...newTool, category: e.target.value })} className={inputCls}>
                {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <input placeholder="Description (optional)" value={newTool.description} onChange={e => setNewTool({ ...newTool, description: e.target.value })} className={inputCls} />
              <div className="flex gap-2 pt-2">
                <button onClick={addIntegration} className="flex-1 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Add</button>
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-brand-border text-sm font-medium rounded-full text-brand-slate">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}