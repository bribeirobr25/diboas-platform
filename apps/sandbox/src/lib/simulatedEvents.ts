/**
 * D-s simulated-events domain helpers (§2.4) — pure derivations for the G11
 * surface: the event magnitude (deterministic, catalogue-sized) and the
 * affordability filter ("an expense event never forces balances negative";
 * the reserve path exists precisely for the tight case). The emitting action
 * (`resolveSimulatedExpense`) lives in `ledgerClient`.
 */

import { WEEKLY_CADENCE_DAYS, type LedgerState } from '@diboas/banking';
import {
  SIMULATED_EVENT_CATALOGUE,
  type SimulatedEventDefinition,
} from '@/config/simulatedEventCatalogue';
import { SIM_EVENT_DUE_WEEK, weeklyCreditAmount } from './growthConstants';

const MS_PER_DAY = 86_400_000;

/** A scheduled event instance — the surface's whole input. */
export interface DueSimulatedEvent {
  /** Stable per (ledger, slot): the idempotency key the engine dedupes on. */
  eventInstanceId: string;
  definition: SimulatedEventDefinition;
  amount: number;
}

/**
 * Is an event due, and which one? THE trigger seam (§4.11).
 *
 * D-s schedules the R1 event at **challenge week 3**, but G13 challenges are
 * out of Phase 2 while G11 is in it — read literally, that builds a screen
 * nothing can reach. So Phase 2 schedules on D-s §5's own **personal week**
 * (`floor((now − genesis)/7) + 1`), the same real-calendar, genesis-anchored
 * clock `collectibleWeeks` already uses. When challenges land, the challenge
 * clock becomes the scheduler and this stays as its free-practice fallback —
 * a one-function change, which is why the whole trigger lives here.
 * (Founder nod: P2BD-16.)
 *
 * Reads wall-clock time and `genesisRecordedAt` and NEVER `simDay`, so the
 * time machine structurally cannot fire an event (D-s §5 dual-clock
 * independence) — a property, not a promise: no sim input is in scope.
 *
 * Returns null once resolved. A postponement is simply the absence of a
 * resolution: the event keeps returning, week after week, with no nag, no
 * expiry and no escalation (RD-9 postponed-forever).
 */
export function dueSimulatedEvent(state: LedgerState, nowIso: string): DueSimulatedEvent | null {
  if (!state.initialized || !state.genesisRecordedAt) return null;
  const t0 = Date.parse(state.genesisRecordedAt);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(t0) || !Number.isFinite(now)) return null;
  const personalWeek = Math.floor((now - t0) / (WEEKLY_CADENCE_DAYS * MS_PER_DAY)) + 1;
  if (personalWeek < SIM_EVENT_DUE_WEEK) return null;

  const definition = SIMULATED_EVENT_CATALOGUE.events.find((e) => e.wave === 'R1');
  if (!definition) return null;
  // Stable, derived, and unique per slot — never random (replay determinism),
  // and it must stay stable across renders or the engine's per-instance
  // idempotency would let the same event resolve twice.
  const eventInstanceId = `${definition.type}:w${SIM_EVENT_DUE_WEEK}`;
  if (state.resolvedEventInstances.includes(eventInstanceId)) return null;
  return { eventInstanceId, definition, amount: simulatedEventAmount(state.mode, definition) };
}

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
/** One option's honest before/after — the impact preview's whole content. */
export interface ExpenseImpact {
  /** The option key, matching the catalogue's `optionKeys`. */
  option: 'coverFromAvailable' | 'useReserve';
  /** Present only on the reserve path — whose reserve. */
  goalId?: string;
  availableBefore: number;
  availableAfter: number;
  /** The chosen goal's cash, before/after — absent on the Available path. */
  goalCashBefore?: number;
  goalCashAfter?: number;
}

/**
 * What each affordable option would do, computed from the SAME state the
 * commit re-validates against (D-s: "impact preview BEFORE any choice").
 *
 * Deliberately carries **no goal-pace column**, though mockup 26 shows one:
 * board §6a is "absent over false", and the app's only ruled pace derivation
 * (`Projection`) yields a word ONLY when a recurring plan exists — so a pace
 * claim here would be invented for most goals. What moves is what is shown.
 *
 * The reserve path releases the FULL amount from one goal and pays from
 * Available, so Available is unchanged by it — the money passes through. That
 * is why the reserve row's Available reads higher than the cover row's: it is
 * not a saving, it is the reserve absorbing the hit, and the row says so.
 */
export function expenseImpacts(
  state: LedgerState,
  amount: number,
  options: AffordableOptions
): ExpenseImpact[] {
  const working = Number(state.buckets.working);
  const impacts: ExpenseImpact[] = [];
  if (options.coverFromAvailable) {
    impacts.push({
      option: 'coverFromAvailable',
      availableBefore: working,
      availableAfter: working - amount,
    });
  }
  for (const goalId of options.reserveGoalIds) {
    const goal = state.goals.find((g) => g.goalId === goalId);
    if (!goal) continue;
    const cash = Number(goal.cash);
    impacts.push({
      option: 'useReserve',
      goalId,
      // Released into Available, then spent from it — net zero, by construction.
      availableBefore: working,
      availableAfter: working,
      goalCashBefore: cash,
      goalCashAfter: cash - amount,
    });
  }
  return impacts;
}

export function affordableExpenseOptions(state: LedgerState, amount: number): AffordableOptions {
  const working = Number(state.buckets.working);
  return {
    coverFromAvailable: working >= amount,
    reserveGoalIds: state.goals
      .filter((g) => (g.status === 'active' || g.status === 'paused') && Number(g.cash) >= amount)
      .map((g) => g.goalId),
  };
}
