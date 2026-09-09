import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { FAQS } from '@/lib/marketing';
import { ChevronDown, ArrowRight, MessageSquare } from 'lucide-react';

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1445019980597-93fa8acb2469?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-25" alt="Resort building" />
          <div className="absolute inset-0 bg-brand-navy/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Help Center</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Frequently asked questions</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to know about Hostera — the platform, pricing, security and onboarding.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ GROUPS */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          {FAQS.map((group, gi) => (
            <div key={group.category}>
              <Reveal>
                <h2 className="text-xl font-bold text-brand-ink mb-5">{group.category}</h2>
              </Reveal>
              <div className="space-y-3">
                {group.items.map((f, fi) => (
                  <Reveal key={f.q} delay={fi * 0.05}>
                    <button
                      onClick={() => setOpen(open === f.q ? null : f.q)}
                      className={`w-full text-left p-5 rounded-2xl border transition-colors ${open === f.q ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border bg-white hover:border-brand-blue/40'}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-brand-ink">{f.q}</span>
                        <ChevronDown className={`w-4 h-4 text-brand-slate shrink-0 transition-transform ${open === f.q ? 'rotate-180' : ''}`} />
                      </div>
                      {open === f.q && (
                        <p className="text-sm text-brand-slate mt-3 leading-relaxed">{f.a}</p>
                      )}
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STILL NEED HELP */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="p-8 rounded-2xl bg-brand-bg border border-brand-border text-center">
              <MessageSquare className="w-8 h-8 text-brand-navy mx-auto mb-4" />
              <h2 className="text-xl font-bold text-brand-ink mb-2">Still have questions?</h2>
              <p className="text-sm text-brand-slate mb-6">
                Registered customers get the fastest answers through the in-app Support Center.
                Everyone else — our team reads every message.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy text-white px-6 py-3 text-sm font-semibold hover:bg-brand-blue transition-colors">
                  Contact Us <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/developers" className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border text-brand-navy px-6 py-3 text-sm font-semibold hover:border-brand-navy transition-colors">
                  Browse Documentation
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}