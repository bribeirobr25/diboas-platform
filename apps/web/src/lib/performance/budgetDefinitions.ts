/**
 * Performance Budget Definitions
 *
 * Comprehensive performance budgets based on Core Web Vitals and best practices
 */

import type { PerformanceBudget } from './budgetTypes';

/**
 * Core Web Vitals budgets
 */
const CORE_WEB_VITALS_BUDGETS: PerformanceBudget[] = [
  {
    id: 'lcp-budget',
    name: 'Largest Contentful Paint',
    description: 'Time for the largest content element to load',
    category: 'loading',
    metric: 'lcp',
    target: 2500,
    warning: 3000,
    critical: 4000,
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
    target: 100,
    warning: 200,
    critical: 300,
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
    target: 0.1,
    warning: 0.15,
    critical: 0.25,
    unit: 'score',
    enabled: true,
    frequency: 'per-page-load'
  },
  {
    id: 'fcp-budget',
    name: 'First Contentful Paint',
    description: 'Time to first content paint',
    category: 'loading',
    metric: 'fcp',
    target: 1800,
    warning: 2500,
    critical: 3000,
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
    target: 200,
    warning: 400,
    critical: 600,
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
    target: 3800,
    warning: 5000,
    critical: 7300,
    unit: 'ms',
    enabled: true,
    frequency: 'per-page-load'
  }
];

/**
 * Bundle size budgets
 */
const BUNDLE_SIZE_BUDGETS: PerformanceBudget[] = [
  {
    id: 'js-bundle-budget',
    name: 'JavaScript Bundle Size',
    description: 'Total JavaScript bundle size',
    category: 'bundle-size',
    metric: 'bundle.javascript.size',
    target: 300 * 1024,
    warning: 500 * 1024,
    critical: 1024 * 1024,
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
    target: 50 * 1024,
    warning: 100 * 1024,
    critical: 200 * 1024,
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
    target: 500 * 1024,
    warning: 1024 * 1024,
    critical: 2 * 1024 * 1024,
    unit: 'bytes',
    enabled: true,
    frequency: 'per-deployment'
  }
];

/**
 * Custom performance budgets
 */
const CUSTOM_BUDGETS: PerformanceBudget[] = [
  {
    id: 'section-render-budget',
    name: 'Section Render Time',
    description: 'Average time for sections to render',
    category: 'rendering',
    metric: 'section.render.time.avg',
    target: 50,
    warning: 100,
    critical: 200,
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
    target: 16,
    warning: 33,
    critical: 100,
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
    target: 500,
    warning: 1000,
    critical: 2000,
    unit: 'ms',
    enabled: true,
    frequency: 'hourly'
  }
];

/**
 * All performance budgets combined
 */
export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  ...CORE_WEB_VITALS_BUDGETS,
  ...BUNDLE_SIZE_BUDGETS,
  ...CUSTOM_BUDGETS
];

/**
 * Get budget by ID
 */
export function getBudgetById(id: string): PerformanceBudget | undefined {
  return PERFORMANCE_BUDGETS.find(b => b.id === id);
}

/**
 * Get enabled budgets
 */
export function getEnabledBudgets(): PerformanceBudget[] {
  return PERFORMANCE_BUDGETS.filter(b => b.enabled);
}

/**
 * Get budgets by category
 */
export function getBudgetsByCategory(category: PerformanceBudget['category']): PerformanceBudget[] {
  return PERFORMANCE_BUDGETS.filter(b => b.category === category && b.enabled);
}

/**
 * Get budgets by frequency
 */
export function getBudgetsByFrequency(frequency: PerformanceBudget['frequency']): PerformanceBudget[] {
  return PERFORMANCE_BUDGETS.filter(b => b.frequency === frequency && b.enabled);
}
