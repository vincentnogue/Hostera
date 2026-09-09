const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FileText, LayoutTemplate, Eye, Plus, X, Globe } from 'lucide-react';

const typeConfig = {
  invoice: { label: 'Guest Invoice', color: 'bg-blue-100 text-blue-700', icon: FileText },
  confirmation: { label: 'Reservation Confirmation', color: 'bg-green-100 text-green-700', icon: FileText },
  registration_card: { label: 'Registration Card', color: 'bg-purple-100 text-purple-700', icon: FileText },
  receipt: { label: 'Payment Receipt', color: 'bg-amber-100 text-amber-700', icon: FileText },
  folio: { label: 'Guest Folio', color: 'bg-teal-100 text-teal-700', icon: FileText },
  email: { label: 'Email Template', color: 'bg-gray-100 text-gray-700', icon: FileText },
};

export default function DocumentTemplates() {
  const [templates, setTemplates] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'invoice', language: 'en', content: '' });

  const fetchData = async () => {
    try {
      const [tmplData, propData] = await Promise.all([
        db.entities.DocumentTemplate.list(),
        db.entities.Property.list(),
      ]);
      setTemplates(tmplData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.type) return;
    setCreating(true);
    try {
      const property = properties[0];
      await db.entities.DocumentTemplate.create({
        ...form,
        property_id: property?.id || '',
        status: 'active',
        last_modified: new Date().toISOString(),
      });
      setShowCreate(false);
      setForm({ name: '', type: 'invoice', language: 'en', content: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleContentUpdate = async (templateId, content) => {
    try {
      await db.entities.DocumentTemplate.update(templateId, {
        content,
        last_modified: new Date().toISOString(),
      });
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

  const previewTemplate = templates.find(t => t.id === previewId);
  const inputCls = "w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy text-brand-ink";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Document Templates</h1>
          <p className="text-sm text-brand-slate mt-1">Invoices, confirmations and registration cards</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          {templates.length === 0 ? (
            <div className="py-16 text-center">
              <LayoutTemplate className="w-12 h-12 text-brand-border mx-auto mb-3" />
              <p className="text-sm text-brand-slate">No templates yet</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {templates.map((tmpl) => {
                const config = typeConfig[tmpl.type] || typeConfig.invoice;
                return (
                  <div
                    key={tmpl.id}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${previewId === tmpl.id ? 'bg-blue-50/30' : 'hover:bg-brand-bg'}`}
                    onClick={() => setPreviewId(tmpl.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center shrink-0`}>
                        <LayoutTemplate className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-ink truncate">{tmpl.name}</p>
                        <p className="text-xs text-brand-slate">
                          {config.label} · {tmpl.language?.toUpperCase()} · {tmpl.status}
                        </p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-brand-slate shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview / Edit Panel */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          {!previewTemplate ? (
            <div className="py-16 text-center">
              <Eye className="w-12 h-12 text-brand-border mx-auto mb-3" />
              <p className="text-sm text-brand-slate">Select a template to preview and edit</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-brand-ink">{previewTemplate.name}</h3>
                  <p className="text-xs text-brand-slate mt-0.5">
                    Last modified: {previewTemplate.last_modified ? new Date(previewTemplate.last_modified).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeConfig[previewTemplate.type]?.color || 'bg-gray-100'}`}>
                  {typeConfig[previewTemplate.type]?.label || previewTemplate.type}
                </span>
              </div>
              <textarea
                defaultValue={previewTemplate.content || ''}
                onBlur={e => handleContentUpdate(previewTemplate.id, e.target.value)}
                rows={16}
                placeholder="Template content with {{placeholders}} like {{guest_name}}, {{check_in}}, {{total}}..."
                className="w-full px-3 py-3 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy font-mono leading-relaxed resize-none text-brand-ink"
              />
              <p className="text-xs text-brand-slate mt-2">
                Changes save automatically when you click outside the editor.
                Use placeholders like {'{{guest_name}}'}, {'{{check_in}}'}, {'{{check_out}}'}, {'{{total}}'}.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">New Template</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Template Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Standard Invoice" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls}>
                  {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Language</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-slate" />
                  <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className={inputCls}>
                    {[['en','English'],['fr','French'],['es','Spanish'],['de','German'],['it','Italian'],['pt','Portuguese'],['ar','Arabic']].map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Initial Content (optional)</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} placeholder="Template content..." className={`${inputCls} resize-none font-mono`} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium text-brand-slate hover:bg-brand-bg">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.name} className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}