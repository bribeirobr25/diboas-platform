/**
 * Connection Monitor
 *
 * Monitors online/offline status and triggers retry of failed
 * analytics events when connectivity is restored. Extracted from
 * AnalyticsTrackingService for single-responsibility compliance.
 */

export class ConnectionMonitor {
  private isOnline = true;
  private boundOnline: (() => void) | null = null;
  private boundOffline: (() => void) | null = null;

  /**
   * Initialize connection monitoring with a callback for when
   * connectivity is restored.
   */
  initialize(onReconnect: () => void): void {
    if (typeof window === 'undefined') return;

    this.boundOnline = () => {
      this.isOnline = true;
      onReconnect();
    };

    this.boundOffline = () => {
      this.isOnline = false;
    };

    window.addEventListener('online', this.boundOnline);
    window.addEventListener('offline', this.boundOffline);
    this.isOnline = navigator.onLine;
  }

  /**
   * Whether the browser is currently online.
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cleanup event listeners.
   */
  destroy(): void {
    if (typeof window === 'undefined') return;

    if (this.boundOnline) {
      window.removeEventListener('online', this.boundOnline);
    }
    if (this.boundOffline) {
      window.removeEventListener('offline', this.boundOffline);
    }
  }
}
