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

  const inputCls = "w-full px-4 py-3 border border-[#E2E8F0] rounded-full text-sm outline-none focus:border-[#123B63] text-[#17212B] placeholder:text-[#94A3B8]";

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-[#123B63] py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-25" alt="Hotel room" />
          <div className="absolute inset-0 bg-[#123B63]/70"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">Contact</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Talk to our team</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Questions about plans, onboarding, migrations or partnerships — we're here.
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
                <div className="p-7 rounded-2xl border border-[#E2E8F0] hover:shadow-xl transition-all h-full flex flex-col">
                  <div className="w-11 h-11 rounded-full bg-[#F6F8FB] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#123B63]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#17212B] mb-2">{c.title}</h3>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-5 flex-1">{c.desc}</p>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-fit px-5 py-2.5 rounded-full bg-[#123B63] text-white text-sm font-semibold hover:bg-[#1F5A8A] transition-colors">
                      {c.cta} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link to={c.to} className="inline-flex items-center justify-center gap-2 w-fit px-5 py-2.5 rounded-full bg-[#123B63] text-white text-sm font-semibold hover:bg-[#1F5A8A] transition-colors">
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
      <section className="pb-20 bg-[#F6F8FB]">
        <div className="max-w-2xl mx-auto px-6">
          <Reveal>
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0]">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-[#123B63]" />
                <h2 className="text-xl font-bold text-[#17212B]">Send us a message</h2>
              </div>
              <p className="text-[13px] text-[#64748B] mb-6">
                Fill in the form and we'll open your email client with everything prefilled — your message goes
                straight to our team through your own email, keeping a copy in your sent folder.
              </p>
              {composed ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-[#17212B]">Your email client should now be open</p>
                  <p className="text-xs text-[#64748B] mt-1">Press send in your email app to deliver your message.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="text" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    <input required type="email" placeholder="Work email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                  </div>
                  <input type="text" placeholder="Property / company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputCls} />
                  <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-3xl text-sm outline-none focus:border-[#123B63] resize-none text-[#17212B] placeholder:text-[#94A3B8]" />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-full bg-[#123B63] text-white px-6 py-3.5 text-sm font-semibold hover:bg-[#1F5A8A] transition-colors">
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