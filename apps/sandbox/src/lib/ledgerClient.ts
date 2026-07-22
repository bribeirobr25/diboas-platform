/**
 * The client-side application service over the play ledger (MVP-0: the
 * LocalStorage store per decision G-2; the Postgres store swaps in at Stage 1
 * behind the same ILedgerStore seam).
 *
 * All money math happens in the domain packages (Decimal.js); this layer only
 * composes events and publishes state to React via a tiny external store.
 */

import Decimal from 'decimal.js';
import { generateId } from './ids';
import {
  LocalStorageLedgerStore,
  computeExitFee,
  project,
  type ILedgerStore,
  type LedgerEvent,
  type LedgerState,
} from '@diboas/banking';
import { getStrategy, type ProtocolApyHistory } from '@diboas/defi';
import { blendSeries, type DailyApySeries } from '@diboas/investing';
import type { JobsSplit } from '@diboas/investing';
import { planAdvance } from './advancePlanner';

type Listener = () => void;

let store: ILedgerStore | null = null;
let cachedState: LedgerState | null = null;
const listeners = new Set<Listener>();

function getStore(): ILedgerStore {
  if (!store) store = new LocalStorageLedgerStore();
  return store;
}

function emit(): void {
  cachedState = null;
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLedgerState(): LedgerState {
  if (!cachedState) cachedState = project(getStore().getAll());
  return cachedState;
}

function appendAll(events: LedgerEvent[]): void {
  const s = getStore();
  for (const event of events) s.append(event);
  emit();
}

function base(correlationId: string) {
  return {
    eventId: generateId(),
    simDay: getLedgerState().simDay,
    recordedAt: new Date().toISOString(),
    correlationId,
  };
}

// ── Actions ──────────────────────────────────────────────────────────────────

export function grantAndSplit(
  amount: number,
  currency: 'USD' | 'BRL' | 'EUR',
  mode: 'b2c' | 'b2b',
  split: JobsSplit
): void {
  const correlationId = generateId();
  appendAll([
    {
      ...base(correlationId),
      type: 'PlayMoneyGranted',
      amount: new Decimal(amount).toFixed(2),
      currency,
      mode,
    },
    {
      ...base(correlationId),
      type: 'JobsSplitSet',
      floorPercent: split.floorPercent,
      cushionPercent: split.cushionPercent,
      workingPercent: split.workingPercent,
    },
  ]);
}

export function createGoal(input: {
  name: string;
  icon: string;
  targetAmount: number;
  horizonMonths: number;
  fundAmount: number;
}): string {
  const goalId = generateId();
  const correlationId = generateId();
  const events: LedgerEvent[] = [
    {
      ...base(correlationId),
      type: 'GoalCreated',
      goalId,
      name: input.name.trim(),
      icon: input.icon,
      targetAmount: new Decimal(input.targetAmount).toFixed(2),
      horizonMonths: input.horizonMonths,
    },
  ];
  if (input.fundAmount > 0) {
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId,
      amount: new Decimal(input.fundAmount).toFixed(2),
    });
  }
  appendAll(events);
  return goalId;
}

/**
 * The exact Decimal split of a committed total into (fee, invested), so that
 * fee + invested == total to the cent. The manifest display and the ledger
 * event both use this — what you read is exactly what happens (no independent
 * float rounding that could drift and trip the engine's cash guard). Fee is
 * clamped so it never exceeds the total.
 */
export function splitEntry(
  totalFromCash: number,
  networkFeeLocal: number
): { total: Decimal; fee: Decimal; invested: Decimal } {
  const total = new Decimal(totalFromCash).toDecimalPlaces(2);
  const fee = Decimal.min(new Decimal(networkFeeLocal).toDecimalPlaces(2), total);
  return { total, fee, invested: total.minus(fee) };
}

/**
 * Enter a strategy. The caller passes the TOTAL committed from goal cash and
 * the network fee; the invested amount is derived in Decimal (see splitEntry),
 * so `amount + networkFee` equals the total EXACTLY.
 */
