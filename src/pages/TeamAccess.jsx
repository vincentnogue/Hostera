const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { UserPlus, X, Shield, Users, UserCog, Lock } from 'lucide-react';
import { PLANS } from '@/lib/marketing';

const roleConfig = {
  admin: { icon: Shield, color: 'bg-purple-100 text-purple-700', label: 'Admin' },
  user: { icon: UserCog, color: 'bg-blue-100 text-blue-700', label: 'Staff' },
};

const roleOptions = [
  { value: 'user', label: 'Staff Member', desc: 'General property access' },
  { value: 'admin', label: 'Administrator', desc: 'Full access including settings' },
];

export default function TeamAccess() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [form, setForm] = useState({ email: '', role: 'user' });
  const [plan, setPlan] = useState(null);

  const fetchData = async () => {
    try {
      const [data, subs] = await Promise.all([
        db.entities.User.list(),
        db.entities.SubscriptionSetting.list().catch(() => []),
      ]);
      setUsers(data || []);
      setPlan(PLANS.find(p => p.name.toLowerCase() === (subs || [])[0]?.plan) || PLANS[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const atUserLimit = plan?.maxUsers != null && users.length >= plan.maxUsers;

  const handleInvite = async () => {
    if (!form.email || atUserLimit) return;
    setInviting(true);
    setInviteMsg('');
    try {
      await db.users.inviteUser(form.email, form.role);
      setInviteMsg(`Invitation sent to ${form.email}`);
      setForm({ email: '', role: 'user' });
      setTimeout(() => { setShowInvite(false); setInviteMsg(''); }, 2000);
      fetchData();
    } catch (e) {
      setInviteMsg(e?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Team Access</h1>
          <p className="text-sm text-brand-slate mt-1">
            {users.length} team members with access
            {plan && <span className="text-brand-slate-light"> · {plan.maxUsers != null ? `${plan.maxUsers} max on ${plan.name}` : `Unlimited on ${plan.name}`}</span>}
          </p>
        </div>
        <button
          onClick={() => atUserLimit ? null : setShowInvite(true)}
          disabled={atUserLimit}
          title={atUserLimit ? `You've reached the ${plan.maxUsers}-user limit on the ${plan.name} plan — upgrade to invite more.` : undefined}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-navy"
        >
          {atUserLimit ? <Lock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {atUserLimit ? 'User limit reached' : 'Invite Member'}
        </button>
      </div>

      {atUserLimit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          You&apos;ve reached the {plan.maxUsers}-user limit on the {plan.name} plan.{' '}
          <a href="/subscription" className="font-semibold underline">Upgrade your plan</a> to invite more team members.
        </div>
      )}

      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No team members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {users.map((user) => {
              const config = roleConfig[user.role] || roleConfig.user;
              const RoleIcon = config.icon;
              const initials = (user.full_name || user.email || '?')
                .split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-brand-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-medium">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{user.full_name || user.email}</p>
                      <p className="text-xs text-brand-slate">{user.email}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@hotel.com"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-2 block">Access Role</label>
                <div className="space-y-2">
                  {roleOptions.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.role === r.value ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border hover:bg-brand-bg'}`}>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        className="mt-1 accent-brand-navy"
                      />
                      <div>
                        <p className="text-sm font-medium text-brand-ink">{r.label}</p>
                        <p className="text-xs text-brand-slate">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {inviteMsg && (
                <p className={`text-sm ${inviteMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{inviteMsg}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium text-brand-slate hover:bg-brand-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !form.email}
                className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}