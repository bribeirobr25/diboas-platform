/**
 * Compound Interest Calculator constants.
 *
 * Event names follow the existing analytics pattern (snake_case, feature-prefixed).
 * Default inputs are tuned per locale to match the first vignette in
 * each locale's Beat 2 table (illustrative only — calculator output is
 * formula-precise and may diverge slightly from the static vignette numbers).
 */

import type { Cadence } from './types';
import type { SupportedLocale } from '@diboas/i18n/config';

export const INPUT_BOUNDS = {
  // max bumped 2026-05-12 (Phase 6E.2) to accommodate B2B Idle Cash Yield
  // tool's business-context defaults (~$100K). Slider UI still caps at smaller
  // typical values; numeric input + engine accept up to this ceiling.
  amount: { min: 0.01, max: 10_000_000 },
  years: { min: 1, max: 40 },
} as const;

export const DEBOUNCE_MS = {
  /** Display update — perceived immediacy without slider-drag flicker. */
  display: 250,
  /** Analytics — fires after user has stopped interacting. */
  analytics: 500,
} as const;

export const CALCULATOR_EVENTS = {
  OPENED: 'calculator_opened',
  AMOUNT_CHANGED: 'calculator_amount_changed',
  CADENCE_CHANGED: 'calculator_cadence_changed',
  YEARS_CHANGED: 'calculator_years_changed',
  SCENARIO_FOCUSED: 'calculator_scenario_focused',
  COMPUTATION_COMPLETED: 'calculator_computation_completed',
} as const;

export type CalculatorEventName =
  typeof CALCULATOR_EVENTS[keyof typeof CALCULATOR_EVENTS];

interface DefaultInput {
  amount: number;
  cadence: Cadence;
  years: number;
}

export const DEFAULT_INPUT_BY_LOCALE: Readonly<Record<SupportedLocale, DefaultInput>> = {
  en: { amount: 5, cadence: 'daily', years: 12 },
  'pt-BR': { amount: 25, cadence: 'daily', years: 12 },
  es: { amount: 3, cadence: 'daily', years: 12 },
  de: { amount: 4, cadence: 'daily', years: 12 },
};