export function enterStrategy(input: {
  goalId: string;
  strategyId: string;
  totalFromCash: number;
  networkFeeLocal: number;
}): string {
  const positionId = generateId();
  const { fee, invested } = splitEntry(input.totalFromCash, input.networkFeeLocal);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyEntered',
      goalId: input.goalId,
      positionId,
      strategyId: input.strategyId,
      amount: invested.toFixed(2),
      networkFee: fee.toFixed(2),
    },
  ]);
  return positionId;
}

/**
 * The time machine: advance simulated days, replaying real APY history onto
 * every open position (blended by the strategy's allocation weights).
 *
 * When a position carries a recurring schedule (C3), its accrual is replayed in
 * SEGMENTS split at each monthly deposit day, so each contribution compounds
 * from its own day (an annuity replay). Every segment passes the GLOBAL `toDay`
 * as `anchorDay` to `replayEarnings` (A-1) — segment slices are then contiguous
 * and their union equals the single-call slice. Deposits are bounded by the
 * shared Working pool, granted in strict day order across all positions (a
 * partial last deposit, then paused). A move within the reconciliation `held`
 * set → the invariant holds by construction.
 */
export function advanceTime(
  days: number,
  histories: ProtocolApyHistory[],
  source: 'real' | 'machine' = 'machine'
): void {
  const state = getLedgerState();
  const toDay = state.simDay + days;
  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const correlationId = generateId();
  const open = state.positions.filter((p) => p.open);

  // Blended real-APY series per open position (built once, reused per segment).
  const blendedByPosition = new Map<string, DailyApySeries>();
  for (const position of open) {
    const strategy = getStrategy(position.strategyId);
    if (!strategy) continue;
    const legs = strategy.allocation.map((leg) => {
      const history = byProtocol.get(leg.protocolId);
      const series: DailyApySeries = {
        points: history ? history.points.map((p) => p.apyPercent) : [0],
        source: history?.stamp.source === 'defillama' ? 'defillama' : 'fixture',
      };
      return { weightPercent: leg.weightPercent, series };
    });
    blendedByPosition.set(position.positionId, blendSeries(legs));
  }

  // The money-moving logic lives in the pure planner (unit tested); this layer
  // only supplies the store-derived inputs and the event stamps.
  const events = planAdvance({
    positions: open.map((p) => ({
      positionId: p.positionId,
      goalId: p.goalId,
      principal: p.principal,
      accrued: p.accrued,
      accruedThroughSimDay: p.accruedThroughSimDay,
    })),
    schedules: state.recurring,
    workingStart: state.buckets.working,
    blendedByPosition,
    toDay,
    days,
    source,
    stamp: () => base(correlationId),
  });
  appendAll(events);
}

/**
 * Set, change, or clear (monthlyAmount = 0) a recurring monthly contribution on
 * an open position. Real play money from Working, auto-invested each due month
 * as the shared clock advances (C3). `startSimDay` = today's sim day → the first
 * deposit lands 30 sim-days later.
 */
export function setRecurring(input: {
  goalId: string;
  positionId: string;
  monthlyAmount: number;
}): void {
  appendAll([
    {
      ...base(generateId()),
      type: 'RecurringSet',
      goalId: input.goalId,
      positionId: input.positionId,
      monthlyAmount: new Decimal(input.monthlyAmount).toFixed(2),
      startSimDay: getLedgerState().simDay,
    },
  ]);
}

export function exitPosition(input: { positionId: string; networkFeeLocal: number }): void {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === input.positionId);
  if (!position || !position.open) return;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: position.goalId,
      grossAmount: gross.toFixed(2),
      exitFee: exitFee.toFixed(2),
      networkFee: new Decimal(input.networkFeeLocal).toFixed(2),
    },
  ]);
}

/** Preview the exit numbers for the manifest (no event appended). */
export function previewExit(positionId: string): { gross: string; exitFee: string } | null {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === positionId);
  if (!position || !position.open) return null;
  const gross = new Decimal(position.principal).plus(position.accrued);
  return { gross: gross.toFixed(2), exitFee: computeExitFee(gross, state.currency).toFixed(2) };
}

export function resetSandbox(): void {
  getStore().clear();
  emit();
}
