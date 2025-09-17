/**
 * Analytics Types
 * Event-Driven Architecture: Type definitions for analytics events
 */

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view';
  parameters: {
    page_path: string;
    page_title: string;
    page_location: string;
    locale: string;
    referrer?: string;
  };
}

export interface PerformanceEvent extends AnalyticsEvent {
  name: 'page_performance';
  parameters: {
    page_path: string;
    metric_name: 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
    metric_value: number;
    metric_rating: 'good' | 'needs-improvement' | 'poor';
    navigation_type: string;
  };
}

export interface NavigationEvent extends AnalyticsEvent {
  name: 'navigation_interaction';
  parameters: {
    menu_id: string;
    action: 'click' | 'hover' | 'open' | 'close';
    menu_path?: string;
    locale: string;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  trackPageViews: boolean;
  trackPerformance: boolean;
  trackNavigation: boolean;
  batchSize: number;
  flushInterval: number;
}

export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
  trackPageView(path: string, title: string, locale: string): void;
  trackPerformance(metrics: WebVitalsMetric[]): void;
  trackNavigation(menuId: string, action: string, locale: string): void;
  flush(): Promise<void>;
  setUserId(userId: string): void;
  setSessionId(sessionId: string): void;
}

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}