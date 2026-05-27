/**
 * Currency bucket classification — FX-16 adoption D10 / Q2 (2026-05-26).
 *
 * Source: `docs/tools/usd_fx_projection_model_consolidated.md` §8 — the FX
 * model groups currencies into 3 narrative buckets plus 2 special cases:
 *
 *   - `pain`  — currency-pain markets (BRL/INR/MXN/ZAR): clear cumulative
 *     erosion; the protect-purchasing-power narrative.
 *   - `hub`   — capital / crypto / wealth hubs (SGD/HKD/AED/CHF/ILS/KRW):
 *     not driven by FX pain; international-strategy narrative.
 *   - `major` — stable majors (EUR/GBP/CAD/AUD/JPY/PLN): moderate drift.
 *   - `peg`   — pegged to USD (HKD/AED in §8.3): FX = 0 by policy.
 *   - `usd`   — the dollar itself; no FX, no narrative.
 *
 * **Why this lives here and NOT on the rate data** (per D10): FX rates are
 * `Status: Hardcoded` market-data config in `iter5-sdk-migration-map.md` —
 * the SDK could populate them. Bucket classification is product positioning
 * the SDK must never touch. Keeping the two separate honors the migration-map
 * taxonomy and the P1 (DDD) boundary between market-data and consuming-tool
 * domains.
 *
 * **Why this lives here and NOT in the component** (per D10): a future second
 * consumer (e.g., post-launch <optgroup> picker per D11's tracked v2 candidate,
 * or a marketing-page bucket-aware copy variant) would duplicate the map.
 * Single source = P4 (DRY).
 *
 * HKD and AED are *both* hubs and pegs in the model — the more specific
 * classification (`peg`) wins for UI / math handling (FX = 0 is the load-bearing
 * fact). Marketing narratives can still treat them as hubs separately.
 */

import type { CurrencyDepreciationOption } from './calculator';

export type BucketKey = 'usd' | 'pain' | 'hub' | 'major' | 'peg';

export const CURRENCY_BUCKET: Record<CurrencyDepreciationOption, BucketKey> = {
  USD: 'usd',
  // Currency-pain markets — cumulative-erosion narrative.
  BRL: 'pain',
  INR: 'pain',
  MXN: 'pain',
  ZAR: 'pain',
  // Capital / crypto / wealth hubs — international-strategy narrative.
  SGD: 'hub',
  ILS: 'hub',
  KRW: 'hub',
  CHF: 'hub',
  // Stable majors — moderate-drift narrative.
  EUR: 'major',
  GBP: 'major',
  CAD: 'major',
  AUD: 'major',
  JPY: 'major',
  PLN: 'major',
  // Pegged to USD — FX = 0 by policy; the more specific classification wins
  // over `hub` for HKD/AED, since the load-bearing UI/math fact is FX = 0.
  HKD: 'peg',
  AED: 'peg',
};
