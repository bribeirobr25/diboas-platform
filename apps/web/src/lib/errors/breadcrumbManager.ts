/**
 * Breadcrumb Manager
 *
 * Manages breadcrumb collection for error tracking
 */

import type { ErrorBreadcrumb, ErrorReportingConfig } from './errorTypes';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * Breadcrumb Manager class
 */
export class BreadcrumbManager {
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private config: ErrorReportingConfig;
  private isInitialized = false;

  constructor(config: ErrorReportingConfig) {
    this.config = config;
  }

  /**
   * Initialize breadcrumb collection
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    if (!this.config.enableBreadcrumbs) return;

    // Track navigation changes
    this.initializeNavigationTracking();

    // Track console errors
    this.initializeConsoleTracking();

    // Track user interactions
    this.initializeClickTracking();

    this.isInitialized = true;
  }

  /**
   * Track navigation changes via History API
   */
  private initializeNavigationTracking(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.add({
        timestamp: Date.now(),
        message: `Navigation to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.add({
        timestamp: Date.now(),
        message: `Navigation replaced to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return originalReplaceState.apply(history, args);
    };
  }

  /**
   * Track console error messages
   */
  private initializeConsoleTracking(): void {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.add({
        timestamp: Date.now(),
        message: args.join(' '),
        category: 'console',
        level: 'error'
      });
      return originalConsoleError.apply(console, args);
    };
  }

  /**
   * Track user click interactions
   */
  private initializeClickTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.add({
        timestamp: Date.now(),
        message: `User clicked ${target.tagName}`,
        category: 'user_action',
        level: 'info',
        data: {
          tagName: target.tagName,
          className: target.className,
          id: target.id
        }
      });
    }, true);
  }

  /**
   * Add a breadcrumb
   */
  add(breadcrumb: ErrorBreadcrumb): void {
    if (!this.config.enableBreadcrumbs) return;

    this.breadcrumbs.push(breadcrumb);

    // Maintain breadcrumb limit
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    Logger.debug('Breadcrumb added', { breadcrumb });
  }

  /**
   * Get all breadcrumbs
   */
  getAll(): ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.breadcrumbs = [];
  }
}
