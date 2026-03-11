/**
 * CalculatorFactory Configuration
 *
 * Configuration interface for the unified calculator component.
 * Two variants: 'cashflow' (fee savings) and 'treasury' (idle cash growth).
 * Both share: 2 input fields, period toggle, 3-scenario results table,
 * adjustable rate slider (1%-15%).
 *
 * Default numeric values stored as raw numbers in locale defaults map,
 * NOT in i18n JSON, to avoid NaN from locale-specific number formatting.
 */

export type CalculatorVariant = 'cashflow' | 'treasury';

/**
 * Locale-specific numeric defaults for calculator inputs.
 * Raw numbers only — no formatted strings — to prevent NaN from parseFloat().
 */
export interface CalculatorLocaleDefaults {
  readonly [locale: string]: {
    readonly field1: number;
    readonly field2: number;
  };
}

export interface CalculatorFactoryConfig {
  readonly variant: CalculatorVariant;
  readonly content: {
    readonly header: string;
    readonly fields: {
      readonly field1: string;
      readonly field2: string;
    };
    readonly periodToggle: {
      readonly month: string;
      readonly sixMonths: string;
      readonly year: string;
    };
    readonly disclaimer: string;
    readonly todayTitle?: string;
    readonly tomorrowTitle?: string;
    readonly results: {
      readonly step1Label: string;
      readonly step2Label: string;
      readonly savingsLabel?: string;
      readonly headers?: Record<string, string>;
      readonly scenarios: {
        readonly conservative: string;
        readonly historical: string;
        readonly optimistic: string;
      };
      readonly likelyBadge?: string;
    };
    readonly sliderLabel: string;
    readonly belowResults: string;
    readonly customRateTemplate?: string;
    readonly cta: string;
    readonly ctaHref: string;
    readonly transitionHook?: string;
  };
  readonly defaults: CalculatorLocaleDefaults;
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
