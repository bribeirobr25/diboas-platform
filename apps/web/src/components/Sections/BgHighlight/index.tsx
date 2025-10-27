/**
 * BgHighlight Section Factory
 *
 * Domain-Driven Design: Background highlight section orchestration
 * Factory Pattern: Dynamic variant selection and rendering
 * Service Agnostic Abstraction: Decoupled variant implementations
 * Error Handling: Graceful fallback for unknown variants
 */

import type { BgHighlightSectionProps, BgHighlightVariant } from './types';
import { BgHighlightDefault } from './variants/BgHighlightDefault/BgHighlightDefault';

/**
 * BgHighlight Section Component (Factory Pattern)
 *
 * Dynamically renders the appropriate BgHighlight variant based on configuration.
 *
 * Supported Variants:
 * - default: Full-width background image with bottom-left content
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
 * import { BgHighlightSection } from '@/components/Sections/BgHighlight';
 * import { bgHighlightConfig } from '@/config/bgHighlight';
 *
 * export function MyPage() {
 *   return (
 *     <BgHighlightSection
 *       config={bgHighlightConfig}
 *       variant="default"
 *       enableAnalytics={true}
 *       priority={true}
 *     />
 *   );
 * }
 * ```
 *
 * @param config - Section configuration
 * @param variant - Variant to render (default: 'default')
 * @param className - Additional CSS class names
 * @param enableAnalytics - Enable analytics tracking
 * @param priority - Priority loading for LCP optimization
 */
export function BgHighlightSection({
  config,
  variant = 'default',
  className = '',
  enableAnalytics = true,
  priority = false
}: BgHighlightSectionProps) {
  // Variant component mapping
  const variantComponents: Record<BgHighlightVariant, typeof BgHighlightDefault> = {
    default: BgHighlightDefault
  };

  // Get the variant component
  const VariantComponent = variantComponents[variant];

  // Handle unknown variant (graceful fallback)
  if (!VariantComponent) {
    console.warn(
      `BgHighlight: Unknown variant "${variant}". Falling back to "default".`
    );
    return (
      <BgHighlightDefault
        config={config}
        className={className}
        enableAnalytics={enableAnalytics}
        priority={priority}
      />
    );
  }

  // Render the selected variant
  return (
    <VariantComponent
      config={config}
      className={className}
      enableAnalytics={enableAnalytics}
      priority={priority}
    />
  );
}

// Re-export types for convenience
export type {
  BgHighlightConfig,
  BgHighlightVariant,
  BgHighlightSectionProps,
  BgHighlightVariantProps,
  BgHighlightImage,
  BgHighlightContent,
  BgHighlightSEO,
  BgHighlightAnalytics
} from './types';
