/**
 * Section Pattern Library - Barrel Export
 * 
 * Centralized export for all section pattern abstractions
 * Provides consistent access to shared patterns across the application
 * 
 * Based on FeatureShowcase component architecture patterns
 * Enables code reusability and maintains architectural consistency
 */

// Core Pattern Interfaces and Types
export type {
  BaseSectionProps,
  BaseSectionConfig,
  SectionSEOConfig,
  SectionAnalyticsConfig,
  SectionAnalyticsService,
  SectionPerformanceConfig,
  SectionLoadingState,
  SectionErrorConfig,
  SectionErrorHandler,
  SectionAccessibilityConfig,
  SectionBreakpoints,
  SectionResponsiveConfig,
  BaseSectionContentItem,
  SectionContentCollection,
  DesignTokenConvention,
  ExtractVariant,
  ExtractConfig,
  RequireConfig,
  SectionComponentFactory
} from './SectionPattern';

// Import types for internal use
import type {
  BaseSectionProps as IBaseSectionProps,
  BaseSectionConfig as IBaseSectionConfig,
  SectionAnalyticsConfig as ISectionAnalyticsConfig,
  SectionAnalyticsService as ISectionAnalyticsService,
  DesignTokenConvention as IDesignTokenConvention,
  SectionErrorConfig as ISectionErrorConfig
} from './SectionPattern';

// Design Token Generation Utilities
export {
  DesignTokenGenerator,
  STANDARD_BREAKPOINTS,
  DESIGN_TOKEN_CONVENTIONS,
  DEFAULT_ERROR_CONFIG
} from './SectionPattern';

// Import constants for internal use
import {
  DESIGN_TOKEN_CONVENTIONS,
  DesignTokenGenerator,
  DEFAULT_ERROR_CONFIG,
  STANDARD_BREAKPOINTS
} from './SectionPattern';

// React Hooks for Section Components
export {
  useSectionLoading,
  useSectionAnalytics,
  useSectionNavigation,
  useKeyboardNavigation,
  useTouchNavigation
} from './SectionHooks';

// Utility Functions
export {
  mergeSectionConfig,
  validateSectionConfig,
  preloadImages,
  preloadImage,
  generateImageSizes,
  getOptimizedImageDimensions,
  throttle,
  debounce,
  createPerformanceMonitor,
  createSectionErrorBoundary,
  retryWithBackoff,
  generateTokenName,
  validateDesignTokens,
  generateMediaQueries,
  generateAriaAttributes,
  announceToScreenReader,
  validateUrl,
  sanitizeText,
  generateId
} from './SectionUtils';

// ================================
// PATTERN FACTORY FUNCTIONS
// ================================

/**
 * Create a section component following the established pattern
 * Provides type-safe factory for building new section components
 */
export function createSectionPattern<
  TVariant extends string,
  TConfig extends IBaseSectionConfig<TVariant, any, any, any>
>(options: {
  name: string;
  variants: Record<TVariant, TConfig>;
  defaultVariant: TVariant;
  tokenPrefix: string;
}) {
  const { name, variants, defaultVariant, tokenPrefix } = options;
  
  /**
   * Get configuration for a specific variant
   */
  const getConfig = (variant: TVariant = defaultVariant): TConfig => {
    return variants[variant] || variants[defaultVariant];
  };
  
  /**
   * Get all available variants
   */
  const getVariants = (): TVariant[] => {
    return Object.keys(variants) as TVariant[];
  };
  
  /**
   * Validate if a variant exists
   */
  const hasVariant = (variant: string): variant is TVariant => {
    return variant in variants;
  };
  
  /**
   * Get design token convention for this section
   */
  const getTokenConvention = (): IDesignTokenConvention => {
    return DESIGN_TOKEN_CONVENTIONS[name.toLowerCase()] || {
      prefix: tokenPrefix,
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
    };
  };
  
  /**
   * Create design token generator for this section
   */
  const createTokenGenerator = () => {
    return new DesignTokenGenerator(getTokenConvention());
  };
  
  return {
    name,
    variants,
    defaultVariant,
    tokenPrefix,
    getConfig,
    getVariants,
    hasVariant,
    getTokenConvention,
    createTokenGenerator
  };
}

/**
 * Higher-order component factory for section error boundaries
 */
export function withSectionErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  sectionName: string,
  errorConfig: ISectionErrorConfig = DEFAULT_ERROR_CONFIG
) {
  return function ErrorBoundaryWrapper(props: P) {
    // In a real implementation, this would use React.ErrorBoundary
    // For now, we'll return the wrapped component
    return WrappedComponent as any;
  };
}

