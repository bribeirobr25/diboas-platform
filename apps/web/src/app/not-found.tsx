'use client';

/**
 * Root 404 Not Found Page
 * i18n: Client-side language detection with fallback defaults
 * User Experience: Graceful handling of non-existent routes
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@diboas/ui';

interface NotFoundTranslations {
  title: string;
  message: string;
  goHome: string;
}

const TRANSLATIONS: Record<string, NotFoundTranslations> = {
  en: {
    title: 'Page Not Found',
    message: "Sorry, we couldn't find the page you're looking for.",
    goHome: 'Go to Homepage',
  },
  de: {
    title: 'Seite nicht gefunden',
    message: 'Entschuldigung, wir konnten die gesuchte Seite nicht finden.',
    goHome: 'Zur Startseite',
  },
  'pt-BR': {
    title: 'Página não encontrada',
    message: 'Desculpe, não conseguimos encontrar a página que você está procurando.',
    goHome: 'Ir para a página inicial',
  },
  es: {
    title: 'Página no encontrada',
    message: 'Lo sentimos, no pudimos encontrar la página que buscas.',
    goHome: 'Ir a la página principal',
  },
};

const DEFAULT_TRANSLATIONS = TRANSLATIONS.en;

/**
 * Detect user's preferred language from browser settings
 */
function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Check for exact match first
  if (TRANSLATIONS[browserLang]) {
    return browserLang;
  }

  // Check for language code match (e.g., 'pt' matches 'pt-BR')
  const langCode = browserLang?.split('-')[0];
  const matchingLocale = Object.keys(TRANSLATIONS).find(
    (locale) => locale.startsWith(langCode) || locale === langCode
  );

  return matchingLocale || 'en';
}

export default function NotFound() {
  const [locale, setLocale] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocale(detectLanguage());
    setMounted(true);
  }, []);

  const t = TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS;

  // Prevent hydration mismatch by showing nothing until mounted
  if (!mounted) {
    return (
      <div className="error-page-container">
        <div className="error-page-content">
          <h1 className="error-page-title">404</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <h1 className="error-page-title">404</h1>
        <h2 className="error-page-subtitle">{t.title}</h2>
        <p className="error-page-description">{t.message}</p>
        <div className="error-page-actions">
          <Link href={`/${locale}`}>
            <Button variant="primary" size="default">
              {t.goHome}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
