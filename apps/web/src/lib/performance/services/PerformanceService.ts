/**
 * Performance Service Implementation
 * 
 * Service Agnostic Abstraction: Clean performance monitoring layer
 * Error Handling & Recovery: Resilient performance tracking
 * Monitoring & Observability: Real-time performance insights
 * Concurrency Prevention: Safe metric aggregation
 */

import {
  PerformanceDomainService,
  PerformanceMetric,
  WebVitalMetric,
  PerformanceBudget,
  PerformanceBudgetResult,
  PerformanceBudgetViolation,
  PerformanceReport,
  PerformanceAlert,
  PerformanceEvent,
  PerformanceTrackingError,
  PerformanceBudgetError,
} from '../domain/PerformanceDomain';

// Configuration Management - Performance budgets
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals budgets
  { metric: 'FCP', budget: 1800, warning: 1500, isHard: true },
  { metric: 'LCP', budget: 2500, warning: 2000, isHard: true },
  { metric: 'FID', budget: 100, warning: 80, isHard: true },
  { metric: 'CLS', budget: 0.1, warning: 0.05, isHard: true },
  { metric: 'TTFB', budget: 600, warning: 400, isHard: false },
  { metric: 'INP', budget: 200, warning: 150, isHard: false },
  
  // Custom performance budgets
  { metric: 'bundle-size', budget: 500000, warning: 400000, isHard: true }, // 500KB
  { metric: 'image-load-time', budget: 3000, warning: 2000, isHard: false },
  { metric: 'api-response-time', budget: 1000, warning: 800, isHard: false },
] as const;

// Alert thresholds configuration
const ALERT_THRESHOLDS = {
  FCP: { warning: 1800, critical: 3000 },
  LCP: { warning: 2500, critical: 4000 },
  FID: { warning: 100, critical: 300 },
  CLS: { warning: 0.1, critical: 0.25 },
  TTFB: { warning: 600, critical: 1200 },
  INP: { warning: 200, critical: 500 },
} as const;

export class PerformanceServiceImpl implements PerformanceDomainService {
  private readonly metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly eventBus: ((event: PerformanceEvent) => void)[] = [];
  private readonly budgets: PerformanceBudget[] = PERFORMANCE_BUDGETS;
  
  // Concurrency Prevention: Mutex for metric storage
  private readonly metricLock = new Set<string>();

  constructor() {
    // Initialize metric storage
    this.budgets.forEach(budget => {
      this.metrics.set(budget.metric, []);
    });
  }

  // Event-Driven Architecture: Subscribe to performance events
  public onEvent(handler: (event: PerformanceEvent) => void): void {
    this.eventBus.push(handler);
  }

