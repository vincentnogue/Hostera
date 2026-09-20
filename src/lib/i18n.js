import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Scope note: this is deliberately NOT wired up across the whole app yet.
// Hostera is ~70 pages of internal PMS UI (staff-facing, whoever a hotel
// hires presumably works in whatever language that hotel already
// operates in) plus a handful of guest/prospect-facing pages where the
// visitor's own language genuinely matters for conversion — the booking
// flow chief among them, since that's where money changes hands. Doing a
// shallow pass across all 70 files would leave English and French
// randomly mixed everywhere, which is worse than not translating at all.
// Namespaces below are added one real, fully-translated surface at a
// time — see PublicBooking.jsx for the first one.
import bookingEn from './locales/en/booking.json';
import bookingFr from './locales/fr/booking.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { booking: bookingEn },
      fr: { booking: bookingFr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    ns: ['booking'],
    defaultNS: 'booking',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      // Guests share a device/browser across bookings on the same
      // property less often than staff do, and the language a guest
      // picks for one booking page should stick for that one visit
      // rather than silently reverting — localStorage persists it across
      // the multi-step form; querystring lets a hotel link
      // ?lng=fr directly for a French-speaking guest.
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
