import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { ArrowRight, Lock, Shield, Users, FileText, Globe, Database } from 'lucide-react';

const pillars = [
  { icon: Lock, title: 'Strict Multi-Tenant Isolation', desc: 'Every record — reservations, guests, folios, invoices — is scoped to your organization and property. Isolation is enforced server-side and never relies on the interface hiding data.' },
  { icon: Shield, title: 'MFA & Privileged Access', desc: 'Multi-factor authentication for privileged accounts, session management, and re-verification for sensitive platform operations.' },
  { icon: Users, title: 'Role-Based Access Control', desc: 'Granular roles from platform owners to housekeepers. Users see only what their role permits — enforced at the data layer.' },
  { icon: FileText, title: 'Immutable Audit Trails', desc: 'Every important operation — reservations, payments, refunds, permission changes — is recorded in an append-only audit log that normal users cannot edit.' },
  { icon: Database, title: 'Financial Ledger Integrity', desc: 'Financial records are append-oriented. Corrections use refunds and credit notes — never silent overwrites of history.' },
  { icon: Globe, title: 'Regional Privacy Controls', desc: 'Consent management, data retention, export and deletion controls designed for international privacy frameworks — configurable per country, without false compliance claims.' },
];

export default function Security() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy-900 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hotels/hotel-08-cliffside-pool.jpg" className="w-full h-full object-cover opacity-20" alt="Cliffside infinity pool — Algarve" />
          <div className="absolute inset-0 bg-brand-navy-900/75"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">
              <Shield className="w-3.5 h-3.5" /> Security & Trust
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Security is a product feature</h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Hostera holds the data hotels run on. Tenant isolation, role-based access and immutable audit
              trails are built into the foundation — not bolted on.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={(i % 3) * 0.08}>
                <div className="p-7 rounded-2xl border border-brand-border hover:shadow-xl transition-all h-full">
                  <div className="w-11 h-11 rounded-full bg-brand-bg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-navy" />
                  </div>
                  <h3 className="text-base font-semibold text-brand-ink mb-2">{p.title}</h3>
                  <p className="text-[13px] text-brand-slate leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="py-20 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-brand-ink text-center mb-10">How the platform enforces it</h2>
          </Reveal>
          <div className="space-y-4">
            {[
              ['Server-side tenant scoping', 'Every business entity carries organization and property ownership. Client-provided tenant IDs are never trusted — context comes from the authenticated session.'],
              ['Row-level security & authorization', 'Reads and writes pass through server-side authorization. A user from one organization can never query another organization\'s records.'],
              ['Controlled integration flow', 'Integrations communicate through adapters, service layers and validation — never directly with the database. A failing OTA can\'t corrupt reservations.'],
              ['No secrets in the frontend', 'API keys, payment secrets and credentials never reach the browser. Payment card data is handled exclusively by tokenized payment providers.'],
              ['Human-readable, secure errors', 'Errors shown to users never expose stack traces, credentials or internal architecture.'],
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="p-6 rounded-2xl bg-white border border-brand-border flex items-start gap-4">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-brand-ink mb-1">{title}</h3>
                    <p className="text-[13px] text-brand-slate leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="p-8 rounded-2xl bg-brand-bg border border-brand-border">
              <h2 className="text-2xl font-bold text-brand-ink mb-4">Privacy, honestly</h2>
              <p className="text-sm text-brand-slate leading-relaxed mb-5">
                Hostera is built for international privacy frameworks: consent management, marketing preferences,
                data export, data deletion and retention policies are part of the platform — and country-specific
                compliance requirements are configurable per property.
              </p>
              <p className="text-xs text-brand-slate">
                We don&apos;t claim automatic legal compliance for your jurisdiction — compliance depends on how you configure
                the platform and your local obligations. Read our{' '}
                <Link to="/legal/privacy" className="text-brand-navy font-semibold hover:underline">Privacy Policy</Link> and{' '}
                <Link to="/legal/data-processing" className="text-brand-navy font-semibold hover:underline">Data Processing terms</Link>.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-navy">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Run your hotel on a platform you can trust</h2>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}