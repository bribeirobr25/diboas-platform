'use client';

/**
 * Performance Monitor Component
 *
 * Declarative component for performance monitoring
 */

import React from 'react';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import type { PerformanceMonitorConfig } from './types';

interface PerformanceMonitorProps extends PerformanceMonitorConfig {
  children: React.ReactNode;
}

export function PerformanceMonitorComponent({ children, ...config }: PerformanceMonitorProps) {
  usePerformanceMonitor(config);

  return <>{children}</>;
}
