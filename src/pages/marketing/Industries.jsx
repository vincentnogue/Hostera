import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { INDUSTRIES } from '@/lib/marketing';
import { ArrowRight, Check, Building2 } from 'lucide-react';

export default function Industries() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-[#123B63] py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" alt="Hotel building" />
          <div className="absolute inset-0 bg-[#123B63]/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Solutions</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">One platform. Sixteen industries.</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Hostera adapts to how you operate — from a five-room guest house to a multi-property international hotel group.
            </p>
          </Reveal>
        </div>
      </section>

      {/* INDUSTRY CARDS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#17212B] mb-3">Find your industry</h2>
              <p className="text-[#64748B] max-w-2xl mx-auto">Each industry gets the same powerful core — with the workflows that matter most to you highlighted.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <Reveal key={ind.name} delay={(i % 4) * 0.06}>
                  <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#1F5A8A]/40 hover:shadow-xl transition-all h-full flex flex-col">
                    <div className="w-11 h-11 rounded-full bg-[#F6F8FB] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#123B63]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#17212B] mb-1.5">{ind.name}</h3>
                    <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">{ind.blurb}</p>
                    <ul className="space-y-1.5 mt-auto">
                      {ind.points.map(p => (
                        <li key={p} className="flex items-center gap-2 text-xs text-[#17212B]">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT ADAPTS */}
      <section className="py-20 bg-[#F6F8FB]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#17212B] mb-3">The same platform, shaped to your operation</h2>
              <p className="text-[#64748B] max-w-2xl mx-auto">Property type, size, currency, timezone and language — all configurable per property.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Small properties', desc: 'B&Bs, guest houses and villas get a clean, fast setup — rooms, rates and reservations without complexity you don\'t need.', point: 'Live in under a day' },
              { title: 'Full-service hotels & resorts', desc: 'Front desk, housekeeping, maintenance, F&B billing and revenue management — every department in one system.', point: 'Every module, integrated' },
              { title: 'Groups & management companies', desc: 'Enterprise organizations manage multiple properties with centralized users, switching and consolidated reporting.', point: 'Multi-property on Enterprise' },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] h-full">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-[#123B63] text-xs font-semibold rounded-full mb-4">{c.point}</span>
                  <h3 className="text-lg font-bold text-[#17212B] mb-2.5">{c.title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#123B63]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <Building2 className="w-10 h-10 text-white/40 mx-auto mb-5" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for how you operate</h2>
            <p className="text-white/70 mb-8">Configure your property and see Hostera adapt to your industry in minutes.</p>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-[#123B63] px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}