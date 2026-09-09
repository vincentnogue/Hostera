import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { ArrowRight, Brain, TrendingUp, BarChart3, Zap, Users, MessageSquare, FileText, Shield, Lock, Check } from 'lucide-react';

const capabilities = [
  { icon: TrendingUp, title: 'Revenue Intelligence', desc: 'Ask "Why did revenue drop last Tuesday?" and get a plain-language answer built from your real reservation, occupancy and rate data.' },
  { icon: BarChart3, title: 'Occupancy Explanations', desc: 'AI correlates events, booking pace and channel mix to explain occupancy shifts — not just display them.' },
  { icon: Zap, title: 'Dynamic Pricing Suggestions', desc: 'Rate recommendations per room type and season, with the reasoning shown so revenue managers stay in control.' },
  { icon: Users, title: 'Staffing Suggestions', desc: 'Housekeeping and front-desk workload forecasts based on arrivals, departures and stay-over patterns.' },
  { icon: MessageSquare, title: 'Guest Feedback Summaries', desc: 'Hundreds of reviews condensed into actionable themes — what guests love and what needs fixing.' },
  { icon: FileText, title: 'Automated Reports', desc: 'Executive-ready reports generated on demand — daily operations, weekly revenue, monthly performance.' },
];

const principles = [
  { icon: Lock, title: 'Tenant isolation first', desc: 'AI never accesses data outside the tenant and property the requesting user is authorized to see.' },
  { icon: Shield, title: 'Role-aware answers', desc: 'AI respects user roles — a housekeeper gets housekeeping answers, not financial exports.' },
  { icon: Check, title: 'Providers abstracted', desc: 'AI providers sit behind a service layer, keeping your data flows controlled and swappable.' },
];

export default function AiPlatform() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-[#0A1E30] py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1564501049412-61c2a308a9d8?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-15" alt="Hotel at dusk" />
          <div className="absolute inset-0 bg-[#0A1E30]/70"></div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#1F5A8A]/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">
              <Brain className="w-3.5 h-3.5" /> Hostera AI
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              The AI that knows your hotel —<br />and respects your data
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Performance answers, forecasting, pricing suggestions and automated reporting — powered by an AI layer
              with the same tenant isolation and permissions as the rest of Hostera.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#17212B] mb-3">What Hostera AI does</h2>
              <p className="text-[#64748B] max-w-2xl mx-auto">Six capabilities designed for hotel managers — not gimmicks.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.title} delay={(i % 3) * 0.08}>
                  <div className="p-6 rounded-2xl border border-[#E2E8F0] hover:shadow-xl hover:border-[#1F5A8A]/30 transition-all h-full">
                    <div className="w-11 h-11 rounded-full bg-[#F6F8FB] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#123B63]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#17212B] mb-2">{c.title}</h3>
                    <p className="text-[13px] text-[#64748B] leading-relaxed">{c.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="py-20 bg-[#0A1E30]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-3">AI with boundaries</h2>
              <p className="text-white/60 max-w-2xl mx-auto">AI must never access data the requesting user cannot access. That&apos;s not a feature — it&apos;s architecture.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {principles.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.1}>
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 h-full">
                    <div className="w-10 h-10 rounded-full bg-[#1F5A8A]/30 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                    <p className="text-[13px] text-white/50 leading-relaxed">{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMING TO PLATFORM */}
      <section className="py-20 bg-[#F6F8FB]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-2xl font-bold text-[#17212B] mb-3">Hostera AI is rolling out progressively</h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-8">
              AI capabilities are enabled through feature flags on the platform — starting with beta organizations
              and expanding to all plans as they mature. No fake AI, no pretend intelligence: capabilities ship when they work.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-[#123B63] text-white px-8 py-3.5 text-sm font-semibold hover:bg-[#1F5A8A] transition-colors">
              Get Early Access <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}