  public async trackWebVital(metric: WebVitalMetric): Promise<void> {
    try {
      await this.trackMetricSafely(metric);
      
      // Check for alerts
      const alert = await this.createAlert(metric);
      if (alert) {
        this.emitEvent({
          type: 'alert-triggered',
          timestamp: new Date(),
          data: { alert, metric: metric.name }
        });
      }

      this.emitEvent({
        type: 'metric-tracked',
        timestamp: new Date(),
        data: { 
          metric: metric.name, 
          value: metric.value, 
          rating: metric.rating,
          url: metric.url 
        }
      });

    } catch (error) {
      throw new PerformanceTrackingError(
        `Failed to track Web Vital ${metric.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metric.name
      );
    }
  }

  public async trackCustomMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await this.trackMetricSafely(metric);
      
      this.emitEvent({
        type: 'metric-tracked',
        timestamp: new Date(),
        data: { metric: metric.name, value: metric.value, url: metric.url }
      });

    } catch (error) {
      throw new PerformanceTrackingError(
        `Failed to track custom metric ${metric.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metric.name
      );
    }
  }

  public async validateBudgets(metrics: PerformanceMetric[]): Promise<PerformanceBudgetResult> {
    try {
      const violations: PerformanceBudgetViolation[] = [];
      const warnings: PerformanceBudgetViolation[] = [];

      for (const metric of metrics) {
        const budget = this.budgets.find(b => b.metric === metric.name);
        if (!budget) continue;

        // Check budget violations
        if (metric.value > budget.budget) {
          violations.push({
            metric: metric.name,
            budgetValue: budget.budget,
            actualValue: metric.value,
            severity: 'error',
            message: `${metric.name} (${metric.value}) exceeds budget (${budget.budget})`
          });
        } else if (metric.value > budget.warning) {
          warnings.push({
            metric: metric.name,
            budgetValue: budget.warning,
            actualValue: metric.value,
            severity: 'warning',
            message: `${metric.name} (${metric.value}) exceeds warning threshold (${budget.warning})`
          });
        }
      }

      // Calculate score (0-100)
      const totalBudgets = this.budgets.length;
      const violatedBudgets = violations.length;
      const score = Math.max(0, Math.round(((totalBudgets - violatedBudgets) / totalBudgets) * 100));

      const result: PerformanceBudgetResult = {
        passed: violations.length === 0,
        violations,
        warnings,
        score
      };

      // Emit budget validation event
      if (violations.length > 0) {
        this.emitEvent({
          type: 'budget-violated',
          timestamp: new Date(),
          data: { violations: violations.length, warnings: warnings.length, score }
        });
      }

      return result;
    } catch (error) {
      throw new PerformanceBudgetError(
        `Budget validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        []
      );
    }
  }

  public async generatePerformanceReport(): Promise<PerformanceReport> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Collect all metrics from the last 24 hours
      const allMetrics: PerformanceMetric[] = [];
      const webVitals: WebVitalMetric[] = [];
      
      for (const [metricName, metricArray] of this.metrics.entries()) {
        const recentMetrics = metricArray.filter(m => m.timestamp >= oneDayAgo);
        allMetrics.push(...recentMetrics);
        
        // Separate Web Vitals
        if (['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'].includes(metricName)) {
          webVitals.push(...recentMetrics as WebVitalMetric[]);
        }
      }

      // Validate budgets
      const budgetStatus = await this.validateBudgets(allMetrics);

      // Generate basic recommendations
      const recommendations = this.generateRecommendations(budgetStatus, webVitals);

      const report: PerformanceReport = {
        period: { start: oneDayAgo, end: now },
        metrics: allMetrics,
        webVitals,
        budgetStatus,
        trends: [], // TODO: Implement trend analysis
        recommendations
      };

      this.emitEvent({
        type: 'report-generated',
        timestamp: new Date(),
        data: { 
          metricsCount: allMetrics.length, 
          score: budgetStatus.score,
          violations: budgetStatus.violations.length 
        }
      });

      return report;
    } catch (error) {
      throw new PerformanceTrackingError(
        `Failed to generate performance report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'report-generation'
      );
    }
  }

  public async createAlert(metric: PerformanceMetric): Promise<PerformanceAlert | null> {
    try {
      const thresholds = ALERT_THRESHOLDS[metric.name as keyof typeof ALERT_THRESHOLDS];
      if (!thresholds) return null;

      let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;

      if (metric.value >= thresholds.critical) {
        severity = 'critical';
      } else if (metric.value >= thresholds.warning) {
        severity = 'high';
      }

      if (!severity) return null;

      const alert: PerformanceAlert = {
        id: `alert-${metric.name}-${Date.now()}`,
        metric: metric.name,
        threshold: severity === 'critical' ? thresholds.critical : thresholds.warning,
        currentValue: metric.value,
        severity,
        timestamp: new Date(),
        url: metric.url
      };

      return alert;
    } catch (error) {
      console.error('Failed to create performance alert:', error);
      return null;
    }
  }

  // Private helper methods

  // Concurrency Prevention: Safe metric tracking with locking
  private async trackMetricSafely(metric: PerformanceMetric): Promise<void> {
    const lockKey = `${metric.name}-${metric.url}`;
    
    // Prevent concurrent writes to the same metric
    if (this.metricLock.has(lockKey)) {
      throw new Error(`Concurrent metric tracking detected for ${lockKey}`);
    }

    try {
      this.metricLock.add(lockKey);
      
      // Store metric
      const metricArray = this.metrics.get(metric.name) || [];
      metricArray.push(metric);
      
      // Keep only last 1000 metrics per type for memory management
      if (metricArray.length > 1000) {
        metricArray.splice(0, metricArray.length - 1000);
      }
      
      this.metrics.set(metric.name, metricArray);
      
    } finally {
      this.metricLock.delete(lockKey);
    }
  }

  private generateRecommendations(budgetStatus: PerformanceBudgetResult, webVitals: WebVitalMetric[]): string[] {
    const recommendations: string[] = [];

    if (budgetStatus.violations.length > 0) {
      recommendations.push('Performance budgets are violated. Review the failing metrics.');
    }

    // Web Vitals specific recommendations
    const poorWebVitals = webVitals.filter(wv => wv.rating === 'poor');
    if (poorWebVitals.length > 0) {
      recommendations.push('Some Core Web Vitals need improvement for better user experience.');
    }

    if (budgetStatus.score < 80) {
      recommendations.push('Overall performance score is below 80%. Consider optimization strategies.');
    }

    return recommendations;
  }

  private emitEvent(event: PerformanceEvent): void {
    this.eventBus.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Performance event handler failed:', error);
      }
    });
  }
}

// Service Factory - DRY Principle & Service Abstraction
export const createPerformanceService = (): PerformanceDomainService => {
  return new PerformanceServiceImpl();
};

// Default service instance
export const performanceService = createPerformanceService();