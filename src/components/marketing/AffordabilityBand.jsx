import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, DollarSign, Clock } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

const GREEN = '#A6FF00';
const NAVY = '#123B63';

// Same ribbon-badge visual style as before, but no longer impersonating
// specific real review platforms (G2, Capterra, Software Advice) that
// Hostera hasn't actually been rated or reviewed by yet — these are
// genuine, verifiable claims about the product itself instead.
const RibbonBadge = ({ icon: Icon, title, subtitle }) => (
  <div
    className="w-28 h-36 flex flex-col items-center justify-center text-center px-2"
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 50% 100%, 0 74%)', background: NAVY, border: `1px solid ${GREEN}40` }}
  >
    <Icon className="w-5 h-5" style={{ color: GREEN }} />
    <span className="text-[13px] font-bold text-white leading-tight mt-2">{title}</span>
    <span className="text-[9px] font-semibold text-white/60 tracking-wide mt-1">{subtitle}</span>
  </div>
);

export default function AffordabilityBand() {
  return (
    <section className="py-14" style={{ background: NAVY }}>
      <Reveal>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          <div className="flex items-end justify-center gap-5">
            <RibbonBadge icon={Layers} title="All Modules" subtitle="INCLUDED" />
            <RibbonBadge icon={DollarSign} title="No Hidden Fees" subtitle="TRANSPARENT PRICING" />
            <RibbonBadge icon={Clock} title="Live In Minutes" subtitle="FAST SETUP" />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white">See how affordable Hostera is</h2>
            <div className="flex flex-wrap items-center gap-3 mt-5 justify-center lg:justify-start">
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-full border-2 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                style={{ borderColor: GREEN }}
              >
                PRICING DETAILS
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-bold hover:scale-[1.03] transition-transform"
                style={{ background: GREEN, color: NAVY }}
              >
                PRICE CALCULATOR
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
