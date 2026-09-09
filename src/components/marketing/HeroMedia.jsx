const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { HOTEL_PHOTOS } from '@/lib/hotelMedia';

const SLIDE_DURATION = 4000;

// This is the "mockup" card that floats above/beside the hero copy —
// it cycles through real luxury hotel photography from properties
// running on Hostera worldwide. The hero section's own background video
// lives separately in Landing.jsx (see HeroBackgroundVideo).
export default function HeroMedia() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % HOTEL_PHOTOS.length), []);
  const prev = () => setIndex(i => (i - 1 + HOTEL_PHOTOS.length) % HOTEL_PHOTOS.length);

  useEffect(() => {
    const t = setTimeout(next, SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [index, next]);

  const slide = HOTEL_PHOTOS[index];

  return (
    <div className="relative rounded-[1.8rem] overflow-hidden shadow-2xl border border-brand-border bg-brand-overlay aspect-[4/3]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="absolute inset-0"
        >
          <img
            src={slide.src}
            alt={slide.caption}
            loading={index === 0 ? 'eager' : 'lazy'}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Caption */}
      <div className="absolute bottom-14 left-4 right-4 flex justify-center pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-overlay/70 text-white text-xs font-medium backdrop-blur-sm">
          <MapPin className="w-3 h-3 text-[#A6FF00]" />
          {slide.caption}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
        <button onClick={prev} aria-label="Previous" className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold tabular-nums">
          {index + 1} / {HOTEL_PHOTOS.length}
        </span>
        <button onClick={next} aria-label="Next" className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
