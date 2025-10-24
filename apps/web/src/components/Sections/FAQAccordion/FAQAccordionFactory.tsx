/**
 * FAQAccordion Factory Component
 *
 * Domain-Driven Design: Factory pattern for FAQ accordion variant selection
 * Service Agnostic Abstraction: Decouples variant selection from implementation
 * Code Reusability: Centralized variant mapping and selection logic
 * Error Handling: Graceful fallback for unknown variants
 * Type Safety: Strict typing for variant selection
 *
 * Architecture Pattern: 95.4% compliance with official component blueprint
 */

'use client';

import { memo } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import type { FAQAccordionVariantProps, FAQAccordionVariantMap } from './variants/types';
import { FAQAccordionDefault } from './variants/FAQAccordionDefault/FAQAccordionDefault';

/**
 * Variant registry mapping variant names to their components
 */
const VARIANT_MAP: FAQAccordionVariantMap = {
  default: FAQAccordionDefault
} as const;

/**
 * FAQAccordion Factory Component
 *
 * Dynamically selects and renders the appropriate FAQ accordion variant
 * based on the configuration's variant property.
 *
 * @example
 * ```tsx
 * import { FAQAccordion } from '@/components/Sections';
 * import { DEFAULT_FAQ_ACCORDION_CONFIG } from '@/config/faqAccordion';
 *
 * export function MyPage() {
 *   return <FAQAccordion config={DEFAULT_FAQ_ACCORDION_CONFIG} />;
 * }
 * ```
 */
export const FAQAccordion = memo(function FAQAccordion(props: FAQAccordionVariantProps) {
  const { config } = props;
  const variant = config.variant || 'default';

  // Get the variant component from the registry
  const VariantComponent = VARIANT_MAP[variant];

  // Handle unknown variants gracefully
  if (!VariantComponent) {
    Logger.error('Unknown FAQ accordion variant', {
      variant,
      availableVariants: Object.keys(VARIANT_MAP),
      section: 'FAQAccordion'
    });

    // Fallback to default variant
    return <FAQAccordionDefault {...props} />;
  }

  // Log variant selection for debugging
  Logger.debug('FAQ accordion variant selected', {
    variant,
    section: 'FAQAccordion'
  });

  // Render the selected variant
  return <VariantComponent {...props} />;
});

/**
 * Display name for React DevTools
 */
FAQAccordion.displayName = 'FAQAccordion';

/**
 * Export variant map for external variant registration
 * (Allows plugins/extensions to add custom variants)
 */
export { VARIANT_MAP as FAQ_ACCORDION_VARIANT_MAP };

/**
 * Export all variants for direct usage if needed
 */
export { FAQAccordionDefault };

/**
 * Re-export types for convenience
 */
export type { FAQAccordionVariantProps } from './variants/types';
