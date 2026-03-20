/**
 * Performance Components - Public API
 */

export { MonitoringInit } from './MonitoringInit';
export { WebVitalsTracker } from './WebVitalsTracker';
export { PageViewTracker } from './PageViewTracker';
export { usePerformanceTracking } from './usePerformanceTracking';
export {
  getRating,
  getConnectionType,
  sendToGoogleAnalytics,
  trackWebVitalsLoadError,
} from './webVitalsUtils';
export type { WindowWithGtag } from './webVitalsUtils';
