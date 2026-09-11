const db = globalThis.__B44_DB__ || { entities: new Proxy({}, { get: () => ({ list: async () => [] }) }) };

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Menu, X, ArrowRight, Sparkles, Facebook, Instagram, Linkedin, Youtube, AlertTriangle } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';
import LanguageSelector from '@/components/marketing/LanguageSelector';
import { MODULES, INDUSTRIES } from '@/lib/marketing';

const platformGroups = [
  { title: 'Core PMS', keys: ['Dashboard', 'Front Desk', 'Reservations', 'Room Rack', 'Room Types'] },
  { title: 'Operations', keys: ['Housekeeping', 'Maintenance', 'Inventory', 'Team Access'] },
  { title: 'Revenue & Finance', keys: ['Finance & Billing', 'Revenue Management', 'Analytics', 'Channel Manager'] },
  { title: 'Guest Experience', keys: ['Guest Portal', 'Reputation', 'Document Templates', 'Guest CRM'] },
];

const resourcesMenu = [
  { label: 'Features Overview', desc: 'All modules at a glance', to: '/features' },
  { label: 'Documentation', desc: 'Guides & help center', to: '/developers' },
  { label: 'API Reference', desc: 'REST API & webhooks', to: '/developers' },
  { label: 'Integrations', desc: 'OTA, payments & more', to: '/integrations' },
  { label: 'System Status', desc: 'Live platform health', to: '/status' },
  { label: 'FAQ', desc: 'Answers to common questions', to: '/faq' },
  { label: 'About Hostera', desc: 'Built by Liafrik', to: '/about' },
  { label: 'Contact', desc: 'Talk to our team', to: '/contact' },
];

