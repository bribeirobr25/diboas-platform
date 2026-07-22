/**
 * The jobs split — every amount gets a job before it moves (the campaign's
 * core idea, operationalized). Floor stays put; Cushion waits; Working is
 * free to work. Percentages are whole numbers summing to 100.
 *
 * The default split follows the Money Jobs safety-first posture (floor-led);
 * the user adjusts freely — nothing is locked, nothing is pre-picked to
 * favour us (SANDBOX_RULES R-3).
 */

export interface JobsSplit {
  floorPercent: number;
  cushionPercent: number;
  workingPercent: number;
}

/** Safety-first default: half protected, a real cushion, a working share. */
export const DEFAULT_SPLIT: JobsSplit = {
  floorPercent: 50,
  cushionPercent: 30,
  workingPercent: 20,
};

export function isValidSplit(split: JobsSplit): boolean {
  const { floorPercent, cushionPercent, workingPercent } = split;
  const parts = [floorPercent, cushionPercent, workingPercent];
  if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > 100)) return false;
  return floorPercent + cushionPercent + workingPercent === 100;
}

/* -------------------------------------------------------------------------- */
/* Attested Money Jobs model (the illustrative life-mirror).                  */
/*                                                                            */
/* The sandbox reframe (I2-D2): from the user's real monthly income we show   */
/* Floor (essentials) / Cushion (safety net) / Working (free to grow) as an   */
/* illustrative MIRROR of their whole financial life — context, never advice  */
/* (Voice Q3). diBoaS only ever operates on the Working slice; the play grant */
/* IS that Working money. This is a faithful SUBSET of the web Money Jobs      */
/* engine (apps/web/src/lib/money-jobs) — the split shares only, none of the  */
/* cost-line / gated-plan machinery. Constants are the SAME attested values;  */
/* provenance = docs/tools/MONEY_JOBS_CONSTANTS_ATTESTATION.md, guarded here   */
/* by a drift test. (Known duplication with the web copy — reconcile by having */
/* the web import this package later; both pinned to the same doc meanwhile.) */
/* -------------------------------------------------------------------------- */

import type { GoalMarket } from './goals';

export const MONEY_JOBS_MODEL = {
  /** Share of NET income that is essentials (Basis A) — the Floor. Per market. */
  essentialsShare: {
    US: 0.62, // BLS CES 2023 after-tax
    BR: 0.61, // IBGE POF 2017-18 (72.2% is share-of-consumption — do NOT "correct" back)
    ES: 0.56, // INE EPF 2024 / ECV
    DE: 0.47, // Destatis LWR 2022
  } satisfies Record<GoalMarket, number>,
  cushionMonths: 6, // flat; aligns with the emergency-fund target multiplier
  prudenceFactor: 0.75, // anti-hype slack on the working "ideal"
  dignityFloorRatio: 0.05, // surplus below 5% of income → protection leads, split suppressed
} as const;

export interface IllustrativeMirror {
  /** Floor — monthly essentials (a standing job). */
  readonly floor: number;
  /** Cushion target — the safety-net stock (essentials × cushionMonths). */
  readonly cushionTarget: number;
  /** Working — monthly surplus free to grow (0 in the dignity state). */
  readonly working: number;
  /** Working "ideal" — surplus × prudenceFactor (the slack number). */
  readonly workingIdeal: number;
  /** True when the month's job is holding you up (surplus below the dignity floor). */
  readonly dignityState: boolean;
  /** True when essentials was assumed from the market share (not user-provided). */
  readonly essentialsAssumed: boolean;
}

/**
 * The illustrative life-mirror from net monthly income. Essentials defaults to
 * `income × essentialsShare[market]`; pass `opts.essentials` (the 4.3 recompute)
 * to use the user's real figure instead. Returns null for invalid income.
 * Illustrative only — never advice.
 */
export function illustrativeMirror(
  netMonthlyIncome: number,
  market: GoalMarket,
  opts?: { essentials?: number }
): IllustrativeMirror | null {
  if (!Number.isFinite(netMonthlyIncome) || netMonthlyIncome <= 0) return null;

  const provided =
    opts?.essentials != null && Number.isFinite(opts.essentials) && opts.essentials >= 0;
  const essentials = provided
    ? (opts!.essentials as number)
    : netMonthlyIncome * MONEY_JOBS_MODEL.essentialsShare[market];

  const surplus = netMonthlyIncome - essentials;
  const dignityState = surplus <= netMonthlyIncome * MONEY_JOBS_MODEL.dignityFloorRatio;
  const working = dignityState ? 0 : surplus;

  return {
    floor: essentials,
    cushionTarget: essentials * MONEY_JOBS_MODEL.cushionMonths,
    working,
    workingIdeal: working * MONEY_JOBS_MODEL.prudenceFactor,
    dignityState,
    essentialsAssumed: !provided,
  };
}
