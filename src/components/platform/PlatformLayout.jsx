const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';

import {
  LayoutDashboard, Building2, CreditCard, Ticket, LifeBuoy, Shield,
  Activity, Flag, Megaphone, FileText, ArrowLeft, Building, Users, UserCog
} from 'lucide-react';
import { PLATFORM_OWNERS } from '@/lib/platformAdmins';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/platform' },
  { label: 'Organizations', icon: Building2, path: '/platform/organizations' },
  { label: 'Subscriptions', icon: CreditCard, path: '/platform/subscriptions' },
  { label: 'Commercial Codes', icon: Ticket, path: '/platform/commercial-codes' },
  { label: 'Support', icon: LifeBuoy, path: '/platform/support' },
  { label: 'Security', icon: Shield, path: '/platform/security' },
  { label: 'System Health', icon: Activity, path: '/platform/system-health' },
  { label: 'Feature Flags', icon: Flag, path: '/platform/feature-flags' },
  { label: 'Announcements', icon: Megaphone, path: '/platform/announcements' },
  { label: 'Audit Logs', icon: FileText, path: '/platform/audit' },
  { label: 'Workforce & HR', icon: Users, path: '/platform/hr' },
  { label: 'Platform Admins', icon: UserCog, path: '/platform/admins' },
];

export default function PlatformLayout() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [adminGranted, setAdminGranted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    db.auth.me()
      .then(async u => {
        let granted = false;
        if (u?.email) {
          try {
            const admins = await db.entities.PlatformAdmin.list();
            granted = (admins || []).some(a => a.email?.toLowerCase() === u.email.toLowerCase());
          } catch (e) { /* no admin records */ }
        }
        if (active) { setUser(u); setAdminGranted(granted); }
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0C2438]">
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only platform owners or explicitly granted platform admins may access the Control Center
  const isOwner = user?.email && PLATFORM_OWNERS.includes(user.email.toLowerCase());
  if (!user || !(isOwner || adminGranted)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0C2438] flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-full w-64 bg-[#0A1E30] border-r border-white/5 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5 shrink-0">
          <Link to="/platform" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#123B63] border border-[#1F5A8A]/50 flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">HOSTERA</h1>
              <p className="text-[9px] text-[#1F5A8A] uppercase tracking-widest font-semibold">Control Center</p>
            </div>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-[#123B63] text-white font-medium border border-[#1F5A8A]/40' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 shrink-0 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Back to Hotel App
          </Link>
          <p className="text-[10px] text-white/30 px-3 pt-2">
            Developed by <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white">Liafrik</a>
          </p>
        </div>
      </aside>

      <div className="lg:ml-64 flex-1">
        <header className="sticky top-0 z-30 bg-[#0C2438]/95 backdrop-blur-sm border-b border-white/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1F5A8A] uppercase tracking-widest">Platform Control Center</span>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-white/40">
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#1F5A8A] text-white flex items-center justify-center text-xs font-bold border border-white/10">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}