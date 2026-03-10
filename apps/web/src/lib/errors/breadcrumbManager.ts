/**
 * Breadcrumb Manager
 *
 * Manages breadcrumb collection for error tracking.
 * Stores references to all monkey-patches and listeners for proper cleanup.
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

  // Store originals for restoration on destroy
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;
  private originalConsoleError: typeof console.error | null = null;
  private boundClickHandler: ((event: Event) => void) | null = null;

  constructor(config: ErrorReportingConfig) {
    this.config = config;
  }

  /**
   * Initialize breadcrumb collection
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    if (!this.config.enableBreadcrumbs) return;

    this.initializeNavigationTracking();
    this.initializeConsoleTracking();
    this.initializeClickTracking();

    this.isInitialized = true;
  }

  /**
   * Track navigation changes via History API
   */
  private initializeNavigationTracking(): void {
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    const self = this;
    const origPush = this.originalPushState;
    const origReplace = this.originalReplaceState;

    history.pushState = function (...args) {
      self.add({
        timestamp: Date.now(),
        message: `Navigation to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return origPush.apply(history, args);
    };

    history.replaceState = function (...args) {
      self.add({
        timestamp: Date.now(),
        message: `Navigation replaced to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return origReplace.apply(history, args);
    };
  }

  /**
   * Track console error messages
   */
  private initializeConsoleTracking(): void {
    this.originalConsoleError = console.error;
    const origError = this.originalConsoleError;
    const self = this;

    console.error = function (...args: Parameters<typeof console.error>) {
      self.add({
        timestamp: Date.now(),
        message: args.join(' '),
        category: 'console',
        level: 'error'
      });
      return origError.apply(console, args);
    };
  }

  /**
   * Track user click interactions
   */
  private initializeClickTracking(): void {
    this.boundClickHandler = (event: Event) => {
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
    };
    document.addEventListener('click', this.boundClickHandler, true);
  }

  /**
   * Add a breadcrumb
   */
  add(breadcrumb: ErrorBreadcrumb): void {
    if (!this.config.enableBreadcrumbs) return;

    this.breadcrumbs.push(breadcrumb);

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

  /**
   * Destroy: restore all monkey-patches and remove listeners
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // Restore History API
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }

    // Restore console.error
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }

    // Remove click listener
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler, true);
      this.boundClickHandler = null;
    }

    this.breadcrumbs = [];
    this.isInitialized = false;
  }
}
