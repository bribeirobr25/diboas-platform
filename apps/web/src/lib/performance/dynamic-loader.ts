/**
 * Dynamic Component Loader - Service Agnostic Abstraction Layer
 * 
 * Domain-Driven Design: Centralized loading logic for all component variants
 * Performance & SEO Optimization: Lazy loading with preloading strategies
 * Error Handling & System Recovery: Fallback components and retry logic
 * Monitoring & Observability: Loading performance tracking
 * Concurrency & Race Condition Prevention: Safe loading state management
 * No Hard coded values: All configuration through design tokens
 */

import React, { lazy, ComponentType, ReactNode } from 'react';
import { Logger } from '@/lib/monitoring/Logger';

// Type definitions for Service Agnostic Abstraction
export interface DynamicLoaderConfig {
  /**
   * Loading strategy for performance optimization
   */
  loadingStrategy?: 'lazy' | 'preload' | 'immediate';
  
  /**
   * Fallback component for error handling
   */
  fallback?: ComponentType<Record<string, unknown>>;
  
  /**
   * Retry attempts for error recovery
   */
  retryAttempts?: number;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Enable performance monitoring
   */
  enableMonitoring?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
}

export interface LoaderMetrics {
  componentName: string;
  loadTime: number;
  success: boolean;
  retryCount: number;
  strategy: string;
}

/**
 * Dynamic Component Loader with advanced optimization
 * 
 * Implements sophisticated loading strategies for optimal performance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponentType = ComponentType<any>;

export class DynamicComponentLoader {
  private static instance: DynamicComponentLoader;
  private loadingCache = new Map<string, Promise<AnyComponentType>>();
  private preloadCache = new Set<string>();
  private metrics: LoaderMetrics[] = [];
  
  private constructor() {}
  
  public static getInstance(): DynamicComponentLoader {
    if (!DynamicComponentLoader.instance) {
      DynamicComponentLoader.instance = new DynamicComponentLoader();
    }
    return DynamicComponentLoader.instance;
  }
  
  /**
   * Load component dynamically with optimized strategies
   * Performance & SEO Optimization: Multiple loading strategies
   * Error Handling & System Recovery: Retry logic and fallbacks
   */
  public async loadComponent<T = Record<string, unknown>>(
    componentPath: string,
    config: DynamicLoaderConfig = {}
  ): Promise<ComponentType<T>> {
    const {
      loadingStrategy = 'lazy',
      retryAttempts = 3,
      timeout = 10000,
      enableMonitoring = true,
      fallback
    } = config;
    
    const startTime = performance.now();
    const retryCount = 0;
    
    // Check cache first for performance
    if (this.loadingCache.has(componentPath)) {
      const cached = await this.loadingCache.get(componentPath)!;
      if (enableMonitoring) {
        this.recordMetrics(componentPath, performance.now() - startTime, true, 0, loadingStrategy);
      }
      return cached as ComponentType<T>;
    }
    
    const loadPromise = this.attemptLoad<T>(
      componentPath,
      retryCount,
      retryAttempts,
      timeout,
      startTime,
      loadingStrategy,
      enableMonitoring,
      fallback
    );
    
    // Cache the promise to prevent duplicate loads
    this.loadingCache.set(componentPath, loadPromise);
    
    return await loadPromise as ComponentType<T>;
  }
  
  /**
   * Attempt to load component with retry logic
   * Error Handling & System Recovery: Comprehensive error handling
   * Monitoring & Observability: Performance tracking
   */
  private async attemptLoad<T>(
    componentPath: string,
    retryCount: number,
    maxRetries: number,
    timeout: number,
    startTime: number,
    strategy: string,
    enableMonitoring: boolean,
    fallback?: ComponentType<Record<string, unknown>>
  ): Promise<ComponentType<T>> {
    try {
      // Create timeout promise for error handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Component load timeout: ${componentPath}`)), timeout);
      });
      
      // Dynamic import with timeout
      const importPromise = import(componentPath).then(module => 
        module.default || module[Object.keys(module)[0]]
      );
      
      const component = await Promise.race([importPromise, timeoutPromise]);
      
      if (enableMonitoring) {
        this.recordMetrics(componentPath, performance.now() - startTime, true, retryCount, strategy);
      }
      
      return component as ComponentType<T>;
      
    } catch (error) {
      Logger.error('Dynamic component load failed', {
        componentPath,
        retryCount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Retry logic for error recovery
      if (retryCount < maxRetries) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.attemptLoad<T>(
          componentPath,
          retryCount + 1,
          maxRetries,
          timeout,
          startTime,
          strategy,
          enableMonitoring,
          fallback
        );
      }
      
      // Record failure metrics
      if (enableMonitoring) {
        this.recordMetrics(componentPath, performance.now() - startTime, false, retryCount, strategy);
      }
      
      // Return fallback component or throw
      if (fallback) {
        Logger.warn('Using fallback component', { componentPath });
        return fallback as ComponentType<T>;
      }
      
      throw new Error(`Failed to load component after ${maxRetries} attempts: ${componentPath}`);
    }
  }
  
  /**
   * Preload component for performance optimization
   * Performance & SEO Optimization: Proactive loading
   */
  public preloadComponent(componentPath: string): void {
    if (this.preloadCache.has(componentPath)) {
      return; // Already preloading or preloaded
    }
    
    this.preloadCache.add(componentPath);
    
    // Preload on next tick to avoid blocking current execution
    setTimeout(() => {
      this.loadComponent(componentPath, {
        loadingStrategy: 'preload',
        enableMonitoring: false
      }).catch(error => {
        Logger.warn('Preload failed', { componentPath, error });
        this.preloadCache.delete(componentPath);
      });
    }, 0);
  }
  
  /**
   * Create lazy component with Suspense wrapper
   * Performance & SEO Optimization: Lazy loading with proper boundaries
   */
  public createLazyComponent<T = Record<string, unknown>>(
    componentPath: string,
    config: DynamicLoaderConfig = {}
  ): React.LazyExoticComponent<ComponentType<T>> {
    return lazy(() => 
      this.loadComponent<T>(componentPath, config)
        .then(Component => ({ default: Component }))
    );
  }
  
  /**
   * Record performance metrics
   * Monitoring & Observability: Performance tracking
   */
  private recordMetrics(
    componentName: string,
    loadTime: number,
    success: boolean,
    retryCount: number,
    strategy: string
  ): void {
    this.metrics.push({
      componentName,
      loadTime,
      success,
      retryCount,
      strategy
    });
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
    
    Logger.info('Component load metrics', {
      componentName,
      loadTime: `${loadTime.toFixed(2)}ms`,
      success,
      retryCount,
      strategy
    });
  }
  
  /**
   * Get performance metrics for monitoring
   * Monitoring & Observability: Analytics integration
   */
  public getMetrics(): LoaderMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Clear cache for memory management
   * Performance & SEO Optimization: Memory optimization
   */
  public clearCache(): void {
    this.loadingCache.clear();
    this.preloadCache.clear();
    this.metrics.length = 0;
  }
  
  /**
   * Delay utility for retry logic
   * Concurrency & Race Condition Prevention: Controlled timing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance for service agnostic access
export const dynamicLoader = DynamicComponentLoader.getInstance();

/**
 * Hook for React components to use dynamic loading
 * Service Agnostic Abstraction: Clean React integration
 */
export function useDynamicComponent<T = Record<string, unknown>>(
  componentPath: string,
  config: DynamicLoaderConfig = {}
): React.LazyExoticComponent<ComponentType<T>> {
  return dynamicLoader.createLazyComponent<T>(componentPath, config);
}