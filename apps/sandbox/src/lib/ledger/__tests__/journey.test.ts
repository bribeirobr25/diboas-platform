import { beforeEach, describe, expect, it } from 'vitest';
import { reconcile, refusedEvents } from '@diboas/banking';
import {
  observedStamp,
  type ProtocolApyHistory,
  type ProtocolId,
  type ProtocolPriceHistory,
  type StrategyId,
} from '@diboas/defi';
import {
  accomplishGoal,
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  pauseGoal,
  raiseGoalTarget,
  resetSandbox,
  resumeGoal,
  setRecurring,
  transferGoalCash,
} from '@/lib/ledgerClient';

/**
 * The core-journey actions' REFUSAL branches (register 5.70). `ledgerClient.test.ts` proves
 * the happy paths and a few G4 guards; these are the branches it never reached. Each guard is
 * an emitter-side mirror of an engine rule ("never emit a leg the projection will refuse"), so
 * a refusal must append NOTHING — the ledger's event count is the witness.
 *
 * Expectations are taken from `journey.ts`'s own contracts: resume is "the calm reverse of
 * pause"; accomplish and raise accept "active OR paused — matching the engine's allowed FROM
 * states"; a transfer needs two distinct goals, a live source and an ACTIVE destination, and
 * "with no cash there is no release event and the version is unchanged"; a raise is "raise
 * only"; and a position the catalogue cannot resolve, or a schedule whose goal is gone, never
 * moves money in the time machine.
 */
const eventCount = () => getLedgerState().events.length;
const newEvents = (before: number) => getLedgerState().events.slice(before);
const goalOf = (goalId: string) => getLedgerState().goals.find((g) => g.goalId === goalId)!;

function goal(name: string, fundAmount = 0): string {
  return createGoal({ name, icon: 'plane', targetAmount: 3000, horizonMonths: 12, fundAmount });
}

beforeEach(() => {
  resetSandbox();
  grantPlayMoney(10_000, 'USD', 'b2c');
});

describe('resumeGoal · only a paused goal resumes', () => {
  it('should append nothing for an unknown goal or a goal that is already active', () => {
    const g = goal('Trip');
    const snapshot = goalOf(g);
    const before = eventCount();
    resumeGoal('no-such-goal');
    resumeGoal(g);
    expect(eventCount()).toBe(before);
    expect(goalOf(g)).toEqual(snapshot);
    expect(snapshot.status).toBe('active');
  });
});

describe('accomplishGoal · only an active or paused goal closes', () => {
  it('should append nothing for an unknown goal or an already-closed one (terminal stays terminal)', () => {
    const g = goal('Trip');
    accomplishGoal(g, 'kept-working');
    expect(goalOf(g).status).toBe('accomplished');
    const before = eventCount();
    accomplishGoal('no-such-goal', 'held-as-cash');
    accomplishGoal(g, 'held-as-cash');
    expect(eventCount()).toBe(before);
    expect(goalOf(g).status).toBe('accomplished');
  });

  it('should close a PAUSED goal — paused is an allowed FROM state', () => {
    const g = goal('Trip');
    pauseGoal(g);
    accomplishGoal(g, 'held-as-cash');
    expect(goalOf(g).status).toBe('accomplished');
    expect(refusedEvents(getLedgerState())).toEqual([]);
  });
});

describe('transferGoalCash · refusals write nothing', () => {
  it('should append nothing when either goal is unknown or both are the same goal', () => {
    const from = goal('Trip', 500);
    const to = goal('Car');
    const before = eventCount();
    transferGoalCash('no-such-goal', to);
    transferGoalCash(from, 'no-such-goal');
    transferGoalCash(from, from);
    expect(eventCount()).toBe(before);
    expect(goalOf(from).cash).toBe('500.00');
  });

  it('should append nothing when the source is already closed', () => {
    const from = goal('Trip', 500);
    const to = goal('Car');
    accomplishGoal(from, 'kept-working');
    const before = eventCount();
    transferGoalCash(from, to);
    expect(eventCount()).toBe(before);
    expect(goalOf(to).cash).toBe('0.00');
  });

  it('should append nothing when the destination is not ACTIVE (a paused goal takes no money)', () => {
    const from = goal('Trip', 500);
    const to = goal('Car');
    pauseGoal(to);
    const before = eventCount();
    transferGoalCash(from, to);
    expect(eventCount()).toBe(before);
    expect(goalOf(from)).toMatchObject({ status: 'active', cash: '500.00' });
    expect(goalOf(to).cash).toBe('0.00');
  });

  it('should move a PAUSED source’s cash and close it as transferred', () => {
    const from = goal('Trip', 500);
    const to = goal('Car');
    pauseGoal(from);
    transferGoalCash(from, to);
    expect(goalOf(from).status).toBe('accomplished');
    expect(goalOf(to).cash).toBe('500.00');
    expect(refusedEvents(getLedgerState())).toEqual([]);
    expect(reconcile(getLedgerState())).toBe('0.00');
  });

  it('should close a cash-less source with ONE event at its unchanged version', () => {
    const from = goal('Trip');
    const to = goal('Car');
    const version = goalOf(from).version;
    const before = eventCount();
    transferGoalCash(from, to);
    const appended = newEvents(before);
    expect(appended.map((e) => e.type)).toEqual(['GoalAccomplished']);
    expect(appended[0]).toMatchObject({ disposition: 'transferred', expectedVersion: version });
    // Accepted by the engine: a wrong expected version would be refused as stale.
    expect(refusedEvents(getLedgerState())).toEqual([]);
    expect(goalOf(from).status).toBe('accomplished');
    expect(goalOf(to).cash).toBe('0.00');
  });
});

