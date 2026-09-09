const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Package, Plus, X, AlertTriangle, Boxes, DollarSign, Truck } from 'lucide-react';

const categories = ['housekeeping', 'linen', 'maintenance', 'minibar', 'assets', 'office', 'other'];

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [restocking, setRestocking] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [form, setForm] = useState({ name: '', category: 'housekeeping', quantity: 0, unit: 'pcs', min_stock: 10, unit_cost: 0, supplier: '' });

  useEffect(() => {
    Promise.all([
      db.entities.InventoryItem.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([i, p]) => { setItems(i || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";
  const filtered = items.filter(i => cat === 'all' || i.category === cat);
  const lowStock = items.filter(i => (i.quantity || 0) <= (i.min_stock || 0));
  const totalValue = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_cost || 0), 0);

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name || !propertyId) return;
    const created = await db.entities.InventoryItem.create({ ...form, property_id: propertyId, last_restocked: new Date().toISOString().slice(0, 10) });
    setItems(prev => [...prev, created]);
    setForm({ name: '', category: 'housekeeping', quantity: 0, unit: 'pcs', min_stock: 10, unit_cost: 0, supplier: '' });
    setShowAdd(false);
  };

  const confirmRestock = async () => {
    const item = items.find(i => i.id === restocking);
    const newQty = (item.quantity || 0) + Number(restockQty);
    await db.entities.InventoryItem.update(item.id, { quantity: newQty, last_restocked: new Date().toISOString().slice(0, 10) });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, last_restocked: new Date().toISOString().slice(0, 10) } : i));
    setRestocking(null);
  };

  const deleteItem = async (id) => {
    await db.entities.InventoryItem.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Inventory Management</h1>
          <p className="text-sm text-brand-slate">Housekeeping supplies, linen stock and operational assets.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Items', value: items.length, icon: Boxes, tint: 'text-brand-navy' },
          { label: 'Low Stock Alerts', value: lowStock.length, icon: AlertTriangle, tint: 'text-red-500' },
          { label: 'Stock Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, tint: 'text-green-600' },
          { label: 'Suppliers', value: new Set(items.map(i => i.supplier).filter(Boolean)).size, icon: Truck, tint: 'text-brand-blue' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
              <Icon className={`w-4 h-4 mb-2 ${k.tint}`} />
              <p className="text-xl font-bold text-brand-ink">{k.value}</p>
              <p className="text-[11px] text-brand-slate">{k.label}</p>
            </div>
          );
        })}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{lowStock.length} item{lowStock.length > 1 ? 's' : ''} at or below minimum stock — reorder recommended.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${cat === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${cat === c ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading inventory…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Package className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No items in this category.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-left text-xs text-brand-slate">
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Stock Level</th>
                <th className="px-5 py-3 font-semibold">Unit Cost</th>
                <th className="px-5 py-3 font-semibold">Supplier</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const low = (i.quantity || 0) <= (i.min_stock || 0);
                return (
                  <tr key={i.id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-brand-ink">{i.name}</p>
                      <p className="text-[11px] text-brand-slate-light">Restocked {i.last_restocked ? new Date(i.last_restocked).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-bg text-brand-slate capitalize">{i.category}</span>
                    </td>
                    <td className="px-5 py-3.5 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${low ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(100, ((i.quantity || 0) / Math.max(i.min_stock * 2, 1)) * 100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${low ? 'text-red-600' : 'text-brand-ink'}`}>{i.quantity}</span>
                        <span className="text-[10px] text-brand-slate-light">/ {i.min_stock} {i.unit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-brand-ink">${(i.unit_cost || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-brand-slate">{i.supplier || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => { setRestocking(i.id); setRestockQty(Math.max(10, i.min_stock || 10)); }} className="px-3 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">Restock</button>
                        <button onClick={() => deleteItem(i.id)} className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-full hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Add Inventory Item</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addItem} className="space-y-3">
              <input placeholder="Item name (e.g. Bath towels)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
                <input placeholder="Unit (pcs, kg, L)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} />
                <input type="number" placeholder="Min stock" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: Number(e.target.value) })} className={inputCls} />
                <input type="number" step="0.01" placeholder="Unit cost" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: Number(e.target.value) })} className={inputCls} />
              </div>
              <input placeholder="Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={inputCls} />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Add Item</button>
            </form>
          </div>
        </div>
      )}

      {restocking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRestocking(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-ink mb-2">Restock {items.find(i => i.id === restocking)?.name}</h3>
            <p className="text-xs text-brand-slate mb-4">Current: {items.find(i => i.id === restocking)?.quantity} units</p>
            <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} className={inputCls} />
            <div className="flex gap-2 mt-4">
              <button onClick={confirmRestock} className="flex-1 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Confirm</button>
              <button onClick={() => setRestocking(null)} className="flex-1 py-2.5 border border-brand-border text-sm font-medium rounded-full text-brand-slate">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}