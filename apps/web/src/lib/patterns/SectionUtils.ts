/**
 * Shared Section Utility Functions
 * 
 * Reusable utilities extracted from FeatureShowcase component
 * Provides common functionality across all sections
 * 
 * Performance & SEO Optimization: Optimized utility functions
 * Error Handling & System Recovery: Error-resilient implementations
 * No Hard-coded Values: Configuration-driven utilities
 * Service Agnostic Abstraction: Provider-agnostic implementations
 */

import { Logger } from '@/lib/monitoring/Logger';
import type {
  BaseSectionConfig,
  SectionErrorConfig,
  SectionPerformanceConfig,
  DesignTokenConvention,
  SectionBreakpoints
} from './SectionPattern';

// ================================
// CONFIGURATION UTILITIES
// ================================

/**
 * Merge section configurations with type safety
 * Based on FeatureShowcase configuration merging pattern
 */
export function mergeSectionConfig<T extends BaseSectionConfig<any, any, any, any>>(
  baseConfig: T,
  customConfig?: Partial<T>
): T {
  if (!customConfig) return baseConfig;
  
  try {
    // Deep merge configurations
    const merged = {
      ...baseConfig,
      ...customConfig,
      content: {
        ...baseConfig.content,
        ...(customConfig.content || {})
      },
      settings: {
        ...baseConfig.settings,
        ...(customConfig.settings || {})
      },
      analytics: customConfig.analytics ? {
        ...baseConfig.analytics,
        ...customConfig.analytics
      } : baseConfig.analytics,
      seo: {
        ...baseConfig.seo,
        ...(customConfig.seo || {})
      }
    } as T;
    
    Logger.debug('Section configuration merged', {
      variant: merged.variant,
      hasCustomConfig: !!customConfig
    });
    
    return merged;
    
  } catch (error) {
    Logger.error('Failed to merge section configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      variant: baseConfig.variant
    });
    
    // Return base config on merge failure
    return baseConfig;
  }
}

/**
 * Validate section configuration
 * Ensures configuration meets minimum requirements
 */
export function validateSectionConfig<T extends BaseSectionConfig<any, any, any, any>>(
  config: T
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate required fields
  if (!config.variant) {
    errors.push('Missing required field: variant');
  }
  
  if (!config.content) {
    errors.push('Missing required field: content');
  }
  
  if (!config.settings) {
    errors.push('Missing required field: settings');
  }
  
  if (!config.seo) {
    errors.push('Missing required field: seo');
  } else {
    if (!config.seo.ariaLabel) {
      errors.push('Missing required field: seo.ariaLabel');
    }
  }
  
  // Validate analytics configuration if present
  if (config.analytics) {
    if (!config.analytics.trackingPrefix) {
      errors.push('Missing required field: analytics.trackingPrefix');
    }
    
    if (!config.analytics.events) {
      errors.push('Missing required field: analytics.events');
    }
  }
  
  const isValid = errors.length === 0;
  
  if (!isValid) {
    Logger.warn('Section configuration validation failed', {
      variant: config.variant,
      errors
    });
  }
  
  return { isValid, errors };
}

// ================================
// IMAGE UTILITIES
// ================================

/**
 * Preload images for performance optimization
 * Based on FeatureShowcase preloading strategy
 */
export function preloadImages(imagePaths: string[]): Promise<void[]> {
  const promises = imagePaths.map(path => preloadImage(path));
  return Promise.allSettled(promises).then(results => {
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');
    
    Logger.debug('Image preloading completed', {
      total: imagePaths.length,
      successful: successful.length,
      failed: failed.length
    });
    
    return successful.map(() => undefined);
  });
}

/**
 * Preload a single image
 */
export function preloadImage(imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!imagePath) {
      reject(new Error('Image path is required'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      Logger.debug('Image preloaded successfully', { imagePath });
      resolve();
    };
    
    img.onerror = () => {
      const error = new Error(`Failed to preload image: ${imagePath}`);
      Logger.warn('Image preload failed', { imagePath, error: error.message });
      reject(error);
    };
    
    img.src = imagePath;
  });
}

