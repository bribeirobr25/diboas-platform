/**
 * Performance Monitor Utilities
 *
 * Utility functions for performance monitoring
 */

import type { PerformanceThresholds, PerformanceSummary } from './performanceTypes';
import { Logger } from './Logger';

/**
 * Extract section name from resource URL
 */
export function extractSectionName(url: string): string {
  const match = url.match(/\/sections\/([^/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Get performance threshold for metric type
 */
export function getThreshold(
  type: string,
  thresholds: PerformanceThresholds
): { good: number; needs_improvement: number } | null {
  const thresholdsRecord = thresholds as unknown as Record<string, { good: number; needs_improvement: number } | undefined>;
  return thresholdsRecord[type] || null;
}

/**
 * Get performance rating based on thresholds
 */
export function getRating(
  value: number,
  threshold: { good: number; needs_improvement: number } | null
): string {
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needs_improvement) return 'needs_improvement';
  return 'poor';
}

/**
 * Get or generate session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}`;
  }

  let sessionId = sessionStorage.getItem('perf-session-id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('perf-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Get current performance summary
 */
export function getPerformanceSummary(): PerformanceSummary | null {
  if (typeof window === 'undefined') return null;

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.startTime : null,
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
      timestamp: Date.now(),
      page: window.location.pathname
    };

  } catch (error) {
    Logger.warn('Failed to get performance summary', { error });
    return null;
  }
}

/**
 * Check if performance monitoring should be initialized
 */
export function shouldInitializeMonitoring(
  enabled: boolean,
  sampleRate: number
): boolean {
  if (!enabled) return false;
  if (typeof window === 'undefined') return false;
  if (!('performance' in window)) return false;

  // Respect sampling rate
  return Math.random() < sampleRate;
}
