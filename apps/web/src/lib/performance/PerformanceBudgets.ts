/**
 * Automated Performance Budget System
 *
 * Performance & SEO Optimization: Automated performance budget enforcement
 * Monitoring & Observability: Continuous performance tracking
 * Service Agnostic Abstraction: Platform-independent budget system
 * Error Handling & System Recovery: Performance degradation alerts
 */

import { Logger } from '@/lib/monitoring/Logger';
import { alertingService, AlertSeverity, AlertCategory } from '@/lib/monitoring/AlertingService';

// Import types
import type { PerformanceBudget, BudgetViolation, BudgetReport } from './budgetTypes';

// Import budget definitions and helpers
import { PERFORMANCE_BUDGETS, getBudgetById } from './budgetDefinitions';

// Import analysis utilities
import {
  analyzeTrends,
  generateRecommendations,
  formatValue,
  determineSeverity,
  calculateExceedance
} from './budgetAnalysis';

// Re-export for backwards compatibility
export type { PerformanceBudget, BudgetViolation, BudgetReport, BudgetTrends } from './budgetTypes';
export { PERFORMANCE_BUDGETS, getBudgetById, getEnabledBudgets, getBudgetsByCategory, getBudgetsByFrequency } from './budgetDefinitions';
export { analyzeTrends, generateRecommendations, formatValue, formatBytes, calculateExceedance, determineSeverity } from './budgetAnalysis';

/**
 * Performance Budget Monitor
 */
export class PerformanceBudgetMonitor {
  private violations: BudgetViolation[] = [];
  private lastCheck: Map<string, number> = new Map();
  private budgetHistory: Map<string, number[]> = new Map();
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize performance budget monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor Core Web Vitals
    this.setupWebVitalsMonitoring();

    // Monitor custom metrics
    this.setupCustomMetricsMonitoring();

    // Set up periodic checks
    this.setupPeriodicChecks();

