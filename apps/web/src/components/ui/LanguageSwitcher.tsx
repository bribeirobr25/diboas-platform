'use client';

import { useRouter, usePathname } from 'next/navigation';
import { SupportedLocale, SUPPORTED_LOCALES } from '@diboas/i18n/server';
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
      <div className="language-switcher-inline-container">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`language-switcher-button-base ${currentLocale === locale
                ? 'language-switcher-button-active'
                : 'language-switcher-button-inactive'
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
    <div className="language-switcher-dropdown-container" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-switcher-trigger"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="language-switcher-flag">{localeFlags[currentLocale]}</span>
        <span className="language-switcher-label">{localeNames[currentLocale]}</span>
        <span className={`language-switcher-chevron ${isOpen ? 'language-switcher-chevron-open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="language-switcher-dropdown-menu">
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLocale(locale)}
              className={`language-switcher-option ${currentLocale === locale ? 'language-switcher-option-active' : ''
                }`}
            >
              <span className="language-switcher-option-flag">{localeFlags[locale]}</span>
              <span className="language-switcher-option-label">{localeNames[locale]}</span>
              {currentLocale === locale && (
                <span className="language-switcher-checkmark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}