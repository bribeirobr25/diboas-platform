/**
 * Goals — the Caixinhas-pattern object, diBoaS-voiced: a named want with a
 * horizon, funded from Working money, optionally put to work in a strategy.
 * Icons are Lucide icon NAMES (never emoji — anti-slop Part 1).
 */

import Decimal from 'decimal.js';
import { illustrativeMirror } from './jobs';

export interface GoalDraft {
  name: string;
  /** Lucide icon name from the curated picker set. */
  icon: string;
  targetAmount: number;
  horizonMonths: number;
}

/** Curated icon choices for goal personalization (all Lucide names). */
export const GOAL_ICONS = [
  'plane',
  'home',
  'shield',
  'graduation-cap',
  'heart',
  'car',
  'palmtree',
  'briefcase',
  'gift',
  'sprout',
] as const;

export const GOAL_NAME_MAX_LENGTH = 40;
export const GOAL_HORIZON_MIN_MONTHS = 1;
export const GOAL_HORIZON_MAX_MONTHS = 480; // 40 years — beyond that the form is a typo

export type GoalValidationError =
  'name_empty' | 'name_too_long' | 'icon_invalid' | 'target_not_positive' | 'horizon_out_of_range';

export function validateGoalDraft(draft: GoalDraft): GoalValidationError[] {
  const errors: GoalValidationError[] = [];
  const name = draft.name.trim();
  if (name.length === 0) errors.push('name_empty');
  if (name.length > GOAL_NAME_MAX_LENGTH) errors.push('name_too_long');
  if (!(GOAL_ICONS as readonly string[]).includes(draft.icon)) errors.push('icon_invalid');
  if (!(draft.targetAmount > 0) || !Number.isFinite(draft.targetAmount))
    errors.push('target_not_positive');
  if (
    !Number.isInteger(draft.horizonMonths) ||
    draft.horizonMonths < GOAL_HORIZON_MIN_MONTHS ||
    draft.horizonMonths > GOAL_HORIZON_MAX_MONTHS
  )
    errors.push('horizon_out_of_range');
  return errors;
}

/* -------------------------------------------------------------------------- */
/* Goal presets — illustrative, rule-of-thumb targets (NOT advice).           */
/*                                                                            */
/* Every figure below is a widely-cited rule of thumb the user then edits and */
/* owns; full provenance + sources + the annual-review rule live in           */
/* docs/sandbox-app/SANDBOX_GOAL_CONSTANTS_ATTESTATION.md. Copy must render    */
/* these as "a common rule of thumb is ~X", never "you should"/"recommended"  */
/* (Voice Q3 / CLO). The user's number always wins. A non-positive income     */
/* returns 0 — the no-salary sentinel the UI checks (plan F-A5).              */
/* -------------------------------------------------------------------------- */

/**
 * The sandbox markets. Kept in the domain package (the app maps its
 * locale → market at the call site, so @diboas/investing has no app dependency).
 */
export type GoalMarket = 'US' | 'BR' | 'DE' | 'ES';

/**
 * Safe Withdrawal Rate per market (2026 attested — see the constants doc,
 * reviewed annually). Financial-Freedom / "replace my job" target =
 * net-monthly-income × 12 ÷ SWR (the capital whose sustainable annual
 * withdrawal replaces a year of net income). A *real* (inflation-adjusted)
 * rate — distinct from the nominal return used for accumulation projections.
 */
export const FINANCIAL_FREEDOM_SWR: Record<GoalMarket, number> = {
  US: 0.039, // Morningstar 2026 (30-yr, 30–50% equity, 90% success)
  BR: 0.04, // AA40 Monte-Carlo conservative (band 3.69–4.5%; regime-dependent)
  DE: 0.0325, // Eurozone planner consensus (health-cost + premia)
  ES: 0.0325, // Spanish planner consensus (IRPF + inflation)
};

