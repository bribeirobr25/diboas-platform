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
  // ── D-e goal lifecycle ──────────────────────────────────────────────────
  // Sequenced on g1 by version. Single-instance-per-type means 5 apply and 2
  // are valid-but-no-op here (PositionReassigned — p1 is already closed;
  // GoalAccomplished — g1 is already terminal after the drop). Real multi-goal
  // behaviour is exercised in ledger.test.ts. All conserving (zero-value or a
  // move within `held`), so the log still reconciles to 0.00 at every prefix.
  GoalTargetChanged: {
    ...base('e11'),
    type: 'GoalTargetChanged',
    goalId: 'g1',
    oldTarget: '3000.00',
    newTarget: '4000.00',
    expectedVersion: 0,
  },
  GoalCashReleased: {
    ...base('e12'),
    type: 'GoalCashReleased',
    goalId: 'g1',
    amount: '100.00',
    expectedVersion: 1,
  },
  GoalPaused: { ...base('e13'), type: 'GoalPaused', goalId: 'g1', expectedVersion: 2 },
  GoalResumed: { ...base('e14'), type: 'GoalResumed', goalId: 'g1', expectedVersion: 3 },
  PositionReassigned: {
    ...base('e15'),
    type: 'PositionReassigned',
    positionId: 'p1',
    fromGoalId: 'g1',
    toGoalId: 'g2',
  },
  GoalDropped: {
    ...base('e16'),
    type: 'GoalDropped',
    goalId: 'g1',
    cashReleased: '881.12',
    expectedVersion: 4,
  },
  GoalAccomplished: {
    ...base('e17'),
    type: 'GoalAccomplished',
    goalId: 'g1',
    disposition: 'held-as-cash',
    expectedVersion: 5,
  },
  // ── D-r rules engine ────────────────────────────────────────────────────
  // One rule, sequenced by version — all zero-value, so the log still
  // reconciles to 0.00 at every prefix (a rule holds no money).
  RuleCreated: {
    ...base('e18'),
    type: 'RuleCreated',
    ruleId: 'r1',
    split: [{ goalId: 'g1', percent: 50 }],
  },
  RuleUpdated: {
    ...base('e19'),
    type: 'RuleUpdated',
    ruleId: 'r1',
    split: [{ goalId: 'g1', percent: 60 }],
    expectedRuleVersion: 0,
  },
  RulePaused: { ...base('e20'), type: 'RulePaused', ruleId: 'r1', expectedRuleVersion: 1 },
  RuleResumed: { ...base('e21'), type: 'RuleResumed', ruleId: 'r1', expectedRuleVersion: 2 },
  RuleDeleted: { ...base('e22'), type: 'RuleDeleted', ruleId: 'r1', expectedRuleVersion: 3 },
};

/** The fixture as an ordered, conserving event log (declaration order). */
export function oneOfEachLog(): LedgerEvent[] {
  return Object.values(ONE_OF_EACH);
}
