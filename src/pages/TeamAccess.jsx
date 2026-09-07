const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { UserPlus, X, Shield, Users, UserCog, ConciergeBell, Sparkles, Wrench, BarChart3 } from 'lucide-react';

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

  const fetchData = async () => {
    try {
      const data = await db.entities.User.list();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInvite = async () => {
    if (!form.email) return;
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
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Team Access</h1>
          <p className="text-sm text-[#64748B] mt-1">{users.length} team members with access</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#123B63] text-white rounded-lg text-sm font-medium hover:bg-[#1F5A8A] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No team members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {users.map((user) => {
              const config = roleConfig[user.role] || roleConfig.user;
              const RoleIcon = config.icon;
              const initials = (user.full_name || user.email || '?')
                .split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-[#F6F8FB] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#123B63] text-white flex items-center justify-center text-sm font-medium">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#17212B]">{user.full_name || user.email}</p>
                      <p className="text-xs text-[#64748B]">{user.email}</p>
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
              <h2 className="text-lg font-semibold text-[#17212B]">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-[#64748B] hover:text-[#17212B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#17212B] mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@hotel.com"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#123B63]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#17212B] mb-2 block">Access Role</label>
                <div className="space-y-2">
                  {roleOptions.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.role === r.value ? 'border-[#123B63] bg-blue-50/30' : 'border-[#E2E8F0] hover:bg-[#F6F8FB]'}`}>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        className="mt-1 accent-[#123B63]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#17212B]">{r.label}</p>
                        <p className="text-xs text-[#64748B]">{r.desc}</p>
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
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F6F8FB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !form.email}
                className="flex-1 px-4 py-2 bg-[#123B63] text-white rounded-lg text-sm font-medium hover:bg-[#1F5A8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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