/**
 * Production Performance Monitoring Service
 *
 * Domain-Driven Design: Performance monitoring aligned with business metrics
 * Service Agnostic Abstraction: Works with any analytics provider
 * Performance & SEO Optimization: Non-blocking performance tracking
 * Error Handling & System Recovery: Graceful degradation when monitoring fails
 * Monitoring & Observability: Comprehensive performance insights
 * No Hard coded values: All thresholds configurable
 */

import { Logger } from './Logger';

// Import types
import type {
  PerformanceConfig,
  BufferedMetric,
  PerformanceSummary
} from './performanceTypes';

// Import configuration
import { createPerformanceConfig } from './performanceConfig';

// Import observers
import {
  setupCoreWebVitalsObserver,
  setupLayoutShiftObserver,
  setupNavigationObserver,
  setupResourceObserver,
  disconnectObservers,
  type ObserverMap
} from './performanceObservers';

// Import utilities
import {
  extractSectionName,
  getThreshold,
  getRating,
  getSessionId,
  getPerformanceSummary as getPerformanceSummaryUtil,
  shouldInitializeMonitoring
} from './performanceUtils';

// Re-export for backwards compatibility
export type {
  PerformanceMetrics,
  BufferedMetric,
  PerformanceThresholds,
  PerformanceConfig,
  PerformanceSummary
} from './performanceTypes';
export { DEFAULT_PERFORMANCE_THRESHOLDS, DEFAULT_PERFORMANCE_CONFIG } from './performanceConfig';

/**
 * Production Performance Monitor
 *
 * Provides comprehensive performance monitoring for production environments
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metricsBuffer: BufferedMetric[] = [];
  private observers: ObserverMap = {};
  private startTime = performance.now();
  private isEnabled = false;

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = createPerformanceConfig(config);

    if (shouldInitializeMonitoring(this.config.enabled, this.config.sampleRate)) {
      this.initialize();
    }
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    try {
      this.isEnabled = true;

      // Bind recordMetric for use in observers
      const recordMetric = this.recordMetric.bind(this);

      // Setup observers
      setupCoreWebVitalsObserver(this.observers, recordMetric);
      setupLayoutShiftObserver(this.observers, recordMetric);
      setupNavigationObserver(this.observers, recordMetric);
      setupResourceObserver(
        this.observers,
        recordMetric,
        this.recordBundleMetrics.bind(this),
        this.recordSectionLoadMetrics.bind(this)
      );

      this.setupPeriodicFlush();

      Logger.info('Performance monitoring initialized', {
        sampleRate: this.config.sampleRate,
        thresholds: this.config.thresholds
      });

    } catch (error) {
      Logger.error('Failed to initialize performance monitoring', { error });
      this.isEnabled = false;
    }
  }

  /**
   * Record individual performance metric
   */
  private recordMetric(
    type: string,
    value: number,
    context: Record<string, unknown> = {}
  ): void {
    try {
      const threshold = getThreshold(type, this.config.thresholds);
      const rating = getRating(value, threshold);

      Logger.info('Performance metric recorded', {
        type,
        value: Math.round(value),
        rating,
        context,
        timestamp: Date.now()
      });

      // Add to analytics buffer if endpoint configured
      if (this.config.endpoint) {
        this.bufferMetric({
          type,
          value,
          rating,
          context,
          timestamp: Date.now(),
          page: window.location.pathname
        });
      }

    } catch (error) {
      Logger.warn('Failed to record metric', { error, type, value });
    }
  }

  /**
   * Record bundle metrics from resource timing
   */
  private recordBundleMetrics(entry: PerformanceResourceTiming): void {
    const bundleSize = entry.transferSize || 0;
    const loadTime = entry.responseEnd - entry.startTime;

    this.recordMetric('bundleSize', bundleSize, {
      url: entry.name,
      type: 'bundle'
    });

    this.recordMetric('bundleLoadTime', loadTime, {
      url: entry.name,
      size: bundleSize
    });
  }

  /**
   * Record section load metrics
   */
  private recordSectionLoadMetrics(entry: PerformanceResourceTiming): void {
    const sectionName = extractSectionName(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;

    this.recordMetric('sectionLoadTime', loadTime, {
      section: sectionName,
      url: entry.name
    });
  }

  /**
   * Buffer metric for batched sending
   */
  private bufferMetric(metric: BufferedMetric): void {
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flushMetrics();
    }

    this.metricsBuffer.push(metric);
  }

  /**
   * Setup periodic metric flushing
   */
  private setupPeriodicFlush(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics();
      }
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  /**
   * Flush buffered metrics to analytics endpoint
   */
  private async flushMetrics(): Promise<void> {
    if (!this.config.endpoint || this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer.length = 0; // Clear buffer

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          session: getSessionId(),
          timestamp: Date.now()
        }),
        keepalive: true // Ensure delivery on page unload
      });

      Logger.info('Performance metrics flushed', { count: metrics.length });

    } catch (error) {
      Logger.warn('Failed to flush performance metrics', { error });
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }

  // Public API

  /**
   * Record custom performance metric
   */
  public recordCustomMetric(name: string, value: number, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    this.recordMetric(`custom_${name}`, value, context);
  }

  /**
   * Record section render time
   */
  public recordSectionRenderTime(sectionName: string, renderTime: number): void {
    if (!this.isEnabled) return;

    this.recordMetric('sectionRenderTime', renderTime, {
      section: sectionName
    });
  }

  /**
   * Record theme switch performance
   */
  public recordThemeSwitch(switchTime: number, fromTheme: string, toTheme: string): void {
    if (!this.isEnabled) return;

    this.recordMetric('themeSwitchTime', switchTime, {
      fromTheme,
      toTheme
    });
  }

  /**
   * Get current performance summary
   */
  public getPerformanceSummary(): PerformanceSummary | null {
    if (!this.isEnabled) return null;
    return getPerformanceSummaryUtil();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };

    if (!this.config.enabled && this.isEnabled) {
      this.destroy();
    } else if (this.config.enabled && !this.isEnabled && shouldInitializeMonitoring(this.config.enabled, this.config.sampleRate)) {
      this.initialize();
    }
  }

  /**
   * Check if monitoring is enabled
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    try {
      // Flush remaining metrics
      this.flushMetrics();

      // Disconnect observers
      disconnectObservers(this.observers);

      this.observers = {};
      this.isEnabled = false;

      Logger.info('Performance monitoring destroyed');

    } catch (error) {
      Logger.error('Failed to destroy performance monitor', { error });
    }
  }
}

// Export singleton instance for service agnostic access
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const recordCustomMetric = (name: string, value: number, context?: Record<string, unknown>) => {
    performanceMonitor.recordCustomMetric(name, value, context);
  };

  const recordSectionRenderTime = (sectionName: string, renderTime: number) => {
    performanceMonitor.recordSectionRenderTime(sectionName, renderTime);
  };

  const getPerformanceSummary = () => {
    return performanceMonitor.getPerformanceSummary();
  };

  return {
    recordCustomMetric,
    recordSectionRenderTime,
    getPerformanceSummary,
    isEnabled: performanceMonitor.isMonitoringEnabled()
  };
}
