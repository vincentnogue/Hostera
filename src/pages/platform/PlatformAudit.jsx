const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FileText, Search, Info, AlertTriangle, Shield } from 'lucide-react';

const severityConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  critical: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/15' },
};

export default function PlatformAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await db.entities.AuditLog.list('-timestamp', 200);
        setLogs(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }