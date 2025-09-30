/**
 * Shared Section Pattern Abstractions
 * 
 * Extracted from FeatureShowcase component architecture for reuse across all sections
 * Provides type-safe, configuration-driven component patterns
 * 
 * Domain-Driven Design: Section-specific domain modeling
 * Service Agnostic Abstraction: Provider-agnostic service interfaces
 * Code Reusability & DRY: Shared patterns and utilities
 * No Hard-coded Values: Configuration-driven approach
 */

// ================================
// CORE SECTION INTERFACES
// ================================

/**
 * Base props interface for all section components
 * Template for consistent component API across all sections
 */
export interface BaseSectionProps<TVariant extends string = string> {
  /**
   * Section variant configuration - determines layout and behavior
   */
  variant?: TVariant;

  /**
   * Custom section configuration - overrides default config
   */
  config?: Partial<BaseSectionConfig<TVariant, any, any, any>>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

/**
 * Base configuration interface for all section variants
 * Provides consistent structure across all components
 */
export interface BaseSectionConfig<
  TVariant extends string,
  TContent = any,
  TSettings = any,
  TAnalytics = any
> {
  /** Section variant identifier */
  variant: TVariant;
  
  /** Section content configuration */
  content: TContent;
  
  /** Section behavior settings */
  settings: TSettings;
  
  /** Analytics configuration (optional) */
  analytics?: TAnalytics;
  
  /** SEO optimization settings */
  seo: SectionSEOConfig;
}

/**
 * SEO configuration for sections
 * Standardized approach to SEO optimization
 */
export interface SectionSEOConfig {
  /** ARIA label for accessibility */
  ariaLabel: string;
  
  /** Structured data for search engines */
  structuredData?: Record<string, any>;
  
  /** Meta description for section content */
  description?: string;
  
  /** Keywords relevant to section content */
  keywords?: string[];
}

// ================================
// ANALYTICS PATTERNS
// ================================

/**
 * Standard analytics configuration for sections
 * Based on FeatureShowcase analytics implementation
 */
export interface SectionAnalyticsConfig {
  /** Enable/disable analytics tracking */
  enabled: boolean;
  
  /** Prefix for all analytics events from this section */
  trackingPrefix: string;
  
  /** Standard event names for consistent tracking */
  events: {
    /** User interaction events (clicks, taps) */
    interaction: string;
    
    /** Navigation events (slide changes, page changes) */
    navigation: string;
    
    /** CTA click events */
    cta_click: string;
    
    /** Section view events */
    section_view: string;
    
    /** Error events */
    error: string;
  };
  
  /** Additional custom events specific to section */
  customEvents?: Record<string, string>;
}

/**
 * Analytics service interface abstraction
 * Service-agnostic contract for analytics providers
 */
export interface SectionAnalyticsService {
  /**
   * Track an analytics event
   */
  trackEvent(
    eventName: string, 
    properties: Record<string, unknown>
  ): Promise<void>;
  
  /**
   * Track a section view event
   */
  trackSectionView(
    sectionId: string,
    properties: Record<string, unknown>
  ): Promise<void>;
  
  /**
   * Get service health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    failedEventsCount: number;
    isOnline: boolean;
  };
}

// ================================
// PERFORMANCE PATTERNS
// ================================

/**
 * Performance configuration for sections
 * Based on FeatureShowcase performance optimization patterns
 */
export interface SectionPerformanceConfig {
  /** Enable lazy loading for non-critical content */
  enableLazyLoading?: boolean;
  
  /** Number of items to preload ahead */
  preloadCount?: number;
  
  /** Timeout for content loading (ms) */
  loadingTimeout?: number;
  
  /** Throttle time for user interactions (ms) */
  navigationThrottleMs?: number;
  
  /** Enable image optimization */
  enableImageOptimization?: boolean;
  
  /** Critical content that should load immediately */
  criticalContent?: string[];
}

/**
 * Loading state management interface
 * Standardized approach to loading states across sections
 */
export interface SectionLoadingState {
  /** Overall loading state */
  isLoading: boolean;
  
  /** Loading progress (0-100) */
  progress: number;
  
  /** Loading errors */
  errors: Set<string>;
  
  /** Successfully loaded items */
  loaded: Set<string>;
  
