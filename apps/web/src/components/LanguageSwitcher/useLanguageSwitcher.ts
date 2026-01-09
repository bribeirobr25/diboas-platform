'use client';

/**
 * Language Switcher Hook
 *
 * Manages locale switching and dropdown state
 */

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

interface UseLanguageSwitcherReturn {
  isOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  toggleDropdown: () => void;
  switchLocale: (newLocale: SupportedLocale) => void;
}

export function useLanguageSwitcher(): UseLanguageSwitcherReturn {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const newPath = `/${newLocale}${segments.length > 0 ? `/${segments.join('/')}` : ''}`;

    setIsOpen(false);
    router.push(newPath);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return {
    isOpen,
    dropdownRef: dropdownRef as React.RefObject<HTMLDivElement>,
    toggleDropdown,
    switchLocale,
  };
}
