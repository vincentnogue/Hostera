import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import HeroMedia from '@/components/marketing/HeroMedia';
import FlagBanner from '@/components/marketing/FlagBanner';
import { RoomRackMockup, FrontDeskMockup, AnalyticsMockup } from '@/components/marketing/Mockups';
import HotelMarquee from '@/components/marketing/HotelMarquee';
import AffordabilityBand from '@/components/marketing/AffordabilityBand';
import { MODULES, INDUSTRIES, PLANS } from '@/lib/marketing';
import {
  ArrowRight, Check, Sparkles, Shield, Users, ConciergeBell,
  Sparkles as SparkleIcon, TrendingUp, Zap, Lock, BarChart3,
  MessageSquare, FileText, KeyRound, BadgeCheck, ShieldCheck, Headphones,
  Play
} from 'lucide-react';

const GREEN = '#A6FF00';
const NAVY = '#123B63';

export default function Landing() {
  const aiFeatures = [
    { icon: TrendingUp, title: 'Revenue Insights', desc: 'Ask why revenue changed and get plain-language answers.' },
    { icon: BarChart3, title: 'Demand Forecasting', desc: 'Predict occupancy and demand curves before they happen.' },
    { icon: Zap, title: 'Pricing Suggestions', desc: 'Data-driven rate recommendations per room type and season.' },
    { icon: MessageSquare, title: 'Feedback Summaries', desc: 'Guest reviews condensed into actionable operational insight.' },
    { icon: FileText, title: 'Report Generation', desc: 'Executive reports written for you, on demand.' },
    { icon: Users, title: 'Staffing Suggestions', desc: 'Housekeeping and front desk priorities based on real workload.' },
  ];

  const securityFeatures = [
    { icon: Lock, title: 'Strict Tenant Isolation', desc: 'Your data is scoped to your organization — enforced server-side, never just in the UI.' },
    { icon: KeyRound, title: 'MFA & Secure Sessions', desc: 'Multi-factor authentication and session management for privileged accounts.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for every team member, from admins to housekeepers.' },
    { icon: FileText, title: 'Append-Only Audit Logs', desc: 'Every staff action is recorded in an immutable audit trail.' },
  ];

  const roles = [
    { icon: ConciergeBell, role: 'Front Desk Managers', quote: 'Arrivals, departures and walk-ins in one fast workspace — no more switching between screens during the morning rush.' },
    { icon: SparkleIcon, role: 'Housekeeping Teams', quote: 'A real-time status board that works on any phone. Dirty rooms, priorities and assignments — always current.' },
    { icon: TrendingUp, role: 'General Managers', quote: 'Occupancy, ADR, RevPAR and revenue trends in one dashboard. Decisions backed by data, not guesswork.' },
  ];

  return (
    <div className="bg-white">
      {/* ================= HERO (ClickMaint style) ================= */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <Reveal>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.08] tracking-tight" style={{ color: NAVY }}>
                Hospitality Management Software{' '}
                <span className="relative inline-block">
                  EASY AS 1-2-3
                  <span className="absolute -bottom-0.5 left-0 right-0 h-[3px] rounded-full" style={{ background: GREEN }} />
                </span>
              </h1>
              <p className="text-lg mt-6 mb-8" style={{ color: '#4A4A4A' }}>
                A hotel platform that is powerful, affordable and easy-to-use. Run your front desk,
                housekeeping, billing, revenue and guest experience — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold hover:scale-[1.03] transition-transform"
                  style={{ background: GREEN, color: NAVY }}
                >
                  Start Your Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3 text-sm font-bold hover:bg-brand-bg transition-colors"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  <Play className="w-4 h-4" /> Watch Demo
                </Link>
              </div>
              <p className="flex items-center gap-2 text-[13px] mt-5" style={{ color: '#4A4A4A' }}>
                <Check className="w-4 h-4" style={{ color: '#16A34A' }} />
                No credit card required. Get instant access to Hostera.
              </p>
            </div>
          </Reveal>

          {/* Right column — real video + premium hotel photo slideshow */}
          <Reveal delay={0.15} y={36}>
            <HeroMedia />
          </Reveal>
        </div>
      </section>

      {/* ================= TRUST BAND ================= */}
      <section className="bg-[#F8F9FA] border-y border-brand-border py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-lg font-bold mb-8" style={{ color: NAVY }}>
              Trusted by thousands of hospitality & property professionals worldwide
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <HotelMarquee />
          </Reveal>
        </div>
      </section>

      {/* ================= WORLD FLAGS BANNER ================= */}
      <section className="py-10 bg-white overflow-hidden">
        <Reveal>
          <FlagBanner />
        </Reveal>
      </section>

      {/* ================= ALL MODULES ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>The Platform</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4" style={{ color: NAVY }}>
                Every module your property needs — all of them, in one platform
              </h2>
              <p className="max-w-2xl mx-auto" style={{ color: '#4A4A4A' }}>
                From the front desk to the boardroom — {MODULES.length}+ integrated modules, not a collection of disconnected tools.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.name + m.group} delay={(i % 4) * 0.06}>
                  <Link to="/features" className="block h-full p-6 rounded-2xl border border-brand-border hover:shadow-xl transition-all group hover:border-brand-blue/40">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-full bg-brand-bg flex items-center justify-center group-hover:bg-brand-navy transition-colors">
                        <Icon className="w-5 h-5 text-brand-navy group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-brand-bg border border-brand-border" style={{ color: '#1F5A8A' }}>
                        {m.group}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold mb-1.5" style={{ color: NAVY }}>{m.name}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: '#4A4A4A' }}>{m.desc}</p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SHOWCASE: ROOM RACK ================= */}
      <section className="py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Room Rack</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-5 leading-tight" style={{ color: NAVY }}>
                See your entire property — at a glance
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: '#4A4A4A' }}>
                Rooms vertically, dates horizontally, color-coded reservations in between. Your front-desk team
                can read a full week of occupancy in seconds and spot gaps, moves and double-booking risks instantly.
              </p>
              <ul className="space-y-3">
                {['Color-coded blocks by reservation status', 'Week-by-week navigation with filters', 'Fast enough for the busiest front desk', 'Overbooking-safe by design'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: NAVY }}>
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/features" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold mt-8 hover:scale-[1.03] transition-transform" style={{ background: GREEN, color: NAVY }}>
                Explore the Room Rack <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <RoomRackMockup />
          </Reveal>
        </div>
      </section>

      {/* ================= SHOWCASE: FRONT DESK ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal className="lg:order-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Front Desk</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-5 leading-tight" style={{ color: NAVY }}>
                Built for speed at the busiest desk in the hotel
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: '#4A4A4A' }}>
                Arrivals, departures, in-house guests and pending payments — organized for the morning rush.
                One-click check-in and check-out that automatically update room status and trigger housekeeping.
              </p>
              <ul className="space-y-3">
                {['One-click check-in / check-out with room status sync', 'Walk-in reservations in seconds', 'Guest and reservation search across your property', 'Pending payment tracking built in'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: NAVY }}>
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/features" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold mt-8 hover:scale-[1.03] transition-transform" style={{ background: GREEN, color: NAVY }}>
                Explore Front Desk <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="lg:order-1">
            <FrontDeskMockup />
          </Reveal>
        </div>
      </section>

      {/* ================= SHOWCASE: ANALYTICS ================= */}
      <section className="py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Analytics</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-5 leading-tight" style={{ color: NAVY }}>
                Revenue decisions backed by real data
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: '#4A4A4A' }}>
                ADR, RevPAR, occupancy trends, channel performance and revenue by booking source — the metrics
                that matter, visualized for managers who need answers, not spreadsheets.
              </p>
              <ul className="space-y-3">
                {['ADR, RevPAR and occupancy 14-day trends', 'Revenue breakdown by booking source', 'Channel performance comparison', 'Executive KPI dashboard for leadership'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: NAVY }}>
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/features" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold mt-8 hover:scale-[1.03] transition-transform" style={{ background: GREEN, color: NAVY }}>
                Explore Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <AnalyticsMockup />
          </Reveal>
        </div>
      </section>

      {/* ================= INDUSTRIES ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Solutions</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4" style={{ color: NAVY }}>Built for every hospitality business</h2>
              <p style={{ color: '#4A4A4A' }}>From a five-room guest house to an international hotel group.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {INDUSTRIES.map(ind => (
                <Link key={ind.name} to="/industries" className="px-5 py-2.5 bg-[#F8F9FA] border border-brand-border rounded-full text-sm font-medium hover:border-brand-navy hover:bg-white transition-all" style={{ color: NAVY }}>
                  {ind.name}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= HOSTERA AI ================= */}
      <section className="py-24 relative overflow-hidden" style={{ background: NAVY }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <Reveal>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-5 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> HOSTERA AI
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">An AI that respects your data</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Ask questions about performance, get forecasting, pricing suggestions and automated reports —
                powered by an AI layer that never accesses data your team can&apos;t access.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {aiFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 3) * 0.08}>
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-blue/50 transition-colors h-full">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/30 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
                    <p className="text-[13px] text-white/50 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <div className="text-center mt-10">
              <Link to="/ai" className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold hover:scale-[1.03] transition-transform" style={{ background: GREEN, color: NAVY }}>
                Discover Hostera AI <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= SECURITY ================= */}
      <section className="py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Security</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4" style={{ color: NAVY }}>Enterprise-grade security, standard</h2>
              <p style={{ color: '#4A4A4A' }}>Multi-tenant isolation, role-based access and immutable audit trails — built in from day one.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {securityFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 0.07}>
                  <div className="p-6 rounded-2xl bg-white border border-brand-border h-full">
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-navy" />
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: NAVY }}>{f.title}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: '#4A4A4A' }}>{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= ROLES ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Built for every role</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3" style={{ color: NAVY }}>The team that runs the hotel, finally on one platform</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((r, i) => {
              const Icon = r.icon;
              return (
                <Reveal key={r.role} delay={i * 0.1}>
                  <div className="p-8 rounded-2xl bg-[#F8F9FA] border border-brand-border h-full flex flex-col">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5" style={{ background: NAVY }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[15px] leading-relaxed flex-1" style={{ color: '#17212B' }}>&quot;{r.quote}&quot;</p>
                    <p className="text-sm font-semibold text-brand-navy mt-5">{r.role}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= AFFORDABILITY BAND (awards) ================= */}
      <AffordabilityBand />

      {/* ================= PRICING PREVIEW ================= */}
      <section className="py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1F5A8A' }}>Pricing</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4" style={{ color: NAVY }}>Simple, transparent plans</h2>
              <p style={{ color: '#4A4A4A' }}>Hotels pay for the platform. Guests never pay subscription fees.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div className={`p-6 rounded-2xl border-2 transition-all h-full ${p.popular ? 'shadow-xl bg-white relative' : 'border-brand-border bg-white hover:border-brand-blue/40'}`} style={p.popular ? { borderColor: NAVY } : {}}>
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-semibold px-3 py-1 rounded-full" style={{ background: NAVY }}>Most Popular</span>
                  )}
                  <h3 className="text-lg font-bold" style={{ color: NAVY }}>{p.name}</h3>
                  <p className="text-xs mt-1 mb-4" style={{ color: '#4A4A4A' }}>{p.desc}</p>
                  <p className="text-4xl font-bold text-brand-navy">${p.price}<span className="text-sm font-normal" style={{ color: '#4A4A4A' }}>/mo</span></p>
                  <ul className="mt-5 space-y-2 mb-6">
                    {p.features.slice(0, 4).map(f => (
                      <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: NAVY }}>
                        <Check className="w-4 h-4 text-green-600 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/pricing" className={`block text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${p.popular ? 'text-brand-overlay hover:brightness-95' : 'border border-brand-border text-brand-navy hover:border-brand-navy'}`} style={p.popular ? { background: GREEN } : {}}>
                    Choose {p.name}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-24 bg-brand-navy relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" alt="Resort pool" />
          <div className="absolute inset-0 bg-brand-navy/70"></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">Ready to modernize your property?</h2>
            <p className="text-lg text-white/70 mb-10">
              Join hospitality businesses worldwide running their operations on Hostera.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform" style={{ background: GREEN, color: NAVY }}>
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm">
                Talk to Our Team
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
              {[
                { icon: BadgeCheck, label: 'Verified by Liafrik' },
                { icon: ShieldCheck, label: 'Enterprise-grade security' },
                { icon: Headphones, label: '24/7 multilingual support' },
              ].map(b => {
                const Icon = b.icon;
                return (
                  <span key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs text-white/80 backdrop-blur-sm">
                    <Icon className="w-3.5 h-3.5 text-green-300" />{b.label}
                  </span>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}