import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

const GREEN = '#A6FF00';
const NAVY = '#123B63';

const G2Badge = () => (
  <div
    className="w-28 h-36 bg-white flex flex-col items-center text-center"
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 50% 100%, 0 74%)' }}
  >
    <div className="w-full bg-[#FF8A00] py-0.5">
      <span className="text-[8px] font-black text-white tracking-widest">WINTER 2026</span>
    </div>
    <span className="text-lg font-black mt-2" style={{ color: '#FF3747' }}>G2</span>
    <span className="text-[13px] font-bold text-black leading-tight mt-1">Easiest<br />To Use</span>
    <span className="text-[8px] font-bold text-black/60 tracking-widest mt-1">SMALL BUSINESS</span>
  </div>
);

const CapterraBadge = () => (
  <div
    className="w-28 h-36 relative"
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 50% 100%, 0 74%)', background: '#022E5B' }}
  >
    <div
      className="absolute inset-[3px] flex flex-col items-center justify-center text-center"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 73.5%, 50% 98%, 0 73.5%)', background: '#1B6BC0' }}
    >
      <span className="text-sm font-black italic text-white tracking-tight">Capterra</span>
      <span className="text-[12px] font-bold text-white leading-tight mt-2">BEST<br />VALUE</span>
      <span className="text-[10px] font-bold text-white/90 mt-1">2026</span>
    </div>
  </div>
);

const SoftwareAdviceBadge = () => (
  <div
    className="w-32 h-36 relative"
    style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', background: '#C6A5E8' }}
  >
    <div
      className="absolute inset-[3px] flex flex-col items-center justify-center text-center px-3"
      style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', background: '#6B2FA0' }}
    >
      <MessageCircle className="w-4 h-4 text-[#FF8A00] fill-[#FF8A00]" />
      <span className="text-[9px] font-semibold text-white mt-1.5">Software Advice</span>
      <span className="text-[10px] font-bold text-white leading-tight mt-1">BEST CUSTOMER<br />SUPPORT</span>
      <span className="text-[10px] font-bold text-white/90 mt-1">2026</span>
    </div>
  </div>
);

export default function AffordabilityBand() {
  return (
    <section className="py-14" style={{ background: NAVY }}>
      <Reveal>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          <div className="flex items-end justify-center gap-5">
            <G2Badge />
            <CapterraBadge />
            <SoftwareAdviceBadge />
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