describe('raiseGoalTarget · raise only', () => {
  it.each([
    ['unparseable input', 'three thousand'],
    ['a lower target', '2999.99'],
    ['the same target', '3000'],
    ['a non-finite target', 'Infinity'],
  ])('should append nothing for %s', (_name, input) => {
    const g = goal('Trip');
    const before = eventCount();
    raiseGoalTarget(g, input);
    expect(eventCount()).toBe(before);
    expect(goalOf(g).targetAmount).toBe('3000.00');
  });
});

describe('advanceTime · what the time machine never moves', () => {
  const LENDING: ProtocolId[] = ['skySsr', 'aaveV3', 'compoundV3'];
  /** A dated APY series from 2026-01-01, one point per day. */
  const datedApy = (days: number): ProtocolApyHistory[] =>
    LENDING.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
        apyPercent: 5,
      })),
      stamp: observedStamp('defillama', '2026-09-15T00:00:00Z'),
    }));

  it('should neither accrue nor deposit into a position whose strategy the catalogue cannot resolve', () => {
    const g = goal('Trip', 2000);
    // A legacy id from a retired catalogue entry: the type forbids it, the log can carry it.
    const orphan = enterStrategy({
      goalId: g,
      strategyId: 'retiredStrategy' as StrategyId,
      totalFromCash: 1000,
      networkFeeLocal: 0,
    });
    setRecurring({ goalId: g, positionId: orphan, monthlyAmount: 100 });
    const working = getLedgerState().buckets.working;
    const before = eventCount();
    advanceTime(35, datedApy(120), 'machine');
    const appended = newEvents(before);
    expect(appended.some((e) => e.type === 'TimeAdvanced')).toBe(true);
    expect(appended.filter((e) => 'positionId' in e && e.positionId === orphan)).toEqual([]);
    const position = getLedgerState().positions.find((p) => p.positionId === orphan)!;
    expect(position).toMatchObject({ principal: '1000.00', accrued: '0.00' });
    expect(getLedgerState().buckets.working).toBe(working);
  });

  it('should never draw a deposit for a schedule whose goal does not exist', () => {
    const g = goal('Trip', 2000);
    const positionId = enterStrategy({
      goalId: g,
      strategyId: 'safeHarbor',
      totalFromCash: 1000,
      networkFeeLocal: 0,
    });
    setRecurring({ goalId: 'no-such-goal', positionId, monthlyAmount: 100 });
    const working = getLedgerState().buckets.working;
    const before = eventCount();
    advanceTime(35, datedApy(120), 'machine');
    expect(newEvents(before).filter((e) => e.type === 'RecurringContributionApplied')).toEqual([]);
    expect(getLedgerState().buckets.working).toBe(working);
  });

  it('should never take a single dated price point as the replay epoch (it yields no factor)', () => {
    const g = goal('Trip', 2000);
    enterStrategy({ goalId: g, strategyId: 'safeHarbor', totalFromCash: 1000, networkFeeLocal: 0 });
    const lonePrice: ProtocolPriceHistory[] = [
      {
        protocolId: 'aaveV3',
        points: [{ date: '2026-12-31', priceUsd: 1 }],
        stamp: observedStamp('coingecko', '2026-09-15T00:00:00Z'),
      },
    ];
    advanceTime(30, datedApy(120), 'machine', lonePrice);
    // The epoch is the APY corpus's first day; the lone later price date is not replayable.
    expect(getLedgerState().replayEpoch).toBe('2026-01-01');
  });
});
