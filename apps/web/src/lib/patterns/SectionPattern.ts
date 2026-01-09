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
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// ================================

// Core section types
export type {
  BaseSectionProps,
  BaseSectionConfig,
  SectionSEOConfig,
  ExtractVariant,
  ExtractConfig,
  RequireConfig,
  SectionComponentFactory
} from './sectionTypes';

// Analytics patterns
export type {
  SectionAnalyticsConfig,
  SectionAnalyticsService
} from './sectionAnalyticsTypes';

// Performance patterns
export type {
  SectionPerformanceConfig,
  SectionLoadingState,
  SectionErrorConfig,
  SectionErrorHandler
} from './sectionPerformanceTypes';

// Accessibility patterns
export type {
  SectionAccessibilityConfig,
  SectionBreakpoints,
  SectionResponsiveConfig
} from './sectionAccessibilityTypes';

// Content patterns
export type {
  BaseSectionContentItem,
  SectionContentCollection
} from './sectionContentTypes';

// Design token utilities
export type { DesignTokenConvention } from './sectionDesignTokens';
export { DesignTokenGenerator, DESIGN_TOKEN_CONVENTIONS } from './sectionDesignTokens';

// Default configurations
export {
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG,
  STANDARD_BREAKPOINTS,
  DEFAULT_ERROR_CONFIG
} from './sectionDefaults';
