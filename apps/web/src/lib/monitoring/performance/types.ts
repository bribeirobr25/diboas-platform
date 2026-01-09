/**
 * Performance Monitor - Types
 *
 * Type definitions for performance monitoring
 */

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
export interface PerformanceThresholds {
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
export interface PerformanceMonitorConfig {
  sectionId: string;
  componentName: string;
  enableRealTimeMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableCustomMetrics?: boolean;
  thresholds?: Partial<PerformanceThresholds>;
  reportingInterval?: number; // milliseconds
  onPerformanceIssue?: (metrics: PerformanceMetrics, severity: PerformanceSeverity) => void;
}

/**
 * Performance severity levels
 */
export type PerformanceSeverity = 'good' | 'needsImprovement' | 'poor';

/**
 * Performance monitor return type
 */
export interface PerformanceMonitorReturn {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordMetric: (name: string, value: number) => void;
  mark: (name: string) => number;
  measure: (name: string, startMark: string, endMark?: string) => number;
  isMonitoring: boolean;
  reportMetrics: () => { metrics: PerformanceMetrics; severity: PerformanceSeverity };
}

/**
 * Performance monitor props for enhanced components
 */
export interface PerformanceMonitorEnhancement {
  performanceMonitor: {
    recordMetric: (name: string, value: number) => void;
    mark: (name: string) => number;
    measure: (name: string, startMark: string, endMark?: string) => number;
  };
}
