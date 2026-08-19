/**
 * The mutable working set `project()` threads through the per-domain appliers
 * (P2BD-4 extraction). One context per projection run — never shared, never
 * retained; `project()` finalizes it into the immutable `LedgerState`.
 */

import type Decimal from 'decimal.js';
import type { GoalState, LedgerState, PositionState, RecurringSchedule, RuleState } from '../state';

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
  /** Running conservation-term accumulators (board §1a). */
  totals: {
    networkFees: Decimal;
    exitFees: Decimal;
    credited: Decimal;
    spent: Decimal;
  };
}
