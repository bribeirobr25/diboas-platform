/**
 * Shared input-clamp helper for the calculator suite (Phase 3 §3.1, 2026-05-25).
 *
 * Closes the C14 / C27 / C34 / C36 family — pre-Phase-3, every standalone
 * calculator's `<input min/max>` was advisory only; the actual `clamp()` used
 * far wider bounds (e.g. `clamp(value, 0, 1_000_000)` while `<input min={1}
 * max={24}>`). A user typing past the UI max was silently accepted.
 *
 * Now: every tool reads its bounds from a single typed constant. The component
 * passes `<input min={B.min} max={B.max}>` AND calls `clampInput(value, B)`
 * with the SAME constant — the UI affordance and the state-setter agree by
 * construction.
 *
 * Soft-validation (C35): `softMaxWarning` exposes a threshold + i18n key so a
 * value above the threshold renders an inline `aria-live="polite"` warning
 * WITHOUT blocking the input (the cap stays at `max`; the warning is
 * advisory). Card-fees's `processorFeePct` is the first consumer.
 *
 * Honors:
 *   - P5 Semantic Naming: `[VERB][Entity]_BOUNDS` for the constants.
 *   - P8 Security (coding-standards.md §8 "Validate all inputs"): single
 *     source of truth for input bounds; no widening at the consumer.
 */

export interface SoftMaxWarning {
  /** Value above which the warning renders. Inclusive comparison: > threshold. */
  readonly threshold: number;
  /** i18n key for the warning message (resolved by the calling component). */
  readonly messageKey: string;
}

export interface NumberInputBounds {
  readonly min: number;
  readonly max: number;
  readonly softMaxWarning?: SoftMaxWarning;
}

/**
 * Clamp `value` to `[bounds.min, bounds.max]`. Non-finite inputs (NaN, ±Infinity)
 * fall back to `bounds.min` per defensive default. Matches the pattern that
 * was inlined across every calculator before Phase 3.
 */
export function clampInput(value: number, bounds: NumberInputBounds): number {
  if (!Number.isFinite(value)) return bounds.min;
  return Math.min(Math.max(value, bounds.min), bounds.max);
}

/**
 * True if the value crosses the soft warning threshold. Used by the calling
 * component to decide whether to render the warning slot.
 */
export function exceedsSoftMaxWarning(value: number, bounds: NumberInputBounds): boolean {
  return bounds.softMaxWarning !== undefined && value > bounds.softMaxWarning.threshold;
}

// ─────────────────────────────────────────────────────────────────────────
// Per-tool input bounds (single source of truth)
// ─────────────────────────────────────────────────────────────────────────

/** Emergency Fund `targetMultiplier` (months of expenses). UI: 1–24. */
export const EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS: NumberInputBounds = {
  min: 1,
  max: 24,
};

/** Inflation Impact `years`. Forward-mode only. UI: 1–40. */
export const INFLATION_IMPACT_YEARS_BOUNDS: NumberInputBounds = {
  min: 1,
  max: 40,
};

/**
 * Card-Fees `processorFeePct` (percent — 2.9 means 2.9%). Card fees realistically
 * sit in a 0.3–3.5% band; the 20% cap is a generous absolute ceiling; the soft
 * warning at 5% catches typos like `29` for `2.9` (C35).
 */
export const CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS: NumberInputBounds = {
  min: 0,
  max: 20,
  softMaxWarning: {
    threshold: 5,
    messageKey: 'tools-card-fees.warnings.feeTooHigh',
  },
};

/** Idle-Cash `bankYieldPct` (percent). UI: 0–50%. */
export const IDLE_CASH_BANK_YIELD_PCT_BOUNDS: NumberInputBounds = {
  min: 0,
  max: 50,
};

/**
 * Currency-Depreciation `amount`. Personal-finance tool — 100M ceiling is
 * generous (accommodates HNW users with non-trivial FX exposure) but
 * deliberately below the compound-interest INPUT_BOUNDS.amount.max (1B) set
 * for B2B idle-cash treasuries under Phase C Decision S3. Per CTO-board v3
 * Action 6 (2026-05-26).
 */
export const CURRENCY_DEPRECIATION_AMOUNT_BOUNDS: NumberInputBounds = {
  min: 0,
  max: 100_000_000,
};

/** Currency-Depreciation `years`. Forward-mode horizon. UI: 1–40. */
export const CURRENCY_DEPRECIATION_YEARS_BOUNDS: NumberInputBounds = {
  min: 1,
  max: 40,
};
