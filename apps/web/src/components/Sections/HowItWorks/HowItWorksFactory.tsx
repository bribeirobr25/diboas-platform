/**
 * HowItWorks Factory Component
 *
 * Domain-Driven Design: Factory pattern for HowItWorks variant selection.
 * Service Agnostic: decouples variant selection from implementation.
 * Internationalization: translates the config via `useConfigTranslation` before
 * handing it to the variant. Error Handling: graceful fallback for unknown
 * variants.
 */

'use client';

import { memo } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { HowItWorksConfig } from '@/config/howItWorks';
import type { HowItWorksVariantProps, HowItWorksVariantMap } from './variants/types';
import { HowItWorksThreeUp } from './variants/HowItWorksThreeUp';

/** Variant registry. */
const VARIANT_MAP: HowItWorksVariantMap = {
  threeUp: HowItWorksThreeUp,
} as const;

export interface HowItWorksProps {
  readonly config: HowItWorksConfig;
  readonly className?: string;
  readonly enableAnalytics?: boolean;
}

/**
 * Selects and renders the appropriate HowItWorks variant based on
 * `config.variant`, with the config translated for the active locale.
 *
 * @example
 * ```tsx
 * import { HowItWorks } from '@/components/Sections';
 * import { B2C_HOW_IT_WORKS_VISUAL_CONFIG } from '@/config/howItWorks';
 *
 * <HowItWorks config={B2C_HOW_IT_WORKS_VISUAL_CONFIG} />
 * ```
 */
export const HowItWorks = memo(function HowItWorks({ config, ...restProps }: HowItWorksProps) {
  const variant = config.variant || 'threeUp';
  const translatedConfig = useConfigTranslation(config);

  const VariantComponent = VARIANT_MAP[variant];

  if (!VariantComponent) {
    Logger.error('Unknown HowItWorks variant', {
      variant,
      availableVariants: Object.keys(VARIANT_MAP),
      section: 'HowItWorks',
    });
    return <HowItWorksThreeUp config={translatedConfig} {...restProps} />;
  }

  return <VariantComponent config={translatedConfig} {...restProps} />;
});

HowItWorks.displayName = 'HowItWorks';

export { VARIANT_MAP as HOW_IT_WORKS_VARIANT_MAP };
export { HowItWorksThreeUp };
export type { HowItWorksVariantProps } from './variants/types';
