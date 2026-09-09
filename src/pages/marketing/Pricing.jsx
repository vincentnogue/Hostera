import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { PLANS, FAQS } from '@/lib/marketing';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';

const COMPARISON = [
  ['Included properties', '1', '1', '1', 'Unlimited'],
  ['Rooms', 'Up to 10', 'Up to 69', 'Up to 199', 'Unlimited'],
  ['Staff user accounts', 'Up to 5', 'Up to 15', 'Up to 50', 'Unlimited'],
  ['CORE PMS', null, null, null, null],
  ['Dashboard, Front Desk, Reservations, Room Rack', true, true, true, true],
  ['Room Types management', true, true, true, true],
  ['Booking Engine configuration', true, true, true, true],
  ['GUEST MANAGEMENT', null, null, null, null],
  ['Guest CRM profiles & history', true, true, true, true],
  ['Guest Portal (digital experience)', true, true, true, true],
  ['Loyalty Program (tiers, points, rewards)', false, true, true, true],
  ['Reputation Management (review aggregation)', false, true, true, true],
  ['OPERATIONS', null, null, null, null],
  ['Housekeeping & Maintenance', true, true, true, true],
  ['Staff Directory & Shift Management', true, true, true, true],
  ['Activity Log & Audit Logs', true, true, true, true],
  ['Inventory Management & Expense Tracking', false, false, true, true],
  ['REVENUE & GROWTH', null, null, null, null],
  ['Rate Manager (seasonal & dynamic rules)', false, true, true, true],
  ['Revenue Management', false, true, true, true],
  ['Channel Manager (OTA sync)', false, true, true, true],
  ['Integration Hub (payments, accounting, tools)', false, false, true, true],
  ['Marketing Tools (campaigns & templates)', false, false, true, true],
  ['Analytics & Reports', 'Basic', 'Standard', 'Advanced', 'Consolidated multi-property'],
  ['Hostera AI (insights & forecasting)', false, false, true, true],
  ['PLATFORM & SUPPORT', null, null, null, null],
  ['API Access & Webhooks', false, false, true, true],
  ['Document Templates', false, false, true, true],
  ['Priority Support', false, true, true, true],
  ['Dedicated Support & Custom Onboarding', false, false, false, true],
  ['SLA Guarantees', false, false, false, true],
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const priceFor = (p) => annual ? p.price * 10 : p.price;

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f3?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-25" alt="Luxury hotel" />
          <div className="absolute inset-0 bg-brand-navy/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Pricing</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Pricing that scales with your property</h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Hotels pay for the platform. Guests never pay subscription fees. No hidden service charges — ever.
            </p>
            <div className="inline-flex items-center bg-white/10 border border-white/20 rounded-full p-1 backdrop-blur-sm">
              <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${!annual ? 'bg-white text-brand-navy' : 'text-white/70'}`}>
                Monthly
              </button>
              <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${annual ? 'bg-white text-brand-navy' : 'text-white/70'}`}>
                Annual <span className="text-green-300">−2 months</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PLANS */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div className={`p-6 rounded-2xl border-2 h-full flex flex-col ${p.popular ? 'border-brand-navy shadow-xl bg-white relative' : 'border-brand-border bg-white'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-navy text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-lg font-bold text-brand-ink">{p.name}</h3>
                <p className="text-xs text-brand-slate mt-1 mb-4">{p.desc}</p>
                <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-brand-navy mb-3">{p.accessNote}</span>
                <p className="text-4xl font-bold text-brand-navy">
                  ${priceFor(p).toLocaleString()}
                  <span className="text-sm text-brand-slate font-normal">{annual ? '/year' : '/mo'}</span>
                </p>
                {annual && <p className="text-xs text-green-600 font-semibold mt-1">2 months free</p>}
                <ul className="mt-5 space-y-2.5 mb-5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-brand-ink">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="mb-5 pt-4 border-t border-[#F1F5F9]">
                  <p className="text-[10px] font-bold text-brand-slate uppercase tracking-wide mb-2">Module access</p>
                  <div className="flex flex-wrap gap-1">
                    {p.modules.map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 bg-brand-bg border border-brand-border rounded-full text-brand-ink">{m}</span>
                    ))}
                  </div>
                </div>
                <Link to="/register" className={`block text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${p.popular ? 'bg-brand-navy text-white hover:bg-brand-blue' : 'border border-brand-border text-brand-navy hover:border-brand-navy'}`}>
                  Choose {p.name}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-xs text-brand-slate mt-8">All plans include a full-featured free trial · Multi-property management is included with Enterprise</p>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-brand-ink text-center mb-10">Compare plans in detail</h2>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl border border-brand-border">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-brand-bg border-b border-brand-border">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-brand-slate uppercase tracking-wide">Feature</th>
                    {PLANS.map(p => (
                      <th key={p.name} className={`px-5 py-4 text-xs font-bold ${p.popular ? 'text-brand-navy' : 'text-brand-ink'}`}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, ri) => {
                    if (row[0] !== null && row[1] === null && row[2] === null) {
                      return (
                        <tr key={ri} className="bg-brand-navy/[0.04]">
                          <td colSpan={5} className="px-5 py-2.5 text-[10px] font-bold text-brand-navy uppercase tracking-widest">{row[0]}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={ri} className="border-b border-brand-border last:border-0">
                        <td className="px-5 py-3 text-[13px] font-medium text-brand-ink">{row[0]}</td>
                        {row.slice(1).map((cell, ci) => (
                          <td key={ci} className="px-5 py-3 text-center text-[13px] text-brand-slate">
                            {typeof cell === 'boolean'
                              ? cell
                                ? <Check className="w-4 h-4 text-green-600 mx-auto" />
                                : <span className="text-[#C4CDD5]">—</span>
                              : cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING FAQ */}
      <section className="py-20 bg-brand-bg">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-brand-ink text-center mb-10">Pricing questions</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS[1].items.map((f) => (
              <Reveal key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === f.q ? null : f.q)} className="w-full text-left p-5 bg-white rounded-2xl border border-brand-border hover:border-brand-blue/40 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-brand-ink">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-brand-slate shrink-0 transition-transform ${openFaq === f.q ? 'rotate-180' : ''}`} />
                  </div>
                  {openFaq === f.q && <p className="text-sm text-brand-slate mt-3 leading-relaxed">{f.a}</p>}
                </button>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-center mt-8">
              <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-blue">
                More questions? Visit the FAQ <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-navy">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Try everything, risk-free</h2>
            <p className="text-white/70 mb-8">Full-featured trial on every plan — cancel anytime.</p>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}