/** The "always invest" share of net income — the base suggested monthly contribution. */
export const MONTHLY_INVEST_SHARE = 0.1;

function isPositiveFinite(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

/**
 * Financial-Freedom ("replace my job") target for a market. Whole currency
 * units — false precision on an illustrative planning figure reads as a
 * promise (UX-61); the UI presents it as an approximation ("about X").
 */
export function financialFreedomTarget(netMonthlyIncome: number, market: GoalMarket): number {
  if (!isPositiveFinite(netMonthlyIncome)) return 0;
  return new Decimal(netMonthlyIncome)
    .mul(12)
    .div(FINANCIAL_FREEDOM_SWR[market])
    .toDecimalPlaces(0)
    .toNumber();
}

/**
 * Emergency-fund target = the attested Money Jobs cushion (essentials ×
 * cushionMonths), so the pre-set goal and the illustrative-mirror cushion are
 * ONE number (I2-D1). Market-dependent via the essentials share — deliberately
 * NOT the literal "income × 6" of proposal 3.1 (that over-states; 6× essentials
 * is the standard and attested basis). Pass `essentials` to use the user's real
 * figure (the 4.3 recompute).
 */
export function emergencyFundTarget(
  netMonthlyIncome: number,
  market: GoalMarket,
  essentials?: number
): number {
  const mirror = illustrativeMirror(netMonthlyIncome, market, { essentials });
  if (!mirror) return 0;
  return new Decimal(mirror.cushionTarget).toDecimalPlaces(0).toNumber();
}

/**
 * Base suggested monthly contribution (10% of net income). The user edits it
 * freely; the 4.3 spending-recompute (later phase) adjusts this illustratively
 * from actual costs — never prescriptively.
 */
export function suggestedMonthlyContribution(netMonthlyIncome: number): number {
  if (!isPositiveFinite(netMonthlyIncome)) return 0;
  return new Decimal(netMonthlyIncome).mul(MONTHLY_INVEST_SHARE).toDecimalPlaces(0).toNumber();
}

/**
 * The minimal honest projection (D-M2 option b): whole years to reach `target`
 * by contributing `monthlyContribution` at an assumed `annualRatePercent`
 * (future value of an annuity, solved for months). A calculator, NEVER a
 * prediction (UX-62) — the assumed rate must be stated wherever this renders,
 * and it is nominal, distinct from the SWR used for the FF target. Returns null
 * when inputs are non-positive or the target is unreachable. Plain float math
 * (log/pow) — this is an illustrative "~N years", not money to the cent.
 */
export function yearsToTarget(
  target: number,
  monthlyContribution: number,
  annualRatePercent: number
): number | null {
  if (!isPositiveFinite(target) || !isPositiveFinite(monthlyContribution)) return null;
  const annual = annualRatePercent / 100;
  if (!(annual > -1)) return null;
  const r = Math.pow(1 + annual, 1 / 12) - 1; // effective monthly rate
  const months =
    r <= 0
      ? target / monthlyContribution // no/negative growth → linear
      : Math.log(1 + (target * r) / monthlyContribution) / Math.log(1 + r);
  if (!Number.isFinite(months) || months <= 0) return null;
  return months / 12;
}

/**
 * Scenario rate envelope for the honest projection — the SAME three assumed
 * annual rates (percent) the web tools suite uses (conservative 7 / historical
 * 10 / optimistic 14, the digital-dollar USDC yield envelope). Defined here in
 * the domain package because `apps/sandbox` cannot import from `apps/web`; the
 * numbers are pinned to the same research anchor and reviewed on the same
 * cadence. These are ASSUMPTIONS a projection is drawn against, never a
 * forecast (UX-62 / Voice Q3) — copy must state the assumed range wherever a
 * projection renders.
 */
export const SCENARIO_RATES = { conservative: 7, historical: 10, optimistic: 14 } as const;

export interface ProjectionRange {
  /** Fewest years (optimistic rate) — the fast edge of the honest range. */
  minYears: number;
  /** Most years (conservative rate) — the slow edge. */
  maxYears: number;
}

/**
 * The honest projection as a RANGE of whole-ish years, not one deterministic
 * line: reach `target` by contributing `monthlyContribution`, drawn across the
 * scenario envelope. Returns null when even the optimistic scenario can't reach
 * the target (both edges null) — the UI then leads with the plan, not a number.
 * A calculator over stated assumptions (UX-60 visualize uncertainty, UX-62
 * calculator-not-prediction), never a promise.
 */
export function projectionRange(
  target: number,
  monthlyContribution: number,
  rates: { conservative: number; optimistic: number } = SCENARIO_RATES
): ProjectionRange | null {
  const slow = yearsToTarget(target, monthlyContribution, rates.conservative);
  const fast = yearsToTarget(target, monthlyContribution, rates.optimistic);
  if (slow == null && fast == null) return null;
  // If only one edge resolves, both edges collapse to it (still an honest bound).
  const maxYears = slow ?? (fast as number);
  const minYears = fast ?? (slow as number);
  return { minYears, maxYears };
}

/**
 * How the projected pace sits against the goal's own timeframe (WS-E on-track):
 * `within` (both edges land inside the horizon), `edge` (the horizon falls
 * inside the range), or `beyond` (even the fast edge runs longer). Compared
 * against the FULL `horizonMonths` (a real-life timeframe), NOT the compressed
 * sim clock — `simDay` is practice acceleration, not real months elapsed
 * (D-M2). A pace SIGNAL, never a guarantee (Voice Q3): the copy frames it as
 * "this pace," never "you will reach it." Returns null when the range or
 * horizon is unusable.
 */
export type PaceStatus = 'within' | 'edge' | 'beyond';

export function paceStatus(
  range: ProjectionRange | null,
  horizonMonths: number
): PaceStatus | null {
  if (!range || !(horizonMonths > 0)) return null;
  const horizonYears = horizonMonths / 12;
  if (range.maxYears <= horizonYears) return 'within';
  if (range.minYears <= horizonYears) return 'edge';
  return 'beyond';
}

export interface ProjectionDisplay {
  /** True when even the slow edge is under a year → a single "within a year" line. */
  underYear: boolean;
  /** Displayed whole years (>=1); when `single`, both are equal. */
  minYears: number;
  maxYears: number;
  single: boolean;
  /** Pace vs the goal's horizon — derived from the DISPLAYED years, never the raw range. */
  pace: PaceStatus | null;
}

/**
 * The single source of truth for what the projection surface shows AND how its
 * pace signal reads — kept in one pure function so the two can never disagree
 * (CLO board F-CLO-B3 / CC-1). The rounding for the displayed years and the
 * comparison the pace word makes are derived from the SAME basis: for the
 * multi-year case the pace compares the DISPLAYED integers (not the raw range),
 * so a rounding boundary can never make "about 2 years" sit next to "fits inside
 * 18 months". The under-a-year case keeps the raw sub-year range — "within a
 * year" is a coarse line the finer pace comparison complements, never
 * contradicts. Returns null when the target is unreachable (UI leads with the
 * plan, not a number).
 */
export function projectionDisplay(
  remaining: number,
  monthlyContribution: number,
  horizonMonths?: number
): ProjectionDisplay | null {
  const range = projectionRange(remaining, monthlyContribution);
  if (!range) return null;
  const underYear = range.maxYears < 1;
  const minYears = Math.max(1, Math.round(range.minYears));
  const maxYears = Math.max(1, Math.round(range.maxYears));
  const single = minYears === maxYears;
  const paceBasis = underYear ? range : { minYears, maxYears };
  const pace = horizonMonths != null ? paceStatus(paceBasis, horizonMonths) : null;
  return { underYear, minYears, maxYears, single, pace };
}
