import React from 'react';

// ISO 3166-1 alpha-2 codes — all UN member/observer countries
const CODES = [
  'af', 'al', 'dz', 'ad', 'ao', 'ag', 'ar', 'am', 'au', 'at', 'az',
  'bs', 'bh', 'bd', 'bb', 'by', 'be', 'bz', 'bj', 'bt', 'bo', 'ba', 'bw', 'br', 'bn', 'bg', 'bf',
  'kh', 'cm', 'ca', 'cv', 'cf', 'td', 'cl', 'cn', 'co', 'km', 'cg', 'cd', 'cr', 'ci', 'hr', 'cu', 'cy', 'cz',
  'dk', 'dj', 'dm', 'do',
  'ec', 'eg', 'sv', 'gq', 'er', 'ee', 'sz', 'et',
  'fj', 'fi', 'fr',
  'ga', 'gm', 'ge', 'de', 'gh', 'gr', 'gd', 'gt', 'gn', 'gy',
  'ht', 'hn', 'hu',
  'is', 'in', 'id', 'ir', 'iq', 'ie', 'il', 'it',
  'jm', 'jp', 'jo',
  'kz', 'ke', 'ki', 'kw', 'kg',
  'la', 'lv', 'lb', 'ls', 'lr', 'ly', 'li', 'lt', 'lu',
  'mg', 'mw', 'my', 'mv', 'ml', 'mt', 'mh', 'mr', 'mu', 'mx', 'fm', 'md', 'mc', 'mn', 'me', 'ma', 'mz', 'mm',
  'na', 'nr', 'np', 'nl', 'nz', 'ni', 'ne', 'ng', 'nu', 'mk', 'no',
  'om',
  'pw', 'ps', 'pa', 'pg', 'py', 'pe', 'ph', 'pl', 'pt',
  'qa',
  'ro', 'ru', 'rw',
  'kn', 'lc', 'vc', 'ws', 'sm', 'st', 'sa', 'sn', 'rs', 'sc', 'sl', 'sg', 'sk', 'si', 'sb', 'so', 'za', 'kr', 'ss', 'lk', 'sd', 'sr', 'se', 'ch', 'sy',
  'tw', 'tj', 'tz', 'th', 'tl', 'tg', 'to', 'tt', 'tn', 'tr', 'tm', 'tv',
  'ug', 'ua', 'ae', 'gb', 'us', 'uy', 'uz',
  'vu', 'va', 've', 'vn',
  'ye',
  'zm', 'zw',
];

export default function FlagBanner() {
  const flags = [...CODES, ...CODES];
  return (
    <div>
      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand-blue mb-6">
        One platform · Every property · Everywhere
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flag-marquee flex items-center gap-3 w-max">
          {flags.map((c, i) => (
            <img
              key={`${c}-${i}`}
              src={`https://flagcdn.com/w80/${c}.png`}
              alt={c.toUpperCase()}
              loading="lazy"
              className="w-9 h-9 rounded-full object-cover border border-brand-border bg-white shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}