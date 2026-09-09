const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Package, AlertTriangle, Plus, Minus, Sparkles, Coffee, Wrench, FileText } from 'lucide-react';

const categoryConfig = {
  housekeeping: { icon: Sparkles, label: 'Housekeeping', color: 'text-teal-600', bg: 'bg-teal-50' },
  minibar: { icon: Coffee, label: 'Minibar', color: 'text-purple-600', bg: 'bg-purple-50' },
  maintenance: { icon: Wrench, label: 'Maintenance', color: 'text-orange-600', bg: 'bg-orange-50' },
  office: { icon: FileText, label: 'Office', color: 'text-blue-600', bg: 'bg-blue-50' },
  other: { icon: Package, label: 'Other', color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('housekeeping');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    try {
      const [itemData, propData] = await Promise.all([
        db.entities.InventoryItem.list(),
        db.entities.Property.list(),
      ]);
      setItems(itemData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateQuantity = async (item, delta) => {
    setUpdatingId(item.id);
    try {
      const newQty = Math.max(0, (item.quantity || 0) + delta);
      await db.entities.InventoryItem.update(item.id, { quantity: newQty });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const lowStockItems = items.filter(i => (i.quantity || 0) <= (i.min_stock || 0));
  const totalItems = items.length;
  const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (i.unit_cost || 0)), 0);
  const filteredItems = items.filter(i => i.category === activeTab);

  const tabs = Object.entries(categoryConfig).filter(([key]) =>
    items.some(i => i.category === key) || key === 'housekeeping'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Inventory Management</h1>
        <p className="text-sm text-brand-slate mt-1">Track supplies, minibar stock and maintenance parts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'text-brand-navy', bg: 'bg-blue-50' },
          { label: 'Low Stock Alerts', value: lowStockItems.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Inventory Value', value: `$${totalValue.toFixed(0)}`, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Categories', value: tabs.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-ink">{s.value}</p>
                  <p className="text-xs text-brand-slate">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-brand-ink">Low Stock Alert ({lowStockItems.length} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(i => (
              <span key={i.id} className="text-xs bg-white px-2.5 py-1 rounded-lg border border-orange-200 text-brand-ink">
                {i.name} — {i.quantity || 0} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([key, config]) => {
          const Icon = config.icon;
          const count = items.filter(i => i.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:bg-brand-bg'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-brand-border py-16 text-center">
            <Package className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No items in this category</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLow = (item.quantity || 0) <= (item.min_stock || 0);
            const stockPct = item.min_stock > 0 ? Math.min(100, ((item.quantity || 0) / (item.min_stock * 3)) * 100) : 100;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-brand-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-ink">{item.name}</h3>
                    <p className="text-xs text-brand-slate mt-0.5">
                      {item.supplier || 'No supplier'} · ${item.unit_cost || 0}/{item.unit || 'unit'}
                    </p>
                  </div>
                  {isLow && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                      <AlertTriangle className="w-3 h-3" /> Low
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-brand-slate">Stock Level</span>
                    <span className={`text-sm font-bold ${isLow ? 'text-orange-600' : 'text-brand-ink'}`}>
                      {item.quantity || 0} {item.unit || ''}
                    </span>
                  </div>
                  <div className="h-1.5 bg-brand-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLow ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.max(5, stockPct)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-brand-slate mt-1">Minimum: {item.min_stock || 0}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item, -1)}
                    disabled={updatingId === item.id || (item.quantity || 0) <= 0}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-brand-border rounded-lg text-xs font-medium text-brand-slate hover:bg-brand-bg transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" /> Use
                  </button>
                  <button
                    onClick={() => updateQuantity(item, 10)}
                    disabled={updatingId === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-brand-navy text-white rounded-lg text-xs font-medium hover:bg-brand-blue transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Restock +10
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}