/**
 * Component Performance Monitor
 * 
 * Performance & SEO Optimization: Comprehensive performance tracking
 * Monitoring & Observability: Real-time performance metrics and alerts
 * Domain-Driven Design: Section-specific performance monitoring
 * Service Agnostic Abstraction: Reusable performance monitoring across components
 * Product KPIs & Analytics: Performance metrics for business insights
 * No Hard Coded Values: Configurable performance thresholds
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Logger } from './Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import { alertingService, AlertSeverity } from './AlertingService';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Timing metrics
  renderTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  
  // Resource metrics
  memoryUsage?: number;
  jsHeapSize?: number;
  
  // Custom metrics
  customMetrics: Record<string, number>;
  
  // Context
  timestamp: number;
  componentName: string;
  sectionId: string;
}

/**
 * Performance thresholds configuration
 */
interface PerformanceThresholds {
  renderTime: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  memoryUsage: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  customThresholds?: Record<string, {
    good: number;
    needsImprovement: number;
    poor: number;
  }>;
}

/**
 * Performance monitoring configuration
 */
interface PerformanceMonitorConfig {
  sectionId: string;
  componentName: string;
  enableRealTimeMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableCustomMetrics?: boolean;
  thresholds?: Partial<PerformanceThresholds>;
  reportingInterval?: number; // milliseconds
  onPerformanceIssue?: (metrics: PerformanceMetrics, severity: 'good' | 'needsImprovement' | 'poor') => void;
}

/**
 * Default performance thresholds based on web vitals
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: {
    good: 100, // 100ms
    needsImprovement: 300, // 300ms
    poor: 500 // 500ms
  },
  memoryUsage: {
    good: 50 * 1024 * 1024, // 50MB
    needsImprovement: 100 * 1024 * 1024, // 100MB
    poor: 200 * 1024 * 1024 // 200MB
  }
};

/**
 * Performance Monitor Hook
 * Monitors component performance with comprehensive metrics
 */
