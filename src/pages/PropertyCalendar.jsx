const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, TrendingUp, Wrench, PartyPopper } from 'lucide-react';

const typeConfig = {
  event: { label: 'Local Event', dot: 'bg-blue-500', pill: 'bg-blue-50 text-brand-navy', icon: PartyPopper },
  demand: { label: 'Demand Period', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700', icon: TrendingUp },
  maintenance: { label: 'Maintenance', dot: 'bg-red-400', pill: 'bg-red-50 text-red-600', icon: Wrench },
  holiday: { label: 'Holiday', dot: 'bg-green-500', pill: 'bg-green-50 text-green-700', icon: CalendarDays },
};

export default function PropertyCalendar() {
  const { selectedProperty } = useProperty();
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'event', date: new Date().toISOString().slice(0, 10), end_date: '', notes: '' });

  useEffect(() => {
    Promise.all([
      db.entities.CalendarEvent.list('-date', 300),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([e, p]) => { setEvents(e || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const visibleEvents = events.filter(e => filter === 'all' || e.type === filter);
  const monthEvents = visibleEvents.filter(e => (e.date || '').startsWith(monthKey));
  const eventsOn = (dayStr) => visibleEvents.filter(e => {
    if (e.date === dayStr) return true;
    return e.end_date && e.date <= dayStr && e.end_date >= dayStr;
  });

  const addEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !propertyId) return;
    const created = await db.entities.CalendarEvent.create({ ...form, property_id: propertyId });
    setEvents(prev => [created, ...prev]);
    setForm({ title: '', type: 'event', date: new Date().toISOString().slice(0, 10), end_date: '', notes: '' });
    setShowAdd(false);
  };

  const deleteEvent = async (id) => {
    await db.entities.CalendarEvent.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Property Calendar</h1>
          <p className="text-sm text-brand-slate">Local events, seasonal demand periods and scheduled maintenance blocks — visible to the whole team.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${filter === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All</button>
        {Object.entries(typeConfig).map(([t, c]) => (
          <button key={t} onClick={() => setFilter(t)} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full ${filter === t ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-brand-ink capitalize">
              {cursor.toLocaleString('en', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1.5">
              <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-[10px] text-brand-slate-light text-center font-semibold uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }, (_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayStr = `${monthKey}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsOn(dayStr);
              const isToday = dayStr === todayStr;
              return (
                <div key={dayStr} className={`min-h-[72px] p-1.5 rounded-xl border ${isToday ? 'border-brand-navy bg-blue-50/40' : 'border-[#F1F5F9]'}`}>
                  <p className={`text-[11px] font-semibold ${isToday ? 'text-brand-navy' : 'text-brand-ink'}`}>{day}</p>
                  <div className="space-y-0.5 mt-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${typeConfig[e.type]?.dot || 'bg-gray-400'} shrink-0`} />
                        <span className="text-[9px] text-brand-slate truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[8px] text-brand-slate-light">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month list */}
        <div className="bg-white rounded-xl border border-brand-border p-5">
          <h3 className="text-sm font-semibold text-brand-ink mb-4">This Month ({monthEvents.length})</h3>
          {loading ? (
            <p className="text-xs text-brand-slate">Loading…</p>
          ) : monthEvents.length === 0 ? (
            <p className="text-xs text-brand-slate-light">No entries this month.</p>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
              {monthEvents.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(e => {
                const c = typeConfig[e.type] || typeConfig.event;
                return (
                  <div key={e.id} className="p-3.5 rounded-xl border border-brand-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.pill}`}>{c.label}</span>
                        <p className="text-[13px] font-medium text-brand-ink mt-1.5">{e.title}</p>
                        <p className="text-[11px] text-brand-slate mt-0.5">
                          {e.date ? new Date(e.date).toLocaleDateString() : ''}{e.end_date ? ` → ${new Date(e.end_date).toLocaleDateString()}` : ''}
                        </p>
                        {e.notes && <p className="text-[11px] text-brand-slate-light mt-1 leading-snug">{e.notes}</p>}
                      </div>
                      <button onClick={() => deleteEvent(e.id)} className="text-[10px] text-red-400 hover:text-red-600 font-medium shrink-0">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Add Calendar Entry</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addEvent} className="space-y-3">
              <input placeholder="Title (e.g. Formula 1 weekend, Boiler maintenance)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                {Object.entries(typeConfig).map(([t, c]) => <option key={t} value={t}>{c.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
              </div>
              <textarea placeholder="Notes for the team (e.g. expect high demand, raise rates 15%)…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none" />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Add Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}