import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HERO_VIDEOS } from '@/lib/hotelMedia';

// Rotating, cross-fading video background for the hero section. Sits behind
// the hero copy at low opacity (see Landing.jsx) so it reads as texture,
// not a distraction. Cycles through the real property walkthrough videos.
export default function HeroBackgroundVideo({ className = '' }) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || HERO_VIDEOS.length <= 1) return;
    const t = setTimeout(() => setIndex(i => (i + 1) % HERO_VIDEOS.length), 9000);
    return () => clearTimeout(t);
  }, [index, reducedMotion]);

  const current = HERO_VIDEOS[index] || HERO_VIDEOS[0];
  if (!current) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={current.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {reducedMotion ? (
            <img src={current.poster} alt="" className="w-full h-full object-cover" />
          ) : (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={current.poster}
              className="w-full h-full object-cover"
            >
              <source src={current.src} type="video/mp4" />
            </video>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
