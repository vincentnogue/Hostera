import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { ArrowRight, Building2, Globe, Target, Rocket, Heart, ArrowUpRight } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-25" alt="Grand hotel" />
          <div className="absolute inset-0 bg-brand-navy/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">About</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Hostera is developed by Liafrik</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              A global hospitality operating system — built on the belief that every property, anywhere in the
              world, deserves enterprise-grade software.
            </p>
          </Reveal>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-brand-ink mb-6">Our story</h2>
            <div className="space-y-5 text-[15px] text-brand-slate leading-relaxed">
              <p>
                Hospitality software was built for a different era — fragmented PMS tools, disconnected channel
                managers, manual billing and analytics that only accountants could love. Properties in emerging
                markets were especially underserved: priced out of enterprise tools or forced into software that
                ignored their currencies, languages and tax systems.
              </p>
              <p>
                Hostera was designed to end that compromise. One platform combining PMS, front desk, housekeeping,
                maintenance, billing, revenue management, distribution and guest experience — multi-tenant,
                multi-currency, multi-language and multi-timezone from day one.
              </p>
              <p>
                Hostera is developed and operated by <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-brand-navy font-semibold hover:underline">Liafrik</a>,
                and grows alongside the Liafrik ecosystem — including Nutro for F&B and LiBooks for accounting.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-brand-ink mb-3">What we believe</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Globe, title: 'International by default', desc: '7 languages including RTL Arabic, 140+ currencies, timezone-aware operations — global is the baseline, not a paid add-on.' },
              { icon: Target, title: 'No fake functionality', desc: 'Every button works, every integration status is honest, every metric comes from real data. Trust is the product.' },
              { icon: Rocket, title: 'Built to scale', desc: 'From 10 hotels to 10,000 — the architecture is designed for global expansion without rewrites.' },
              { icon: Heart, title: 'Operators first', desc: 'Designed for people who work long shifts: fast, readable, and efficient — not decorative.' },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.08}>
                  <div className="p-7 rounded-2xl bg-white border border-brand-border h-full">
                    <div className="w-11 h-11 rounded-full bg-brand-bg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-navy" />
                    </div>
                    <h3 className="text-base font-semibold text-brand-ink mb-2">{v.title}</h3>
                    <p className="text-[13px] text-brand-slate leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIAFRIK */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="p-10 rounded-2xl bg-brand-navy text-center">
              <Building2 className="w-10 h-10 text-white/40 mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-white mb-3">The company behind Hostera</h2>
              <p className="text-white/60 max-w-xl mx-auto mb-6 leading-relaxed">
                Liafrik builds international software products for global markets. Hostera is its hospitality
                platform — designed, developed and operated with the same security and quality standards across
                every country it serves.
              </p>
              <a
                href="https://liafrik.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-7 py-3 text-sm font-bold hover:scale-105 transition-transform"
              >
                Visit liafrik.com <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-2xl font-bold text-brand-ink mb-4">Join the platform</h2>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-brand-navy text-white px-8 py-3.5 text-sm font-semibold hover:bg-brand-blue transition-colors">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}