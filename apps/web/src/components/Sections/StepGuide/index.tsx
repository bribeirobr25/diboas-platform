/**
 * StepGuide Section Factory
 *
 * Domain-Driven Design: Step-by-step guide section orchestration
 * Factory Pattern: Dynamic variant selection and rendering
 * Service Agnostic Abstraction: Decoupled variant implementations
 * Error Handling: Graceful fallback for unknown variants
 */

import type { StepGuideSectionProps, StepGuideVariant } from './types';
import { StepGuideDefault } from './variants/StepGuideDefault/StepGuideDefault';

/**
 * StepGuide Section Component (Factory Pattern)
 *
 * Dynamically renders the appropriate StepGuide variant based on configuration.
 *
 * Supported Variants:
 * - default: Numbered step guide with white rounded background
 *
 * Features:
 * - Variant-based rendering with factory pattern
 * - Graceful fallback for unknown variants
 * - Type-safe variant selection
 * - Performance optimization with lazy loading
 * - Analytics and SEO support
 *
 * @example
 * ```tsx
 * import { StepGuideSection } from '@/components/Sections/StepGuide';
 * import { stepGuideConfig } from '@/config/stepGuide';
 *
 * export function MyPage() {
 *   return (
 *     <StepGuideSection
 *       config={stepGuideConfig}
 *       variant="default"
 *       enableAnalytics={true}
 *     />
 *   );
 * }
 * ```
 *
 * @param config - Section configuration
 * @param variant - Variant to render (default: 'default')
 * @param className - Additional CSS class names
 * @param enableAnalytics - Enable analytics tracking
 */
export function StepGuideSection({
  config,
  variant = 'default',
  className = '',
  enableAnalytics = true
}: StepGuideSectionProps) {
  // Variant component mapping
  const variantComponents: Record<StepGuideVariant, typeof StepGuideDefault> = {
    default: StepGuideDefault
  };

  // Get the variant component
  const VariantComponent = variantComponents[variant];

  // Handle unknown variant (graceful fallback)
  if (!VariantComponent) {
    // Unknown variant - fallback to default
    return (
      <StepGuideDefault
        config={config}
        className={className}
        enableAnalytics={enableAnalytics}
      />
    );
  }

  // Render the selected variant
  return (
    <VariantComponent
      config={config}
      className={className}
      enableAnalytics={enableAnalytics}
    />
  );
}

// Re-export types for convenience
export type {
  StepGuideConfig,
  StepGuideVariant,
  StepGuideSectionProps,
  StepGuideVariantProps,
  Step,
  StepGuideContent,
  StepGuideSEO,
  StepGuideAnalytics
} from './types';
