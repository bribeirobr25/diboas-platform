/**
 * Performance Budgets - Public API
 */

export { PerformanceBudgetMonitor, performanceBudgetMonitor } from './PerformanceBudgets';
export type { PerformanceBudget, BudgetViolation, BudgetReport, BudgetTrends, PercentileStats } from './budgetTypes';
export { PERFORMANCE_BUDGETS, getBudgetById, getEnabledBudgets, getBudgetsByCategory, getBudgetsByFrequency } from './budgetDefinitions';
export { analyzeTrends, generateRecommendations, formatValue, formatBytes, calculateExceedance, determineSeverity, computePercentiles } from './budgetAnalysis';
export { DynamicComponentLoader, dynamicLoader, useDynamicComponent } from './dynamic-loader';
