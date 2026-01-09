'use client';

/**
 * Performance Monitor Hook
 *
 * Monitors component performance with comprehensive metrics
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Logger } from '../Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import { alertingService, AlertSeverity } from '../AlertingService';
import type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
  PerformanceSeverity,
  PerformanceMonitorReturn,
} from './types';
import { DEFAULT_THRESHOLDS, DEFAULT_REPORTING_INTERVAL } from './constants';

export function usePerformanceMonitor(config: PerformanceMonitorConfig): PerformanceMonitorReturn {
  const {
    sectionId,
    componentName,
    enableRealTimeMonitoring = true,
    enableMemoryMonitoring = true,
    enableCustomMetrics = true,
    thresholds = {},
    reportingInterval = DEFAULT_REPORTING_INTERVAL,
    onPerformanceIssue
  } = config;

  const renderStartTime = useRef<number>(performance.now());
  const mountTime = useRef<number>(0);
  const updateCount = useRef<number>(0);
  const customMetrics = useRef<Record<string, number>>({});
  const reportingTimer = useRef<NodeJS.Timeout | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const mergedThresholds: PerformanceThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
    customThresholds: {
      ...thresholds.customThresholds
    }
  };

  const measureMemoryUsage = useCallback((): number | undefined => {
    if (!enableMemoryMonitoring) return undefined;

    try {
      // @ts-expect-error - performance.memory is a Chrome-specific API
      if (performance.memory) {
        // @ts-expect-error - usedJSHeapSize is Chrome-specific
        return performance.memory.usedJSHeapSize;
      }
    } catch (error) {
      Logger.debug('Memory measurement not available', { error });
    }

    return undefined;
  }, [enableMemoryMonitoring]);

  const measureWebVitals = useCallback((): Partial<PerformanceMetrics> => {
    const metrics: Partial<PerformanceMetrics> = {};

    try {
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      if (fcpEntries.length > 0) {
        metrics.firstContentfulPaint = fcpEntries[0].startTime;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.largestContentfulPaint = entries[entries.length - 1].startTime;
        }
      });

      if ('observe' in observer) {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        setTimeout(() => observer.disconnect(), 1000);
      }
    } catch (error) {
      Logger.debug('Web Vitals measurement not available', { error });
    }

    return metrics;
  }, []);

  const recordMetric = useCallback((name: string, value: number) => {
    if (!enableCustomMetrics) return;

    customMetrics.current[name] = value;

    Logger.debug('Custom metric recorded', {
      sectionId,
      componentName,
      metricName: name,
      value
    });
  }, [enableCustomMetrics, sectionId, componentName]);

  const collectMetrics = useCallback((): PerformanceMetrics => {
    const now = performance.now();
    const renderTime = now - renderStartTime.current;
    const memoryUsage = measureMemoryUsage();
    const webVitals = measureWebVitals();

    return {
      renderTime,
      memoryUsage,
      jsHeapSize: memoryUsage,
      customMetrics: { ...customMetrics.current },
      timestamp: Date.now(),
      componentName,
      sectionId,
      ...webVitals
    };
  }, [sectionId, componentName, measureMemoryUsage, measureWebVitals]);

  const analyzePerformance = useCallback((metrics: PerformanceMetrics): PerformanceSeverity => {
    let worstSeverity: PerformanceSeverity = 'good';

    if (metrics.renderTime > mergedThresholds.renderTime.poor) {
      worstSeverity = 'poor';
    } else if (metrics.renderTime > mergedThresholds.renderTime.needsImprovement) {
      worstSeverity = 'needsImprovement';
    }

    if (metrics.memoryUsage) {
      if (metrics.memoryUsage > mergedThresholds.memoryUsage.poor) {
        worstSeverity = 'poor';
      } else if (metrics.memoryUsage > mergedThresholds.memoryUsage.needsImprovement && worstSeverity === 'good') {
        worstSeverity = 'needsImprovement';
      }
    }

    if (mergedThresholds.customThresholds) {
      Object.entries(metrics.customMetrics).forEach(([metricName, value]) => {
        const threshold = mergedThresholds.customThresholds?.[metricName];
        if (threshold) {
          if (value > threshold.poor) {
            worstSeverity = 'poor';
          } else if (value > threshold.needsImprovement && worstSeverity === 'good') {
            worstSeverity = 'needsImprovement';
          }
        }
      });
    }

    return worstSeverity;
  }, [mergedThresholds]);

  const reportMetrics = useCallback(() => {
    if (!isMonitoring) return;

    const metrics = collectMetrics();
    const severity = analyzePerformance(metrics);

    const logLevel = severity === 'poor' ? 'warn' : severity === 'needsImprovement' ? 'info' : 'debug';
    Logger[logLevel]('Performance metrics collected', {
      sectionId,
      componentName,
      metrics,
      severity,
      updateCount: updateCount.current
    });

    sectionEventBus.emit(SectionEventType.SECTION_PERFORMANCE_METRIC, {
      sectionId,
      sectionType: componentName,
      timestamp: Date.now(),
      metric: 'comprehensive_performance',
      value: metrics.renderTime,
      unit: 'ms'
    });

    if (severity !== 'good' && onPerformanceIssue) {
      onPerformanceIssue(metrics, severity);
    }

    if (severity === 'poor') {
      alertingService.sendPerformanceAlert(
        'Component Performance',
        metrics.renderTime,
        mergedThresholds.renderTime.poor,
        AlertSeverity.CRITICAL,
        { componentName, sectionId, allMetrics: metrics }
      );
    } else if (severity === 'needsImprovement') {
      alertingService.sendPerformanceAlert(
        'Component Performance',
        metrics.renderTime,
        mergedThresholds.renderTime.needsImprovement,
        AlertSeverity.WARNING,
        { componentName, sectionId, allMetrics: metrics }
      );
    }

    if (metrics.memoryUsage) {
      alertingService.checkPerformanceThresholds({
        memoryUsage: metrics.memoryUsage,
        renderTime: metrics.renderTime
      });
    }

    renderStartTime.current = performance.now();
  }, [isMonitoring, collectMetrics, analyzePerformance, sectionId, componentName, onPerformanceIssue, mergedThresholds]);

  const startMonitoring = useCallback(() => {
    if (!enableRealTimeMonitoring || isMonitoring) return;

    setIsMonitoring(true);
    mountTime.current = performance.now();
    reportingTimer.current = setInterval(reportMetrics, reportingInterval);

    Logger.debug('Performance monitoring started', { sectionId, componentName, reportingInterval });
  }, [enableRealTimeMonitoring, isMonitoring, reportMetrics, reportingInterval, sectionId, componentName]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    if (reportingTimer.current) {
      clearInterval(reportingTimer.current);
      reportingTimer.current = null;
    }

    reportMetrics();

    Logger.debug('Performance monitoring stopped', {
      sectionId,
      componentName,
      totalUpdateCount: updateCount.current,
      totalMountTime: performance.now() - mountTime.current
    });
  }, [isMonitoring, reportMetrics, sectionId, componentName]);

  const mark = useCallback((name: string) => {
    const timestamp = performance.now();
    recordMetric(`mark_${name}`, timestamp);

    if (performance.mark) {
      performance.mark(`${sectionId}_${componentName}_${name}`);
    }

    return timestamp;
  }, [recordMetric, sectionId, componentName]);

  const measure = useCallback((name: string, startMark: string, endMark?: string) => {
    const endTime = endMark ? customMetrics.current[`mark_${endMark}`] : performance.now();
    const startTime = customMetrics.current[`mark_${startMark}`];

    if (startTime !== undefined) {
      const duration = endTime - startTime;
      recordMetric(`measure_${name}`, duration);

      if (performance.measure) {
        try {
          performance.measure(
            `${sectionId}_${componentName}_${name}`,
            `${sectionId}_${componentName}_${startMark}`,
            endMark ? `${sectionId}_${componentName}_${endMark}` : undefined
          );
        } catch (error) {
          Logger.debug('Performance measure failed', { error, name, startMark, endMark });
        }
      }

      return duration;
    }

    return 0;
  }, [recordMetric, sectionId, componentName]);

  useEffect(() => {
    updateCount.current += 1;
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    recordMetric,
    mark,
    measure,
    isMonitoring,
    reportMetrics: () => {
      const metrics = collectMetrics();
      const severity = analyzePerformance(metrics);
      reportMetrics();
      return { metrics, severity };
    }
  };
}
