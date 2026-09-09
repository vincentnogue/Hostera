const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Building2, Search, CheckCircle2, Ban, RotateCcw } from 'lucide-react';

const statusColors = {
  active: 'bg-green-500/15 text-green-400',
  trial: 'bg-blue-500/15 text-blue-400',
  suspended: 'bg-red-500/15 text-red-400',
  pending: 'bg-amber-500/15 text-amber-400',
  closed: 'bg-white/10 text-white/40',
};

export default function PlatformOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = async () => {
    try {
      const [orgData, propData, subData] = await Promise.all([
        db.entities.Organization.list(),
        db.entities.Property.list(),
        db.entities.PlatformSubscription.list(),
      ]);
      setOrgs(orgData || []);
      setProperties(propData || []);
      setSubs(subData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const logAction = async (org, action, severity = 'warning') => {
    try {
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `${action} organization`,
        entity_type: 'organization',
        entity_id: org.id,
        details: `${org.name} — status set to ${org.status}`,
        severity,
        timestamp: new Date().toISOString(),
      });
    } catch (e) { console.error(e); }
  };

  const changeStatus = async (org, newStatus) => {
    try {
      await db.entities.Organization.update(org.id, { status: newStatus });
      setActionMsg(`${org.name} → ${newStatus}`);
      setTimeout(() => setActionMsg(''), 2500);
      await logAction({ ...org, status: newStatus }, newStatus === 'suspended' ? 'suspended' : newStatus === 'active' ? 'activated' : 'updated');
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = orgs.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search && !(o.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-sm text-white/50 mt-1">{orgs.length} organizations · {properties.length} properties</p>
        </div>
        {actionMsg && (
          <span className="text-sm text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">{actionMsg}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-navy-900 rounded-lg border border-white/5 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-white placeholder:text-white/30"
          />
        </div>
        {['all', 'active', 'trial', 'pending', 'suspended'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-brand-blue text-white' : 'bg-brand-navy-900 border border-white/5 text-white/50 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-brand-navy-900 border border-white/5 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No organizations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Properties</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(org => {
                  const propCount = properties.filter(p => p.organization_id === org.id).length;
                  const sub = subs.find(s => s.organization_id === org.id);
                  return (
                    <tr key={org.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{org.name}</p>
                        <p className="text-xs text-white/40">{org.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-white/60">{org.country || '—'}</td>
                      <td className="px-4 py-3 text-white/60">{propCount}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-brand-navy text-white/80 font-medium capitalize border border-brand-blue/40">
                          {sub?.plan || org.plan || 'starter'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[org.status] || 'bg-white/10 text-white/50'}`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {org.status !== 'active' && (
                            <button
                              onClick={() => changeStatus(org, 'active')}
                              title="Activate"
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {org.status !== 'suspended' && (
                            <button
                              onClick={() => { if (window.confirm(`Suspend ${org.name}? This will restrict access for all its users.`)) changeStatus(org, 'suspended'); }}
                              title="Suspend"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {org.status === 'suspended' && (
                            <button
                              onClick={() => changeStatus(org, 'active')}
                              title="Reactivate"
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}