export function usePerformanceMonitor(config: PerformanceMonitorConfig) {
  const {
    sectionId,
    componentName,
    enableRealTimeMonitoring = true,
    enableMemoryMonitoring = true,
    enableCustomMetrics = true,
    thresholds = {},
    reportingInterval = 5000, // 5 seconds
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

  /**
   * Measure memory usage if available
   */
  const measureMemoryUsage = useCallback((): number | undefined => {
    if (!enableMemoryMonitoring) return undefined;
    
    try {
      // @ts-ignore - performance.memory is not in all TypeScript definitions
      if (performance.memory) {
        // @ts-ignore
        return performance.memory.usedJSHeapSize;
      }
    } catch (error) {
      Logger.debug('Memory measurement not available', { error });
    }
    
    return undefined;
  }, [enableMemoryMonitoring]);

  /**
   * Measure Web Vitals if available
   */
  const measureWebVitals = useCallback((): Partial<PerformanceMetrics> => {
    const metrics: Partial<PerformanceMetrics> = {};
    
    try {
      // First Contentful Paint
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      if (fcpEntries.length > 0) {
        metrics.firstContentfulPaint = fcpEntries[0].startTime;
      }

      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.largestContentfulPaint = entries[entries.length - 1].startTime;
        }
      });
      
      if ('observe' in observer) {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Clean up observer after a short delay
        setTimeout(() => {
          observer.disconnect();
        }, 1000);
      }
    } catch (error) {
      Logger.debug('Web Vitals measurement not available', { error });
    }
    
    return metrics;
  }, []);

  /**
   * Record custom metric
   */
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

  /**
   * Collect all performance metrics
   */
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const now = performance.now();
    const renderTime = now - renderStartTime.current;
    const memoryUsage = measureMemoryUsage();
    const webVitals = measureWebVitals();

    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      jsHeapSize: memoryUsage,
      customMetrics: { ...customMetrics.current },
      timestamp: Date.now(),
      componentName,
      sectionId,
      ...webVitals
    };

    return metrics;
  }, [sectionId, componentName, measureMemoryUsage, measureWebVitals]);

  /**
   * Analyze performance metrics and determine severity
   */
  const analyzePerformance = useCallback((metrics: PerformanceMetrics): 'good' | 'needsImprovement' | 'poor' => {
    let worstSeverity: 'good' | 'needsImprovement' | 'poor' = 'good';

    // Check render time
    if (metrics.renderTime > mergedThresholds.renderTime.poor) {
      worstSeverity = 'poor';
    } else if (metrics.renderTime > mergedThresholds.renderTime.needsImprovement) {
      worstSeverity = 'needsImprovement';
    }

    // Check memory usage
    if (metrics.memoryUsage) {
      if (metrics.memoryUsage > mergedThresholds.memoryUsage.poor) {
        worstSeverity = 'poor';
      } else if (metrics.memoryUsage > mergedThresholds.memoryUsage.needsImprovement && worstSeverity === 'good') {
        worstSeverity = 'needsImprovement';
      }
    }

    // Check custom metrics
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

  /**
   * Report performance metrics
   */
  const reportMetrics = useCallback(() => {
    if (!isMonitoring) return;

    const metrics = collectMetrics();
    const severity = analyzePerformance(metrics);

    // Log metrics
    const logLevel = severity === 'poor' ? 'warn' : severity === 'needsImprovement' ? 'info' : 'debug';
    Logger[logLevel]('Performance metrics collected', {
      sectionId,
      componentName,
      metrics,
      severity,
      updateCount: updateCount.current
    });

    // Emit performance event
    sectionEventBus.emit(SectionEventType.SECTION_PERFORMANCE_METRIC, {
      sectionId,
      sectionType: componentName,
      timestamp: Date.now(),
      metric: 'comprehensive_performance',
      value: metrics.renderTime,
      unit: 'ms'
    });

    // Call custom performance issue handler
    if (severity !== 'good' && onPerformanceIssue) {
      onPerformanceIssue(metrics, severity);
    }

    // Send alerts for performance issues
    if (severity === 'poor') {
      alertingService.sendPerformanceAlert(
        'Component Performance',
        metrics.renderTime,
        mergedThresholds.renderTime.poor,
        AlertSeverity.CRITICAL,
        {
          componentName,
          sectionId,
          allMetrics: metrics
        }
      );
    } else if (severity === 'needsImprovement') {
      alertingService.sendPerformanceAlert(
        'Component Performance',
        metrics.renderTime,
        mergedThresholds.renderTime.needsImprovement,
        AlertSeverity.WARNING,
        {
          componentName,
          sectionId,
          allMetrics: metrics
        }
      );
    }

    // Check memory usage alerts
    if (metrics.memoryUsage) {
      alertingService.checkPerformanceThresholds({
        memoryUsage: metrics.memoryUsage,
        renderTime: metrics.renderTime
      });
    }

    // Reset render start time for next measurement
    renderStartTime.current = performance.now();
  }, [isMonitoring, collectMetrics, analyzePerformance, sectionId, componentName, onPerformanceIssue]);

  /**
   * Start real-time monitoring
   */
  const startMonitoring = useCallback(() => {
    if (!enableRealTimeMonitoring || isMonitoring) return;

    setIsMonitoring(true);
    mountTime.current = performance.now();

    // Set up periodic reporting
    reportingTimer.current = setInterval(reportMetrics, reportingInterval);

    Logger.debug('Performance monitoring started', {
      sectionId,
      componentName,
      reportingInterval
    });
  }, [enableRealTimeMonitoring, isMonitoring, reportMetrics, reportingInterval, sectionId, componentName]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    if (reportingTimer.current) {
      clearInterval(reportingTimer.current);
      reportingTimer.current = null;
    }

    // Final report
    reportMetrics();

    Logger.debug('Performance monitoring stopped', {
      sectionId,
      componentName,
      totalUpdateCount: updateCount.current,
      totalMountTime: performance.now() - mountTime.current
    });
  }, [isMonitoring, reportMetrics, sectionId, componentName]);

  /**
   * Mark performance point for custom measurements
   */
  const mark = useCallback((name: string) => {
    const timestamp = performance.now();
    recordMetric(`mark_${name}`, timestamp);
    
    if (performance.mark) {
      performance.mark(`${sectionId}_${componentName}_${name}`);
    }
    
    return timestamp;
  }, [recordMetric, sectionId, componentName]);

  /**
   * Measure time between two marks
   */
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

  // Component lifecycle hooks
  useEffect(() => {
    updateCount.current += 1;
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    // Control methods
    startMonitoring,
    stopMonitoring,
    
    // Measurement methods
    recordMetric,
    mark,
    measure,
    
    // Status
    isMonitoring,
    
    // Manual reporting
    reportMetrics: () => {
      const metrics = collectMetrics();
      const severity = analyzePerformance(metrics);
      reportMetrics();
      return { metrics, severity };
    }
  };
}

/**
 * Higher-Order Component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: Omit<PerformanceMonitorConfig, 'componentName'>
) {
  const WrappedWithPerformanceMonitoring = (props: P) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    const { recordMetric, mark, measure } = usePerformanceMonitor({
      ...config,
      componentName
    });

    // Add performance monitoring props
    const enhancedProps = {
      ...props,
      performanceMonitor: {
        recordMetric,
        mark,
        measure
      }
    } as P & {
      performanceMonitor: {
        recordMetric: (name: string, value: number) => void;
        mark: (name: string) => number;
        measure: (name: string, startMark: string, endMark?: string) => number;
      };
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  WrappedWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WrappedWithPerformanceMonitoring;
}

/**
 * Performance Monitor Component for declarative monitoring
 */
interface PerformanceMonitorProps extends PerformanceMonitorConfig {
  children: React.ReactNode;
}

export function PerformanceMonitor({ children, ...config }: PerformanceMonitorProps) {
  usePerformanceMonitor(config);
  
  return <>{children}</>;
}