    Logger.info('Performance budget monitoring initialized', {
      budgetCount: PERFORMANCE_BUDGETS.length,
      enabledBudgets: PERFORMANCE_BUDGETS.filter(b => b.enabled).length
    });
  }

  /**
   * Set up Core Web Vitals monitoring
   */
  private setupWebVitalsMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Use web-vitals library if available, otherwise use Performance Observer
    // @ts-expect-error - Optional package
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.handleMetric.bind(this, 'cls'));
      getFID(this.handleMetric.bind(this, 'fid'));
      getFCP(this.handleMetric.bind(this, 'fcp'));
      getLCP(this.handleMetric.bind(this, 'lcp'));
      getTTFB(this.handleMetric.bind(this, 'ttfb'));
    }).catch(() => {
      // Fallback to Performance Observer
      this.setupPerformanceObserver();
    });
  }

  /**
   * Fallback Performance Observer implementation
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.handleMetric('lcp', { value: lastEntry.startTime });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FCP Observer
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.handleMetric('fcp', { value: fcpEntry.startTime });
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Layout Shift Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value ?? 0;
          }
        }
        this.handleMetric('cls', { value: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      Logger.warn('Failed to set up Performance Observer', { error });
    }
  }

  /**
   * Handle web vital metric measurement
   */
  private handleMetric(metricName: string, metric: { value: number }): void {
    const budget = PERFORMANCE_BUDGETS.find(b => b.metric === metricName && b.enabled);
    if (!budget) return;

    const navigatorWithConnection = navigator as Navigator & { connection?: { effectiveType?: string } };
    this.checkBudget(budget, metric.value, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: navigatorWithConnection.connection?.effectiveType || 'unknown'
    });
  }

  /**
   * Set up custom metrics monitoring
   */
  private setupCustomMetricsMonitoring(): void {
    // Monitor section render times
    this.monitorSectionPerformance();

    // Monitor carousel interactions
    this.monitorCarouselPerformance();

    // Monitor image loading
    this.monitorImagePerformance();
  }

  /**
   * Monitor section rendering performance
   */
  private monitorSectionPerformance(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.matches('section[class*="section"]')) {
                this.measureSectionRenderTime(element);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Measure section render time
   */
  private measureSectionRenderTime(section: Element): void {
    const startTime = performance.now();

    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      const budget = getBudgetById('section-render-budget');

      if (budget) {
        this.checkBudget(budget, renderTime, {
          sectionClass: section.className,
          sectionId: section.id
        });
      }
    });
  }

  /**
   * Monitor carousel interaction performance
   */
  private monitorCarouselPerformance(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      if (target.closest('[class*="carousel"]')) {
        const startTime = performance.now();

        requestAnimationFrame(() => {
          const interactionDelay = performance.now() - startTime;
          const budget = getBudgetById('carousel-interaction-budget');

          if (budget) {
            this.checkBudget(budget, interactionDelay, {
              interactionType: 'click',
              carouselElement: target.closest('[class*="carousel"]')?.className
            });
          }
        });
      }
    });
  }

  /**
   * Monitor image loading performance
   */
  private monitorImagePerformance(): void {
    const imageObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
          const budget = getBudgetById('image-load-budget');
          if (budget) {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.checkBudget(budget, entry.duration, {
              imageUrl: entry.name,
              imageSize: resourceEntry.transferSize
            });
          }
        }
      }
    });

    imageObserver.observe({ entryTypes: ['resource'] });
  }

  /**
   * Set up periodic budget checks
   */
  private setupPeriodicChecks(): void {
    // Hourly checks
    setInterval(() => {
      this.performHourlyChecks();
    }, 60 * 60 * 1000); // 1 hour

    // Daily checks
    setInterval(() => {
      this.performDailyChecks();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Perform hourly budget checks
   */
  private performHourlyChecks(): void {
    const hourlyBudgets = PERFORMANCE_BUDGETS.filter(b =>
      b.enabled && b.frequency === 'hourly'
    );

    hourlyBudgets.forEach(budget => {
      // Get average performance for the last hour
      this.checkAveragePerformance(budget);
    });
  }

  /**
   * Perform daily budget checks
   */
  private performDailyChecks(): void {
    const dailyBudgets = PERFORMANCE_BUDGETS.filter(b =>
      b.enabled && b.frequency === 'daily'
    );

    dailyBudgets.forEach(budget => {
      // Generate daily performance report
      this.generateDailyReport(budget);
    });
  }

  /**
   * Check budget against measured value
   */
  checkBudget(budget: PerformanceBudget, value: number, context: Record<string, unknown> = {}): void {
    // Store historical data
    if (!this.budgetHistory.has(budget.id)) {
      this.budgetHistory.set(budget.id, []);
    }
    this.budgetHistory.get(budget.id)!.push(value);

    // Keep only last 1000 measurements
    const history = this.budgetHistory.get(budget.id)!;
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
        context: {
          ...context,
          budgetName: budget.name,
          unit: budget.unit
        }
      };

      this.violations.push(violation);
      this.handleBudgetViolation(budget, violation);
    }

    Logger.debug('Performance budget checked', {
      budgetId: budget.id,
      value,
      target: budget.target,
      severity: severity || 'pass',
      unit: budget.unit
    });
  }

  /**
   * Handle budget violation
   */
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
        context: violation.context
      },
      fingerprint: `budget-violation-${budget.id}`,
      actionUrl: `/admin/performance/budgets/${budget.id}`
    });

    Logger.warn('Performance budget violation', {
      budgetId: budget.id,
      budgetName: budget.name,
      severity: violation.severity,
      actualValue: violation.actualValue,
      targetValue: violation.targetValue,
      context: violation.context
    });
  }

  /**
   * Check average performance for a budget
   */
  private checkAveragePerformance(budget: PerformanceBudget): void {
    const history = this.budgetHistory.get(budget.id);
    if (!history || history.length === 0) return;

    const recentMeasurements = history.slice(-100); // Last 100 measurements
    const average = recentMeasurements.reduce((sum, val) => sum + val, 0) / recentMeasurements.length;

    this.checkBudget(budget, average, {
      type: 'average',
      sampleSize: recentMeasurements.length,
      timeframe: 'last-hour'
    });
  }

  /**
   * Generate daily performance report
   */
  private generateDailyReport(budget: PerformanceBudget): void {
    const history = this.budgetHistory.get(budget.id);
    if (!history || history.length === 0) return;

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Get violations from last 24 hours
    const recentViolations = this.violations.filter(v =>
      v.budgetId === budget.id && v.timestamp > yesterday.getTime()
    );

    const report = {
      budget: budget.name,
      date: today.toISOString().split('T')[0],
      measurements: history.length,
      violations: recentViolations.length,
      averageValue: history.reduce((sum, val) => sum + val, 0) / history.length,
      targetValue: budget.target
    };

    Logger.info('Daily performance budget report', report);
  }

  /**
   * Get performance budget report
   */
  getBudgetReport(): BudgetReport {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentViolations = this.violations.filter(v => v.timestamp > last24h);
    const passedBudgets = PERFORMANCE_BUDGETS.filter(b => b.enabled).length - recentViolations.length;
    const warningViolations = recentViolations.filter(v => v.severity === 'warning').length;
    const criticalViolations = recentViolations.filter(v => v.severity === 'critical').length;

    // Analyze trends using extracted utility
    const trends = analyzeTrends(this.budgetHistory);

    return {
      timestamp: now,
      budgets: {
        total: PERFORMANCE_BUDGETS.filter(b => b.enabled).length,
        passed: passedBudgets,
        warning: warningViolations,
        critical: criticalViolations
      },
      violations: recentViolations,
      trends,
      recommendations: generateRecommendations(recentViolations)
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

    // Quick budget report function
    (window as Window & { getBudgetReport?: () => BudgetReport }).getBudgetReport = () => {
      const report = performanceBudgetMonitor.getBudgetReport();
      Logger.info('Performance Budget Report', { report });
      return report;
    };
  }
}
