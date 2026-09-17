const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';
import { useProperty } from '@/lib/PropertyContext';
import { Compass, Plus, X, Users, Clock, Percent, CalendarDays } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const emptyForm = { title: '', description: '', price: '', duration_minutes: 60, category: 'tour', commission_rate: 15 };

export default function Experiences() {
  const { toast } = useToast();
  const { selectedProperty, properties } = useProperty();
  const property = selectedProperty || properties[0];

  const [experiences, setExperiences] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.Experience.list('-created_date', 200),
      db.entities.ExperienceBooking.list('-created_date', 200),
    ]).then(([e, b]) => { setExperiences(e || []); setBookings(b || []); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const bookingsFor = (expId) => bookings.filter(b => b.experience_id === expId);

  const totalCommission = useMemo(
    () => bookings.reduce((s, b) => s + (Number(b.commission_amount) || 0), 0),
    [bookings]
  );

  const createExperience = async (e) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    try {
      await db.entities.Experience.create({
        property_id: property.id,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        duration_minutes: Number(form.duration_minutes) || 60,
        category: form.category,
        commission_rate: Number(form.commission_rate) || 15,
        status: 'active',
      });
      toast({ title: 'Experience published', description: 'Guests can now add it while booking.' });
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast({ title: 'Could not create experience', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (exp) => {
    const next = exp.status === 'active' ? 'paused' : 'active';
    await db.entities.Experience.update(exp.id, { status: next });
    setExperiences(prev => prev.map(x => x.id === exp.id ? { ...x, status: next } : x));
  };

  const updateBookingStatus = async (b, status) => {
    await db.entities.ExperienceBooking.update(b.id, { status });
    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status } : x));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Compass className="w-5 h-5" /> Expériences &amp; Visites</h1>
          <p className="text-sm text-brand-navy/50">Sell local activities and tours alongside room bookings — you keep the rest of the commission.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> New experience
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Live experiences', value: experiences.filter(e => e.status === 'active').length },
          { label: 'Bookings', value: bookings.length },
          { label: 'Platform commission paid', value: `$${totalCommission.toFixed(2)}` },
        ].map(k => (
          <div key={k.label} className="bg-white border border-brand-border rounded-2xl p-4">
            <p className="text-lg font-bold text-brand-navy">{k.value}</p>
            <p className="text-xs text-brand-navy/50">{k.label}</p>
          </div>
        ))}
      </div>

      {experiences.length === 0 ? (
        <div className="bg-white border border-dashed border-brand-border rounded-2xl p-10 text-center text-sm text-brand-navy/50">
          No experiences yet. Add a local tour or activity to sell it during checkout.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {experiences.map(exp => (
            <div key={exp.id} className="bg-white border border-brand-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-brand-navy">{exp.title}</p>
                  <p className="text-xs text-brand-navy/40 flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3" /> {exp.duration_minutes} min · <Percent className="w-3 h-3" /> {exp.commission_rate}% commission
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-navy">${Number(exp.price).toFixed(2)}</span>
              </div>
              <p className="text-sm text-brand-navy/60 mb-3">{exp.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exp.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{exp.status}</span>
                <button onClick={() => toggleStatus(exp)} className="text-xs font-semibold text-brand-navy hover:text-brand-blue">
                  {exp.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              </div>
              {bookingsFor(exp.id).length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-border space-y-2">
                  {bookingsFor(exp.id).map(b => (
                    <div key={b.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-brand-navy/70"><Users className="w-3 h-3" /> {b.guest_name} · {b.participants} pax · <CalendarDays className="w-3 h-3" /> {b.scheduled_date}</span>
                      <select value={b.status} onChange={e => updateBookingStatus(b, e.target.value)} className="border border-brand-border rounded-full px-2 py-0.5 text-xs">
                        <option value="requested">Requested</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <form onSubmit={createExperience} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-navy">New experience</h2>
              <button type="button" onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></button>
            </div>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Desert safari & BBQ dinner"
              className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Short description guests will see"
              className="w-full px-3.5 py-2 border border-brand-border rounded-2xl text-sm outline-none focus:border-brand-navy resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Price ($)</label>
                <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Duration (min)</label>
                <input type="number" min="1" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                  <option value="tour">Tour</option>
                  <option value="activity">Activity</option>
                  <option value="dining">Dining</option>
                  <option value="wellness">Wellness</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Hostera commission (%)</label>
                <input type="number" min="0" max="100" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              {saving ? 'Publishing…' : 'Publish experience'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
