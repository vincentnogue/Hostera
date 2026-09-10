import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import BrandLogo from '@/components/marketing/BrandLogos';
import { INTEGRATION_CATEGORIES } from '@/lib/marketing';
import { ArrowRight, Plug, UtensilsCrossed, Receipt, Check, Shield } from 'lucide-react';

const statusStyles = {
  'Available': 'bg-green-100 text-green-700',
  'Connector ready': 'bg-blue-100 text-blue-700',
  'Strategic partner': 'bg-brand-navy text-white',
  'On roadmap': 'bg-gray-100 text-gray-500',
};

export default function Integrations() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hotels/hotel-04-modern-facade.jpg" className="w-full h-full object-cover opacity-25" alt="Radisson-style facade — India" />
          <div className="absolute inset-0 bg-brand-navy/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Integration Hub</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Connect to everything that matters</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Distribution, payments, accounting, communication and hardware — through a secure connector architecture that never lets integrations touch core reservation data directly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* LIAFRIK ECOSYSTEM — FEATURED */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">The Liafrik Ecosystem</span>
              <h2 className="text-3xl font-bold text-brand-ink mt-3">Strategic integrations, built together</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Reveal>
              <div className="p-5 rounded-xl bg-brand-navy text-white relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Nutro</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/15 font-semibold uppercase tracking-wide">F&B · Restaurant</span>
                    </div>
                  </div>
                  <BrandLogo name="Nutro" size="sm" className="!bg-white/10 !border-white/20" />
                </div>
                <p className="text-[12px] text-white/60 leading-relaxed mb-4 flex-1">
                  Restaurant orders flow straight into guest folios: Nutro identifies the guest and room,
                  Hostera posts the charge, issues the invoice and syncs the payment — automatically.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['Guest & room ID', 'Folio charging', 'Invoice sync'].map(f => (
                    <span key={f} className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
                <a href="https://nutro.liafrik.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-blue-300 transition-colors">
                  nutro.liafrik.com <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="p-5 rounded-xl bg-white border-2 border-brand-navy h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-bg flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-brand-ink">LiBooks</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-brand-navy font-semibold uppercase tracking-wide">Accounting · Finance</span>
                    </div>
                  </div>
                  <BrandLogo name="LiBooks" size="sm" />
                </div>
                <p className="text-[12px] text-brand-slate leading-relaxed mb-4 flex-1">
                  Invoices, credit notes, payments, taxes and refunds exported to the Liafrik accounting
                  platform — with mapping, reconciliation, retry logic and full sync logs.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {['Invoice sync', 'Tax mapping', 'Reconciliation'].map(f => (
                    <span key={f} className="text-[10px] bg-brand-bg text-brand-ink px-2.5 py-1 rounded-full border border-brand-border">{f}</span>
                  ))}
                </div>
                <a href="https://libooks.liafrik.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-blue transition-colors">
                  libooks.liafrik.com <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          {INTEGRATION_CATEGORIES.map((cat, ci) => (
            <Reveal key={cat.name}>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-full bg-brand-bg flex items-center justify-center">
                    <Plug className="w-4 h-4 text-brand-navy" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-ink">{cat.name}</h2>
                  <span className="text-xs text-brand-slate">{cat.items.length} integration{cat.items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cat.items.map(item => (
                    <div key={item.name} className="p-5 rounded-2xl border border-brand-border hover:border-brand-blue/40 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <BrandLogo name={item.name} size="sm" />
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyles[item.status] || statusStyles['On roadmap']}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-brand-ink">{item.name}</p>
                      {item.desc && <p className="text-xs text-brand-slate mt-1 leading-relaxed">{item.desc}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE NOTE */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="p-8 rounded-2xl bg-white border border-brand-border">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-brand-navy" />
                <h3 className="text-lg font-bold text-brand-ink">A connector architecture that protects your data</h3>
              </div>
              <p className="text-sm text-brand-slate leading-relaxed mb-5">
                No integration ever manipulates the database directly. Every connector flows through an
                adapter, service layer, business logic and validation — so a failing integration can never corrupt
                core reservation data. Every synchronization is logged with retry and error handling.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Adapter → Service → Validation → Database', 'Sync logs & retries', 'Overbooking protection', 'Never trust external systems blindly'].map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-xs text-brand-ink bg-brand-bg px-3 py-1.5 rounded-full border border-brand-border">
                    <Check className="w-3.5 h-3.5 text-green-600" />{f}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-navy">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Don&apos;t see your integration?</h2>
            <p className="text-white/70 mb-8">Our developer platform and connector architecture make new integrations fast to add — tell us what you need.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
                Request an Integration <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/developers" className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors">
                Developer Platform
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}