/**
 * Scenario rates re-export.
 *
 * Source of truth lives in lib/market-data/constants.ts FALLBACK_MARKET_DATA.rates.scenarioRates.
 * This module is the stable name engineering imports — keeps the calculator's
 * dependency on the market-data domain explicit and one-directional.
 */

import type { ScenarioKey } from '@/lib/market-data/types';
// SDK_INVARIANT_OK: scenarioRates is `Status: Hardcoded` per iter5-sdk-migration-map.md
// (illustrative product config, set from research; the SDK does NOT populate this field). Re-exported
// here as a stable named constant for calculator-suite consumers — see file header.
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

export type { ScenarioKey };

/** { conservative, historical, optimistic } — illustrative scenario rates, in percent. The one
 *  source for every figure the calculators compute AND every figure the copy states
 *  (`scenarioCopy.ts` fills the catalogues' `{scenario…}` slots from it, 5.730). The rationale and
 *  its sources are in the lib/market-data/constants.ts header. */
export const SCENARIO_RATES: Readonly<Record<ScenarioKey, number>> =
  FALLBACK_MARKET_DATA.rates.scenarioRates;
