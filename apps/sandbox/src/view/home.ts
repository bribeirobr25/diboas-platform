import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import { goalCurrentValue } from '@/lib/goalValue';

/**
 * `view/` — the view-model (selector) seam. P03's layer C, implemented.
 *
 * ## Why this layer exists
 *
 * Every P0/P1 honesty defect this project found on a money surface was a
 * calculation or a truth-decision performed inside a React component: the time
 * machine reporting the user's own deposits as market change (`5.199`), a net
 * amount beside a gross CTA (`5.230`), target-reached derived twice (`5.224`),
 * the Home triad composed in JSX. The counter-example proves the remedy:
 * `lib/monthReport.ts` derives from the conservation identity and checks that
 * identity before claiming to explain anything — and produced no findings.
 *
 * So components receive derived, already-truthful values and render them. They
 * never compute money, never derive a truth class, never decide freshness.
 *
 * ## The contract (architecture plan §3.2 rule 3, gate `VIEW-1`)
 *
 * Selectors are **pure**: `select*(state, snapshot, prefs) → ViewModel`.
 * No React, no `next/*`, no I/O, no ledger writes, no market fetching.
 * Orchestration fetches; selectors receive data as arguments. That is what
 * makes this layer testable with no DOM and no network.
 *
 * ## Why the ViewModel carries STRINGS, not `Decimal`
 *
 * A deliberate choice, and it is what lets `VIEW-2` ever reach `error`. If a
 * selector handed back `Decimal` instances, every consuming component would
 * still import `decimal.js` to type its props — the ban would be unenforceable
 * and the seam cosmetic. Strings cross the boundary as display-only values;
 * `hooks/useFormatters` already accepts `string | number`, so the convention
 * matches what the app does today. Money arithmetic stays on this side, in
 * `Decimal`, where it is exact.
 */

/** Home's money summary. Every field is a fixed-2dp display string. */
export interface HomeTriad {
  /** Undeployed money: the working + floor buckets. */
  available: string;
  /** Money committed to goals: uninvested goal cash + open positions' value. */
  working: string;
  /** The cushion bucket. */
  emergency: string;
  /** available + working + emergency. The hero figure. */
  playBalance: string;
  /**
   * Whether the emergency column may render at all.
   *
   * ABSENT OVER FALSE (board §6a). The cushion bucket's only writer was deleted
   * in the R1 re-audit, so the column can today only ever read 0.00 — and shown
   * at zero it actively misleads: a user whose goal is literally named
   * "Emergency fund" and holds real value was told their reserve was zero,
   * directly above it. The rule is a PRODUCT decision, so it belongs here with
   * the number it governs, not as a `.gt(0)` comparison inside JSX. The column
   * returns by itself the day a producer exists.
   */
  showEmergency: boolean;
}

/**
 * Home's three tones and the hero total.
 *
 * The tones sum to `playBalance` by construction: funding a goal moves cash
 * from the working bucket into `goal.cash` (engine `GoalFunded`), so goal cash
 * MUST be counted in `working` or the hero silently understates the user's
 * money. That omission was a real defect once (Home and Move both dropped it),
 * which is why the sum is asserted in this module's test rather than trusted.
 */
export function selectHomeTriad(state: LedgerState): HomeTriad {
  const available = new Decimal(state.buckets.working).plus(state.buckets.floor);

  const positionsValue = state.positions
    .filter((p) => p.open)
    .reduce((sum, p) => sum.plus(p.principal).plus(p.accrued), new Decimal(0));

  // Reuses the shared derivation rather than re-deriving: `goalCurrentValue` is
  // the single source of truth for "how much is in this goal right now", and it
  // already counts uninvested cash plus open positions. Summing it per goal
  // would double-count the positions above, so `working` adds goal CASH only —
  // the positions term is already there.
  const goalCash = state.goals.reduce((sum, g) => sum.plus(g.cash), new Decimal(0));
  const working = positionsValue.plus(goalCash);

  const emergency = new Decimal(state.buckets.cushion);
  const playBalance = available.plus(working).plus(emergency);

  return {
    available: available.toFixed(2),
    working: working.toFixed(2),
    emergency: emergency.toFixed(2),
    playBalance: playBalance.toFixed(2),
    showEmergency: emergency.gt(0),
  };
}

/**
 * A goal's progress, for any surface that shows a goal.
 *
 * `targetReached` delegates to `lib/goalValue.goalTargetReached` — the derived
 * `target_reached` fact (D-e §3), recomputed and NEVER stored, because it may
 * honestly un-reach if the market dips. `GoalDetailScreen` re-implements it
 * inline today (`5.224`); this is where that stops.
 */
export interface GoalProgress {
  current: string;
  target: string;
  /** 0-100, clamped. `0` when no target is set. */
  ratioPercent: number;
  hasTarget: boolean;
  targetReached: boolean;
}

export function selectGoalProgress(state: LedgerState, goalId: string): GoalProgress {
  const goal = state.goals.find((g) => g.goalId === goalId);
  const current = goalCurrentValue(state, goalId);
  const target = new Decimal(goal?.targetAmount ?? 0);
  const hasTarget = target.gt(0);

  return {
    current: current.toFixed(2),
    target: target.toFixed(2),
    ratioPercent: hasTarget ? Decimal.min(current.div(target), 1).mul(100).toNumber() : 0,
    hasTarget,
    // A zero or absent target is never "reached" — asserted in the test, because
    // `0 >= 0` would otherwise make every target-less goal complete.
    targetReached: hasTarget && current.gte(target),
  };
}
