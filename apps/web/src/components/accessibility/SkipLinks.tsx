'use client';

import Link from 'next/link';
import { Button } from '@diboas/ui';

/**
 * Skip Links Component
 * 
 * Accessibility: WCAG 2.1 AA compliance for keyboard navigation
 * UX: Improves navigation for screen reader users
 */
export function SkipLinks() {
  const skipLinks = [
    {
      href: '#main-content',
      text: 'Skip to main content'
    },
    {
      href: '#navigation',
      text: 'Skip to navigation'
    }
  ];

  return (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <Link 
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          {link.text}
        </Link>
      ))}
    </div>
  );
}