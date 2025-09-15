'use client';

import { useRouter, usePathname } from 'next/navigation';
import { SupportedLocale, SUPPORTED_LOCALES } from '@diboas/i18n';
import { useState, useRef, useEffect } from 'react';

const localeNames: Record<SupportedLocale, string> = {
  'en': 'English',
  'pt-BR': 'Português',
  'es': 'Español',
  'de': 'Deutsch'
};

const localeFlags: Record<SupportedLocale, string> = {
  'en': '🇺🇸',
  'pt-BR': '🇧🇷',
  'es': '🇪🇸',
  'de': '🇩🇪'
};

interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  variant?: 'dropdown' | 'inline';
}

export function LanguageSwitcher({ currentLocale, variant = 'dropdown' }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (newLocale: SupportedLocale) => {
    // Replace current locale in pathname with new locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    router.push(newPath);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentLocale === locale
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            aria-label={`Switch to ${localeNames[locale]}`}
          >
            {localeFlags[locale]} {locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{localeFlags[currentLocale]}</span>
        <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''} text-xs`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${currentLocale === locale ? 'bg-primary-50' : ''
                }`}
            >
              <span className="text-lg">{localeFlags[locale]}</span>
              <span className="text-sm font-medium">{localeNames[locale]}</span>
              {currentLocale === locale && (
                <span className="ml-auto text-primary-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}