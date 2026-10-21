import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LedgerEvent } from '../ledger/events';
import { project, type LedgerState } from '../ledger/engine';
import { appliedEvents, reconcile } from '../ledger/engine';
import { eventsWithDisposition, refusedEvents } from '../ledger/dispositions';

/**
 * P8a · every event carries a disposition (register `5.485`). The projection used
 * to refuse events SILENTLY — a cross-tab write the goal could not afford (case 3)
 * left no trace, so every reader that walked the raw log counted it. Refusals are
 * now recorded with a reason; the raw log is preserved untouched.
 */

let n = 0;
const ev = (type: string, extra: Record<string, unknown> = {}): LedgerEvent =>
  ({
    eventId: `e${++n}`,
    type,
    simDay: 0,
    recordedAt: '2026-10-16T00:00:00.000Z',
    correlationId: 'c',
    ...extra,
  }) as unknown as LedgerEvent;

const grant = () => ev('PlayMoneyGranted', { amount: '10000', currency: 'USD', mode: 'b2c' });
const goal = (goalId: string) =>
  ev('GoalCreated', {
    goalId,
    name: goalId,
    icon: 'target',
    targetAmount: '1000',
    horizonMonths: 12,
  });
const enter = (positionId: string, amount: string, goalId = 'g1') =>
  ev('StrategyEntered', {
    goalId,
    positionId,
    strategyId: 'sky',
    amount,
    networkFee: '0',
  });

/** The register 5.485 case 3: two entries of 80 against a goal balance of 100. */
function case3(): LedgerEvent[] {
  return [
    grant(),
    goal('g1'),
    ev('GoalFunded', { goalId: 'g1', amount: '100' }),
    enter('p1', '80'),
    enter('p2', '80'),
  ];
}

const statusOf = (state: LedgerState) => eventsWithDisposition(state).map((x) => x.disposition);

/** A goal holding 50 cash with an open position `p1` of 50 — the base most position cases need. */
const withPosition = () => [
  grant(),
  goal('g1'),
  ev('GoalFunded', { goalId: 'g1', amount: '100' }),
  enter('p1', '50'),
];
const rule = (ruleId = 'r1') =>
  ev('RuleCreated', { ruleId, split: [{ goalId: 'g1', percent: 100 }] });
const exit = (positionId: string) =>
  ev('StrategyExited', {
    goalId: 'g1',
    positionId,
    grossAmount: '50',
    exitFee: '0',
    networkFee: '0',
  });

/**
 * ONE case per refusal site — `file:event:reason`, every branch that calls `refuse()`.
 * The independent review (2026-10-16) deleted `refuse()` at nine sites and the earlier
 * sample of ten scenarios stayed green; a site without its own case is a site nothing
 * proves. `the table covers every refusal site` below keeps this list honest.
 */
