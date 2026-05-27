/**
 * Scenario rates re-export.
 *
 * Source of truth lives in lib/market-data/constants.ts FALLBACK_MARKET_DATA.rates.scenarioRates.
 * This module is the stable name engineering imports — keeps the calculator's
 * dependency on the market-data domain explicit and one-directional.
 */

import type { ScenarioKey } from '@/lib/market-data/types';
// SDK_INVARIANT_OK: scenarioRates is `Status: Hardcoded` per iter5-sdk-migration-map.md
// (research-anchored product config; the SDK does NOT populate this field). Re-exported
// here as a stable named constant for calculator-suite consumers — see file header.
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

export type { ScenarioKey };

/** { conservative: 7, historical: 10, optimistic: 14 } — values are percentages.
 *  Updated 2026-05-12 to reflect digital-dollar (USDC) yield envelope across
 *  Solana-first DeFi stack — see lib/market-data/constants.ts header for sourcing. */
export const SCENARIO_RATES: Readonly<Record<ScenarioKey, number>> =
  FALLBACK_MARKET_DATA.rates.scenarioRates;