export default function MarketingLayout() {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasActiveIncident, setHasActiveIncident] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function checkStatus() {
      try {
        const incidents = await db.entities.PlatformIncident.list('-started_at', 50);
        const active = (incidents || []).filter(i => i.status !== 'resolved' && i.status !== 'postmortem');
        setHasActiveIncident(active.length > 0);
      } catch {
        // If we can't reach the platform status, don't claim everything's fine.
        setHasActiveIncident(false);
      }
    }
    checkStatus();
  }, []);

  const linkCls = (path) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      location.pathname === path ? 'bg-brand-navy text-white' : 'text-brand-ink hover:bg-brand-bg'
    }`;

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-50" onMouseLeave={() => setOpenMenu(null)}>
        <div className="bg-brand-navy text-center text-[11px] font-medium px-6 py-1.5">
          <span className="text-white/70">Hostera — One platform. Every property. Everywhere.</span>{' '}
          <Link to="/features" className="text-white font-semibold hover:underline">Explore the platform →</Link>
        </div>
        <header className="bg-white/90 backdrop-blur-md border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-brand-ink tracking-tight leading-none">HOSTERA</h1>
                <p className="text-[9px] text-brand-slate uppercase tracking-widest">Hospitality OS</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <button
                onMouseEnter={() => setOpenMenu('platform')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'platform' ? 'bg-brand-bg text-brand-navy' : 'text-brand-ink hover:bg-brand-bg'}`}
              >
                Platform <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'platform' ? 'rotate-180' : ''}`} />
              </button>
              <button
                onMouseEnter={() => setOpenMenu('solutions')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'solutions' ? 'bg-brand-bg text-brand-navy' : 'text-brand-ink hover:bg-brand-bg'}`}
              >
                Solutions <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              <Link to="/pricing" onMouseEnter={() => setOpenMenu(null)} className={linkCls('/pricing')}>Pricing</Link>
              <Link to="/marketplace" onMouseEnter={() => setOpenMenu(null)} className={linkCls('/marketplace')}>Marketplace</Link>
              <button
                onMouseEnter={() => setOpenMenu('resources')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'resources' ? 'bg-brand-bg text-brand-navy' : 'text-brand-ink hover:bg-brand-bg'}`}
              >
                Resources <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              <Link to="/ai" onMouseEnter={() => setOpenMenu(null)} className={linkCls('/ai')}>Hostera AI</Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSelector />
              <Link to="/login" className="px-5 py-2 rounded-full text-sm font-semibold text-brand-ink border border-brand-border hover:border-brand-navy transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-brand-navy text-white hover:bg-brand-blue transition-colors">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-brand-ink">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* ===== MEGA MENU: Platform ===== */}
        {openMenu === 'platform' && (
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-brand-border shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-5 gap-8">
              {platformGroups.map(group => (
                <div key={group.title}>
                  <p className="text-[11px] font-bold text-brand-slate uppercase tracking-wider mb-3">{group.title}</p>
                  <div className="space-y-1">
                    {group.keys.map(key => {
                      const mod = MODULES.find(m => m.name === key);
                      if (!mod) return null;
                      const Icon = mod.icon;
                      return (
                        <Link key={key} to="/features" onClick={() => setOpenMenu(null)} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-brand-bg transition-colors group">
                          <div className="w-8 h-8 rounded-full bg-brand-bg group-hover:bg-brand-navy flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-4 h-4 text-brand-navy group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-ink">{mod.name}</p>
                            <p className="text-[11px] text-brand-slate leading-snug">{mod.desc.split('.')[0]}.</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Link to="/ai" onClick={() => setOpenMenu(null)} className="rounded-2xl bg-brand-navy p-5 flex flex-col justify-between hover:bg-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">Hostera AI</p>
                  <p className="text-xs text-white/60 mt-1 leading-snug">AI-powered revenue insights, forecasting and reporting — respecting tenant isolation.</p>
                  <span className="inline-flex items-center gap-1 text-xs text-white font-semibold mt-3">Explore <ArrowRight className="w-3.5 h-3.5" /></span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ===== MEGA MENU: Solutions ===== */}
        {openMenu === 'solutions' && (
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-brand-border shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <p className="text-[11px] font-bold text-brand-slate uppercase tracking-wider mb-4">Built for every hospitality business</p>
              <div className="grid grid-cols-4 gap-2">
                {INDUSTRIES.slice(0, 8).map(ind => {
                  const Icon = ind.icon;
                  return (
                    <Link key={ind.name} to="/industries" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-bg transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-brand-navy" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-ink">{ind.name}</p>
                        <p className="text-[11px] text-brand-slate truncate">{ind.blurb}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link to="/industries" onClick={() => setOpenMenu(null)} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-navy hover:text-brand-blue">
                View all 16 industries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ===== MEGA MENU: Resources ===== */}
        {openMenu === 'resources' && (
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-brand-border shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-4 gap-2">
              {resourcesMenu.map(r => (
                <Link key={r.label} to={r.to} onClick={() => setOpenMenu(null)} className="p-3 rounded-xl hover:bg-brand-bg transition-colors">
                  <p className="text-sm font-semibold text-brand-ink">{r.label}</p>
                  <p className="text-[11px] text-brand-slate">{r.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== MOBILE MENU ===== */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-brand-border max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 space-y-1">
              {[
                { label: 'Features', to: '/features' },
                { label: 'Industries', to: '/industries' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'Marketplace', to: '/marketplace' },
                { label: 'Integrations', to: '/integrations' },
                { label: 'Hostera AI', to: '/ai' },
                { label: 'Security', to: '/security' },
                { label: 'Developers & API', to: '/developers' },
                { label: 'Status', to: '/status' },
                { label: 'FAQ', to: '/faq' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-full text-sm font-medium text-brand-ink hover:bg-brand-bg">
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 flex gap-3 items-center">
                <LanguageSelector />
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold border border-brand-border">Sign In</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold bg-brand-navy text-white">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== PAGE ===== */}
      <main>
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-brand-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6 pt-14">
          <Reveal>
            <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-blue border border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white">Ready to run your property on Hostera?</h3>
                <p className="text-sm text-white/60 mt-1">Start a full-featured trial today — no credit card required.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-6 py-3 text-sm font-bold hover:scale-105 transition-transform shrink-0">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-brand-navy border border-brand-blue/50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight">HOSTERA</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">Hospitality OS</p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                The global hospitality operating system. One platform. Every property. Everywhere.
              </p>
              <p className="text-xs text-white/40 mt-5">
                Hostera is developed by{' '}
                <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white font-medium transition-colors">
                  Liafrik
                </a>
              </p>
              <div className="flex items-center gap-2 mt-5">
                {[
                  { Icon: Facebook, href: 'https://www.facebook.com/share/1LMAGqsy3n/?mibextid=wwXIfr', label: 'Facebook' },
                  { Icon: Instagram, href: 'https://www.instagram.com/liafrik_tech?igsi=eXBjdTc5NG42Zml4&utm_source=qr', label: 'Instagram' },
                  { Icon: Linkedin, href: 'https://www.linkedin.com/company/liafrik/', label: 'LinkedIn' },
                  { Icon: Youtube, href: 'https://youtube.com/@liyah-n?si=D-lXwovYubw3sdaf', label: 'YouTube' },
                  { tiktok: true, href: 'https://www.tiktok.com/@liafrik4?_r=1&_t=ZN-9981b1Sq59K', label: 'TikTok — Liafrik' },
                  { tiktok: true, href: 'https://www.tiktok.com/@liyahgroup?_r=1&_t=ZS-9981XGgaxrE', label: 'TikTok — Liyah Group' },
                ].map(({ Icon, tiktok, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                    {tiktok ? (
                      <img src="https://cdn.simpleicons.org/tiktok/white" alt="" className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['Features', '/features'], ['Pricing', '/pricing'], ['Integrations', '/integrations'],
                  ['Hostera AI', '/ai'], ['Changelog', '/developers#changelog'], ['System Status', '/status'],
                ].map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-white/60 hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Solutions</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['Hotels & Resorts', '/industries'], ['Boutique & B&B', '/industries'],
                  ['Apartments & Villas', '/industries'], ['Hostels & Groups', '/industries'],
                  ['Hotel Groups & Chains', '/industries'],
                ].map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-white/60 hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Resources</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['Documentation', '/developers#overview'], ['API Reference', '/developers#api-reference'],
                  ['Developer Portal', '/developers#developer-portal'],
                  ['FAQ & Help Center', '/faq'], ['Security', '/security'], ['Contact', '/contact'],
                ].map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-white/60 hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Company & Legal</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['About', '/about'], ['Terms of Service', '/legal/terms'], ['Privacy Policy', '/legal/privacy'],
                  ['Cookie Policy', '/legal/cookies'], ['Data Processing', '/legal/data-processing'], ['Accessibility', '/legal/accessibility'],
                ].map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-white/60 hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} Hostera. All rights reserved.</p>
            <div className="flex items-center gap-5 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${hasActiveIncident ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                {hasActiveIncident ? (
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Active incident</span>
                ) : (
                  'All systems operational'
                )}
              </span>
              <Link to="/status" className="hover:text-white transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}