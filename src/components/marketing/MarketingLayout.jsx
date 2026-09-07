import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Menu, X, ArrowRight, Sparkles, Globe, Linkedin, Twitter, Youtube } from 'lucide-react';
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
  const location = useLocation();

  const linkCls = (path) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      location.pathname === path ? 'bg-[#123B63] text-white' : 'text-[#17212B] hover:bg-[#F6F8FB]'
    }`;

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-50" onMouseLeave={() => setOpenMenu(null)}>
        <div className="bg-[#123B63] text-center text-[11px] font-medium px-6 py-1.5">
          <span className="text-white/70">Hostera — One platform. Every property. Everywhere.</span>{' '}
          <Link to="/features" className="text-white font-semibold hover:underline">Explore the platform →</Link>
        </div>
        <header className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#123B63] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#17212B] tracking-tight leading-none">HOSTERA</h1>
                <p className="text-[9px] text-[#64748B] uppercase tracking-widest">Hospitality OS</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <button
                onMouseEnter={() => setOpenMenu('platform')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'platform' ? 'bg-[#F6F8FB] text-[#123B63]' : 'text-[#17212B] hover:bg-[#F6F8FB]'}`}
              >
                Platform <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'platform' ? 'rotate-180' : ''}`} />
              </button>
              <button
                onMouseEnter={() => setOpenMenu('solutions')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'solutions' ? 'bg-[#F6F8FB] text-[#123B63]' : 'text-[#17212B] hover:bg-[#F6F8FB]'}`}
              >
                Solutions <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              <Link to="/pricing" onMouseEnter={() => setOpenMenu(null)} className={linkCls('/pricing')}>Pricing</Link>
              <button
                onMouseEnter={() => setOpenMenu('resources')}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${openMenu === 'resources' ? 'bg-[#F6F8FB] text-[#123B63]' : 'text-[#17212B] hover:bg-[#F6F8FB]'}`}
              >
                Resources <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              <Link to="/ai" onMouseEnter={() => setOpenMenu(null)} className={linkCls('/ai')}>Hostera AI</Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSelector />
              <Link to="/login" className="px-5 py-2 rounded-full text-sm font-semibold text-[#17212B] border border-[#E2E8F0] hover:border-[#123B63] transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-[#123B63] text-white hover:bg-[#1F5A8A] transition-colors">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-[#17212B]">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* ===== MEGA MENU: Platform ===== */}
        {openMenu === 'platform' && (
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-5 gap-8">
              {platformGroups.map(group => (
                <div key={group.title}>
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3">{group.title}</p>
                  <div className="space-y-1">
                    {group.keys.map(key => {
                      const mod = MODULES.find(m => m.name === key);
                      if (!mod) return null;
                      const Icon = mod.icon;
                      return (
                        <Link key={key} to="/features" onClick={() => setOpenMenu(null)} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#F6F8FB] transition-colors group">
                          <div className="w-8 h-8 rounded-full bg-[#F6F8FB] group-hover:bg-[#123B63] flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-4 h-4 text-[#123B63] group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#17212B]">{mod.name}</p>
                            <p className="text-[11px] text-[#64748B] leading-snug">{mod.desc.split('.')[0]}.</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Link to="/ai" onClick={() => setOpenMenu(null)} className="rounded-2xl bg-[#123B63] p-5 flex flex-col justify-between hover:bg-[#1F5A8A] transition-colors">
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
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-4">Built for every hospitality business</p>
              <div className="grid grid-cols-4 gap-2">
                {INDUSTRIES.slice(0, 8).map(ind => {
                  const Icon = ind.icon;
                  return (
                    <Link key={ind.name} to="/industries" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F6F8FB] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#F6F8FB] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#123B63]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#17212B]">{ind.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{ind.blurb}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link to="/industries" onClick={() => setOpenMenu(null)} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#123B63] hover:text-[#1F5A8A]">
                View all 16 industries <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ===== MEGA MENU: Resources ===== */}
        {openMenu === 'resources' && (
          <div className="hidden lg:block absolute left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-4 gap-2">
              {resourcesMenu.map(r => (
                <Link key={r.label} to={r.to} onClick={() => setOpenMenu(null)} className="p-3 rounded-xl hover:bg-[#F6F8FB] transition-colors">
                  <p className="text-sm font-semibold text-[#17212B]">{r.label}</p>
                  <p className="text-[11px] text-[#64748B]">{r.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== MOBILE MENU ===== */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-[#E2E8F0] max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 space-y-1">
              {[
                { label: 'Features', to: '/features' },
                { label: 'Industries', to: '/industries' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'Integrations', to: '/integrations' },
                { label: 'Hostera AI', to: '/ai' },
                { label: 'Security', to: '/security' },
                { label: 'Developers & API', to: '/developers' },
                { label: 'Status', to: '/status' },
                { label: 'FAQ', to: '/faq' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-full text-sm font-medium text-[#17212B] hover:bg-[#F6F8FB]">
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 flex gap-3 items-center">
                <LanguageSelector />
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold border border-[#E2E8F0]">Sign In</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold bg-[#123B63] text-white">Get Started</Link>
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
      <footer className="bg-[#0A1E30] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-14">
          <Reveal>
            <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-[#123B63] to-[#1F5A8A] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white">Ready to run your property on Hostera?</h3>
                <p className="text-sm text-white/60 mt-1">Start a full-featured trial today — no credit card required.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-[#123B63] px-6 py-3 text-sm font-bold hover:scale-105 transition-transform shrink-0">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#123B63] border border-[#1F5A8A]/50 flex items-center justify-center">
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
                {[Globe, Linkedin, Twitter, Youtube].map((Icon, i) => (
                  <a key={i} href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-white/60" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['Features', '/features'], ['Pricing', '/pricing'], ['Integrations', '/integrations'],
                  ['Hostera AI', '/ai'], ['Changelog', '/developers'], ['System Status', '/status'],
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
                  ['Documentation', '/developers'], ['API Reference', '/developers'], ['Developer Portal', '/developers'],
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
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> All systems operational
              </span>
              <Link to="/status" className="hover:text-white transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}