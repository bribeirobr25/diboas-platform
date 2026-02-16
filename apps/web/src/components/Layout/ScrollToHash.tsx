'use client';

import { useEffect } from 'react';

/**
 * ScrollToHash
 *
 * Client component that handles hash-based scrolling on soft navigation.
 * Next.js App Router doesn't always trigger native hash scroll on
 * client-side navigation, so this reads window.location.hash on mount
 * and scrolls to the target element.
 */
export function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.slice(1);
    const timeout = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', window.location.pathname);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
