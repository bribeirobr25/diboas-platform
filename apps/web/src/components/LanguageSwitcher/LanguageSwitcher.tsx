/**
 * Language Switcher Component
 *
 * Domain-Driven Design: Localization domain component
 * Code Reusability: Reusable component for language switching
 * No Hardcoded Values: Uses translation keys and config
 * Accessibility: Full keyboard and screen reader support
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { SUPPORTED_LOCALES, LOCALE_CONFIG, type SupportedLocale } from '@diboas/i18n/server';
import { Globe } from 'lucide-react';
import { ChevronIcon, CheckmarkIcon } from './LanguageSwitcherIcons';
import { useLanguageSwitcher } from './useLanguageSwitcher';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'md',
  theme = 'light',
  className = ''
}: LanguageSwitcherProps) {
  const intl = useTranslation();
  const { locale: currentLocale, isHydrated } = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen, dropdownRef, toggleDropdown, switchLocale } = useLanguageSwitcher();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isHydrated) {
    return null;
  }

  const currentLanguageLabel = intl.formatMessage({
    id: `common.languageSwitcher.languages.${currentLocale}`
  });

  if (variant === 'inline') {
    return (
      <div className={`${styles.inline} ${styles[`size-${size}`]} ${className}`}>
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            className={`${styles.inlineButton} ${locale === currentLocale ? styles.active : ''}`}
            aria-current={locale === currentLocale ? 'page' : undefined}
            aria-label={intl.formatMessage({
              id: `common.languageSwitcher.languages.${locale}`
            })}
          >
            <span className={styles.flagEmoji}>{LOCALE_CONFIG[locale].flag}</span>
          </button>
        ))}
      </div>
    );
  }

  const themeClass = theme === 'dark' ? styles.themeDark : '';

  return (
    <div
      ref={dropdownRef}
      className={`${styles.dropdown} ${styles[`size-${size}`]} ${themeClass} ${className}`}
    >
      <button
        onClick={toggleDropdown}
        className={styles.dropdownButton}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={intl.formatMessage({ id: 'common.accessibility.toggleLanguage' })}
      >
        <Globe className={styles.icon} aria-hidden="true" />
        <span className={styles.currentLanguage}>{currentLanguageLabel}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu} role="menu">
          {SUPPORTED_LOCALES.map((locale) => (
            <li key={locale} role="none">
              <button
                onClick={() => switchLocale(locale)}
                className={`${styles.dropdownItem} ${locale === currentLocale ? styles.active : ''}`}
                role="menuitem"
                aria-current={locale === currentLocale ? 'page' : undefined}
              >
                {intl.formatMessage({ id: `common.languageSwitcher.languages.${locale}` })}
                {locale === currentLocale && <CheckmarkIcon />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
