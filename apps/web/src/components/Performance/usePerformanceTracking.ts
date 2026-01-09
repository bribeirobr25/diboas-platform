'use client';

/**
 * Performance Tracking Hook
 *
 * Custom hook for manual performance tracking
 */

import { usePathname } from 'next/navigation';
import { performanceService } from '@/lib/performance/services/PerformanceService';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * Hook for manual performance tracking
 */
export function usePerformanceTracking() {
  const pathname = usePathname();

  const trackCustomMetric = async (name: string, value: number) => {
    try {
      await performanceService.trackCustomMetric({
        name,
        value,
        timestamp: new Date(),
        url: pathname,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      Logger.error('Failed to track custom metric', { name }, error instanceof Error ? error : undefined);
    }
  };

  const trackTiming = (name: string, startTime: number) => {
    const duration = performance.now() - startTime;
    trackCustomMetric(name, duration);
  };

  return {
    trackCustomMetric,
    trackTiming,
  };
}
