/**
 * Performance Thresholds Configuration
 * Configuration Management: Centralized performance monitoring thresholds
 * Code Reusability: Single source of truth for performance metrics across analytics and monitoring
 * Semantic Naming: Clear, descriptive threshold names with business context
 */

interface PerformanceThreshold {
  readonly good: number;
  readonly poor: number;
  readonly unit: string;
  readonly description: string;
}

interface WebVitalsThresholds {
  readonly FCP: PerformanceThreshold; // First Contentful Paint
  readonly LCP: PerformanceThreshold; // Largest Contentful Paint
  readonly CLS: PerformanceThreshold; // Cumulative Layout Shift
  readonly TTFB: PerformanceThreshold; // Time to First Byte
  readonly INP: PerformanceThreshold; // Interaction to Next Paint
  readonly FID: PerformanceThreshold; // First Input Delay
}

interface ApiPerformanceThresholds {
  readonly responseTime: PerformanceThreshold;
  readonly errorRate: PerformanceThreshold;
  readonly throughput: PerformanceThreshold;
  readonly availability: PerformanceThreshold;
}

interface SystemPerformanceThresholds {
  readonly memoryUsage: PerformanceThreshold;
  readonly cpuUsage: PerformanceThreshold;
  readonly diskUsage: PerformanceThreshold;
  readonly networkLatency: PerformanceThreshold;
}

/**
 * Create performance threshold with validation
 * For metrics where lower is better (latency, error rate)
 */
function createThreshold(
  good: number,
  poor: number,
  unit: string,
  description: string
): PerformanceThreshold {
  if (good >= poor) {
    throw new Error(`Good threshold (${good}) must be less than poor threshold (${poor}) for ${description}`);
  }
  
  return { good, poor, unit, description };
}

/**
 * Create performance threshold for metrics where higher is better (throughput, availability)
 */
function createReverseThreshold(
  good: number,
  poor: number,
  unit: string,
  description: string
): PerformanceThreshold {
  if (good <= poor) {
    throw new Error(`Good threshold (${good}) must be greater than poor threshold (${poor}) for ${description}`);
  }
  
  return { good, poor, unit, description };
}

/**
 * Web Vitals thresholds based on Google's Core Web Vitals
 * https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS: WebVitalsThresholds = {
  FCP: createThreshold(
    1800, 
    3000, 
    'ms', 
    'First Contentful Paint - Time until first text or image is painted'
  ),
  LCP: createThreshold(
    2500, 
    4000, 
    'ms', 
    'Largest Contentful Paint - Time until largest content element is rendered'
  ),
  CLS: createThreshold(
    0.1, 
    0.25, 
    'score', 
    'Cumulative Layout Shift - Visual stability during page load'
  ),
  TTFB: createThreshold(
    800, 
    1800, 
    'ms', 
    'Time to First Byte - Server response time'
  ),
  INP: createThreshold(
    200, 
    500, 
    'ms', 
    'Interaction to Next Paint - Responsiveness to user interactions'
  ),
  FID: createThreshold(
    100, 
    300, 
    'ms', 
    'First Input Delay - Time from first interaction to browser response'
  )
};

/**
 * API Performance thresholds for financial services
 */
export const API_PERFORMANCE_THRESHOLDS: ApiPerformanceThresholds = {
  responseTime: createThreshold(
    100, 
    500, 
    'ms', 
    'API response time for critical financial operations'
  ),
  errorRate: createThreshold(
    0.1, 
    1.0, 
    '%', 
    'API error rate percentage'
  ),
  throughput: createReverseThreshold(
    1000, 
    100, 
    'req/s', 
    'API requests per second capacity'
  ),
  availability: createReverseThreshold(
    99.9, 
    99.0, 
    '%', 
    'API uptime percentage'
  )
};

/**
 * System performance thresholds
 */
export const SYSTEM_PERFORMANCE_THRESHOLDS: SystemPerformanceThresholds = {
  memoryUsage: createThreshold(
    70, 
    90, 
    '%', 
    'System memory utilization percentage'
  ),
  cpuUsage: createThreshold(
    60, 
    85, 
    '%', 
    'System CPU utilization percentage'
  ),
  diskUsage: createThreshold(
    75, 
    90, 
    '%', 
    'Disk space utilization percentage'
  ),
  networkLatency: createThreshold(
    50, 
    200, 
    'ms', 
    'Network round-trip latency'
  )
};

/**
 * Performance budget for bundle sizes
 */
export const BUNDLE_SIZE_THRESHOLDS = {
  javascript: createThreshold(
    250, 
    500, 
    'KB', 
    'JavaScript bundle size'
  ),
  css: createThreshold(
    50, 
    100, 
    'KB', 
    'CSS bundle size'
  ),
  images: createThreshold(
    500, 
    1000, 
    'KB', 
    'Total image size per page'
  ),
  fonts: createThreshold(
    100, 
    200, 
    'KB', 
    'Font files total size'
  )
} as const;

/**
 * Business-specific performance thresholds
 */
export const BUSINESS_PERFORMANCE_THRESHOLDS = {
  transactionProcessing: createThreshold(
    2000, 
    5000, 
    'ms', 
    'Financial transaction processing time'
  ),
  portfolioCalculation: createThreshold(
    1000, 
    3000, 
    'ms', 
    'Portfolio value calculation time'
  ),
  authenticationTime: createThreshold(
    500, 
    2000, 
    'ms', 
    'User authentication response time'
  ),
  dataSync: createThreshold(
    5000, 
    15000, 
    'ms', 
    'Financial data synchronization time'
  )
} as const;

/**
 * Helper functions for threshold evaluation
 */
export function evaluatePerformance(
  value: number, 
  threshold: PerformanceThreshold
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function getThresholdDescription(threshold: PerformanceThreshold): string {
  return `${threshold.description} (Good: ≤${threshold.good}${threshold.unit}, Poor: >${threshold.poor}${threshold.unit})`;
}

/**
 * Export all thresholds for monitoring dashboard
 */
export const ALL_PERFORMANCE_THRESHOLDS = {
  webVitals: WEB_VITALS_THRESHOLDS,
  api: API_PERFORMANCE_THRESHOLDS,
  system: SYSTEM_PERFORMANCE_THRESHOLDS,
  bundleSize: BUNDLE_SIZE_THRESHOLDS,
  business: BUSINESS_PERFORMANCE_THRESHOLDS
} as const;

// Export legacy PERFORMANCE_THRESHOLDS for backward compatibility
export const PERFORMANCE_THRESHOLDS = WEB_VITALS_THRESHOLDS;

// Export types for external usage
export type { 
  PerformanceThreshold, 
  WebVitalsThresholds, 
  ApiPerformanceThresholds, 
  SystemPerformanceThresholds 
};