/**
 * Create analytics service instance for sections
 */
export function createSectionAnalyticsService(
  baseService: any, // Your actual analytics service
  sectionConfig: ISectionAnalyticsConfig
): ISectionAnalyticsService {
  return {
    async trackEvent(eventName: string, properties: Record<string, unknown>) {
      if (!sectionConfig.enabled) return;
      
      try {
        await baseService.track(eventName, {
          ...properties,
          section: sectionConfig.trackingPrefix,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`Analytics tracking failed: ${eventName}`, error);
      }
    },
    
    async trackSectionView(sectionId: string, properties: Record<string, unknown>) {
      await this.trackEvent(`${sectionConfig.trackingPrefix}_view`, {
        sectionId,
        ...properties
      });
    },
    
    getHealthStatus() {
      return {
        isHealthy: true, // Implement actual health check
        failedEventsCount: 0,
        isOnline: navigator.onLine
      };
    }
  };
}

// ================================
// VALIDATION HELPERS
// ================================

/**
 * Validate section props against pattern requirements
 */
export function validateSectionProps<T extends IBaseSectionProps>(
  props: T,
  requiredProps: (keyof T)[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required props
  requiredProps.forEach(prop => {
    if (props[prop] === undefined || props[prop] === null) {
      errors.push(`Missing required prop: ${String(prop)}`);
    }
  });
  
  // Validate variant if provided
  if (props.variant && typeof props.variant !== 'string') {
    errors.push('Variant must be a string');
  }
  
  // Validate className if provided
  if (props.className && typeof props.className !== 'string') {
    errors.push('ClassName must be a string');
  }
  
  // Validate enableAnalytics if provided
  if (props.enableAnalytics !== undefined && typeof props.enableAnalytics !== 'boolean') {
    errors.push('EnableAnalytics must be a boolean');
  }
  
  // Validate priority if provided
  if (props.priority !== undefined && typeof props.priority !== 'boolean') {
    errors.push('Priority must be a boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Development mode checker for pattern validation
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Pattern compliance checker (development only)
 */
export function checkPatternCompliance(
  componentName: string,
  config: any,
  patterns: string[] = []
): void {
  if (!isDevelopment) return;
  
  const compliance = {
    hasVariantSystem: !!config.variants,
    hasAnalytics: !!config.analytics,
    hasSEO: !!config.seo,
    hasErrorHandling: !!config.errorConfig,
    hasPerformanceConfig: !!config.performance
  };
  
  const score = Object.values(compliance).filter(Boolean).length;
  const total = Object.keys(compliance).length;
  const percentage = (score / total) * 100;
  
  console.group(`🏗️ Pattern Compliance Check: ${componentName}`);
  console.log(`📊 Score: ${score}/${total} (${percentage.toFixed(1)}%)`);
  
  Object.entries(compliance).forEach(([pattern, implemented]) => {
    console.log(`${implemented ? '✅' : '❌'} ${pattern}`);
  });
  
  if (percentage < 80) {
    console.warn('⚠️ Component below recommended pattern compliance (80%)');
  } else if (percentage === 100) {
    console.log('🎉 Perfect pattern compliance!');
  }
  
  console.groupEnd();
}

// ================================
// MIGRATION HELPERS
// ================================

/**
 * Helper for migrating legacy components to the new pattern
 */
export function createMigrationHelper<TLegacyProps, TNewProps extends IBaseSectionProps>(
  componentName: string,
  propMapper: (legacyProps: TLegacyProps) => TNewProps
) {
  return function migrateLegacyProps(legacyProps: TLegacyProps): TNewProps {
    console.warn(`🔄 Migrating legacy props for ${componentName}. Consider updating to new pattern.`);
    
    try {
      const newProps = propMapper(legacyProps);
      
      // Validate migrated props
      const validation = validateSectionProps(newProps);
      if (!validation.isValid) {
        console.error('❌ Migration validation failed:', validation.errors);
      }
      
      return newProps;
    } catch (error) {
      console.error(`❌ Migration failed for ${componentName}:`, error);
      throw error;
    }
  };
}

// ================================
// EXPORTS FOR EXTERNAL CONSUMPTION
// ================================

// Default export with all utilities
export default {
  createSectionPattern,
  withSectionErrorBoundary,
  createSectionAnalyticsService,
  validateSectionProps,
  checkPatternCompliance,
  createMigrationHelper,
  
  // Constants
  STANDARD_BREAKPOINTS,
  DESIGN_TOKEN_CONVENTIONS,
  DEFAULT_ERROR_CONFIG,
  
  // Development utilities
  isDevelopment
};