const SITES: [site: string, prefix: () => LedgerEvent[], refused: () => LedgerEvent][] = [
  [
    'credits:WeeklyCreditGranted:duplicate',
    () => [grant(), ev('WeeklyCreditGranted', { week: 1, amount: '10' })],
    () => ev('WeeklyCreditGranted', { week: 1, amount: '10' }),
  ],
  [
    'credits:ComparisonCreditGranted:not-eligible',
    () => [grant()],
    () => ev('ComparisonCreditGranted', { amount: '10' }),
  ],
  [
    'goals:GoalPaused:stale-or-illegal-transition',
    () => [grant(), goal('g1')],
    () => ev('GoalPaused', { goalId: 'g1', expectedVersion: 7 }),
  ],
  [
    'goals:GoalResumed:stale-or-illegal-transition',
    () => [grant(), goal('g1')],
    () => ev('GoalResumed', { goalId: 'g1', expectedVersion: 0 }),
  ],
  [
    'goals:GoalDropped:stale-or-illegal-transition',
    () => [grant(), goal('g1')],
    () => ev('GoalDropped', { goalId: 'g1', expectedVersion: 9 }),
  ],
  [
    'goals:GoalAccomplished:stale-or-illegal-transition',
    () => [grant(), goal('g1')],
    () => ev('GoalAccomplished', { goalId: 'g1', expectedVersion: 9 }),
  ],
  [
    'goals:GoalTargetChanged:stale-or-illegal-transition',
    () => [grant(), goal('g1')],
    () => ev('GoalTargetChanged', { goalId: 'g1', expectedVersion: 9, newTarget: '5' }),
  ],
  [
    'goals:GoalCashReleased:insufficient-goal-cash',
    () => [grant(), goal('g1'), ev('GoalFunded', { goalId: 'g1', amount: '100' })],
    () => ev('GoalCashReleased', { goalId: 'g1', amount: '500', expectedVersion: 0 }),
  ],
  [
    'goals:GoalCashReleased:non-positive-amount',
    () => [grant(), goal('g1'), ev('GoalFunded', { goalId: 'g1', amount: '100' })],
    () => ev('GoalCashReleased', { goalId: 'g1', amount: '0', expectedVersion: 0 }),
  ],
  [
    'goals:GoalCashReleased:stale-or-illegal-transition',
    () => [grant(), goal('g1'), ev('GoalFunded', { goalId: 'g1', amount: '100' })],
    () => ev('GoalCashReleased', { goalId: 'g1', amount: '10', expectedVersion: 9 }),
  ],
  [
    'goals:PositionReassigned:unknown-or-closed-position',
    () => [...withPosition(), goal('g2'), exit('p1')],
    () => ev('PositionReassigned', { positionId: 'p1', fromGoalId: 'g1', toGoalId: 'g2' }),
  ],
  [
    'goals:PositionReassigned:stale-or-illegal-transition',
    () => [...withPosition(), goal('g2')],
    () => ev('PositionReassigned', { positionId: 'p1', fromGoalId: 'g2', toGoalId: 'g1' }),
  ],
  [
    'goals:PositionReassigned:unknown-goal',
    () => withPosition(),
    () => ev('PositionReassigned', { positionId: 'p1', fromGoalId: 'g1', toGoalId: 'nope' }),
  ],
  [
    'core:GoalFunded:unknown-goal',
    () => [grant()],
    () => ev('GoalFunded', { goalId: 'nope', amount: '5' }),
  ],
  [
    'core:GoalFunded:insufficient-available',
    () => [grant(), goal('g1')],
    () => ev('GoalFunded', { goalId: 'g1', amount: '999999' }),
  ],
  ['core:StrategyEntered:unknown-goal', () => [grant()], () => enter('p9', '5', 'nope')],
  [
    'core:StrategyEntered:insufficient-goal-cash',
    () => case3().slice(0, 4),
    () => enter('p2', '80'),
  ],
  [
    'core:AccrualApplied:unknown-or-closed-position',
    () => [grant()],
    () => ev('AccrualApplied', { positionId: 'nope', earnings: '1', fromSimDay: 0, toSimDay: 1 }),
  ],
  [
    'core:ReplaySpanRefused:unknown-or-closed-position',
    () => [...withPosition(), exit('p1')],
    () =>
      ev('ReplaySpanRefused', {
        positionId: 'p1',
        fromSimDay: 0,
        toSimDay: 30,
        reason: 'mixed-calendar',
      }),
  ],
  [
    'core:StrategyExited:unknown-or-closed-position',
    () => [...withPosition(), exit('p1')],
    () => exit('p1'),
  ],
  [
    'core:RecurringContributionApplied:unknown-or-closed-position',
    () => [grant()],
    () => ev('RecurringContributionApplied', { goalId: 'g1', positionId: 'nope', amount: '5' }),
  ],
  [
    'core:RecurringContributionApplied:non-positive-amount',
    () => withPosition(),
    () => ev('RecurringContributionApplied', { goalId: 'g1', positionId: 'p1', amount: '0' }),
  ],
  [
    'core:RecurringContributionApplied:insufficient-available',
    () => withPosition(),
    () => ev('RecurringContributionApplied', { goalId: 'g1', positionId: 'p1', amount: '999999' }),
  ],
  ['rules:RuleCreated:rule-exists', () => [grant(), goal('g1'), rule('r1')], () => rule('r2')],
  [
    'rules:RuleUpdated:stale-or-illegal-transition',
    () => [grant(), goal('g1'), rule()],
    () =>
      ev('RuleUpdated', {
        ruleId: 'r1',
        expectedRuleVersion: 9,
        split: [{ goalId: 'g1', percent: 100 }],
      }),
  ],
  [
    'rules:RulePaused:stale-or-illegal-transition',
    () => [grant(), goal('g1'), rule()],
    () => ev('RulePaused', { ruleId: 'r1', expectedRuleVersion: 9 }),
  ],
  [
    'rules:RuleResumed:stale-or-illegal-transition',
    () => [grant(), goal('g1'), rule()],
    () => ev('RuleResumed', { ruleId: 'r1', expectedRuleVersion: 0 }),
  ],
  [
    'rules:RuleDeleted:stale-or-illegal-transition',
    () => [grant(), goal('g1'), rule()],
    () => ev('RuleDeleted', { ruleId: 'r1', expectedRuleVersion: 9 }),
  ],
  [
    'simEvents:SimulatedExpensePaid:duplicate',
    () => [grant(), ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '5' })],
    () => ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '5' }),
  ],
  [
    'simEvents:SimulatedExpensePaid:non-positive-amount',
    () => [grant()],
    () => ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '0' }),
  ],
  [
    'simEvents:SimulatedExpensePaid:insufficient-available',
    () => [grant()],
    () => ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '999999' }),
  ],
  [
    'simEvents:SimulatedIncomeReceived:duplicate',
    () => [grant(), ev('SimulatedIncomeReceived', { eventInstanceId: 'i', amount: '5' })],
    () => ev('SimulatedIncomeReceived', { eventInstanceId: 'i', amount: '5' }),
  ],
  [
    'simEvents:SimulatedIncomeReceived:non-positive-amount',
    () => [grant()],
    () => ev('SimulatedIncomeReceived', { eventInstanceId: 'i', amount: '0' }),
  ],
];

