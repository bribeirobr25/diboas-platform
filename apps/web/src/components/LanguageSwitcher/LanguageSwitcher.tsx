/**
 * Language Switcher Component
 *
 * Domain-Driven Design: Localization domain component
 * Code Reusability: Reusable component for language switching
 * No Hardcoded Values: Uses translation keys and config
 * Accessibility: Full keyboard and screen reader support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { SUPPORTED_LOCALES, LOCALE_CONFIG, type SupportedLocale } from '@diboas/i18n/server';
import { Globe } from 'lucide-react';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  /**
   * Display mode: 'dropdown' or 'inline'
   */
  variant?: 'dropdown' | 'inline';
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Theme variant for different backgrounds
   */
  theme?: 'light' | 'dark';
  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * LanguageSwitcher Component
 * Allows users to switch between supported locales
 */
export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'md',
  theme = 'light',
  className = ''
}: LanguageSwitcherProps) {
  const intl = useTranslation();
  const { locale: currentLocale, isHydrated } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  const switchLocale = (newLocale: SupportedLocale) => {
    // Persist locale preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    // Remove current locale from pathname and add new locale
    const segments = pathname.split('/').filter(Boolean);

    // Remove current locale if it exists in the path
    if (SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
      segments.shift();
    }

    // Build new path with new locale
    const newPath = `/${newLocale}${segments.length > 0 ? '/' + segments.join('/') : ''}`;

    setIsOpen(false);
    router.push(newPath);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Prevent hydration mismatch - don't render until mounted and hydrated
  if (!isMounted || !isHydrated) {
    return null;
  }

  // Get current language label
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

  // Dropdown variant
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
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
                {locale === currentLocale && (
                  <svg
                    className={styles.checkmark}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M16.25 5L7.5 14.375L3.75 10.625"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