  /** Items currently being loaded */
  loading: Set<string>;
}

// ================================
// ERROR HANDLING PATTERNS
// ================================

/**
 * Error handling configuration for sections
 * Based on FeatureShowcase error recovery patterns
 */
export interface SectionErrorConfig {
  /** Enable error boundaries */
  enableErrorBoundary?: boolean;
  
  /** Retry configuration for failed operations */
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };
  
  /** Fallback content for critical failures */
  fallbackContent?: {
    title: string;
    message: string;
    action?: {
      text: string;
      href: string;
    };
  };
  
  /** Log error events to analytics */
  logToAnalytics?: boolean;
}

/**
 * Error handling utility interface
 * Reusable error handling patterns
 */
export interface SectionErrorHandler {
  /**
   * Handle a recoverable error with fallback
   */
  handleRecoverableError(
    error: Error,
    context: string,
    fallback?: () => void
  ): void;
  
  /**
   * Handle a critical error that breaks functionality
   */
  handleCriticalError(
    error: Error,
    context: string,
    recovery?: () => void
  ): void;
  
  /**
   * Log error for monitoring
   */
  logError(
    error: Error,
    context: string,
    metadata?: Record<string, unknown>
  ): void;
}

// ================================
// ACCESSIBILITY PATTERNS
// ================================

/**
 * Accessibility configuration for sections
 * Standardized a11y approach across components
 */
export interface SectionAccessibilityConfig {
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
  
  /** Enable touch/swipe navigation */
  enableTouch?: boolean;
  
  /** Announce changes to screen readers */
  announceChanges?: boolean;
  
  /** Custom keyboard instructions */
  keyboardInstructions?: string;
  
  /** Focus management configuration */
  focusManagement?: {
    trapFocus?: boolean;
    returnFocus?: boolean;
    skipLinks?: boolean;
  };
  
  /** Reduced motion preferences */
  respectReducedMotion?: boolean;
}

// ================================
// RESPONSIVE DESIGN PATTERNS
// ================================

/**
 * Responsive breakpoint configuration
 * Standardized breakpoints across all sections
 */
export interface SectionBreakpoints {
  /** Small mobile devices */
  smallMobile: number;  // 320px
  
  /** Medium mobile devices */
  mobile: number;       // 480px
  
  /** Large mobile devices */
  largeMobile: number;  // 600px
  
  /** Tablet devices */
  tablet: number;       // 768px
  
  /** Small desktop */
  desktop: number;      // 1024px
  
  /** Large desktop */
  largeDesktop: number; // 1440px
}

/**
 * Responsive configuration for sections
 * Device-specific behavior and content
 */
export interface SectionResponsiveConfig {
  /** Breakpoint configuration */
  breakpoints: SectionBreakpoints;
  
  /** Mobile-specific settings */
  mobile?: {
    simplifiedNavigation?: boolean;
    reducedAnimations?: boolean;
    optimizedImages?: boolean;
  };
  
  /** Tablet-specific settings */
  tablet?: {
    hybridInteractions?: boolean;
    enhancedTouch?: boolean;
  };
  
  /** Desktop-specific settings */
  desktop?: {
    keyboardShortcuts?: boolean;
    hoverEffects?: boolean;
    advancedFeatures?: boolean;
  };
}

// ================================
// CONTENT PATTERNS
// ================================

/**
 * Base content item interface
 * Common structure for content items across sections
 */
export interface BaseSectionContentItem {
  /** Unique identifier */
  id: string;
  
  /** Display title */
  title: string;
  
  /** Description or subtitle */
  description?: string;
  
  /** Associated media assets */
  media?: {
    image?: string;
    video?: string;
    audio?: string;
    alt?: string;
  };
  
  /** Call-to-action configuration */
  cta?: {
    text: string;
    href: string;
    target?: '_blank' | '_self';
    rel?: string;
  };
  
  /** Metadata for tracking and organization */
  metadata?: Record<string, unknown>;
}

/**
 * Content collection interface
 * For sections that display multiple content items
 */
export interface SectionContentCollection<T extends BaseSectionContentItem = BaseSectionContentItem> {
  /** Collection of content items */
  items: T[];
  
  /** Collection metadata */
  meta: {
    total: number;
    displayOrder: 'sequential' | 'random' | 'priority';
    pagination?: {
      enabled: boolean;
      itemsPerPage: number;
    };
  };
}

// ================================
// DESIGN TOKEN PATTERNS
// ================================

/**
 * Design token naming convention
 * Standardized approach to CSS custom property naming
 */
export interface DesignTokenConvention {
  /** Component prefix (e.g., 'fs', 'hs', 'pc') */
  prefix: string;
  
