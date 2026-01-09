/**
 * BenefitsCards Section Factory
 *
 * Factory Pattern: Dynamic variant selection based on configuration
 * Domain-Driven Design: Section factory for benefits display domain
 * Service Agnostic Abstraction: Variant-agnostic interface
 * Code Reusability: Single entry point for all BenefitsCards variants
 */

'use client';

import { useMemo } from 'react';
import { BenefitsCardsDefault } from './variants/BenefitsCardsDefault/BenefitsCardsDefault';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { BenefitsCardsConfig, BenefitsCardsVariant } from './types';

/**
 * Props for BenefitsCards section factory
 */
export interface BenefitsCardsSectionProps {
  /** Section configuration data */
  config: BenefitsCardsConfig;

  /** Variant to render (default: 'default') */
  variant?: BenefitsCardsVariant;

  /** Optional additional CSS class */
  className?: string;

  /** Enable performance monitoring (default: true) */
  enableAnalytics?: boolean;

  /** Priority loading for above-the-fold content */
  priority?: boolean;
}

/**
 * BenefitsCards Section Factory Component
 *
 * Dynamically selects and renders the appropriate variant based on configuration.
 *
 * @example
 * ```tsx
 * import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
 * import { benefitsCardsConfig } from '@/data/benefits-cards';
 *
 * export function MyPage() {
 *   return (
 *     <BenefitsCardsSection
 *       config={benefitsCardsConfig}
 *       variant="default"
 *       priority={true}
 *     />
 *   );
 * }
 * ```
 */
export function BenefitsCardsSection({
  config,
  variant = 'default',
  className = '',
  enableAnalytics = true,
  priority = false
}: BenefitsCardsSectionProps) {
  // Internationalization: Translate config using translation keys
  const translatedConfig = useConfigTranslation(config);

  // Variant factory: Map variant names to components
  const variantComponents = {
    default: BenefitsCardsDefault
  };

  // Select the appropriate variant component
  const VariantComponent = variantComponents[variant];

  // Fallback to default variant if unknown variant is requested
  if (!VariantComponent) {
    // Unknown variant - fallback to default
    return (
      <BenefitsCardsDefault
        config={translatedConfig}
        className={className}
        enableAnalytics={enableAnalytics}
        priority={priority}
      />
    );
  }

  // Render the selected variant
  return (
    <VariantComponent
      config={translatedConfig}
      className={className}
      enableAnalytics={enableAnalytics}
      priority={priority}
    />
  );
}

// Export types for external use
export type { BenefitsCardsConfig, BenefitsCardsVariant, BenefitCard } from './types';
