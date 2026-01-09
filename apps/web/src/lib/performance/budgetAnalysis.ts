/**
 * Budget Analysis Utilities
 *
 * Functions for analyzing performance budget data
 */

import type { PerformanceBudget, BudgetViolation, BudgetTrends } from './budgetTypes';
import { PERFORMANCE_BUDGETS } from './budgetDefinitions';

/**
 * Analyze performance trends from historical data
 */
export function analyzeTrends(budgetHistory: Map<string, number[]>): BudgetTrends {
  let improving = 0;
  let degrading = 0;
  let stable = 0;

  PERFORMANCE_BUDGETS.filter(b => b.enabled).forEach(budget => {
    const history = budgetHistory.get(budget.id);
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

    if (change < -0.05) {
      improving++;
    } else if (change > 0.05) {
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
export function generateRecommendations(violations: BudgetViolation[]): string[] {
  const recommendations: string[] = [];
  const violationsByCategory = violations.reduce((acc, violation) => {
    const budget = PERFORMANCE_BUDGETS.find(b => b.id === violation.budgetId);
    if (budget) {
      acc[budget.category] = (acc[budget.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (violationsByCategory.loading > 0) {
    recommendations.push('Optimize loading performance: Consider image compression, lazy loading, and resource prioritization');
  }

  if (violationsByCategory.rendering > 0) {
    recommendations.push('Improve rendering performance: Review component complexity and implement performance monitoring');
  }

  if (violationsByCategory.interactivity > 0) {
    recommendations.push('Enhance interactivity: Optimize JavaScript execution and reduce main thread blocking');
  }

  if (violationsByCategory['visual-stability'] > 0) {
    recommendations.push('Improve visual stability: Set explicit dimensions for images and dynamic content');
  }

  if (violationsByCategory['bundle-size'] > 0) {
    recommendations.push('Reduce bundle size: Implement code splitting and tree shaking');
  }

  if (recommendations.length === 0) {
    recommendations.push('All performance budgets are within targets - great job!');
  }

  return recommendations;
}

/**
 * Format value with appropriate unit
 */
export function formatValue(value: number, unit: string): string {
  switch (unit) {
    case 'ms':
      return `${value.toFixed(0)}ms`;
    case 'bytes':
      return formatBytes(value);
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
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

/**
 * Calculate exceedance percentage
 */
export function calculateExceedance(actual: number, target: number): string {
  return ((actual - target) / target * 100).toFixed(1);
}

/**
 * Determine violation severity
 */
export function determineSeverity(
  value: number,
  budget: PerformanceBudget
): 'warning' | 'critical' | null {
  if (value > budget.critical) {
    return 'critical';
  } else if (value > budget.warning) {
    return 'warning';
  }
  return null;
}
