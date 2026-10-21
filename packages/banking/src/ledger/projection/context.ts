/**
 * The mutable working set `project()` threads through the per-domain appliers
 * (P2BD-4 extraction). One context per projection run — never shared, never
 * retained; `project()` finalizes it into the immutable `LedgerState`.
 */

import type Decimal from 'decimal.js';
import type {
  GoalState,
  LedgerState,
  PositionState,
  RecurringSchedule,
  RefusalReason,
  RuleState,
} from '../state';

export interface GoalEntry {
  s: GoalState;
  cash: Decimal;
  invested: Decimal;
  earnings: Decimal;
}

export interface PositionEntry {
  s: PositionState;
  principal: Decimal;
  accrued: Decimal;
}

export interface ProjectionContext {
  state: LedgerState;
  floor: { v: Decimal };
  cushion: { v: Decimal };
  working: { v: Decimal };
  goals: Map<string, GoalEntry>;
  positions: Map<string, PositionEntry>;
  recurring: Map<string, RecurringSchedule>;
  rules: Map<string, RuleState>;
  /**
   * Running conservation-term accumulators (board §1a).
   *
   * `networkFees`/`exitFees` are **deducted** fees only — the legacy generation,
   * and the sole fee terms `reconcile()` may subtract, because they are the only
   * ones that actually left `held` (`5.403`).
   *
   * `modeledNetworkFees`/`modeledExitFees` are EVERY modelled fee, of both
   * generations. They move no money; they feed the fee trail, reporting and the
   * credit-ceiling compatibility basis.
   */
  totals: {
    networkFees: Decimal;
    exitFees: Decimal;
    modeledNetworkFees: Decimal;
    modeledExitFees: Decimal;
    credited: Decimal;
    spent: Decimal;
  };
  /** Set by an applier that does NOT apply the current event; reset per event (P8a). */
  refusal: RefusalReason | null;
}

/**
 * ⛑ A refusal is RECORDED, never silent (P8a, register `5.485`). Every applier
 * branch that leaves an event unapplied calls this with its reason, so the
 * projection can report a disposition per event. Inferring a refusal from "no
 * balance changed" would misread every valid zero-value marker.
 */
export function refuse(ctx: ProjectionContext, reason: RefusalReason): void {
  ctx.refusal = reason;
}
