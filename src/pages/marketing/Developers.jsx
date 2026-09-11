import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { ArrowRight, Code, Key, Webhook, Server, Braces, Check, RefreshCw, Rocket } from 'lucide-react';

const API_DOMAINS = [
  '/properties', '/rooms', '/reservations', '/guests', '/folios', '/payments',
  '/invoices', '/availability', '/rates', '/housekeeping', '/maintenance', '/integrations', '/webhooks',
];

const WEBHOOK_EVENTS = [
  'reservation.created', 'reservation.updated', 'reservation.cancelled',
  'guest.created', 'checkin.completed', 'checkout.completed',
  'payment.completed', 'invoice.created', 'room.status_changed',
  'housekeeping.completed', 'maintenance.created',
];

const CHANGELOG = [
  {
    version: 'v1.2', date: 'September 2026', tag: 'New',
    items: ['Revenue Analytics module with 14-day ADR / RevPAR / occupancy trends', 'Commercial code engine with revenue attribution', 'Platform Control Center for Liafrik operations'],
  },
  {
    version: 'v1.1', date: 'August 2026', tag: 'New',
    items: ['Channel Manager with two-way OTA synchronization', 'Guest Portal with digital check-in preferences', 'Inventory Management with low-stock alerts'],
  },
  {
    version: 'v1.0', date: 'July 2026', tag: 'Launch',
    items: ['Initial launch: PMS, Front Desk, Reservations, Room Rack', 'Housekeeping & Maintenance modules', 'Multi-currency, multi-timezone, 7 languages incl. RTL Arabic'],
  },
];

export default function Developers() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section id="overview" className="relative bg-brand-navy-900 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hotels/hotel-07-lakeside-palace.jpg" className="w-full h-full object-cover opacity-20" alt="Lakeside palace — Lucerne" />
          <div className="absolute inset-0 bg-brand-navy-900/75"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">
              <Code className="w-3.5 h-3.5" /> Developer Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Build on Hostera</h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              REST APIs, webhooks, API keys and OAuth — a developer platform that never exposes the database directly.
            </p>
          </Reveal>
        </div>
      </section>

      {/* IN-PAGE NAV */}
      <div className="sticky top-16 z-20 bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {[
            ['Overview', '#overview'], ['API Reference', '#api-reference'],
            ['Webhooks', '#webhooks'], ['Developer Portal', '#developer-portal'],
            ['Changelog', '#changelog'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="shrink-0 px-4 py-3 text-sm font-medium text-brand-slate hover:text-brand-navy whitespace-nowrap">
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* CODE SAMPLE */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="rounded-2xl overflow-hidden border border-brand-border shadow-xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-brand-border">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-brand-slate font-medium ml-2">Create a reservation — REST API</span>
              </div>
              <pre className="bg-brand-navy-900 p-6 overflow-x-auto text-[13px] leading-relaxed"><code>{`POST /v1/reservations
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "guest_id": "gst_8f3k29x",
  "room_type_id": "rmt_deluxe_king",
  "check_in": "2026-09-10",
  "check_out": "2026-09-13",
  "adults": 2,
  "source": "direct",
  "idempotency_key": "booking-ref-2026-0912"
}

201 Created
{
  "id": "res_9a2f71c",
  "status": "confirmed",
  "total": 1050,
  "currency": "AED"
}`}</code></pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* API DOMAINS + FEATURES */}
      <section id="api-reference" className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Reveal>
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Server className="w-5 h-5 text-brand-navy" />
                <h2 className="text-2xl font-bold text-brand-ink">API domains</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {API_DOMAINS.map(d => (
                  <div key={d} className="flex items-center gap-2 px-4 py-2.5 bg-brand-bg rounded-full border border-brand-border">
                    <Braces className="w-3.5 h-3.5 text-brand-blue" />
                    <code className="text-xs text-brand-ink font-mono">{d}</code>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div id="developer-portal">
              <div className="flex items-center gap-3 mb-5">
                <Key className="w-5 h-5 text-brand-navy" />
                <h2 className="text-2xl font-bold text-brand-ink">Platform capabilities</h2>
              </div>
              <div className="space-y-3">
                {[
                  ['API keys with scoped permissions', 'Grant exactly the access an integration needs — property-scoped, revocable, auditable.'],
                  ['OAuth 2.0', 'Let partner apps connect on behalf of properties with consent, not shared credentials.'],
                  ['Rate limits & versioning', 'Predictable limits, versioned endpoints and a sandbox for safe development.'],
                  ['Idempotency keys', 'Financial and reservation operations can never be accidentally duplicated.'],
                ].map(([t, d]) => (
                  <div key={t} className="p-4 rounded-2xl border border-brand-border">
                    <p className="text-sm font-semibold text-brand-ink mb-1">{t}</p>
                    <p className="text-[13px] text-brand-slate leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WEBHOOKS */}
      <section id="webhooks" className="py-16 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <Webhook className="w-5 h-5 text-brand-navy" />
              <h2 className="text-2xl font-bold text-brand-ink">Webhooks</h2>
            </div>
            <p className="text-sm text-brand-slate mb-6 leading-relaxed max-w-2xl">
              Reliable event delivery with exponential-backoff retries, signature verification, delivery logs
              and replay. Duplicate events never duplicate transactions — idempotency is guaranteed.
            </p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(e => (
                <code key={e} className="text-xs font-mono px-3.5 py-2 bg-white border border-brand-border rounded-full text-brand-ink">
                  {e}
                </code>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CHANGELOG */}
      <section id="changelog" className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-8">
              <Rocket className="w-5 h-5 text-brand-navy" />
              <h2 className="text-2xl font-bold text-brand-ink">Changelog</h2>
            </div>
          </Reveal>
          <div className="space-y-4">
            {CHANGELOG.map((rel, i) => (
              <Reveal key={rel.version} delay={i * 0.06}>
                <div className="p-6 rounded-2xl border border-brand-border">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-brand-ink">{rel.version}</span>
                    <span className="text-xs text-brand-slate">{rel.date}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${rel.tag === 'Launch' ? 'bg-brand-navy text-white' : 'bg-green-100 text-green-700'}`}>
                      {rel.tag}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {rel.items.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-[13px] text-brand-slate">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-navy">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-white mb-4">Start building</h2>
            <p className="text-white/70 mb-8">Create an organization, generate an API key and call your first endpoint in minutes.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-brand-navy px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/status" className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors">
                <RefreshCw className="w-4 h-4" /> API Status
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}