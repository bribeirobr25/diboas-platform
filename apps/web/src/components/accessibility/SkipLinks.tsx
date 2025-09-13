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
          className="skip-link"
        >
          {link.text}
        </Link>
      ))}
    </div>
  );
}