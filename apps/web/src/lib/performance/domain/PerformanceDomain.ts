/**
 * Performance Domain Layer - Domain-Driven Design
 * 
 * Domain Services: Performance monitoring business logic
 * Service Abstraction: Clean interfaces for performance tracking
 * Monitoring & Observability: Performance metrics and alerting
 */

// Domain Entities
export interface PerformanceMetric {
  readonly name: string;
  readonly value: number;
  readonly timestamp: Date;
  readonly url: string;
  readonly userAgent?: string;
  readonly connectionType?: string;
}

export interface WebVitalMetric extends PerformanceMetric {
  readonly name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  readonly rating: 'good' | 'needs-improvement' | 'poor';
  readonly delta?: number;
}

export interface PerformanceBudget {
  readonly metric: string;
  readonly budget: number;
  readonly warning: number;
  readonly isHard: boolean; // Hard budgets fail builds, soft budgets warn
}

export interface PerformanceAlert {
  readonly id: string;
  readonly metric: string;
  readonly threshold: number;
  readonly currentValue: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly timestamp: Date;
  readonly url: string;
}

// Domain Services Interface
export interface PerformanceDomainService {
  trackWebVital(metric: WebVitalMetric): Promise<void>;
  trackCustomMetric(metric: PerformanceMetric): Promise<void>;
  validateBudgets(metrics: PerformanceMetric[]): Promise<PerformanceBudgetResult>;
  generatePerformanceReport(): Promise<PerformanceReport>;
  createAlert(metric: PerformanceMetric): Promise<PerformanceAlert | null>;
}

// Value Objects
export interface PerformanceBudgetResult {
  readonly passed: boolean;
  readonly violations: PerformanceBudgetViolation[];
  readonly warnings: PerformanceBudgetViolation[];
  readonly score: number;
}

export interface PerformanceBudgetViolation {
  readonly metric: string;
  readonly budgetValue: number;
  readonly actualValue: number;
  readonly severity: 'warning' | 'error';
  readonly message: string;
}

export interface PerformanceReport {
  readonly period: { start: Date; end: Date };
  readonly metrics: PerformanceMetric[];
  readonly webVitals: WebVitalMetric[];
  readonly budgetStatus: PerformanceBudgetResult;
  readonly trends: PerformanceTrend[];
  readonly recommendations: string[];
}

export interface PerformanceTrend {
  readonly metric: string;
  readonly trend: 'improving' | 'degrading' | 'stable';
  readonly changePercent: number;
  readonly period: string;
}

// Domain Events (Event-Driven Architecture)
export interface PerformanceEvent {
  readonly type: 'metric-tracked' | 'budget-violated' | 'alert-triggered' | 'report-generated';
  readonly timestamp: Date;
  readonly data: Record<string, unknown>;
}

// Domain Errors
export class PerformanceDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'PerformanceDomainError';
  }
}

export class PerformanceTrackingError extends PerformanceDomainError {
  constructor(message: string, public readonly metric: string) {
    super(message, 'PERFORMANCE_TRACKING_FAILED', true);
  }
}

export class PerformanceBudgetError extends PerformanceDomainError {
  constructor(message: string, public readonly violations: PerformanceBudgetViolation[]) {
    super(message, 'PERFORMANCE_BUDGET_VIOLATED', false);
  }
}