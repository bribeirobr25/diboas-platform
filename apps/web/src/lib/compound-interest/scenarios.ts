/**
 * Scenario rates re-export.
 *
 * Source of truth lives in lib/market-data/constants.ts FALLBACK_MARKET_DATA.rates.scenarioRates.
 * This module is the stable name engineering imports — keeps the calculator's
 * dependency on the market-data domain explicit and one-directional.
 */

import type { ScenarioKey } from '@/lib/market-data/types';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

export type { ScenarioKey };

/** { conservative: 4, historical: 7, optimistic: 10 } — values are percentages. */
export const SCENARIO_RATES: Readonly<Record<ScenarioKey, number>> =
  FALLBACK_MARKET_DATA.rates.scenarioRates;
