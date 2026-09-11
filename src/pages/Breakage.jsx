const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import {
  Plus, X, PackageX, AlertTriangle, MapPin, User, DollarSign,
  Camera, Loader2, Check, ArrowRight, PackageMinus
} from 'lucide-react';

const CATEGORIES = ['Linen', 'Furniture', 'Electronics', 'Glassware & Crockery', 'Fixtures', 'Other'];
const CAUSES = ['Accidental', 'Guest damage', 'Staff error', 'Wear and tear', 'Theft', 'Unknown'];

const STATUS_FLOW = { reported: 'under_review', under_review: 'resolved' };
const statusPills = {
  reported: 'bg-red-50 text-red-600',
  under_review: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
  charged: 'bg-purple-50 text-purple-700',
  written_off: 'bg-gray-100 text-gray-500',
};

export default function Breakage() {
  const { selectedProperty } = useProperty();
  const [reports, setReports] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    item_name: '', inventory_item_id: '', category: 'Other', room_number: '',
    quantity: 1, estimated_cost: 0, cause: 'Accidental',
    charged_to_guest: false, guest_name: '', reported_by: '', notes: '', photo_url: '',
  });

  useEffect(() => {
    Promise.all([
      db.entities.BreakageReport.list('-reported_date', 200),
      db.entities.InventoryItem.list().catch(() => []),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([r, inv, p]) => { setReports(r || []); setInventory(inv || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";
  const currency = selectedProperty?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

  const filtered = reports.filter(r => status === 'all' || r.status === status);
  const totalLoss = reports.reduce((sum, r) => sum + (Number(r.estimated_cost) || 0), 0);
  const pendingReview = reports.filter(r => r.status === 'reported' || r.status === 'under_review').length;
  const chargedCount = reports.filter(r => r.charged_to_guest).length;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, bucket: 'uploads' });
      if (file_url) setForm(prev => ({ ...prev, photo_url: file_url }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!form.item_name || !propertyId) return;
    const created = await db.entities.BreakageReport.create({
      ...form,
      property_id: propertyId,
      reported_date: new Date().toISOString().slice(0, 10),
      status: 'reported',
    });
    setReports(prev => [created, ...prev]);
    setForm({
      item_name: '', inventory_item_id: '', category: 'Other', room_number: '',
      quantity: 1, estimated_cost: 0, cause: 'Accidental',
      charged_to_guest: false, guest_name: '', reported_by: '', notes: '', photo_url: '',
    });
    setShowAdd(false);
  };

  const advance = async (r) => {
    const next = STATUS_FLOW[r.status];
    if (!next) return;
    await db.entities.BreakageReport.update(r.id, { status: next });
    setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
  };

  const markFinal = async (r, finalStatus) => {
    await db.entities.BreakageReport.update(r.id, { status: finalStatus });
    setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: finalStatus } : x));
  };

  const deductFromInventory = async (r) => {
    const invItem = inventory.find(i => i.id === r.inventory_item_id);
    if (!invItem) return;
    const newQty = Math.max(0, (invItem.quantity || 0) - (r.quantity || 1));
    await db.entities.InventoryItem.update(invItem.id, { quantity: newQty });
    setInventory(prev => prev.map(i => i.id === invItem.id ? { ...i, quantity: newQty } : i));
    await db.entities.BreakageReport.update(r.id, { inventory_deducted: true });
    setReports(prev => prev.map(x => x.id === r.id ? { ...x, inventory_deducted: true } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Breakage & Damage</h1>
          <p className="text-sm text-brand-slate">Report broken or damaged items, track estimated loss, and decide whether it&apos;s charged to a guest or written off.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Report Breakage
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length },
          { label: 'Pending Review', value: pendingReview },
          { label: 'Estimated Loss', value: fmt(totalLoss) },
          { label: 'Charged to Guests', value: chargedCount },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'reported', 'under_review', 'resolved', 'charged', 'written_off'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${status === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading reports…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <PackageX className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No breakage reports match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-brand-border p-5 flex flex-col">
              {r.photo_url && (
                <img src={r.photo_url} alt={r.item_name} className="w-full h-32 object-cover rounded-lg mb-3" loading="lazy" />
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusPills[r.status] || 'bg-gray-100 text-gray-500'}`}>
                  {(r.status || '').replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-brand-ink">{r.item_name} {r.quantity > 1 && `×${r.quantity}`}</p>
              <p className="text-[11px] text-brand-slate-light">{r.category} · {r.cause}</p>
              <div className="space-y-1 mt-3 text-[11px] text-brand-slate">
                {r.room_number && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />Room {r.room_number}</p>}
                {r.guest_name && <p className="flex items-center gap-1.5"><User className="w-3 h-3" />{r.guest_name}{r.charged_to_guest && ' · charged'}</p>}
                {r.estimated_cost > 0 && <p className="flex items-center gap-1.5 font-medium text-brand-ink"><DollarSign className="w-3 h-3" />{fmt(r.estimated_cost)}</p>}
                {r.reported_by && <p className="text-brand-slate-light">Reported by {r.reported_by}</p>}
              </div>
              <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[#F1F5F9] flex-wrap">
                {STATUS_FLOW[r.status] && (
                  <button onClick={() => advance(r)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-navy text-white text-[11px] font-semibold rounded-full hover:bg-brand-blue capitalize">
                    {STATUS_FLOW[r.status].replace(/_/g, ' ')} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {r.status === 'under_review' && (
                  <>
                    <button onClick={() => markFinal(r, 'charged')} className="px-3 py-1.5 border border-brand-border text-[11px] text-brand-slate rounded-full hover:border-brand-navy">Charge guest</button>
                    <button onClick={() => markFinal(r, 'written_off')} className="px-3 py-1.5 border border-red-200 text-[11px] text-red-500 rounded-full hover:bg-red-50">Write off</button>
                  </>
                )}
                {r.inventory_item_id && !r.inventory_deducted && (
                  <button onClick={() => deductFromInventory(r)} className="flex items-center gap-1 px-3 py-1.5 border border-brand-border text-[11px] text-brand-slate rounded-full hover:border-brand-navy">
                    <PackageMinus className="w-3 h-3" /> Deduct from stock
                  </button>
                )}
                {r.inventory_deducted && (
                  <span className="flex items-center gap-1 text-[11px] text-green-600"><Check className="w-3 h-3" /> Stock updated</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Report Breakage</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={submitReport} className="space-y-3">
              <input placeholder="Item (e.g. Table lamp, wine glasses ×4)" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className={inputCls}>
                  {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select value={form.inventory_item_id} onChange={e => setForm({ ...form, inventory_item_id: e.target.value })} className={inputCls}>
                <option value="">Link to inventory item (optional)</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} in stock)</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Room number" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} className={inputCls} />
                <input type="number" min={1} placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} />
              </div>
              <div className="relative">
                <input type="number" min={0} placeholder="Estimated cost" value={form.estimated_cost || ''} onChange={e => setForm({ ...form, estimated_cost: Number(e.target.value) })} className={`${inputCls} pl-8`} />
                <DollarSign className="w-3.5 h-3.5 text-brand-slate-light absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Reported by (staff)" value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} className={inputCls} />
                <input placeholder="Guest name (if applicable)" value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-ink px-1">
                <input type="checkbox" checked={form.charged_to_guest} onChange={e => setForm({ ...form, charged_to_guest: e.target.checked })} className="rounded" />
                Charge this to the guest&apos;s folio
              </label>
              <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              <label className="flex items-center gap-2 px-3.5 py-2 border border-dashed border-brand-border rounded-full text-sm text-brand-slate cursor-pointer hover:border-brand-navy">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {form.photo_url ? 'Photo attached' : 'Attach a photo (optional)'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
