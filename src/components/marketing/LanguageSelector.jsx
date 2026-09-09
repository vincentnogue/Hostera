import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => localStorage.getItem('hostera_language') || 'en');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (code) => {
    setCurrent(code);
    localStorage.setItem('hostera_language', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    setOpen(false);
  };

  const active = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-brand-ink hover:bg-brand-bg transition-colors"
      >
        <Globe className="w-4 h-4 text-brand-slate" />
        <span className="uppercase">{active.code}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-brand-border rounded-2xl shadow-xl py-2 z-50">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors"
            >
              <span>{l.label}</span>
              {current === l.code && <Check className="w-3.5 h-3.5 text-green-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}