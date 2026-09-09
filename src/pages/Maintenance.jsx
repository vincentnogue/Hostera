const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Plus, X, Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const categoryLabels = {
  electrical: 'Electrical', plumbing: 'Plumbing', hvac: 'HVAC',
  furniture: 'Furniture', appliance: 'Appliance', structural: 'Structural', other: 'Other',
};

export default function Maintenance() {
  const { selectedProperty } = useProperty();
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'other', room_id: '' });

  const fetchData = async () => {
    try {
      const [ticketData, roomData, propData] = await Promise.all([
        db.entities.MaintenanceTicket.list(),
        db.entities.Room.list(),
        db.entities.Property.list(),
      ]);
      setTickets(ticketData || []);
      setRooms(roomData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.title) return;
    setCreating(true);
    try {
      const property = selectedProperty || properties[0];
      await db.entities.MaintenanceTicket.create({
        ...form,
        property_id: property?.id || '',
        status: 'open',
      });
      if (form.room_id) {
        await db.entities.Room.update(form.room_id, { status: 'maintenance' });
      }
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'medium', category: 'other', room_id: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus, roomId) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
      await db.entities.MaintenanceTicket.update(ticketId, updates);
      if (newStatus === 'completed' && roomId) {
        await db.entities.Room.update(roomId, { status: 'available' });
      }
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Maintenance</h1>
          <p className="text-sm text-brand-slate mt-1">Track and manage maintenance tickets</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div><p className="text-2xl font-bold text-brand-ink">{stats.open}</p><p className="text-xs text-brand-slate">Open</p></div>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <div><p className="text-2xl font-bold text-brand-ink">{stats.in_progress}</p><p className="text-xs text-brand-slate">In Progress</p></div>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div><p className="text-2xl font-bold text-brand-ink">{stats.completed}</p><p className="text-xs text-brand-slate">Completed</p></div>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div><p className="text-2xl font-bold text-brand-ink">{stats.urgent}</p><p className="text-xs text-brand-slate">Urgent</p></div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:bg-brand-bg'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No maintenance tickets</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {filtered.map((ticket) => {
              const room = rooms.find(r => r.id === ticket.room_id);
              return (
                <div key={ticket.id} className="p-4 hover:bg-brand-bg transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-brand-ink">{ticket.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      {ticket.description && (
                        <p className="text-xs text-brand-slate mb-1">{ticket.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-brand-slate">
                        <span>{categoryLabels[ticket.category] || ticket.category}</span>
                        <span>·</span>
                        <span>Room {room?.number || 'N/A'}</span>
                        {ticket.assigned_to && (
                          <>
                            <span>·</span>
                            <span>Assigned: {ticket.assigned_to}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value, ticket.room_id)}
                        className="text-xs px-2 py-1 border border-brand-border rounded-lg outline-none cursor-pointer bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">New Maintenance Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Broken AC unit"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Room (optional)</label>
                <select
                  value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                >
                  <option value="">No specific room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.number} (Floor {r.floor})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium text-brand-slate hover:bg-brand-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.title}
                className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}