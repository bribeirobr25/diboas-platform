'use client';

/**
 * Higher-Order Component for Performance Monitoring
 *
 * Wraps components with automatic performance monitoring
 */

import React from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import type { PerformanceMonitorConfig, PerformanceMonitorEnhancement } from './types';

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

    const enhancedProps = {
      ...props,
      performanceMonitor: {
        recordMetric,
        mark,
        measure
      }
    } as P & PerformanceMonitorEnhancement;

    return <WrappedComponent {...enhancedProps} />;
  };

  WrappedWithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WrappedWithPerformanceMonitoring;
}