/**
 * Generate responsive image sizes string
 * For Next.js Image component optimization
 */
export function generateImageSizes(
  breakpoints: SectionBreakpoints,
  sizeMap: {
    mobile: number;
    tablet: number;
    desktop: number;
  }
): string {
  return [
    `(max-width: ${breakpoints.mobile}px) ${sizeMap.mobile}px`,
    `(max-width: ${breakpoints.tablet}px) ${sizeMap.tablet}px`,
    `${sizeMap.desktop}px`
  ].join(', ');
}

/**
 * Get optimized image dimensions based on device capabilities
 */
export function getOptimizedImageDimensions(
  baseWidth: number,
  baseHeight: number,
  devicePixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio : 1
): { width: number; height: number } {
  // Cap at 3x for performance while maintaining quality
  const effectiveRatio = Math.min(devicePixelRatio, 3);
  
  return {
    width: Math.round(baseWidth * effectiveRatio),
    height: Math.round(baseHeight * effectiveRatio)
  };
}

// ================================
// PERFORMANCE UTILITIES
// ================================

/**
 * Throttle function to prevent rapid successive calls
 * Based on FeatureShowcase navigation throttling
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall >= limitMs) {
      lastCallTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, limitMs - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function to delay execution until calls stop
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delayMs);
  };
}

/**
 * Create a performance monitor for section operations
 */
export function createPerformanceMonitor(sectionName: string) {
  const marks = new Map<string, number>();
  
  return {
    /**
     * Start measuring an operation
     */
    start(operationName: string): void {
      const markName = `${sectionName}_${operationName}_start`;
      marks.set(operationName, performance.now());
      
      if (typeof performance.mark === 'function') {
        performance.mark(markName);
      }
    },
    
    /**
     * End measuring an operation and log duration
     */
    end(operationName: string): number {
      const startTime = marks.get(operationName);
      if (!startTime) {
        Logger.warn('Performance measurement not found', { 
          sectionName, 
          operationName 
        });
        return 0;
      }
      
      const duration = performance.now() - startTime;
      marks.delete(operationName);
      
      const markName = `${sectionName}_${operationName}`;
      if (typeof performance.mark === 'function') {
        performance.mark(`${markName}_end`);
        
        if (typeof performance.measure === 'function') {
          performance.measure(markName, `${markName}_start`, `${markName}_end`);
        }
      }
      
      Logger.debug('Performance measurement completed', {
        sectionName,
        operationName,
        duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
      });
      
      return duration;
    },
    
    /**
     * Get all performance entries for this section
     */
    getEntries(): PerformanceEntry[] {
      if (typeof performance.getEntriesByName !== 'function') {
        return [];
      }
      
      return performance.getEntriesByName(sectionName);
    }
  };
}

// ================================
// ERROR HANDLING UTILITIES
// ================================

/**
 * Create error boundary for section components
 */
export function createSectionErrorBoundary(
  sectionName: string,
  config: SectionErrorConfig
) {
  return class SectionErrorBoundary extends Error {
    constructor(
      public readonly originalError: Error,
      public readonly context: string,
      public readonly recovery?: () => void
    ) {
      super(`${sectionName} Error: ${originalError.message}`);
      this.name = 'SectionErrorBoundary';
    }
    
    /**
     * Handle the error with configured recovery strategy
     */
    handle(): boolean {
      Logger.error(`Section error boundary triggered`, {
        sectionName,
        context: this.context,
        error: this.originalError.message,
        stack: this.originalError.stack
      });
      
      // Attempt recovery if provided
      if (this.recovery && config.enableErrorBoundary) {
        try {
          this.recovery();
          Logger.info('Section error recovery successful', { 
            sectionName, 
            context: this.context 
          });
          return true;
        } catch (recoveryError) {
          Logger.error('Section error recovery failed', {
            sectionName,
            context: this.context,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
          });
        }
      }
      
      return false;
    }
  };
}

