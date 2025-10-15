/**
 * Production Performance Monitoring Service
 * 
 * Domain-Driven Design: Performance monitoring aligned with business metrics
 * Service Agnostic Abstraction: Works with any analytics provider
 * Performance & SEO Optimization: Non-blocking performance tracking
 * Error Handling & System Recovery: Graceful degradation when monitoring fails
 * Monitoring & Observability: Comprehensive performance insights
 * No Hard coded values: All thresholds configurable
 */

import { Logger } from './Logger';

// Type definitions for Service Agnostic Abstraction
export interface PerformanceMetrics {
  /**
   * Core Web Vitals
   */
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  
  /**
   * Bundle and loading metrics
   */
  loading: {
    bundleSize: number;
    loadTime: number;
    initialRenderTime: number;
    interactiveTime: number;
  };
  
  /**
   * Section-specific performance
   */
  sections: {
    [sectionName: string]: {
      renderTime: number;
      interactionTime: number;
      errorCount: number;
    };
  };
  
  /**
   * Theme system performance
   */
  theme: {
    switchTime: number;
    tokenEvaluationTime: number;
  };
  
  /**
   * Device and environment context
   */
  context: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string;
    memoryLimit?: number;
  };
}

export interface PerformanceThresholds {
  lcp: { good: number; needs_improvement: number };
  fid: { good: number; needs_improvement: number };
  cls: { good: number; needs_improvement: number };
  fcp: { good: number; needs_improvement: number };
  ttfb: { good: number; needs_improvement: number };
  bundleSize: { target: number; maximum: number };
  renderTime: { target: number; maximum: number };
}

export interface PerformanceConfig {
  /**
   * Enable performance monitoring
   */
  enabled: boolean;
  
  /**
   * Sampling rate (0-1)
   */
  sampleRate: number;
  
  /**
   * Performance thresholds
   */
  thresholds: PerformanceThresholds;
  
  /**
   * Analytics endpoint
   */
  endpoint?: string;
  
  /**
   * Buffer size for batching
   */
  bufferSize: number;
  
  /**
   * Flush interval in milliseconds
   */
  flushInterval: number;
}

