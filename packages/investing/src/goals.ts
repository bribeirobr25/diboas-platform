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