/** Everything but the log and its dispositions — what a refused event must leave untouched. */
const snapshot = (s: LedgerState): string => {
  const { events: _e, dispositions: _d, ...rest } = s;
  return JSON.stringify(rest);
};

describe('P8a · every refusal site records itself, with its reason, and changes nothing', () => {
  it.each(SITES)('%s', (site, prefix, refused) => {
    const head = prefix();
    const before = project(head);
    expect(refusedEvents(before), `${site}: the setup itself was refused`).toEqual([]);
    const after = project([...head, refused()]);
    const reason = site.split(':')[2];
    expect(
      after.dispositions[after.dispositions.length - 1],
      `${site}: not recorded as refused`
    ).toEqual({
      status: 'REFUSED',
      reason,
    });
    expect(snapshot(after), `${site}: a refused event changed state`).toBe(snapshot(before));
  });

  /** Parsed from the projection source, so a NEW refusal site without a case here fails. */
  it('the table covers every refusal site in the projection — no more, no fewer', () => {
    const dir = join(__dirname, '../ledger/projection');
    const inSource = new Set<string>();
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      let current = '';
      for (const line of readFileSync(join(dir, file), 'utf8').split('\n')) {
        const c = /case '([A-Za-z]+)':/.exec(line);
        if (c) current = c[1]!;
        if (!/refuse\(ctx,/.test(line)) continue;
        for (const r of line.matchAll(/'([a-z-]+)'/g))
          inSource.add(`${file.replace(/\.ts$/, '')}:${current}:${r[1]}`);
      }
    }
    expect(inSource.size, 'the parser found nothing — it proves nothing').toBeGreaterThan(20);
    expect([...SITES.map(([site]) => site)].sort()).toEqual([...inSource].sort());
  });
});

describe('P8a · dispositions — APPLIED vs REFUSED, the raw log preserved', () => {
  it('should REFUSE the second case-3 entry and keep it in the raw log', () => {
    const log = case3();
    const state = project(log);
    expect(state.events).toHaveLength(5); // PRESERVE: nothing dropped
    expect(state.events).toEqual(log);
    expect(refusedEvents(state).map((r) => [r.event.eventId, r.reason])).toEqual([
      [log[4]!.eventId, 'insufficient-goal-cash'],
    ]);
    expect(appliedEvents(state).map((e) => e.eventId)).toEqual(
      log.slice(0, 4).map((e) => e.eventId)
    );
    expect(state.positions.map((p) => p.positionId)).toEqual(['p1']);
  });

  it('should keep valid ZERO-VALUE markers APPLIED (they drive idempotency, history and cycle counts)', () => {
    const log = [
      grant(),
      goal('g1'),
      ev('GoalFunded', { goalId: 'g1', amount: '100' }),
      enter('p1', '80'),
      ev('ReplaySpanRefused', {
        positionId: 'p1',
        fromSimDay: 0,
        toSimDay: 30,
        reason: 'mixed-calendar',
      }),
      ev('RuleCreated', { ruleId: 'r1', split: [{ goalId: 'g1', percent: 100 }] }),
      ev('RuleApplied', { ruleId: 'r1', ruleVersion: 0, proposalId: 'pr1', weekSet: [1] }),
      ev('TimeAdvanced', { days: 7 }),
      ev('GoalPaused', { goalId: 'g1', expectedVersion: 0 }),
    ];
    expect(statusOf(project(log)).every((d) => d.status === 'APPLIED')).toBe(true);
  });

  it('should DERIVE dispositions for a hand-built state, never assume APPLIED', () => {
    const log = case3();
    const handBuilt = { ...project(log), dispositions: [] } as LedgerState;
    expect(refusedEvents(handBuilt)).toHaveLength(1);
  });
});

/**
 * The guard against a MISSED refusal site: replay every log in this file event
 * by event. A REFUSED event must change nothing; an APPLIED money-moving event
 * must change something. A branch that skips without calling `refuse()` would
 * read APPLIED-with-no-change and fail here.
 */
