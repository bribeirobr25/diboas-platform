/**
 * Performance Budget Types
 *
 * Type definitions for performance budget system
 */

export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  category: 'loading' | 'rendering' | 'interactivity' | 'visual-stability' | 'bundle-size';
  metric: string;
  target: number;
  warning: number;
  critical: number;
  unit: 'ms' | 'bytes' | 'score' | 'percentage' | 'count';
  enabled: boolean;
  frequency: 'per-page-load' | 'hourly' | 'daily' | 'per-deployment';
}

export interface BudgetViolation {
  budgetId: string;
  timestamp: number;
  actualValue: number;
  targetValue: number;
  severity: 'warning' | 'critical';
  context: {
    page?: string;
    userAgent?: string;
    connection?: string;
    [key: string]: unknown;
  };
}

export interface PercentileStats {
  p50: number;
  p95: number;
  p99: number;
  count: number;
}

export interface BudgetReport {
  timestamp: number;
  budgets: {
    total: number;
    passed: number;
    warning: number;
    critical: number;
  };
  violations: BudgetViolation[];
  trends: {
    improving: number;
    degrading: number;
    stable: number;
  };
  percentiles: Record<string, PercentileStats>;
  recommendations: string[];
}

export interface BudgetTrends {
  improving: number;
  degrading: number;
  stable: number;
}
