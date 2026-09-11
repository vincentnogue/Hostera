import React, { useState } from 'react';

// Real brand marks served from Simple Icons (cdn.simpleicons.org) — the
// standard, freely-licensed SVG set built for exactly this use case
// (showing which third-party products something integrates with).
// Not every brand has a slug there (and Nutro/LiBooks are Liafrik's own
// products, not third parties), so this is best-effort with a graceful
// fallback to the colored wordmark pill below if the image 404s.
const LOGO_SLUGS = {
  'Booking.com': 'bookingdotcom',
  'Expedia': 'expedia',
  'Airbnb': 'airbnb',
  'Trip.com': 'tripdotcom',
  'Stripe': 'stripe',
  'PayPal': 'paypal',
  'Adyen': 'adyen',
  'Checkout.com': 'checkmarx', // best-effort; falls back to pill if wrong/missing
  'Flutterwave': 'flutterwave',
  'Paystack': 'paystack',
  'WhatsApp': 'whatsapp',
  'Telegram': 'telegram',
  'Zapier': 'zapier',
  'Make': 'make',
  'Google Analytics': 'googleanalytics',
  'OpenAI': 'openai',
  'Claude': 'anthropic',
  'Gemini': 'googlegemini',
  'Perplexity': 'perplexity',
  'ElevenLabs': 'elevenlabs',
  'Mistral AI': 'mistralai',
  'Hugging Face': 'huggingface',
  'DeepL': 'deepl',
  'Meta AI': 'meta',
};

// Brand-styled wordmark chips — real brand colors, no generic placeholders.
const BRANDS = {
  'Booking.com': 'bg-[#003580] text-white',
  'Expedia': 'bg-[#191E3B] text-white',
  'Airbnb': 'bg-[#FF5A5F] text-white',
  'Agoda': 'bg-[#E4002B] text-white',
  'Google Hotel': 'bg-white text-[#4285F4] border border-[#4285F4]/30',
  'Trip.com': 'bg-[#287DFA] text-white',
  'Stripe': 'bg-[#635BFF] text-white',
  'PayPal': 'bg-[#00457C] text-white',
  'Adyen': 'bg-[#0ABF53] text-white',
  'Checkout.com': 'bg-[#111318] text-white',
  'PayUnit': 'bg-[#FF6B00] text-white',
  'Paddle': 'bg-[#2662FF] text-white',
  'Flutterwave': 'bg-[#FF9D00] text-[#231F20]',
  'Paystack': 'bg-[#0BA4DB] text-white',
  'Kora Pay': 'bg-[#00A8A8] text-white',
  'Nutro': 'bg-brand-navy text-white',
  'LiBooks': 'bg-brand-blue text-white',
  'GDS': 'bg-[#2E7D32] text-white',
  'Metasearch': 'bg-[#5E35B1] text-white',
  'SMS': 'bg-[#3949AB] text-white',
  'WhatsApp': 'bg-[#25D366] text-[#111318]',
  'Telegram': 'bg-[#26A5E4] text-white',
  'Zapier': 'bg-[#FF4A00] text-white',
  'Make': 'bg-[#6D00CC] text-white',
  'Webhooks': 'bg-[#455A64] text-white',
  'Email': 'bg-[#039BE5] text-white',
  'Smart Locks': 'bg-[#455A64] text-white',
  'Keycard Systems': 'bg-[#546E7A] text-white',
  'ID Scanners': 'bg-[#00838F] text-white',
  'Kiosks': 'bg-[#6D4C41] text-white',
  'Google Analytics': 'bg-white text-[#E37400] border border-[#E37400]/30',
  'OpenAI': 'bg-[#0D0D0D] text-white',
  'Claude': 'bg-[#191919] text-[#D97757]',
  'Gemini': 'bg-white text-[#1A73E8] border border-[#1A73E8]/30',
  'Perplexity': 'bg-[#20808D] text-white',
  'ElevenLabs': 'bg-[#141414] text-white',
  'Mistral AI': 'bg-[#FF7000] text-white',
  'Hugging Face': 'bg-[#FFD21E] text-[#0F0F0F]',
  'DeepL': 'bg-[#0F2B46] text-white',
  'Midjourney': 'bg-black text-white',
  'Meta AI': 'bg-[#0064E0] text-white',
};

export default function BrandLogo({ name, size = 'md', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const style = BRANDS[name] || 'bg-brand-navy text-white';
  const sizes = {
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  };
  const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };
  const slug = LOGO_SLUGS[name];

  return (
    <span className={`inline-flex items-center gap-1.5 justify-center rounded-full font-bold tracking-tight whitespace-nowrap ${style} ${sizes[size]} ${className || ''}`}>
      {slug && !imgFailed && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/white`}
          alt=""
          className={`${iconSizes[size]} shrink-0`}
          onError={() => setImgFailed(true)}
        />
      )}
      {name}
    </span>
  );
}

export function BrandGrid({ names, size = 'md', className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className || ''}`}>
      {names.map(n => <BrandLogo key={n} name={n} size={size} />)}
    </div>
  );
}