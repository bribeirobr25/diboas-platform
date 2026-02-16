'use client';

import { useScrollDepthTracking } from '@/lib/analytics/useScrollDepthTracking';

export function ScrollDepthTracker() {
  useScrollDepthTracking({
    sectionSelector: '[data-section-id], section[id]',
    threshold: 0.3
  });
  return null;
}
