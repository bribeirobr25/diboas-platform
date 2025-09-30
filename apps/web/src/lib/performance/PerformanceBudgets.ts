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
    [key: string]: any;
  };
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
  recommendations: string[];
}

/**
 * Comprehensive Performance Budgets
 * Based on Core Web Vitals and industry best practices
 */
export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals
  {
    id: 'lcp-budget',
    name: 'Largest Contentful Paint',
    description: 'Time for the largest content element to load',
    category: 'loading',
    metric: 'lcp',
    target: 2500, // Good: <2.5s
    warning: 3000,
    critical: 4000, // Poor: >4s
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'fid-budget',
    name: 'First Input Delay',
    description: 'Time from first user interaction to browser response',
    category: 'interactivity',
    metric: 'fid',
    target: 100, // Good: <100ms
    warning: 200,
    critical: 300, // Poor: >300ms
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'cls-budget',
    name: 'Cumulative Layout Shift',
    description: 'Visual stability metric',
    category: 'visual-stability',
    metric: 'cls',
    target: 0.1, // Good: <0.1
    warning: 0.15,
    critical: 0.25, // Poor: >0.25
    unit: 'score',
    enabled: true,
    frequency: 'per-page-load'
  },

  // Additional Performance Metrics
  {
    id: 'fcp-budget',
    name: 'First Contentful Paint',
    description: 'Time to first content paint',
    category: 'loading',
    metric: 'fcp',
    target: 1800, // Good: <1.8s
    warning: 2500,
    critical: 3000, // Poor: >3s
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'ttfb-budget',
    name: 'Time to First Byte',
    description: 'Server response time',
    category: 'loading',
    metric: 'ttfb',
    target: 200, // Good: <200ms
    warning: 400,
    critical: 600, // Poor: >600ms
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'tti-budget',
    name: 'Time to Interactive',
    description: 'Time until page is fully interactive',
    category: 'interactivity',
    metric: 'tti',
    target: 3800, // Good: <3.8s
    warning: 5000,
    critical: 7300, // Poor: >7.3s
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },

  // Bundle Size Budgets
  {
    id: 'js-bundle-budget',
    name: 'JavaScript Bundle Size',
    description: 'Total JavaScript bundle size',
    category: 'bundle-size',
    metric: 'bundle.javascript.size',
    target: 300 * 1024, // 300KB
    warning: 500 * 1024, // 500KB
    critical: 1024 * 1024, // 1MB
    unit: 'bytes',
    enabled: true,
    frequency: 'per-deployment'
  },
  {
    id: 'css-bundle-budget',
    name: 'CSS Bundle Size',
    description: 'Total CSS bundle size',
    category: 'bundle-size',
    metric: 'bundle.css.size',
    target: 50 * 1024, // 50KB
    warning: 100 * 1024, // 100KB
    critical: 200 * 1024, // 200KB
    unit: 'bytes',
    enabled: true,
    frequency: 'per-deployment'
  },
  {
    id: 'total-bundle-budget',
    name: 'Total Bundle Size',
    description: 'Combined size of all bundles',
    category: 'bundle-size',
    metric: 'bundle.total.size',
    target: 500 * 1024, // 500KB
    warning: 1024 * 1024, // 1MB
    critical: 2 * 1024 * 1024, // 2MB
    unit: 'bytes',
    enabled: true,
    frequency: 'per-deployment'
  },

  // Custom Performance Budgets
  {
    id: 'section-render-budget',
    name: 'Section Render Time',
    description: 'Average time for sections to render',
    category: 'rendering',
    metric: 'section.render.time.avg',
    target: 50, // 50ms
    warning: 100, // 100ms
    critical: 200, // 200ms
    unit: 'ms',
    enabled: true,
    frequency: 'hourly'
  },
  {
    id: 'carousel-interaction-budget',
    name: 'Carousel Interaction Delay',
    description: 'Time from user interaction to carousel response',
    category: 'interactivity',
    metric: 'carousel.interaction.delay',
    target: 16, // 16ms (60fps)
    warning: 33, // 33ms (30fps)
    critical: 100, // 100ms
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'image-load-budget',
    name: 'Image Load Time',
    description: 'Average image loading time',
    category: 'loading',
    metric: 'image.load.time.avg',
    target: 500, // 500ms
    warning: 1000, // 1s
    critical: 2000, // 2s
    unit: 'ms',
    enabled: true,
    frequency: 'hourly'
  }
];

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
    // @ts-ignore - Optional package
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
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
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

    this.checkBudget(budget, metric.value, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
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
      const budget = PERFORMANCE_BUDGETS.find(b => b.id === 'section-render-budget');
      
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
          const budget = PERFORMANCE_BUDGETS.find(b => b.id === 'carousel-interaction-budget');
          
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
          const budget = PERFORMANCE_BUDGETS.find(b => b.id === 'image-load-budget');
          if (budget) {
            this.checkBudget(budget, entry.duration, {
              imageUrl: entry.name,
              imageSize: (entry as any).transferSize
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
  checkBudget(budget: PerformanceBudget, value: number, context: any = {}): void {
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

    let severity: 'warning' | 'critical' | null = null;
    
    if (value > budget.critical) {
      severity = 'critical';
    } else if (value > budget.warning) {
      severity = 'warning';
    }

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
    const valueFormatted = this.formatValue(violation.actualValue, budget.unit);
    const targetFormatted = this.formatValue(violation.targetValue, budget.unit);

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
        exceedancePercentage: ((violation.actualValue - violation.targetValue) / violation.targetValue * 100).toFixed(1),
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

    // Analyze trends
    const trends = this.analyzeTrends();

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
      recommendations: this.generateRecommendations(recentViolations)
    };
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): { improving: number; degrading: number; stable: number } {
    let improving = 0;
    let degrading = 0;
    let stable = 0;

    PERFORMANCE_BUDGETS.filter(b => b.enabled).forEach(budget => {
      const history = this.budgetHistory.get(budget.id);
      if (!history || history.length < 10) {
        stable++;
        return;
      }

      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      
      if (older.length === 0) {
        stable++;
        return;
      }

      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      
      const change = (recentAvg - olderAvg) / olderAvg;
      
      if (change < -0.05) { // 5% improvement
        improving++;
      } else if (change > 0.05) { // 5% degradation
        degrading++;
      } else {
        stable++;
      }
    });

    return { improving, degrading, stable };
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: BudgetViolation[]): string[] {
    const recommendations: string[] = [];
    const violationsByCategory = violations.reduce((acc, violation) => {
      const budget = PERFORMANCE_BUDGETS.find(b => b.id === violation.budgetId);
      if (budget) {
        acc[budget.category] = (acc[budget.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Category-specific recommendations
    if (violationsByCategory.loading > 0) {
      recommendations.push('🚀 Optimize loading performance: Consider image compression, lazy loading, and resource prioritization');
    }

    if (violationsByCategory.rendering > 0) {
      recommendations.push('⚡ Improve rendering performance: Review component complexity and implement performance monitoring');
    }

    if (violationsByCategory.interactivity > 0) {
      recommendations.push('🎯 Enhance interactivity: Optimize JavaScript execution and reduce main thread blocking');
    }

    if (violationsByCategory['visual-stability'] > 0) {
      recommendations.push('🎨 Improve visual stability: Set explicit dimensions for images and dynamic content');
    }

    if (violationsByCategory['bundle-size'] > 0) {
      recommendations.push('📦 Reduce bundle size: Implement code splitting and tree shaking');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All performance budgets are within targets - great job!');
    }

    return recommendations;
  }

  /**
   * Format value with appropriate unit
   */
  private formatValue(value: number, unit: string): string {
    switch (unit) {
      case 'ms':
        return `${value.toFixed(0)}ms`;
      case 'bytes':
        return this.formatBytes(value);
      case 'score':
        return value.toFixed(3);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value.toString();
      default:
        return value.toString();
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }
}

// Singleton instance
export const performanceBudgetMonitor = new PerformanceBudgetMonitor();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).performanceBudgetMonitor = performanceBudgetMonitor;
    
    // Quick budget report function
    (window as any).getBudgetReport = () => {
      const report = performanceBudgetMonitor.getBudgetReport();
      console.log('Performance Budget Report:', report);
      return report;
    };
  }
}