const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const VIDEO_URL = 'https://media.db.com/videos/public/6a9ea8143c2e0f57c497d6da/09714159a_Hero_Htel_Premium.mp4';

const SLIDES = [
  {
    type: 'video',
    src: VIDEO_URL,
    caption: 'The Hostera experience',
    duration: 9000,
  },
  {
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    caption: 'Overwater villas — Maldives',
    duration: 4000,
  },
  {
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1611892440504-42a792a2470f?q=80&w=1200&auto=format&fit=crop',
    caption: 'Presidential suite — Dubai',
    duration: 4000,
  },
  {
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1590490360182-ac338c382b0f?q=80&w=1200&auto=format&fit=crop',
    caption: 'Boutique residence — Santorini',
    duration: 4000,
  },
  {
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1582719478250-c89cae37dcdb?q=80&w=1200&auto=format&fit=crop',
    caption: 'Infinity pool resort — Bali',
    duration: 4000,
  },
  {
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop',
    caption: 'Grand atrium lobby — Singapore',
    duration: 4000,
  },
];

export default function HeroMedia() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % SLIDES.length), []);
  const prev = () => setIndex(i => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const t = setTimeout(next, SLIDES[index].duration);
    return () => clearTimeout(t);
  }, [index, next]);

  const slide = SLIDES[index];

  return (
    <div className="relative rounded-[1.8rem] overflow-hidden shadow-2xl border border-[#E2E8F0] bg-[#0E243F] aspect-[4/3]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="absolute inset-0"
        >
          {slide.type === 'video' ? (
            <video
              src={slide.src}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={slide.src}
              alt={slide.caption}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Caption */}
      <div className="absolute bottom-14 left-4 right-4 flex justify-center pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0E243F]/70 text-white text-xs font-medium backdrop-blur-sm">
          <MapPin className="w-3 h-3 text-[#A6FF00]" />
          {slide.caption}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
        <button onClick={prev} aria-label="Previous" className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
        <button onClick={next} aria-label="Next" className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}