'use client';

/**
 * Language Switcher Hook
 *
 * Manages locale switching and dropdown state
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

interface UseLanguageSwitcherReturn {
  isOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  toggleDropdown: () => void;
  switchLocale: (newLocale: SupportedLocale) => void;
  handleMenuKeyDown: (event: React.KeyboardEvent) => void;
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

  // Close dropdown on escape key and return focus to trigger
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        // Return focus to the trigger button within the dropdown container
        const triggerButton = dropdownRef.current?.querySelector<HTMLElement>('button');
        triggerButton?.focus();
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

  /**
   * Keyboard navigation for dropdown menu items.
   * ArrowDown/ArrowUp: move focus between menu items
   * Home/End: jump to first/last menu item
   */
  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent) => {
    const menu = dropdownRef.current?.querySelector<HTMLElement>('[role="menu"]');
    if (!menu) return;

    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item === document.activeElement);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
        break;
      }
      case 'Home': {
        event.preventDefault();
        items[0]?.focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      }
    }
  }, []);

  return {
    isOpen,
    dropdownRef: dropdownRef as React.RefObject<HTMLDivElement>,
    toggleDropdown,
    switchLocale,
    handleMenuKeyDown,
  };
}
