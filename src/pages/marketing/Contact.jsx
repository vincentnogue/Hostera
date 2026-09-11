import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { ArrowRight, Mail, Globe, Rocket, LifeBuoy, Send, Check } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [composed, setComposed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Hostera inquiry — ${form.company || form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nCompany: ${form.company}\nEmail: ${form.email}\n\n${form.message}\n\n— Sent from hostera.com contact page`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setComposed(true);
  };

  const inputCls = "w-full px-4 py-3 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy text-brand-ink placeholder:text-brand-slate-light";

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-brand-navy py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hotels/hotel-01-oceanview-suite.jpg" className="w-full h-full object-cover opacity-80" alt="Oceanview suite — Lima" />
          <div className="absolute inset-0 bg-brand-navy/80"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Contact</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Talk to our team</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Questions about plans, onboarding, migrations or partnerships — we&apos;re here.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CHANNELS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Rocket, title: 'Start a Trial', desc: 'Explore the full platform yourself — every module, no credit card required.', cta: 'Get Started', to: '/register' },
            { icon: LifeBuoy, title: 'Existing Customer?', desc: 'Registered users get fastest support through the in-app Support Center — tickets are tenant-aware and fully traceable.', cta: 'Sign In', to: '/login' },
            { icon: Globe, title: 'Liafrik', desc: 'For company-level, partnership and press inquiries, reach us through the Liafrik website.', cta: 'liafrik.com', href: 'https://liafrik.com' },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="p-7 rounded-2xl border border-brand-border hover:shadow-xl transition-all h-full flex flex-col">
                  <div className="w-11 h-11 rounded-full bg-brand-bg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-navy" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-ink mb-2">{c.title}</h3>
                  <p className="text-[13px] text-brand-slate leading-relaxed mb-5 flex-1">{c.desc}</p>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-fit px-5 py-2.5 rounded-full bg-brand-navy text-white text-sm font-semibold hover:bg-brand-blue transition-colors">
                      {c.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link to={c.to} className="inline-flex items-center justify-center gap-2 w-fit px-5 py-2.5 rounded-full bg-brand-navy text-white text-sm font-semibold hover:bg-brand-blue transition-colors">
                      {c.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FORM */}
      <section className="pb-20 bg-brand-bg">
        <div className="max-w-2xl mx-auto px-6">
          <Reveal>
            <div className="p-8 rounded-2xl bg-white border border-brand-border">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-brand-navy" />
                <h2 className="text-xl font-bold text-brand-ink">Send us a message</h2>
              </div>
              <p className="text-[13px] text-brand-slate mb-6">
                Fill in the form and we&apos;ll open your email client with everything prefilled — your message goes
                straight to our team through your own email, keeping a copy in your sent folder.
              </p>
              {composed ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-brand-ink">Your email client should now be open</p>
                  <p className="text-xs text-brand-slate mt-1">Press send in your email app to deliver your message.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="text" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    <input required type="email" placeholder="Work email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                  </div>
                  <input type="text" placeholder="Property / company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputCls} />
                  <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none text-brand-ink placeholder:text-brand-slate-light" />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-navy text-white px-6 py-3.5 text-sm font-semibold hover:bg-brand-blue transition-colors">
                    Compose Message <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}