describe('P8a · disposition invariant — refused changes nothing, applied money moves', () => {
  const MONEY_MOVING = new Set([
    'GoalFunded',
    'StrategyEntered',
    'StrategyExited',
    'RecurringContributionApplied',
    'SimulatedExpensePaid',
    'SimulatedIncomeReceived',
    'WeeklyCreditGranted',
    'ComparisonCreditGranted',
    'GoalCashReleased',
  ]);
  const corpus: LedgerEvent[][] = [
    case3(),
    [
      grant(),
      goal('g1'),
      ev('GoalFunded', { goalId: 'g1', amount: '999999' }),
      ev('GoalFunded', { goalId: 'g1', amount: '50' }),
    ],
    [
      grant(),
      ev('WeeklyCreditGranted', { week: 1, amount: '10' }),
      ev('WeeklyCreditGranted', { week: 1, amount: '10' }),
    ],
    [
      grant(),
      goal('g1'),
      ev('GoalFunded', { goalId: 'g1', amount: '100' }),
      enter('p1', '50'),
      ev('ComparisonCreditGranted', { amount: '10' }),
      ev('ComparisonCreditGranted', { amount: '10' }),
    ],
    [
      grant(),
      ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '5' }),
      ev('SimulatedExpensePaid', { eventInstanceId: 'x', amount: '5' }),
    ],
  ];

  it.each(corpus.map((log, i) => [i, log] as const))('should hold for corpus log %i', (_i, log) => {
    for (let k = 0; k < log.length; k += 1) {
      const before = project(log.slice(0, k));
      const after = project(log.slice(0, k + 1));
      const disposition = after.dispositions[k]!;
      const changed = snapshot(before) !== snapshot(after);
      const type = log[k]!.type;
      if (disposition.status === 'REFUSED')
        expect(changed, `${type} REFUSED but changed state`).toBe(false);
      else if (MONEY_MOVING.has(type))
        expect(changed, `${type} APPLIED but moved nothing`).toBe(true);
    }
  });
});

describe('P8a · reconcile() counts only APPLIED accruals', () => {
  it('should stay at 0.00 when an accrual on an unknown position is refused', () => {
    const log = [
      grant(),
      goal('g1'),
      ev('GoalFunded', { goalId: 'g1', amount: '100' }),
      enter('p1', '80'),
      ev('AccrualApplied', { positionId: 'ghost', earnings: '5', fromSimDay: 0, toSimDay: 1 }),
    ];
    const state = project(log);
    expect(refusedEvents(state).map((r) => r.reason)).toEqual(['unknown-or-closed-position']);
    expect(reconcile(state), 'a refused accrual was counted as earnings').toBe('0.00');
  });
});

describe('P8a · a projected state owns a snapshot of its log', () => {
  it('should not grow when the caller later appends to the array it projected', () => {
    const log = case3().slice(0, 3);
    const state = project(log);
    log.push(enter('p9', '10'));
    expect(state.events, 'the state shares the live log').toHaveLength(3);
    expect(state.dispositions).toHaveLength(3);
    expect(Object.isFrozen(state.dispositions)).toBe(true);
  });

  it('should FREEZE its log, so an in-place push throws instead of going stale', () => {
    const state = project(case3());
    appliedEvents(state); // cache the applied list first — the stale-read case
    expect(Object.isFrozen(state.events)).toBe(true);
    expect(() => (state.events as LedgerEvent[]).push(enter('p9', '1'))).toThrow(TypeError);
    expect(appliedEvents(state)).toHaveLength(4);
  });

  it('should DERIVE dispositions for a state spread over another log of the same length', () => {
    const affordable = case3().slice(0, 4); // the first entry of 80 — applies
    const state = project(affordable);
    const swapped = { ...state, events: [...affordable.slice(0, 3), enter('p2', '999')] };
    // Same length, so a length check would reuse "all APPLIED"; identity says these
    // dispositions describe another log, so they are derived: the 999 entry is refused.
    expect(refusedEvents(swapped).map((r) => r.reason)).toEqual(['insufficient-goal-cash']);
    expect(appliedEvents(swapped)).toHaveLength(3);
  });

  it('should compute appliedEvents once per projected state, frozen', () => {
    const state = project(case3());
    const first = appliedEvents(state);
    expect(appliedEvents(state)).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first).toHaveLength(4);
  });
});