  /** Token categories */
  categories: {
    scaling: string;      // 'scale'
    colors: string;       // 'color'
    spacing: string;      // 'gap', 'padding', 'margin'
    typography: string;   // 'font'
    borders: string;      // 'border'
    depth: string;        // 'z-index', 'opacity'
    animations: string;   // 'transition', 'animation'
    effects: string;      // 'shadow', 'filter'
  };
  
  /** Variant suffixes */
  variants: {
    mobile: string;       // 'mobile'
    tablet: string;       // 'tablet'
    desktop: string;      // 'desktop'
  };
}

/**
 * Design token generator utility
 * Helper for creating consistent token names
 */
export class DesignTokenGenerator {
  constructor(private convention: DesignTokenConvention) {}
  
  /**
   * Generate a design token name
   */
  generateToken(
    category: string,
    property: string,
    variant?: string,
    modifier?: string
  ): string {
    const parts = [
      `--${this.convention.prefix}`,
      category,
      property
    ];
    
    if (variant) parts.push(variant);
    if (modifier) parts.push(modifier);
    
    return parts.join('-');
  }
  
  /**
   * Generate tokens for responsive variants
   */
  generateResponsiveTokens(
    category: string,
    property: string,
    modifier?: string
  ): {
    mobile: string;
    tablet: string;
    desktop: string;
  } {
    return {
      mobile: this.generateToken(category, property, this.convention.variants.mobile, modifier),
      tablet: this.generateToken(category, property, this.convention.variants.tablet, modifier),
      desktop: this.generateToken(category, property, this.convention.variants.desktop, modifier)
    };
  }
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Extract variant type from configuration record
 */
export type ExtractVariant<T> = T extends Record<infer K, any> ? K : never;

/**
 * Extract configuration type from configuration record
 */
export type ExtractConfig<T> = T extends Record<any, infer V> ? V : never;

/**
 * Make certain properties required in a configuration
 */
export type RequireConfig<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Section component factory type
 * For creating type-safe section components
 */
export type SectionComponentFactory<
  TVariant extends string,
  TConfig extends BaseSectionConfig<TVariant, any, any, any>
> = (props: BaseSectionProps<TVariant>) => JSX.Element;

// ================================
// CONSTANTS
// ================================

/**
 * Default performance configuration
 * Based on FeatureShowcase optimizations
 */
export const DEFAULT_PERFORMANCE_CONFIG: Required<SectionPerformanceConfig> = {
  enableLazyLoading: true,
  preloadCount: 2,
  loadingTimeout: 2000,
  navigationThrottleMs: 150,
  enableImageOptimization: true,
  criticalContent: []
};

/**
 * Default accessibility configuration
 * WCAG 2.1 AA compliant defaults
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: Required<SectionAccessibilityConfig> = {
  enableKeyboard: true,
  enableTouch: true,
  announceChanges: true,
  keyboardInstructions: 'Use arrow keys to navigate',
  focusManagement: {
    trapFocus: false,
    returnFocus: true,
    skipLinks: true
  },
  respectReducedMotion: true
};

/**
 * Standard responsive breakpoints
 * Based on industry standards and FeatureShowcase implementation
 */
export const STANDARD_BREAKPOINTS: SectionBreakpoints = {
  smallMobile: 320,
  mobile: 480,
  largeMobile: 600,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440
};

/**
 * Design token conventions for all sections
 * Standardized naming across the component library
 */
export const DESIGN_TOKEN_CONVENTIONS: Record<string, DesignTokenConvention> = {
  featureShowcase: {
    prefix: 'fs',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  heroSection: {
    prefix: 'hs',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  productCarousel: {
    prefix: 'pc',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  oneFeature: {
    prefix: 'of',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  }
};

/**
 * Default section error configuration
 * Non-blocking error handling with user experience focus
 */
export const DEFAULT_ERROR_CONFIG: Required<SectionErrorConfig> = {
  enableErrorBoundary: true,
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  fallbackContent: {
    title: 'Content temporarily unavailable',
    message: 'Please try refreshing the page or check back later.',
    action: {
      text: 'Refresh page',
      href: 'javascript:window.location.reload()'
    }
  },
  logToAnalytics: true
};