/**
 * Production Performance Monitor
 * 
 * Provides comprehensive performance monitoring for production environments
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metricsBuffer: PerformanceMetrics[] = [];
  private observers: { [key: string]: PerformanceObserver } = {};
  private startTime = performance.now();
  private isEnabled = false;
  
  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // 10% sampling in production
      thresholds: {
        lcp: { good: 2500, needs_improvement: 4000 },
        fid: { good: 100, needs_improvement: 300 },
        cls: { good: 0.1, needs_improvement: 0.25 },
        fcp: { good: 1800, needs_improvement: 3000 },
        ttfb: { good: 800, needs_improvement: 1800 },
        bundleSize: { target: 300 * 1024, maximum: 500 * 1024 },
        renderTime: { target: 16, maximum: 100 }
      },
      bufferSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };
    
    if (this.shouldInitialize()) {
      this.initialize();
    }
  }
  
  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Check if monitoring should be initialized
   * Performance & SEO Optimization: Respect sampling rate and conditions
   */
  private shouldInitialize(): boolean {
    if (!this.config.enabled) return false;
    if (typeof window === 'undefined') return false;
    if (!('performance' in window)) return false;
    
    // Respect sampling rate
    return Math.random() < this.config.sampleRate;
  }
  
  /**
   * Initialize performance monitoring
   * Error Handling & System Recovery: Safe initialization
   */
  private initialize(): void {
    try {
      this.isEnabled = true;
      this.setupCoreWebVitalsObserver();
      this.setupNavigationObserver();
      this.setupResourceObserver();
      this.setupLayoutShiftObserver();
      this.setupPeriodicFlush();
      
      Logger.info('Performance monitoring initialized', {
        sampleRate: this.config.sampleRate,
        thresholds: this.config.thresholds
      });
      
    } catch (error) {
      Logger.error('Failed to initialize performance monitoring', { error });
      this.isEnabled = false;
    }
  }
  
  /**
   * Setup Core Web Vitals observer
   * Monitoring & Observability: Track critical performance metrics
   */
  private setupCoreWebVitalsObserver(): void {
    try {
      // Largest Contentful Paint
      this.observers.lcp = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceEventTiming[];
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('lcp', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName,
          url: (lastEntry as any).url
        });
      });
      this.observers.lcp.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      this.observers.fid = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceEventTiming[];
        entries.forEach(entry => {
          this.recordMetric('fid', entry.processingStart - entry.startTime, {
            eventType: entry.name,
            target: (entry as any).target?.tagName
          });
        });
      });
      this.observers.fid.observe({ entryTypes: ['first-input'] });
      
      // First Contentful Paint
      this.observers.fcp = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime);
          }
        });
      });
      this.observers.fcp.observe({ entryTypes: ['paint'] });
      
    } catch (error) {
      Logger.warn('Failed to setup Core Web Vitals observer', { error });
    }
  }
  
  /**
   * Setup Cumulative Layout Shift observer
   * Performance & SEO Optimization: Track layout stability
   */
  private setupLayoutShiftObserver(): void {
    try {
      let clsValue = 0;
      
      this.observers.cls = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceEventTiming[];
        
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        this.recordMetric('cls', clsValue);
      });
      this.observers.cls.observe({ entryTypes: ['layout-shift'] });
      
    } catch (error) {
      Logger.warn('Failed to setup layout shift observer', { error });
    }
  }
  
  /**
   * Setup navigation timing observer
   * Monitoring & Observability: Track page load performance
   */
  private setupNavigationObserver(): void {
    try {
      this.observers.navigation = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceNavigationTiming[];
        
        entries.forEach(entry => {
          const ttfb = entry.responseStart - entry.requestStart;
          this.recordMetric('ttfb', ttfb);
          
          // Record loading metrics
          this.recordLoadingMetrics(entry);
        });
      });
      this.observers.navigation.observe({ entryTypes: ['navigation'] });
      
    } catch (error) {
      Logger.warn('Failed to setup navigation observer', { error });
    }
  }
  
  /**
   * Setup resource timing observer
   * Performance & SEO Optimization: Track resource loading
   */
  private setupResourceObserver(): void {
    try {
      this.observers.resource = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as PerformanceResourceTiming[];
        
        entries.forEach(entry => {
          // Track bundle sizes and load times
          if (entry.name.includes('/_next/static/')) {
            this.recordBundleMetrics(entry);
          }
          
          // Track section component loading
          if (entry.name.includes('/sections/')) {
            this.recordSectionMetrics(entry);
          }
        });
      });
      this.observers.resource.observe({ entryTypes: ['resource'] });
      
    } catch (error) {
      Logger.warn('Failed to setup resource observer', { error });
    }
  }
  
  /**
   * Record individual performance metric
   * Domain-Driven Design: Structured metric recording
   */
  private recordMetric(
    type: string, 
    value: number, 
    context: Record<string, any> = {}
  ): void {
    try {
      const threshold = this.getThreshold(type);
      const rating = this.getRating(value, threshold);
      
      Logger.info('Performance metric recorded', {
        type,
        value: Math.round(value),
        rating,
        context,
        timestamp: Date.now()
      });
      
      // Add to analytics buffer if endpoint configured
      if (this.config.endpoint) {
        this.bufferMetric({
          type,
          value,
          rating,
          context,
          timestamp: Date.now(),
          page: window.location.pathname
        });
      }
      
    } catch (error) {
      Logger.warn('Failed to record metric', { error, type, value });
    }
  }
  
  /**
   * Record loading metrics from navigation timing
   * Performance & SEO Optimization: Comprehensive loading analysis
   */
  private recordLoadingMetrics(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.startTime;
    const renderTime = entry.domContentLoadedEventEnd - entry.startTime;
    const interactiveTime = entry.domInteractive - entry.startTime;
    
    this.recordMetric('loadTime', loadTime);
    this.recordMetric('renderTime', renderTime);
    this.recordMetric('interactiveTime', interactiveTime);
  }
  
  /**
   * Record bundle metrics from resource timing
   * Monitoring & Observability: Bundle size and performance tracking
   */
  private recordBundleMetrics(entry: PerformanceResourceTiming): void {
    const bundleSize = entry.transferSize || 0;
    const loadTime = entry.responseEnd - entry.startTime;
    
    this.recordMetric('bundleSize', bundleSize, {
      url: entry.name,
      type: 'bundle'
    });
    
    this.recordMetric('bundleLoadTime', loadTime, {
      url: entry.name,
      size: bundleSize
    });
  }
  
  /**
   * Record section-specific metrics
   * Domain-Driven Design: Section performance tracking
   */
  private recordSectionMetrics(entry: PerformanceResourceTiming): void {
    const sectionName = this.extractSectionName(entry.name);
    const loadTime = entry.responseEnd - entry.startTime;
    
    this.recordMetric('sectionLoadTime', loadTime, {
      section: sectionName,
      url: entry.name
    });
  }
  
  /**
   * Extract section name from resource URL
   * Service Agnostic Abstraction: URL parsing abstraction
   */
  private extractSectionName(url: string): string {
    const match = url.match(/\/sections\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }
  
  /**
   * Get performance threshold for metric type
   * No Hard coded values: Configurable thresholds
   */
  private getThreshold(type: string): { good: number; needs_improvement: number } | null {
    const thresholds = this.config.thresholds as any;
    return thresholds[type] || null;
  }
  
  /**
   * Get performance rating based on thresholds
   * Performance & SEO Optimization: Standard performance classification
   */
  private getRating(value: number, threshold: { good: number; needs_improvement: number } | null): string {
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needs_improvement) return 'needs_improvement';
    return 'poor';
  }
  
  /**
   * Buffer metric for batched sending
   * Performance & SEO Optimization: Efficient data transmission
   */
  private bufferMetric(metric: any): void {
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flushMetrics();
    }
    
    this.metricsBuffer.push(metric);
  }
  
  /**
   * Setup periodic metric flushing
   * Monitoring & Observability: Regular data transmission
   */
  private setupPeriodicFlush(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics();
      }
    }, this.config.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }
  
  /**
   * Flush buffered metrics to analytics endpoint
   * Error Handling & System Recovery: Safe metric transmission
   */
  private async flushMetrics(): Promise<void> {
    if (!this.config.endpoint || this.metricsBuffer.length === 0) return;
    
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer.length = 0; // Clear buffer
    
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          session: this.getSessionId(),
          timestamp: Date.now()
        }),
        keepalive: true // Ensure delivery on page unload
      });
      
      Logger.info('Performance metrics flushed', { count: metrics.length });
      
    } catch (error) {
      Logger.warn('Failed to flush performance metrics', { error });
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }
  
  /**
   * Get or generate session ID
   * Service Agnostic Abstraction: Session management
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('perf-session-id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('perf-session-id', sessionId);
    }
    return sessionId;
  }
  
  // Public API
  
  /**
   * Record custom performance metric
   * Domain-Driven Design: Business-specific metric tracking
   */
  public recordCustomMetric(name: string, value: number, context?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    this.recordMetric(`custom_${name}`, value, context);
  }
  
  /**
   * Record section render time
   * Performance & SEO Optimization: Component performance tracking
   */
  public recordSectionRenderTime(sectionName: string, renderTime: number): void {
    if (!this.isEnabled) return;
    
    this.recordMetric('sectionRenderTime', renderTime, {
      section: sectionName
    });
  }
  
  /**
   * Record theme switch performance
   * Monitoring & Observability: Theme system performance
   */
  public recordThemeSwitch(switchTime: number, fromTheme: string, toTheme: string): void {
    if (!this.isEnabled) return;
    
    this.recordMetric('themeSwitchTime', switchTime, {
      fromTheme,
      toTheme
    });
  }
  
  /**
   * Get current performance summary
   * Service Agnostic Abstraction: Performance data access
   */
  public getPerformanceSummary(): any {
    if (!this.isEnabled) return null;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.startTime : null,
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
        timestamp: Date.now(),
        page: window.location.pathname
      };
      
    } catch (error) {
      Logger.warn('Failed to get performance summary', { error });
      return null;
    }
  }
  
  /**
   * Update configuration
   * No Hard coded values: Runtime configuration updates
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (!this.config.enabled && this.isEnabled) {
      this.destroy();
    } else if (this.config.enabled && !this.isEnabled && this.shouldInitialize()) {
      this.initialize();
    }
  }
  
  /**
   * Check if monitoring is enabled
   * Service Agnostic Abstraction: Status checking
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Cleanup resources
   * Error Handling & System Recovery: Safe cleanup
   */
  public destroy(): void {
    try {
      // Flush remaining metrics
      this.flushMetrics();
      
      // Disconnect observers
      Object.values(this.observers).forEach(observer => {
        observer.disconnect();
      });
      
      this.observers = {};
      this.isEnabled = false;
      
      Logger.info('Performance monitoring destroyed');
      
    } catch (error) {
      Logger.error('Failed to destroy performance monitor', { error });
    }
  }
}

// Export singleton instance for service agnostic access
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * React hook for performance monitoring
 * Service Agnostic Abstraction: Clean React integration
 */
export function usePerformanceMonitoring() {
  const recordCustomMetric = (name: string, value: number, context?: Record<string, any>) => {
    performanceMonitor.recordCustomMetric(name, value, context);
  };
  
  const recordSectionRenderTime = (sectionName: string, renderTime: number) => {
    performanceMonitor.recordSectionRenderTime(sectionName, renderTime);
  };
  
  const getPerformanceSummary = () => {
    return performanceMonitor.getPerformanceSummary();
  };
  
  return {
    recordCustomMetric,
    recordSectionRenderTime,
    getPerformanceSummary,
    isEnabled: performanceMonitor.isMonitoringEnabled()
  };
}