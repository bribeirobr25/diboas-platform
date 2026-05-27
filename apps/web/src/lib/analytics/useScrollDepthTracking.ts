'use client';

import { useEffect, useRef } from 'react';
import { analyticsService } from './service';

interface ScrollDepthConfig {
  /** CSS selector for sections to observe */
  sectionSelector?: string;
  /** Intersection threshold (0-1) */
  threshold?: number;
  /** Only fire once per section */
  fireOnce?: boolean;
  /** Locale for impression attribution */
  locale?: string;
}

/**
 * Tracks scroll depth by observing section visibility via Intersection Observer.
 * Follows Analytics-Integration.md event naming: section_viewed
 */
export function useScrollDepthTracking(config: ScrollDepthConfig = {}) {
  const {
    sectionSelector = '[data-section-id]',
    threshold = 0.3,
    fireOnce = true,
    locale,
  } = config;
  const viewedSections = useRef<Set<string>>(new Set());
  const localeRef = useRef(locale);

  // Sync ref with latest locale in effect (not during render) for stable observer callback
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const sectionId =
            (entry.target as HTMLElement).dataset.sectionId || entry.target.id || 'unknown';

          if (fireOnce && viewedSections.current.has(sectionId)) return;
          viewedSections.current.add(sectionId);

          analyticsService.track({
            name: 'section_viewed',
            parameters: {
              section: sectionId,
              timestamp: Date.now(),
              scroll_depth: Math.round(
                ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) *
                  100
              ),
              ...(localeRef.current ? { locale: localeRef.current } : {}),
            },
          });
        });
      },
      { threshold }
    );

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll(sectionSelector);
      sections.forEach((section) => observer.observe(section));
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [sectionSelector, threshold, fireOnce]);
}
