/**
 * Performance Budget Monitor
 *
 * Evaluates measured performance metrics against defined budgets,
 * tracks violations, and generates reports. Metric collection is
 * delegated to metricCollectors.ts for separation of concerns.
 */

import { Logger } from '@/lib/monitoring/Logger';
import { alertingService, AlertSeverity, AlertCategory } from '@/lib/monitoring/AlertingService';

import type { PerformanceBudget, BudgetViolation, BudgetReport } from './budgetTypes';
import { PERFORMANCE_BUDGETS } from './budgetDefinitions';
import {
  analyzeTrends,
  generateRecommendations,
  formatValue,
  determineSeverity,
  calculateExceedance,
  computePercentiles,
} from './budgetAnalysis';
import { setupWebVitalsCollector, setupCustomMetricCollectors } from './metricCollectors';

// Re-export for backwards compatibility
export type { PerformanceBudget, BudgetViolation, BudgetReport, BudgetTrends } from './budgetTypes';
export { PERFORMANCE_BUDGETS, getBudgetById, getEnabledBudgets, getBudgetsByCategory, getBudgetsByFrequency } from './budgetDefinitions';
export { analyzeTrends, generateRecommendations, formatValue, formatBytes, calculateExceedance, determineSeverity, computePercentiles } from './budgetAnalysis';

/**
 * Performance Budget Monitor
 *
 * Responsible for:
 * - Evaluating measurements against budget thresholds
 * - Tracking violations and history
 * - Periodic aggregation (hourly/daily)
 * - Generating budget reports
 */
export class PerformanceBudgetMonitor {
  private violations: BudgetViolation[] = [];
  private budgetHistory: Map<string, number[]> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;

    // Delegate metric collection to dedicated collectors
    const onMeasurement = this.checkBudget.bind(this);
    setupWebVitalsCollector(onMeasurement);
    setupCustomMetricCollectors(onMeasurement);

    // Set up periodic aggregation
    this.setupPeriodicChecks();

    Logger.info('Performance budget monitoring initialized', {
      budgetCount: PERFORMANCE_BUDGETS.length,
      enabledBudgets: PERFORMANCE_BUDGETS.filter((b) => b.enabled).length,
    });
  }

  private setupPeriodicChecks(): void {
    setInterval(() => this.performHourlyChecks(), 60 * 60 * 1000);
    setInterval(() => this.performDailyChecks(), 24 * 60 * 60 * 1000);
  }

  private performHourlyChecks(): void {
    PERFORMANCE_BUDGETS
      .filter((b) => b.enabled && b.frequency === 'hourly')
      .forEach((budget) => this.checkAveragePerformance(budget));
  }

  private performDailyChecks(): void {
    PERFORMANCE_BUDGETS
      .filter((b) => b.enabled && b.frequency === 'daily')
      .forEach((budget) => this.generateDailyReport(budget));
  }

  // ---------------------------------------------------------------------------
  // Budget evaluation
  // ---------------------------------------------------------------------------

  checkBudget(budget: PerformanceBudget, value: number, context: Record<string, unknown> = {}): void {
    // Store historical data
    if (!this.budgetHistory.has(budget.id)) {
      this.budgetHistory.set(budget.id, []);
    }
    const history = this.budgetHistory.get(budget.id)!;
    history.push(value);

    // Keep only last 1000 measurements
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    const severity = determineSeverity(value, budget);

    if (severity) {
      const violation: BudgetViolation = {
        budgetId: budget.id,
        timestamp: Date.now(),
        actualValue: value,
        targetValue: budget.target,
        severity,
        context: { ...context, budgetName: budget.name, unit: budget.unit },
      };

      this.violations.push(violation);
      this.handleBudgetViolation(budget, violation);
    }

    Logger.debug('Performance budget checked', {
      budgetId: budget.id,
      value,
      target: budget.target,
      severity: severity || 'pass',
      unit: budget.unit,
    });
  }

  private handleBudgetViolation(budget: PerformanceBudget, violation: BudgetViolation): void {
    const alertSeverity = violation.severity === 'critical' ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    const valueFormatted = formatValue(violation.actualValue, budget.unit);
    const targetFormatted = formatValue(violation.targetValue, budget.unit);

    alertingService.sendAlert({
      title: `Performance Budget Violation: ${budget.name}`,
      message: `${budget.name} exceeded budget: ${valueFormatted} (target: ${targetFormatted})`,
      severity: alertSeverity,
      category: AlertCategory.PERFORMANCE,
      source: 'performance-budget',
      metadata: {
        budgetId: budget.id,
        budgetCategory: budget.category,
        actualValue: violation.actualValue,
        targetValue: violation.targetValue,
        exceedancePercentage: calculateExceedance(violation.actualValue, violation.targetValue),
        context: violation.context,
      },
      fingerprint: `budget-violation-${budget.id}`,
      actionUrl: `/admin/performance/budgets/${budget.id}`,
    });

    Logger.warn('Performance budget violation', {
      budgetId: budget.id,
      budgetName: budget.name,
      severity: violation.severity,
      actualValue: violation.actualValue,
      targetValue: violation.targetValue,
      context: violation.context,
    });
  }

  private checkAveragePerformance(budget: PerformanceBudget): void {
    const history = this.budgetHistory.get(budget.id);
    if (!history || history.length === 0) return;

    const recentMeasurements = history.slice(-100);
    const average = recentMeasurements.reduce((sum, val) => sum + val, 0) / recentMeasurements.length;

    this.checkBudget(budget, average, {
      type: 'average',
      sampleSize: recentMeasurements.length,
      timeframe: 'last-hour',
    });
  }

  // ---------------------------------------------------------------------------
  // Reporting
  // ---------------------------------------------------------------------------

  private generateDailyReport(budget: PerformanceBudget): void {
    const history = this.budgetHistory.get(budget.id);
    if (!history || history.length === 0) return;

    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const recentViolations = this.violations.filter(
      (v) => v.budgetId === budget.id && v.timestamp > yesterday
    );

    Logger.info('Daily performance budget report', {
      budget: budget.name,
      date: new Date().toISOString().split('T')[0],
      measurements: history.length,
      violations: recentViolations.length,
      averageValue: history.reduce((sum, val) => sum + val, 0) / history.length,
      targetValue: budget.target,
    });
  }

  getBudgetReport(): BudgetReport {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentViolations = this.violations.filter((v) => v.timestamp > last24h);
    const enabledCount = PERFORMANCE_BUDGETS.filter((b) => b.enabled).length;

    return {
      timestamp: now,
      budgets: {
        total: enabledCount,
        passed: enabledCount - recentViolations.length,
        warning: recentViolations.filter((v) => v.severity === 'warning').length,
        critical: recentViolations.filter((v) => v.severity === 'critical').length,
      },
      violations: recentViolations,
      trends: analyzeTrends(this.budgetHistory),
      percentiles: computePercentiles(this.budgetHistory),
      recommendations: generateRecommendations(recentViolations),
    };
  }
}

// Singleton instance
export const performanceBudgetMonitor = new PerformanceBudgetMonitor();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & {
      performanceBudgetMonitor?: PerformanceBudgetMonitor;
      getBudgetReport?: () => BudgetReport;
    }).performanceBudgetMonitor = performanceBudgetMonitor;

    (window as Window & { getBudgetReport?: () => BudgetReport }).getBudgetReport = () => {
      const report = performanceBudgetMonitor.getBudgetReport();
      Logger.info('Performance Budget Report', { report });
      return report;
    };
  }
}
