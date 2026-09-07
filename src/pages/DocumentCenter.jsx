const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FolderOpen, Plus, X, FileText, Send, Archive, Globe } from 'lucide-react';

const types = ['invoice', 'confirmation', 'registration_card', 'welcome_letter', 'receipt', 'folio', 'email'];
const typeLabels = { invoice: 'Invoice', confirmation: 'Confirmation', registration_card: 'Registration Card', welcome_letter: 'Welcome Letter', receipt: 'Receipt', folio: 'Folio', email: 'Email' };
const languages = ['en', 'fr', 'ar', 'es', 'de', 'pt', 'it'];

export default function DocumentCenter() {
  const [docs, setDocs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'invoice', language: 'en', content: '' });

  useEffect(() => {
    Promise.all([
      db.entities.DocumentTemplate.list('-last_modified', 200),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([d, p]) => { setDocs(d || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-[#E2E8F0] rounded-full text-sm outline-none focus:border-[#123B63]";
  const filtered = docs.filter(d => type === 'all' || d.type === type);

  const openNew = () => { setEditing('new'); setForm({ name: '', type: 'invoice', language: 'en', content: '' }); };
  const openEdit = (d) => { setEditing(d.id); setForm({ name: d.name, type: d.type, language: d.language || 'en', content: d.content || '' }); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (editing === 'new') {
      if (!propertyId) return;
      const created = await db.entities.DocumentTemplate.create({ ...form, property_id: propertyId, status: 'draft', last_modified: new Date().toISOString() });
      setDocs(prev => [created, ...prev]);
    } else {
      await db.entities.DocumentTemplate.update(editing, { ...form, last_modified: new Date().toISOString() });
      setDocs(prev => prev.map(d => d.id === editing ? { ...d, ...form, last_modified: new Date().toISOString() } : d));
    }
    setEditing(null);
  };

  const setStatus = async (d, status) => {
    await db.entities.DocumentTemplate.update(d.id, { status });
    setDocs(prev => prev.map(x => x.id === d.id ? { ...x, status } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Document Center</h1>
          <p className="text-sm text-[#64748B]">Registration forms, welcome letters and invoice templates — organized for automated guest distribution.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Templates', value: docs.length },
          { label: 'Active', value: docs.filter(d => d.status === 'active').length },
          { label: 'Drafts', value: docs.filter(d => d.status === 'draft').length },
          { label: 'Languages', value: new Set(docs.map(d => d.language).filter(Boolean)).size },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
            <p className="text-[11px] text-[#64748B]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setType('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${type === 'all' ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>All</button>
        {types.map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${type === t ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>
            {typeLabels[t]} ({docs.filter(d => d.type === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
          <FolderOpen className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No templates yet — create your first document template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-[#F6F8FB] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#123B63]" />
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${d.status === 'active' ? 'bg-green-50 text-green-700' : d.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#17212B]">{d.name}</p>
              <div className="flex gap-1.5 mt-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#123B63] rounded-full font-medium">{typeLabels[d.type] || d.type}</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#F6F8FB] text-[#64748B] rounded-full font-medium uppercase flex items-center gap-1"><Globe className="w-3 h-3" />{d.language || 'en'}</span>
              </div>
              <p className="text-[12px] text-[#64748B] leading-relaxed line-clamp-3 flex-1">{d.content || 'No content yet.'}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] mt-3">
                <button onClick={() => openEdit(d)} className="text-[11px] px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] rounded-full hover:border-[#123B63] hover:text-[#123B63] font-medium">Edit</button>
                <div className="flex gap-1.5">
                  {d.status !== 'active' && <button onClick={() => setStatus(d, 'active')} className="flex items-center gap-1 text-[11px] px-3 py-1.5 bg-[#123B63] text-white rounded-full font-semibold hover:bg-[#1F5A8A]"><Send className="w-3 h-3" /> Activate</button>}
                  {d.status !== 'archived' && <button onClick={() => setStatus(d, 'archived')} className="flex items-center gap-1 text-[11px] px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] rounded-full hover:border-red-200 hover:text-red-600"><Archive className="w-3 h-3" /> Archive</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#17212B]">{editing === 'new' ? 'New Template' : 'Edit Template'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input placeholder="Template name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  {types.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                </select>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className={inputCls}>
                  {languages.map(l => <option key={l} value={l} className="uppercase">{l}</option>)}
                </select>
              </div>
              <textarea placeholder="Template content — use variables like {{guest_name}}, {{room_number}}, {{check_in}}…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={7} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-3xl text-sm outline-none focus:border-[#123B63] resize-none" />
              <button type="submit" className="w-full py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">Save Template</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}