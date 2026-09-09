const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Crown, Gift, Plus, X, Star, Users, Sparkles } from 'lucide-react';

const tierColors = { blue: 'bg-blue-50 text-brand-navy border-blue-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', gray: 'bg-gray-100 text-gray-600 border-gray-200', green: 'bg-green-50 text-green-700 border-green-200' };

export default function LoyaltyProgram() {
  const [tiers, setTiers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [guests, setGuests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'tier' | 'reward'
  const [tierForm, setTierForm] = useState({ name: '', min_points: 0, discount_percent: 0, benefits: '', color: 'blue' });
  const [rewardForm, setRewardForm] = useState({ name: '', points_cost: 100, description: '', category: 'discount' });

  useEffect(() => {
    Promise.all([
      db.entities.LoyaltyTier.list(),
      db.entities.LoyaltyReward.list(),
      db.entities.Guest.list().catch(() => []),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([t, r, g, p]) => { setTiers(t || []); setRewards(r || []); setGuests(g || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";
  const members = guests.filter(g => (g.loyalty_points || 0) > 0);
  const topGuests = [...guests].sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0)).slice(0, 5);

  const saveTier = async (e) => {
    e.preventDefault();
    if (!tierForm.name || !propertyId) return;
    const created = await db.entities.LoyaltyTier.create({ ...tierForm, property_id: propertyId });
    setTiers(prev => [...prev, created]);
    setTierForm({ name: '', min_points: 0, discount_percent: 0, benefits: '', color: 'blue' });
    setDialog(null);
  };

  const saveReward = async (e) => {
    e.preventDefault();
    if (!rewardForm.name || !propertyId) return;
    const created = await db.entities.LoyaltyReward.create({ ...rewardForm, property_id: propertyId });
    setRewards(prev => [...prev, created]);
    setRewardForm({ name: '', points_cost: 100, description: '', category: 'discount' });
    setDialog(null);
  };

  const toggleStatus = async (item, kind) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    await db.entities[kind].update(item.id, { status: next });
    const setter = kind === 'LoyaltyTier' ? setTiers : setRewards;
    setter(prev => prev.map(t => t.id === item.id ? { ...t, status: next } : t));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Loyalty Program</h1>
        <p className="text-sm text-brand-slate">Membership tiers, guest points and exclusive rewards for frequent visitors.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Membership Tiers', value: tiers.filter(t => t.status === 'active').length, icon: Crown },
          { label: 'Active Rewards', value: rewards.filter(r => r.status === 'active').length, icon: Gift },
          { label: 'Enrolled Members', value: members.length, icon: Users },
          { label: 'Points Issued', value: members.reduce((s, g) => s + (g.loyalty_points || 0), 0).toLocaleString(), icon: Sparkles },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
              <Icon className="w-4 h-4 text-brand-navy mb-2" />
              <p className="text-xl font-bold text-brand-ink">{k.value}</p>
              <p className="text-[11px] text-brand-slate">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TIERS */}
        <div className="bg-white rounded-xl border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-brand-ink">Membership Tiers</h3>
            <button onClick={() => setDialog('tier')} className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">
              <Plus className="w-3.5 h-3.5" /> New Tier
            </button>
          </div>
          {tiers.length === 0 ? (
            <p className="text-xs text-brand-slate py-6 text-center border border-dashed border-brand-border rounded-xl">No tiers yet — create Silver, Gold, Platinum…</p>
          ) : (
            <div className="space-y-3">
              {tiers.sort((a, b) => (a.min_points || 0) - (b.min_points || 0)).map(t => (
                <div key={t.id} className={`p-4 rounded-xl border ${tierColors[t.color] || tierColors.blue}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-bold">{t.name}</p>
                        <p className="text-[11px] opacity-70">{t.min_points}+ pts · {t.discount_percent}% discount</p>
                      </div>
                    </div>
                    <button onClick={() => toggleStatus(t, 'LoyaltyTier')} className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${t.status === 'active' ? 'bg-white/70' : 'bg-white text-gray-500'}`}>
                      {t.status}
                    </button>
                  </div>
                  {t.benefits && <p className="text-[11px] opacity-75 mt-2 leading-relaxed">{t.benefits}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REWARDS */}
        <div className="bg-white rounded-xl border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-brand-ink">Exclusive Rewards</h3>
            <button onClick={() => setDialog('reward')} className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">
              <Plus className="w-3.5 h-3.5" /> New Reward
            </button>
          </div>
          {rewards.length === 0 ? (
            <p className="text-xs text-brand-slate py-6 text-center border border-dashed border-brand-border rounded-xl">No rewards yet — add free nights, upgrades, vouchers…</p>
          ) : (
            <div className="space-y-2.5">
              {rewards.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{r.name}</p>
                      <p className="text-[11px] text-brand-slate">{r.points_cost} pts · {r.category}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleStatus(r, 'LoyaltyReward')} className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP MEMBERS */}
      <div className="bg-white rounded-xl border border-brand-border p-5">
        <h3 className="text-sm font-semibold text-brand-ink mb-4">Top Members by Points</h3>
        {topGuests.length === 0 ? (
          <p className="text-xs text-brand-slate">No guest data yet.</p>
        ) : (
          <div className="space-y-2">
            {topGuests.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg">
                <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-ink">{g.first_name} {g.last_name}</p>
                  {g.vip_status && g.vip_status !== 'none' && (
                    <span className="text-[10px] text-amber-600 font-semibold uppercase">{g.vip_status} VIP</span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-brand-navy">
                  <Star className="w-3.5 h-3.5 fill-brand-navy" />
                  {(g.loyalty_points || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DIALOGS */}
      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDialog(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">{dialog === 'tier' ? 'New Membership Tier' : 'New Reward'}</h3>
              <button onClick={() => setDialog(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            {dialog === 'tier' ? (
              <form onSubmit={saveTier} className="space-y-3">
                <input placeholder="Tier name (e.g. Gold)" value={tierForm.name} onChange={e => setTierForm({ ...tierForm, name: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Minimum points" value={tierForm.min_points} onChange={e => setTierForm({ ...tierForm, min_points: Number(e.target.value) })} className={inputCls} />
                  <input type="number" placeholder="Discount %" value={tierForm.discount_percent} onChange={e => setTierForm({ ...tierForm, discount_percent: Number(e.target.value) })} className={inputCls} />
                </div>
                <select value={tierForm.color} onChange={e => setTierForm({ ...tierForm, color: e.target.value })} className={inputCls}>
                  <option value="blue">Blue</option><option value="amber">Amber</option><option value="green">Green</option><option value="gray">Gray</option>
                </select>
                <input placeholder="Benefits (e.g. Late checkout, free upgrade)" value={tierForm.benefits} onChange={e => setTierForm({ ...tierForm, benefits: e.target.value })} className={inputCls} />
                <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Create Tier</button>
              </form>
            ) : (
              <form onSubmit={saveReward} className="space-y-3">
                <input placeholder="Reward name (e.g. Free night)" value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Points cost" value={rewardForm.points_cost} onChange={e => setRewardForm({ ...rewardForm, points_cost: Number(e.target.value) })} className={inputCls} />
                  <select value={rewardForm.category} onChange={e => setRewardForm({ ...rewardForm, category: e.target.value })} className={inputCls}>
                    <option value="discount">Discount</option><option value="upgrade">Upgrade</option><option value="amenity">Amenity</option><option value="experience">Experience</option><option value="voucher">Voucher</option>
                  </select>
                </div>
                <input placeholder="Description" value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} className={inputCls} />
                <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Create Reward</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}