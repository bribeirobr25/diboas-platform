/**
 * D-s simulated-events domain helpers (§2.4) — pure derivations for the G11
 * surface: the event magnitude (deterministic, catalogue-sized) and the
 * affordability filter ("an expense event never forces balances negative";
 * the reserve path exists precisely for the tight case). The emitting action
 * (`resolveSimulatedExpense`) lives in `ledgerClient`.
 */

import type { LedgerState } from '@diboas/banking';
import type { SimulatedEventDefinition } from '@/config/simulatedEventCatalogue';
import { weeklyCreditAmount } from './growthConstants';

/** The concrete integer amount for an event instance (mid-band default, P2BD-12). */
export function simulatedEventAmount(
  mode: 'b2c' | 'b2b',
  definition: SimulatedEventDefinition
): number {
  return Math.round(weeklyCreditAmount(mode) * definition.sizing.defaultMultiple);
}

export interface AffordableOptions {
  /** Available (working) covers the whole expense. */
  coverFromAvailable: boolean;
  /**
   * Goals whose cash fully covers the expense (the reserve path releases the
   * full amount from ONE goal, then pays — "the reserve did its job", never
   * judged). Active or paused; never dropped/accomplished.
   */
  reserveGoalIds: string[];
}

/**
 * Filter the R1 expense options by affordability (D-s §2). When BOTH come back
 * empty, the surface keeps only postponed-forever — the event waits quietly
 * (no nag, no expiry) until the balance allows a real choice.
 */
export function affordableExpenseOptions(state: LedgerState, amount: number): AffordableOptions {
  const working = Number(state.buckets.working);
  return {
    coverFromAvailable: working >= amount,
    reserveGoalIds: state.goals
      .filter(
        (g) => (g.status === 'active' || g.status === 'paused') && Number(g.cash) >= amount
      )
      .map((g) => g.goalId),
  };
}
