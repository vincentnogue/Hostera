import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGS = ['en', 'fr'];

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation('booking');
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <Globe className="w-3.5 h-3.5 opacity-60" />
      {LANGS.map((lng, i) => (
        <React.Fragment key={lng}>
          {i > 0 && <span className="opacity-30">·</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            className={`px-1 ${i18n.resolvedLanguage === lng ? 'font-semibold underline' : 'opacity-60 hover:opacity-100'}`}
          >
            {t(`language.${lng}`)}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
