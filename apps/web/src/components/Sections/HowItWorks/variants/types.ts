/**
 * HowItWorks variant types.
 *
 * Centralized type definitions shared across all HowItWorks variants.
 */

import type { HowItWorksConfig } from '@/config/howItWorks';

/** Base props shared by all HowItWorks variants. */
export interface HowItWorksVariantProps {
  /** Configuration (already translated by the Factory before reaching the variant). */
  readonly config: HowItWorksConfig;
  /** Optional CSS class for custom styling. */
  readonly className?: string;
  /** Whether to emit impression/interaction analytics. */
  readonly enableAnalytics?: boolean;
}

/** Registry mapping variant names to their components. */
export type HowItWorksVariantMap = Record<
  NonNullable<HowItWorksConfig['variant']>,
  React.ComponentType<HowItWorksVariantProps>
>;
