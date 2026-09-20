const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useProperty } from '@/lib/PropertyContext';

import { Sparkles, BedDouble, CheckCircle2, Clock, AlertCircle, Plus, X } from 'lucide-react';

const roomStatusConfig = {
  available: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Available' },
  occupied: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Occupied' },
  dirty: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Dirty' },
  clean: { color: 'bg-teal-100 text-teal-700 border-teal-200', dot: 'bg-teal-500', label: 'Clean' },
  inspected: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-600', label: 'Inspected' },
  out_of_order: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Out of Order' },
  maintenance: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Maintenance' },
  reserved: { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'Reserved' },
};

const taskStatusFlow = ['pending', 'assigned', 'in_progress', 'completed', 'inspected'];

export default function Housekeeping() {
  const { toast } = useToast();
  const { selectedProperty, properties } = useProperty();
  const [allRooms, setAllRooms] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // HousekeepingTask rows were only ever updated (status changes), never
  // created — there was no way for staff to actually log a new task, so
  // this board could only ever show tasks that don't exist yet.
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ room_id: '', type: 'cleaning', priority: 'normal' });
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchData = async () => {
    try {
      const [roomData, taskData] = await Promise.all([
        db.entities.Room.list(),
        db.entities.HousekeepingTask.list(),
      ]);
      setAllRooms(roomData || []);
      setAllTasks(taskData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Derived at render time (not baked into state at fetch time) so
  // switching properties via the header switcher updates this board
  // immediately, the same way RoomTypes/Reservations/Rate Manager do.
  const property = selectedProperty || properties[0];
  const scoped = properties.length > 1 && property;
  const rooms = scoped ? allRooms.filter(r => r.property_id === property.id) : allRooms;
  const roomIds = scoped ? new Set(rooms.map(r => r.id)) : null;
  // HousekeepingTask rows link to a room, not directly to a property, so
  // scope through the room rather than assuming a property_id field exists
  // on the task itself.
  const tasks = scoped ? allTasks.filter(t => roomIds.has(t.room_id)) : allTasks;

  const handleRoomStatusChange = async (roomId, newStatus) => {
    try {
      await db.entities.Room.update(roomId, { status: newStatus });
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update room status', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
      await db.entities.HousekeepingTask.update(taskId, updates);
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update task', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.room_id) return;
    setCreatingTask(true);
    try {
      const room = allRooms.find(r => r.id === newTask.room_id);
      await db.entities.HousekeepingTask.create({
        organization_id: room?.organization_id || property?.organization_id,
        property_id: room?.property_id || property?.id,
        room_id: newTask.room_id,
        type: newTask.type,
        priority: newTask.priority,
        status: 'pending',
      });
      setShowNewTask(false);
      setNewTask({ room_id: '', type: 'cleaning', priority: 'normal' });
      fetchData();
      toast({ title: 'Task created' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not create task', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusCounts = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    clean: rooms.filter(r => r.status === 'clean').length,
    inspected: rooms.filter(r => r.status === 'inspected').length,
    out_of_order: rooms.filter(r => r.status === 'out_of_order' || r.status === 'maintenance').length,
  };

  const stats = [
    { label: 'Available', value: statusCounts.available, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Dirty', value: statusCounts.dirty, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Clean', value: statusCounts.clean, icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Inspected', value: statusCounts.inspected, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const sortedRooms = [...rooms].sort((a, b) => (a.number || '').localeCompare(b.number || ''));
  const filteredRooms = filter === 'all' ? sortedRooms : sortedRooms.filter(r => r.status === filter);

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'inspected' && t.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Housekeeping</h1>
        <p className="text-sm text-brand-slate mt-1">Room status board and cleaning tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-ink">{s.value}</p>
                  <p className="text-xs text-brand-slate">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:bg-brand-bg'
          }`}
        >
          All ({rooms.length})
        </button>
        {Object.entries(roomStatusConfig).map(([status, config]) => {
          const count = rooms.filter(r => r.status === status).length;
          if (count === 0 && status !== 'dirty' && status !== 'available' && status !== 'occupied') return null;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:bg-brand-bg'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Room Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredRooms.map((room) => {
          const config = roomStatusConfig[room.status] || roomStatusConfig.available;
          const roomTask = tasks.find(t => t.room_id === room.id && t.status !== 'completed' && t.status !== 'cancelled');
          return (
            <div key={room.id} className={`rounded-xl border-2 p-4 ${config.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4" />
                  <span className="text-sm font-bold">{room.number}</span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
              </div>
              <p className="text-xs font-medium mb-3">{config.label}</p>
              {roomTask && (
                <p className="text-[10px] opacity-70 mb-2 truncate">
                  Task: {roomTask.type} · {roomTask.priority}
                </p>
              )}
              <select
                value={room.status}
                onChange={(e) => handleRoomStatusChange(room.id, e.target.value)}
                className="w-full text-xs px-2 py-1 rounded-md border border-current border-opacity-20 bg-white bg-opacity-50 outline-none cursor-pointer"
              >
                <option value="available">Available</option>
                <option value="dirty">Dirty</option>
                <option value="clean">Clean</option>
                <option value="inspected">Inspected</option>
                <option value="occupied">Occupied</option>
                <option value="out_of_order">Out of Order</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowNewTask(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-3.5 h-3.5" /> New task
        </button>
      </div>

      {showNewTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTask(false)}>
          <form onSubmit={createTask} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-ink">New housekeeping task</h2>
              <button type="button" onClick={() => setShowNewTask(false)}><X className="w-4 h-4" /></button>
            </div>
            <select required value={newTask.room_id} onChange={e => setNewTask({ ...newTask, room_id: e.target.value })}
              className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
              <option value="">Select a room…</option>
              {allRooms.map(r => <option key={r.id} value={r.id}>Room {r.number}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="px-3 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                <option value="cleaning">Cleaning</option>
                <option value="deep_clean">Deep clean</option>
                <option value="turndown">Turndown</option>
                <option value="inspection">Inspection</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="px-3 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <button type="submit" disabled={creatingTask || !newTask.room_id} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              {creatingTask ? 'Creating…' : 'Create task'}
            </button>
          </form>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {pendingTasks.map((task) => {
              const room = rooms.find(r => r.id === task.room_id);
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-brand-slate" />
                    <div>
                      <p className="text-sm font-medium text-brand-ink">
                        Room {room?.number || task.room_number || 'N/A'} — {task.type}
                      </p>
                      <p className="text-xs text-brand-slate">
                        Priority: {task.priority} · Assigned: {task.assigned_to || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                    className="text-xs px-2 py-1.5 border border-brand-border rounded-lg outline-none cursor-pointer bg-white"
                  >
                    {taskStatusFlow.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}