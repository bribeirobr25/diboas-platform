'use client';

import Link from 'next/link';
import { useTranslation } from 'react-intl';

/**
 * Skip Links Component
 * 
 * Accessibility: WCAG 2.1 AA compliance for keyboard navigation
 * i18n: Translatable skip link text
 * UX: Improves navigation for screen reader users
 */
export function SkipLinks() {
  const { formatMessage } = useTranslation();
  
  const skipLinks = [
    {
      href: '#main-content',
      text: formatMessage({ id: 'accessibility.skipToMain' })
    },
    {
      href: '#navigation',
      text: formatMessage({ id: 'accessibility.skipToNav' })
    }
  ];

  return (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-500 text-white px-4 py-2 rounded-lg z-50 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
        >
          {link.text}
        </Link>
      ))}
    </div>
  );
}