/**
 * Retry mechanism with exponential backoff
 * Based on FeatureShowcase error recovery patterns
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier, onRetry } = config;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        Logger.info('Operation succeeded after retry', { 
          attempt, 
          maxAttempts 
        });
      }
      
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        Logger.error('Operation failed after all retry attempts', {
          attempt,
          maxAttempts,
          error: lastError.message
        });
        break;
      }
      
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      
      Logger.warn('Operation failed, retrying', {
        attempt,
        maxAttempts,
        nextRetryIn: delay,
        error: lastError.message
      });
      
      onRetry?.(attempt, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// ================================
// DESIGN TOKEN UTILITIES
// ================================

/**
 * Generate CSS custom property name using design token convention
 */
export function generateTokenName(
  convention: DesignTokenConvention,
  category: string,
  property: string,
  variant?: string,
  modifier?: string
): string {
  const parts = [`--${convention.prefix}`, category, property];
  
  if (variant) parts.push(variant);
  if (modifier) parts.push(modifier);
  
  return parts.join('-');
}

/**
 * Extract design tokens from CSS and validate against convention
 */
export function validateDesignTokens(
  cssContent: string,
  convention: DesignTokenConvention
): { valid: string[]; invalid: string[]; missing: string[] } {
  const tokenPattern = new RegExp(`--${convention.prefix}-[\\w-]+`, 'g');
  const foundTokens = cssContent.match(tokenPattern) || [];
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  foundTokens.forEach(token => {
    const parts = token.substring(2).split('-'); // Remove '--' prefix
    
    if (parts.length >= 3 && parts[0] === convention.prefix) {
      const category = parts[1];
      if (Object.values(convention.categories).includes(category)) {
        valid.push(token);
      } else {
        invalid.push(token);
      }
    } else {
      invalid.push(token);
    }
  });
  
  // This would need to be extended to check for missing required tokens
  const missing: string[] = [];
  
  return { valid, invalid, missing };
}

/**
 * Generate responsive CSS media queries based on breakpoints
 */
export function generateMediaQueries(breakpoints: SectionBreakpoints): {
  mobile: string;
  tablet: string;
  desktop: string;
  largeDesktop: string;
} {
  return {
    mobile: `@media (max-width: ${breakpoints.tablet - 1}px)`,
    tablet: `@media (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
    desktop: `@media (min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.largeDesktop - 1}px)`,
    largeDesktop: `@media (min-width: ${breakpoints.largeDesktop}px)`
  };
}

// ================================
// ACCESSIBILITY UTILITIES
// ================================

/**
 * Generate ARIA attributes for section accessibility
 */
export function generateAriaAttributes(config: {
  role?: string;
  label: string;
  description?: string;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  controls?: string;
  describedBy?: string;
}): Record<string, string> {
  const attributes: Record<string, string> = {
    'aria-label': config.label
  };
  
  if (config.role) {
    attributes.role = config.role;
  }
  
  if (config.description) {
    attributes['aria-description'] = config.description;
  }
  
  if (config.live) {
    attributes['aria-live'] = config.live;
  }
  
  if (config.atomic !== undefined) {
    attributes['aria-atomic'] = config.atomic.toString();
  }
  
  if (config.controls) {
    attributes['aria-controls'] = config.controls;
  }
  
  if (config.describedBy) {
    attributes['aria-describedby'] = config.describedBy;
  }
  
  return attributes;
}

/**
 * Create accessible announcement for screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
  
  Logger.debug('Screen reader announcement', { message, priority });
}

// ================================
// VALIDATION UTILITIES
// ================================

/**
 * Validate URL for security (prevent XSS in hrefs)
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('#')) {
      return true;
    }
    
    // Validate absolute URLs
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    
    return allowedProtocols.includes(parsed.protocol);
    
  } catch {
    return false;
  }
}

/**
 * Sanitize text content to prevent XSS
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/[<>'"&]/g, char => {
      const charMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return charMap[char] || char;
    });
}

/**
 * Generate unique ID for accessibility
 */
export function generateId(prefix: string = 'section'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}