'use client';

import { useScrollDepthTracking } from '@/lib/analytics/useScrollDepthTracking';
import { useLocale } from '@/components/Providers';

export function ScrollDepthTracker() {
  const { locale } = useLocale();
  useScrollDepthTracking({
    sectionSelector: '[data-section-id], section[id]',
    threshold: 0.3,
    locale,
  });
  return null;
}
