const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useProperty } from '@/lib/PropertyContext';
import { useAuth } from '@/lib/AuthContext';
import { applyThemeColors, THEME_PRESETS } from '@/lib/theme';

import {
  LayoutDashboard, ConciergeBell, CalendarCheck, Grid3X3, Users,
  Sparkles, Wrench, Receipt, TrendingUp, BarChart3,
  Plug, Settings, Bell, Search, Menu, X, Building2, ChevronDown,
  BedDouble, Smartphone, Package, Star, UserCog, FileText, LayoutTemplate,
  Globe, Crown, Contact, Clock, Banknote, Tag, Blocks, Megaphone, History,
  CalendarDays, ScrollText, Palette, ClipboardList, Truck, CreditCard, FolderOpen, Layers, Rocket, ArrowRight, LifeBuoy,
  CheckCheck, Inbox, PackageX, Wallet
} from 'lucide-react';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Front Desk', icon: ConciergeBell, path: '/front-desk' },
      { label: 'Reservations', icon: CalendarCheck, path: '/reservations' },
      { label: 'Room Rack', icon: Grid3X3, path: '/room-rack' },
      { label: 'Room Types', icon: BedDouble, path: '/room-types' },
      { label: 'Booking Engine', icon: Globe, path: '/booking-engine' },
      { label: 'Calendar', icon: CalendarDays, path: '/property-calendar' },
    ],
  },
  {
    label: 'Guests',
    items: [
      { label: 'Guests', icon: Users, path: '/guests' },
      { label: 'Guest Portal', icon: Smartphone, path: '/guest-portal' },
      { label: 'Loyalty Program', icon: Crown, path: '/loyalty-program' },
      { label: 'Reputation Mgmt', icon: Star, path: '/reputation-management' },
      { label: 'House Rules', icon: ScrollText, path: '/house-rules' },
      { label: 'Portal Config', icon: Palette, path: '/guest-portal-config' },
    ],
  },
  {
    label: 'Facilities & Staff',
    items: [
      { label: 'Housekeeping', icon: Sparkles, path: '/housekeeping' },
      { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
      { label: 'Inventory Mgmt', icon: Package, path: '/inventory-management' },
      { label: 'Breakage & Damage', icon: PackageX, path: '/breakage' },
      { label: 'Staff Directory', icon: Contact, path: '/staff-directory' },
      { label: 'Shifts', icon: Clock, path: '/shift-management' },
      { label: 'Shift Logs', icon: ClipboardList, path: '/shift-logs' },
      { label: 'Lost & Found', icon: Search, path: '/lost-and-found' },
      { label: 'Vendors', icon: Truck, path: '/vendor-directory' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance & Billing', icon: Receipt, path: '/finance' },
      { label: 'Cash Register', icon: Wallet, path: '/cash-register' },
      { label: 'Expenses', icon: Banknote, path: '/expenses' },
      { label: 'Rate Manager', icon: Tag, path: '/rate-manager' },
      { label: 'Rate Plans', icon: Layers, path: '/rate-plans' },
      { label: 'Revenue Mgmt', icon: TrendingUp, path: '/revenue-management' },
      { label: 'Subscription', icon: CreditCard, path: '/subscription' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Channel Manager', icon: Plug, path: '/channel-manager' },
      { label: 'Integration Hub', icon: Blocks, path: '/integration-hub' },
      { label: 'Marketing Tools', icon: Megaphone, path: '/marketing-tools' },
      { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team Access', icon: UserCog, path: '/team-access' },
      { label: 'Support', icon: LifeBuoy, path: '/support' },
      { label: 'Activity Log', icon: History, path: '/activity-log' },
      { label: 'Audit Logs', icon: FileText, path: '/audit-logs' },
      { label: 'Doc Templates', icon: LayoutTemplate, path: '/document-templates' },
      { label: 'Doc Center', icon: FolderOpen, path: '/document-center' },
      { label: 'Settings', icon: Settings, path: '/property-settings' },
    ],
  },
];

// Real, functional notification center — replaces what was previously a
// static bell icon with a hardcoded permanent "unread" dot and no click
// handler at all (a fake button the spec explicitly prohibits).
function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    db.entities.Notification.list('-created_date', 30)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const onClickAway = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const unread = items.filter(n => !n.read);

  const markRead = async (n) => {
    if (n.read) return;
    const updated = await db.entities.Notification.update(n.id, { read: true });
    setItems(prev => prev.map(x => x.id === n.id ? updated : x));
  };

  const markAllRead = async () => {
    const toMark = items.filter(n => !n.read);
    await Promise.all(toMark.map(n => db.entities.Notification.update(n.id, { read: true })));
    setItems(prev => prev.map(x => ({ ...x, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative text-brand-slate hover:text-brand-navy transition-colors">
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#DC2626] rounded-full"></span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl border border-brand-border shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <p className="text-sm font-semibold text-brand-ink">Notifications</p>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-medium text-brand-navy hover:underline">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <p className="text-xs text-brand-slate text-center py-8">Loading…</p>
            ) : items.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Inbox className="w-6 h-6 text-[#C4CDD5] mx-auto mb-2" />
                <p className="text-xs text-brand-slate">No notifications yet.</p>
              </div>
            ) : (
              items.map(n => (
                <button key={n.id} onClick={() => markRead(n)} className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-brand-bg transition-colors ${n.read ? '' : 'bg-blue-50/40'}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-brand-ink truncate">{n.title || 'Notification'}</p>
                      {n.message && <p className="text-[12px] text-brand-slate mt-0.5 line-clamp-2">{n.message}</p>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { properties, loading, selectedPropertyId, selectProperty, selectedProperty } = useProperty();
  const { user } = useAuth();
  const propsLoaded = !loading;
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('hostera_theme') || 'cool'; } catch { return 'cool'; }
  });
  const toggleTheme = () => {
    const next = theme === 'cool' ? 'warm' : 'cool';
    setTheme(next);
    try { localStorage.setItem('hostera_theme', next); } catch { /* private browsing */ }
  };
  const initials = (user?.full_name || user?.email || 'U')
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'U';

  useEffect(() => {
    const p = selectedProperty || properties[0];
    if (p?.theme_primary || p?.theme_accent) {
      applyThemeColors(p.theme_primary, p.theme_accent);
    } else {
      applyThemeColors(THEME_PRESETS[0].primary, THEME_PRESETS[0].accent);
    }
  }, [selectedProperty, properties]);

  return (
    <div className={`min-h-screen ${theme === 'warm' ? 'bg-brand-bg-warm' : 'bg-brand-bg'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-brand-navy text-white transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">HOSTERA</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Hospitality OS</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-3 overflow-y-auto flex-1 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[9px] font-semibold text-white/30 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-full text-[13px] transition-colors ${
                        active
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pt-4 border-t border-white/10 shrink-0">
          <p className="text-[10px] text-white/40 px-3 mt-3">
            Developed by{' '}
            <a
              href="https://liafrik.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              Liafrik
            </a>
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-brand-border px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-brand-slate">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-navy" />
              <select
                value={selectedPropertyId || 'all'}
                onChange={(e) => selectProperty(e.target.value === 'all' ? null : e.target.value)}
                className="text-sm font-medium text-brand-ink bg-transparent border-none outline-none cursor-pointer max-w-[200px]"
              >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-brand-slate pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-lg">
              <Search className="w-4 h-4 text-brand-slate" />
              <input
                type="text"
                placeholder="Search guests, reservations..."
                className="bg-transparent text-sm outline-none w-48 text-brand-ink placeholder:text-brand-slate-light"
              />
            </div>
            <button
              onClick={toggleTheme}
              title={theme === 'warm' ? 'Switch to cool theme' : 'Switch to warm (off-white) theme'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border text-xs font-medium text-brand-slate hover:border-brand-navy hover:text-brand-navy transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              {theme === 'warm' ? 'Warm' : 'Cool'}
            </button>
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {propsLoaded && properties.length === 0 && location.pathname !== '/onboarding' && (
            <div className="mb-6 bg-brand-navy rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Complete your business setup</p>
                  <p className="text-sm text-white/60 mt-0.5">Create your organization, property and room types in a guided 4-step onboarding.</p>
                </div>
              </div>
              <Link to="/onboarding" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-6 py-2.5 text-sm font-bold hover:scale-105 transition-transform shrink-0">
                Start Setup <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}