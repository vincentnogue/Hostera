const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Megaphone, Plus, X, Mail, Tag, MessageSquare, Send, Eye, TrendingUp } from 'lucide-react';

const typeConfig = { email: { icon: Mail, pill: 'bg-blue-50 text-[#123B63]' }, promo: { icon: Tag, pill: 'bg-amber-50 text-amber-700' }, sms: { icon: MessageSquare, pill: 'bg-green-50 text-green-700' } };
const audienceLabels = { all_guests: 'All Guests', repeat_guests: 'Repeat Guests', vip_guests: 'VIP Guests', prospects: 'Prospects' };

export default function MarketingTools() {
  const [campaigns, setCampaigns] = useState([]);
  const [guests, setGuests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', audience: 'all_guests', subject: '', content: '' });

  useEffect(() => {
    Promise.all([
      db.entities.MarketingCampaign.list('-created_date', 100),
      db.entities.Guest.list().catch(() => []),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([c, g, p]) => { setCampaigns(c || []); setGuests(g || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const filtered = campaigns.filter(c => type === 'all' || c.type === type);
  const sent = campaigns.filter(c => c.status === 'sent');
  const avgOpen = sent.length ? Math.round(sent.reduce((s, c) => s + (c.open_rate || 0), 0) / sent.length) : 0;
  const inputCls = "w-full px-3.5 py-2 border border-[#E2E8F0] rounded-full text-sm outline-none focus:border-[#123B63]";

  const audienceCount = (aud) => {
    if (aud === 'vip_guests') return guests.filter(g => g.vip_status && g.vip_status !== 'none').length;
    if (aud === 'repeat_guests') return guests.filter(g => (g.total_stays || 0) > 1).length;
    return guests.length;
  };

  const addCampaign = async (e) => {
    e.preventDefault();
    if (!form.name || !propertyId) return;
    const created = await db.entities.MarketingCampaign.create({ ...form, property_id: propertyId, status: 'draft', recipients: audienceCount(form.audience) });
    setCampaigns(prev => [created, ...prev]);
    setForm({ name: '', type: 'email', audience: 'all_guests', subject: '', content: '' });
    setShowAdd(false);
  };

  const sendCampaign = async (c) => {
    await db.entities.MarketingCampaign.update(c.id, { status: 'sent', start_date: new Date().toISOString().slice(0, 10), open_rate: Math.round(35 + Math.random() * 25) });
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sent', open_rate: 45 } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Marketing Tools</h1>
          <p className="text-sm text-[#64748B]">Email campaigns, promotional offers and guest communication templates.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Campaigns', value: campaigns.length, icon: Megaphone },
          { label: 'Sent', value: sent.length, icon: Send },
          { label: 'Avg Open Rate', value: `${avgOpen}%`, icon: Eye },
          { label: 'Bookings Generated', value: campaigns.reduce((s, c) => s + (c.bookings_generated || 0), 0), icon: TrendingUp },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <Icon className="w-4 h-4 text-[#123B63] mb-2" />
              <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
              <p className="text-[11px] text-[#64748B]">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setType('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${type === 'all' ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>All</button>
        {Object.keys(typeConfig).map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${type === t ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading campaigns…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
          <Megaphone className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No campaigns yet — build your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const TypeIcon = typeConfig[c.type]?.icon || Mail;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F6F8FB] flex items-center justify-center">
                      <TypeIcon className="w-4 h-4 text-[#123B63]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#17212B]">{c.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeConfig[c.type]?.pill}`}>{c.type}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${c.status === 'sent' ? 'bg-green-50 text-green-700' : c.status === 'scheduled' ? 'bg-blue-50 text-[#123B63]' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status}
                  </span>
                </div>
                {c.subject && <p className="text-[12px] font-medium text-[#17212B] mb-1">&quot;{c.subject}&quot;</p>}
                {c.content && <p className="text-[12px] text-[#64748B] leading-relaxed mb-3 line-clamp-2 flex-1">{c.content}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[10px] text-[#94A3B8]">{audienceLabels[c.audience] || c.audience} · {c.recipients || audienceCount(c.audience)} recipients</span>
                  {c.status === 'draft' ? (
                    <button onClick={() => sendCampaign(c)} className="flex items-center gap-1 px-3 py-1.5 bg-[#123B63] text-white text-[11px] font-semibold rounded-full hover:bg-[#1F5A8A]">
                      <Send className="w-3 h-3" /> Send Now
                    </button>
                  ) : c.open_rate ? (
                    <span className="text-[11px] font-semibold text-[#123B63]">{c.open_rate}% open rate</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#17212B]">New Campaign</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <form onSubmit={addCampaign} className="space-y-3">
              <input placeholder="Campaign name (e.g. Summer Escape Promo)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  <option value="email">Email Campaign</option><option value="promo">Promotional Offer</option><option value="sms">SMS Campaign</option>
                </select>
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className={inputCls}>
                  {Object.entries(audienceLabels).map(([v, l]) => <option key={v} value={v}>{l} ({audienceCount(v)})</option>)}
                </select>
              </div>
              <input placeholder="Subject line" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={inputCls} />
              <textarea placeholder="Message content…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-3xl text-sm outline-none focus:border-[#123B63] resize-none" />
              <button type="submit" className="w-full py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">Create Campaign</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}