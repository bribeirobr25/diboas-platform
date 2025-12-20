/**
 * DemoEmbed Section Factory
 *
 * Domain-Driven Design: Demo embed section orchestration
 * Factory Pattern: Dynamic variant selection and rendering
 * Service Agnostic Abstraction: Decoupled variant implementations
 * Error Handling: Graceful fallback for unknown variants
 */

import type { DemoEmbedSectionProps, DemoEmbedVariant } from './types';
import { DemoEmbedDefault } from './variants/DemoEmbedDefault/DemoEmbedDefault';

/**
 * DemoEmbed Section Component (Factory Pattern)
 *
 * Dynamically renders the appropriate DemoEmbed variant based on configuration.
 *
 * Supported Variants:
 * - default: Centered header with demo embed area
 *
 * Features:
 * - Variant-based rendering with factory pattern
 * - Graceful fallback for unknown variants
 * - Type-safe variant selection
 * - Support for iframe embeds or custom components
 * - Analytics and SEO support
 *
 * @example
 * ```tsx
 * import { DemoEmbedSection } from '@/components/Sections/DemoEmbed';
 *
 * export function MyPage() {
 *   return (
 *     <DemoEmbedSection
 *       config={{
 *         content: {
 *           header: 'landing-b2c.demo.header',
 *           subtext: 'landing-b2c.demo.subtext'
 *         },
 *         demo: {
 *           embedUrl: 'https://demo.diboas.com'
 *         },
 *         seo: { headingLevel: 'h2' }
 *       }}
 *       variant="default"
 *       enableAnalytics={true}
 *     />
 *   );
 * }
 * ```
 */
export function DemoEmbedSection({
  config,
  variant = 'default',
  className = '',
  enableAnalytics = true
}: DemoEmbedSectionProps) {
  // Variant component mapping
  const variantComponents: Record<DemoEmbedVariant, typeof DemoEmbedDefault> = {
    default: DemoEmbedDefault
  };

  // Get the variant component
  const VariantComponent = variantComponents[variant];

  // Handle unknown variant (graceful fallback)
  if (!VariantComponent) {
    console.warn(
      `DemoEmbed: Unknown variant "${variant}". Falling back to "default".`
    );
    return (
      <DemoEmbedDefault
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
  DemoEmbedConfig,
  DemoEmbedVariant,
  DemoEmbedSectionProps,
  DemoEmbedVariantProps,
  DemoEmbedContent,
  DemoEmbedDemo,
  DemoEmbedSEO,
  DemoEmbedAnalytics
} from './types';
