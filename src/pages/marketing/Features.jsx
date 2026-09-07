import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { RoomRackMockup, FrontDeskMockup, AnalyticsMockup, DashboardMockup } from '@/components/marketing/Mockups';
import { MODULES, MODULE_GROUPS } from '@/lib/marketing';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';

const groupBlurbs = {
  'Core PMS': 'The operational heart of your property — reservations, front desk and the visual room rack your team will live in.',
  'Operations': 'Housekeeping, maintenance, inventory and team management — the modules that keep the property running.',
  'Revenue & Finance': 'Billing, revenue management, analytics and channel distribution — the tools that grow the business.',
  'Guest Experience': 'Guest portal, reputation, templates and CRM — the touchpoints that turn stays into loyalty.',
  'Platform': 'Audit trails and property configuration — the foundation that keeps everything secure and localized.',
};

const groupMockups = {
  'Core PMS': RoomRackMockup,
  'Operations': FrontDeskMockup,
  'Revenue & Finance': AnalyticsMockup,
  'Guest Experience': DashboardMockup,
  'Platform': DashboardMockup,
};

export default function Features() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-[#123B63] py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1582719478250-c89cae40dc85?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-25" alt="Luxury resort pool" />
          <div className="absolute inset-0 bg-[#123B63]/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Platform</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Every module. One platform.</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Explore the complete Hostera operating system — {MODULES.length} deeply integrated modules covering every corner of hospitality operations.
            </p>
          </Reveal>
        </div>
      </section>

      {/* GROUPS */}
      {MODULE_GROUPS.map((group, gi) => {
        const mods = MODULES.filter(m => m.group === group);
        const Mockup = groupMockups[group];
        return (
          <section key={group} className={`py-20 ${gi % 2 === 0 ? 'bg-white' : 'bg-[#F6F8FB]'}`}>
            <div className="max-w-7xl mx-auto px-6">
              <Reveal>
                <div className="max-w-3xl mb-12">
                  <span className="text-xs font-bold text-[#1F5A8A] uppercase tracking-widest">{`0${gi + 1}`} — {group}</span>
                  <h2 className="text-3xl font-bold text-[#17212B] mt-3 mb-3">{group}</h2>
                  <p className="text-[#64748B] leading-relaxed">{groupBlurbs[group]}</p>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {mods.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <Reveal key={m.name} delay={(i % 3) * 0.07}>
                      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:shadow-xl hover:border-[#1F5A8A]/30 transition-all h-full">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-11 h-11 rounded-full bg-[#F6F8FB] flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#123B63]" />
                          </div>
                          <h3 className="text-base font-semibold text-[#17212B]">{m.name}</h3>
                        </div>
                        <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">{m.desc}</p>
                        <ul className="space-y-2">
                          {m.features.map(f => (
                            <li key={f} className="flex items-start gap-2 text-[13px] text-[#17212B]">
                              <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              {gi === 0 && (
                <Reveal>
                  <div className="max-w-4xl mx-auto">
                    <Mockup />
                  </div>
                </Reveal>
              )}
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-20 bg-[#123B63]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See it all working together</h2>
            <p className="text-white/70 mb-8">Start a full-featured trial and explore every module with your own property.</p>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white text-[#123B63] px-8 py-3.5 text-sm font-bold hover:scale-105 transition-transform">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}