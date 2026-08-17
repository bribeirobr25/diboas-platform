import type { LedgerEvent, LedgerEventType } from '@diboas/banking';

/**
 * The canonical "one valid instance of every event type" fixture, shared by the
 * PostgresLedgerStore round-trip test and the both-stores reconcile-equivalence
 * test.
 *
 * Typed as a mapped `Record` over `LedgerEventType` (board §9.5): every key is
 * REQUIRED and each value must match its key's type, so a net-new Phase-2 event
 * type **fails to compile** until it's added here — the fixture can never
 * silently stop covering a leg. The declared ORDER is a valid, conserving
 * money journey, so `oneOfEachLog()` reconciles to `0.00`.
 */
type OneOfEach = { [K in LedgerEventType]: Extract<LedgerEvent, { type: K }> };

const base = (id: string) => ({
  eventId: id,
  simDay: 0,
  recordedAt: '2026-07-24T00:00:00.000Z',
  correlationId: `corr-${id}`,
});

export const ONE_OF_EACH: OneOfEach = {
  PlayMoneyGranted: {
    ...base('e1'),
    type: 'PlayMoneyGranted',
    amount: '10000.00',
    currency: 'USD',
    mode: 'b2c',
  },
  JobsSplitSet: {
    ...base('e2'),
    type: 'JobsSplitSet',
    floorPercent: 30,
    cushionPercent: 20,
    workingPercent: 50,
  },
  GoalCreated: {
    ...base('e3'),
    type: 'GoalCreated',
    goalId: 'g1',
    name: 'Trip',
    icon: 'plane',
    targetAmount: '3000.00',
    horizonMonths: 24,
  },
  GoalFunded: { ...base('e4'), type: 'GoalFunded', goalId: 'g1', amount: '1000.00' },
  StrategyEntered: {
    ...base('e5'),
    type: 'StrategyEntered',
    goalId: 'g1',
    positionId: 'p1',
    strategyId: 'safeHarbor',
    amount: '990.00',
    networkFee: '10.00',
  },
  AccrualApplied: {
    ...base('e6'),
    type: 'AccrualApplied',
    positionId: 'p1',
    fromSimDay: 0,
    toSimDay: 30,
    earnings: '5.00',
    apySource: 'defillama',
  },
  StrategyExited: {
    ...base('e7'),
    type: 'StrategyExited',
    positionId: 'p1',
    goalId: 'g1',
    grossAmount: '995.00',
    exitFee: '3.88',
    networkFee: '10.00',
  },
  RecurringSet: {
    ...base('e8'),
    type: 'RecurringSet',
    goalId: 'g1',
    positionId: 'p1',
    monthlyAmount: '100.00',
    startSimDay: 0,
  },
  RecurringContributionApplied: {
    ...base('e9'),
    type: 'RecurringContributionApplied',
    goalId: 'g1',
    positionId: 'p1',
    amount: '100.00',
    onSimDay: 30,
  },
  TimeAdvanced: { ...base('e10'), type: 'TimeAdvanced', days: 365, source: 'machine' },
};

/** The fixture as an ordered, conserving event log (declaration order). */
export function oneOfEachLog(): LedgerEvent[] {
  return Object.values(ONE_OF_EACH);
}