/**
 * Second P8a audit (2026-10-17): the coverage check above proves every `refuse()` call
 * has a case — but a NEW skip branch written WITHOUT `refuse()` leaves its event APPLIED,
 * changes nothing, and has no `SITES` row either, so 24 of the 31 sites could regress
 * silently. This corpus is built independently of `SITES`: every event type, against
 * three base logs, under every mutation that makes an event invalid — unknown or other
 * ids, a stale version, and each MONEY FIELD set to zero, negative and oversized (the
 * third review found an earlier version mutated `amount` only) — once and repeated.
 * Five oracles: an APPLIED event changed the projection (unless a pure marker or an
 * idempotent repeat), kept `reconcile()` at 0.00, carried a valid amount, kept every
 * goal's `invested` equal to its own open positions' principal, and did not re-apply
 * an accrual span. Today's exceptions are pinned EXACTLY and grouped by the registered
 * P8d defect each belongs to (`5.525`, `5.526`, `5.529`): a new one fails, and fixing
 * one fails until it is unpinned. Measured: removing a `refuse()` call AND its `SITES`
 * row fails at 32 of 32 sites (was 7 of 31).
 */
describe('P8a · an APPLIED event changed the projection (catches a silent skip branch)', () => {
  const base1 = () => [
    grant(),
    goal('g1'),
    goal('g2'),
    ev('GoalFunded', { goalId: 'g1', amount: '100' }),
    enter('p1', '50'),
    rule('r1'),
  ];
  const BASES: Record<string, () => LedgerEvent[]> = {
    empty: () => [grant()],
    open: base1,
    closed: () => [...base1(), exit('p1')],
  };
  const T: Record<string, () => Record<string, unknown>> = {
    PlayMoneyGranted: () => ({ amount: '10', currency: 'USD', mode: 'b2c' }),
    WeeklyCreditGranted: () => ({ week: 1, amount: '10' }),
    ComparisonCreditGranted: () => ({ amount: '10' }),
    GoalCreated: () => ({
      goalId: 'g9',
      name: 'g9',
      icon: 'target',
      targetAmount: '10',
      horizonMonths: 1,
    }),
    GoalFunded: () => ({ goalId: 'g1', amount: '5' }),
    GoalPaused: () => ({ goalId: 'g1', expectedVersion: 0 }),
    GoalResumed: () => ({ goalId: 'g1', expectedVersion: 0 }),
    GoalDropped: () => ({ goalId: 'g1', expectedVersion: 0 }),
    GoalAccomplished: () => ({ goalId: 'g1', expectedVersion: 0 }),
    GoalTargetChanged: () => ({
      goalId: 'g1',
      oldTarget: '1000',
      newTarget: '2000',
      expectedVersion: 0,
    }),
    GoalCashReleased: () => ({ goalId: 'g1', amount: '5', expectedVersion: 0 }),
    PositionReassigned: () => ({ positionId: 'p1', fromGoalId: 'g1', toGoalId: 'g2' }),
    StrategyEntered: () => ({
      goalId: 'g1',
      positionId: 'p5',
      strategyId: 'sky',
      amount: '5',
      networkFee: '0',
    }),
    StrategyExited: () => ({
      goalId: 'g1',
      positionId: 'p1',
      grossAmount: '50',
      exitFee: '0',
      networkFee: '0',
    }),
    AccrualApplied: () => ({
      positionId: 'p1',
      earnings: '1',
      fromSimDay: 0,
      toSimDay: 1,
      apySource: 'fixture',
    }),
    ReplaySpanRefused: () => ({
      positionId: 'p1',
      fromSimDay: 0,
      toSimDay: 30,
      reason: 'mixed-calendar',
    }),
    RecurringSet: () => ({ goalId: 'g1', positionId: 'p1', monthlyAmount: '5', startSimDay: 0 }),
    RecurringContributionApplied: () => ({ goalId: 'g1', positionId: 'p1', amount: '5' }),
    RuleCreated: () => ({ ruleId: 'r9', split: [{ goalId: 'g1', percent: 100 }] }),
    RuleUpdated: () => ({
      ruleId: 'r1',
      expectedRuleVersion: 0,
      split: [{ goalId: 'g2', percent: 100 }],
    }),
    RulePaused: () => ({ ruleId: 'r1', expectedRuleVersion: 0 }),
    RuleResumed: () => ({ ruleId: 'r1', expectedRuleVersion: 0 }),
    RuleDeleted: () => ({ ruleId: 'r1', expectedRuleVersion: 0 }),
    RuleApplied: () => ({ ruleId: 'r1', ruleVersion: 0, proposalId: 'pp', weekSet: [1] }),
    SimulatedExpensePaid: () => ({ eventInstanceId: 'x', amount: '5' }),
    SimulatedIncomeReceived: () => ({ eventInstanceId: 'i', amount: '5' }),
    TimeAdvanced: () => ({ days: 1 }),
    JobsSplitSet: () => ({ floorPercent: 50, cushionPercent: 30, workingPercent: 20 }),
  };
  /**
   * Every Decimal money field, with what a VALID value is. Each field is mutated on its
   * own (the third review found the corpus had mutated `amount` only — an inflated
   * `grossAmount` on an exit minted play money unnoticed).
   */
  const MONEY_FIELDS: Record<string, 'positive' | 'non-negative' | 'any-sign'> = {
    amount: 'positive',
    grossAmount: 'positive',
    exitFee: 'non-negative',
    networkFee: 'non-negative',
    monthlyAmount: 'non-negative', // '0' clears a schedule (C3, A-7)
    earnings: 'any-sign', // negative in a down replay
  };
  /** Each mutation applies only where its field exists. `as-is` is the valid template. */
  const MUTATIONS: Record<string, (p: Record<string, unknown>) => Record<string, unknown> | null> =
    {
      'as-is': (p) => p,
      'unknown-goal': (p) => ('goalId' in p ? { ...p, goalId: 'nope' } : null),
      'other-goal': (p) => ('goalId' in p ? { ...p, goalId: 'g2' } : null),
      'unknown-to-goal': (p) => ('toGoalId' in p ? { ...p, toGoalId: 'nope' } : null),
      'other-from-goal': (p) => ('fromGoalId' in p ? { ...p, fromGoalId: 'g2' } : null),
      'unknown-position': (p) => ('positionId' in p ? { ...p, positionId: 'nope' } : null),
      'unknown-rule': (p) => ('ruleId' in p ? { ...p, ruleId: 'nope' } : null),
      'stale-version': (p) =>
        'expectedVersion' in p
          ? { ...p, expectedVersion: 99 }
          : 'expectedRuleVersion' in p
            ? { ...p, expectedRuleVersion: 99 }
            : null,
      ...Object.fromEntries(
        Object.keys(MONEY_FIELDS).flatMap((field) =>
          (
            [
              ['zero', '0'],
              ['negative', '-5'],
              ['oversized', '999999'],
            ] as const
          ).map(([kind, value]) => [
            `${field}=${kind}`,
            (p: Record<string, unknown>) => (field in p ? { ...p, [field]: value } : null),
          ])
        )
      ),
    };
  /** Is this mutation's value INVALID for its field? (`as-is` and id mutations: no.) */
  const invalidValue = (mutName: string): boolean => {
    const [field, kind] = mutName.split('=') as [string, string | undefined];
    const rule = MONEY_FIELDS[field];
    if (!rule || !kind || kind === 'oversized') return false;
    return rule === 'positive' || (rule === 'non-negative' && kind === 'negative');
  };
  /**
   * Types whose valid occurrence changes no projected field — markers by design; a
   * silent skip in THEIR branch is invisible here (only its `SITES` row proves it).
   * `ReplaySpanRefused` is NOT one: it advances the position's consumed-through day
   * (`projection/core.ts`) — the third review measured that treating it as a marker
   * was the whole of the one "survivor" this corpus once reported.
   */
  const PURE_MARKERS = new Set(['RuleApplied']);
  /** Repeated with the same value, these change nothing — legitimately. */
  const IDEMPOTENT_REPEATS = new Set(['JobsSplitSet', 'RecurringSet', 'ReplaySpanRefused']);

  const noops: string[] = [];
  const breaksReconcile: string[] = [];
  const invalidApplied: string[] = [];
  const breaksGoalAttribution: string[] = [];
  const doubleAccrual: string[] = [];
  /** Each goal's `invested` equals the principal of its own open positions. */
  const goalsAttributed = (st: LedgerState): boolean =>
    st.goals.every(
      (g) =>
        Number(g.invested).toFixed(2) ===
        st.positions
          .filter((p) => p.open && p.goalId === g.goalId)
          .reduce((sum, p) => sum + Number(p.principal), 0)
          .toFixed(2)
    );
  for (const [baseName, base] of Object.entries(BASES))
    for (const [type, template] of Object.entries(T))
      for (const [mutName, mutate] of Object.entries(MUTATIONS)) {
        const payload = mutate(template());
        if (!payload) continue;
        for (const repeat of [false, true]) {
          const id = `${baseName}:${type}:${mutName}${repeat ? ':repeat' : ''}`;
          const head = [...base(), ...(repeat ? [ev(type, payload)] : [])];
          const log = [...head, ev(type, payload)];
          const before = project(head);
          const after = project(log);
          if (after.dispositions[log.length - 1]!.status !== 'APPLIED') continue;
          if (reconcile(before) === '0.00' && reconcile(after) !== '0.00') breaksReconcile.push(id);
          if (!repeat && invalidValue(mutName)) invalidApplied.push(id);
          if (goalsAttributed(before) && !goalsAttributed(after)) breaksGoalAttribution.push(id);
          if (repeat && type === 'AccrualApplied') doubleAccrual.push(id);
          if (
            PURE_MARKERS.has(type) ||
            (repeat && mutName === 'as-is' && IDEMPOTENT_REPEATS.has(type))
          )
            continue;
          if (snapshot(before) === snapshot(after)) noops.push(id);
        }
      }

  it('should leave APPLIED-but-unchanged only to the pinned defects (5.526 / 5.529)', () => {
    // Grouped by register below; compared as sets of ids.
    expect([...noops].sort()).toEqual(
      [
        // 5.526 · a zero amount is APPLIED and changes nothing
        'empty:PlayMoneyGranted:amount=zero',
        'empty:PlayMoneyGranted:amount=zero:repeat',
        'open:PlayMoneyGranted:amount=zero',
        'open:PlayMoneyGranted:amount=zero:repeat',
        'open:GoalFunded:amount=zero',
        'open:GoalFunded:amount=zero:repeat',
        'closed:PlayMoneyGranted:amount=zero',
        'closed:PlayMoneyGranted:amount=zero:repeat',
        'closed:GoalFunded:amount=zero',
        'closed:GoalFunded:amount=zero:repeat',
        // 5.529 · a repeated create with an existing id OVERWRITES the goal / position
        'empty:GoalCreated:as-is:repeat',
        'empty:GoalCreated:unknown-goal:repeat',
        'empty:GoalCreated:other-goal:repeat',
        'open:GoalCreated:as-is:repeat',
        'open:GoalCreated:unknown-goal:repeat',
        'open:GoalCreated:other-goal:repeat',
        'open:StrategyEntered:amount=zero:repeat',
        'closed:GoalCreated:as-is:repeat',
        'closed:GoalCreated:unknown-goal:repeat',
        'closed:GoalCreated:other-goal:repeat',
        'closed:StrategyEntered:amount=zero:repeat',
        // 5.526 · RecurringSet is never validated (unknown or closed position, any goal, any amount)
        'empty:RecurringSet:as-is',
        'empty:RecurringSet:unknown-goal',
        'empty:RecurringSet:unknown-goal:repeat',
        'empty:RecurringSet:other-goal',
        'empty:RecurringSet:other-goal:repeat',
        'empty:RecurringSet:unknown-position',
        'empty:RecurringSet:unknown-position:repeat',
        'empty:RecurringSet:monthlyAmount=zero',
        'empty:RecurringSet:monthlyAmount=zero:repeat',
        'empty:RecurringSet:monthlyAmount=negative',
        'empty:RecurringSet:monthlyAmount=negative:repeat',
        'empty:RecurringSet:monthlyAmount=oversized',
        'empty:RecurringSet:monthlyAmount=oversized:repeat',
        'open:RecurringSet:unknown-goal:repeat',
        'open:RecurringSet:other-goal:repeat',
        'open:RecurringSet:unknown-position',
        'open:RecurringSet:unknown-position:repeat',
        'open:RecurringSet:monthlyAmount=zero',
        'open:RecurringSet:monthlyAmount=zero:repeat',
        'open:RecurringSet:monthlyAmount=negative',
        'open:RecurringSet:monthlyAmount=negative:repeat',
        'open:RecurringSet:monthlyAmount=oversized:repeat',
        'closed:RecurringSet:as-is',
        'closed:RecurringSet:unknown-goal',
        'closed:RecurringSet:unknown-goal:repeat',
        'closed:RecurringSet:other-goal',
        'closed:RecurringSet:other-goal:repeat',
        'closed:RecurringSet:unknown-position',
        'closed:RecurringSet:unknown-position:repeat',
        'closed:RecurringSet:monthlyAmount=zero',
        'closed:RecurringSet:monthlyAmount=zero:repeat',
        'closed:RecurringSet:monthlyAmount=negative',
        'closed:RecurringSet:monthlyAmount=negative:repeat',
        'closed:RecurringSet:monthlyAmount=oversized',
        'closed:RecurringSet:monthlyAmount=oversized:repeat',
        // 5.525 · a repeated accrual span
        'open:AccrualApplied:earnings=zero:repeat',
      ].sort()
    );
  });

  it('should keep reconcile() at 0.00 after every APPLIED event, except the pinned 5.525 / 5.529 cases', () => {
    // Grouped by register below; compared as sets of ids.
    expect([...breaksReconcile].sort()).toEqual(
      [
        // 5.529 · a repeated create with an existing id OVERWRITES the goal / position
        'open:StrategyEntered:as-is:repeat',
        'open:StrategyEntered:unknown-position:repeat',
        'open:StrategyEntered:amount=negative:repeat',
        'open:StrategyEntered:networkFee=zero:repeat',
        'open:StrategyEntered:networkFee=negative:repeat',
        'closed:StrategyEntered:as-is:repeat',
        'closed:StrategyEntered:unknown-position:repeat',
        'closed:StrategyEntered:amount=negative:repeat',
        'closed:StrategyEntered:networkFee=zero:repeat',
        'closed:StrategyEntered:networkFee=negative:repeat',
        // 5.525 · an exit is not checked against the position: another goal's credit, or a gross that mints/destroys money
        'open:StrategyExited:unknown-goal',
        'open:StrategyExited:grossAmount=zero',
        'open:StrategyExited:grossAmount=negative',
        'open:StrategyExited:grossAmount=oversized',
      ].sort()
    );
  });

  it('should APPLY an invalid amount or fee only where pinned (5.529 — the projection does not validate them)', () => {
    // Grouped by register below; compared as sets of ids.
    expect([...invalidApplied].sort()).toEqual(
      [
        // 5.529 · the projection does not validate amounts and fees
        'empty:PlayMoneyGranted:amount=zero',
        'empty:PlayMoneyGranted:amount=negative',
        'empty:WeeklyCreditGranted:amount=zero',
        'empty:WeeklyCreditGranted:amount=negative',
        'open:PlayMoneyGranted:amount=zero',
        'open:PlayMoneyGranted:amount=negative',
        'open:WeeklyCreditGranted:amount=zero',
        'open:WeeklyCreditGranted:amount=negative',
        'open:ComparisonCreditGranted:amount=zero',
        'open:ComparisonCreditGranted:amount=negative',
        'open:GoalFunded:amount=zero',
        'open:GoalFunded:amount=negative',
        'open:StrategyEntered:amount=zero',
        'open:StrategyEntered:amount=negative',
        'open:StrategyEntered:networkFee=negative',
        'closed:PlayMoneyGranted:amount=zero',
        'closed:PlayMoneyGranted:amount=negative',
        'closed:WeeklyCreditGranted:amount=zero',
        'closed:WeeklyCreditGranted:amount=negative',
        'closed:ComparisonCreditGranted:amount=zero',
        'closed:ComparisonCreditGranted:amount=negative',
        'closed:GoalFunded:amount=zero',
        'closed:GoalFunded:amount=negative',
        'closed:StrategyEntered:amount=zero',
        'closed:StrategyEntered:amount=negative',
        'closed:StrategyEntered:networkFee=negative',
        // 5.526 · RecurringSet is never validated (unknown or closed position, any goal, any amount)
        'empty:RecurringSet:monthlyAmount=negative',
        'open:RecurringSet:monthlyAmount=negative',
        'closed:RecurringSet:monthlyAmount=negative',
        // 5.525 · an exit is not checked against the position: another goal's credit, or a gross that mints/destroys money
        'open:StrategyExited:grossAmount=zero',
        'open:StrategyExited:grossAmount=negative',
        'open:StrategyExited:exitFee=negative',
        'open:StrategyExited:networkFee=negative',
      ].sort()
    );
  });

  it('should keep every goal’s invested equal to its open positions’ principal, except the pinned 5.525 / 5.529 cases', () => {
    // Grouped by register below; compared as sets of ids.
    expect([...breaksGoalAttribution].sort()).toEqual(
      [
        // 5.529 · a repeated create with an existing id OVERWRITES the goal / position
        'open:StrategyEntered:as-is:repeat',
        'open:StrategyEntered:unknown-position:repeat',
        'open:StrategyEntered:amount=negative:repeat',
        'open:StrategyEntered:networkFee=zero:repeat',
        'open:StrategyEntered:networkFee=negative:repeat',
        'closed:StrategyEntered:as-is:repeat',
        'closed:StrategyEntered:unknown-position:repeat',
        'closed:StrategyEntered:amount=negative:repeat',
        'closed:StrategyEntered:networkFee=zero:repeat',
        'closed:StrategyEntered:networkFee=negative:repeat',
        // 5.525 · an exit is not checked against the position: another goal's credit, or a gross that mints/destroys money
        'open:StrategyExited:unknown-goal',
        'open:StrategyExited:other-goal',
        // 5.529 · a contribution's goal is not checked against the position's
        'open:RecurringContributionApplied:unknown-goal',
        'open:RecurringContributionApplied:other-goal',
      ].sort()
    );
  });

  it('should APPLY a repeated accrual span only where pinned (5.525)', () => {
    // Grouped by register below; compared as sets of ids.
    expect([...doubleAccrual].sort()).toEqual(
      [
        // 5.525 · a repeated accrual span is APPLIED again — earnings counted twice (a stale tab re-running the time machine)
        'open:AccrualApplied:as-is:repeat',
        'open:AccrualApplied:earnings=zero:repeat',
        'open:AccrualApplied:earnings=negative:repeat',
        'open:AccrualApplied:earnings=oversized:repeat',
      ].sort()
    );
  });
});
