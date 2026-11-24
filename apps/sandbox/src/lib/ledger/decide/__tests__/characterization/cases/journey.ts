/**
 * ⛑ LEDGER-CHAR-1 · journey commands (rows 1–8, 10–12; plan P12 Appendix A). Row 9
 * (`advanceTime`) lives in `advanceTime.ts`. Each case states today's behaviour as a label.
 */
import type { CaseDef } from '../harness';
import { history } from '../seed';

type Ccy = 'USD' | 'BRL' | 'EUR';
type Mode = 'b2c' | 'b2b';
const CURRENCIES: Ccy[] = ['USD', 'BRL', 'EUR'];
const MODES: Mode[] = ['b2c', 'b2b'];

const granted = (c: Ccy = 'USD', m: Mode = 'b2c') => history().grant('10000.00', c, m);
const withGoal = () => granted().goal('g1').fund('g1', '1000.00');
const paused = () => withGoal().add('GoalPaused', { goalId: 'g1', expectedVersion: 0 });
const accomplished = () =>
  withGoal().add('GoalAccomplished', {
    goalId: 'g1',
    disposition: 'kept-working',
    expectedVersion: 0,
  });
const dropped = () =>
  withGoal().add('GoalDropped', { goalId: 'g1', cashReleased: '1000.00', expectedVersion: 0 });
const twoGoals = () => withGoal().goal('g2', '500.00', 'Car').fund('g2', '200.00');
/** One OPEN v1 and one OPEN v2 position on g1 (plan §4.1: the shared fixtures close both). */
const openPositions = (c: Ccy = 'USD', m: Mode = 'b2c') =>
  granted(c, m)
    .goal('g1')
    .fund('g1', '3000.00')
    .enterV1('g1', 'p1', '990.00')
    .enterV2('g1', 'p2', '1000.00', 'stableGrowth');

const emitted = { expected: 'emitted' };
const noop = (reason: string) => ({ expected: `noop:${reason}` });
const threw = { expected: 'throw' };

export const journeyCases: CaseDef[] = [
  /* ── row 1 · grantPlayMoney ───────────────────────────────────────────────────── */
  ...CURRENCIES.flatMap((c) =>
    MODES.map((m): CaseDef => ({
      id: `grant-${c}-${m}`,
      row: 1,
      label: emitted,
      run: ({ ledger }) => ledger.grantPlayMoney(10000, c, m),
    }))
  ),
  {
    id: 'grant-already-initialized',
    row: 1,
    label: noop('alreadyInitialized'),
    seed: granted().get(),
    run: ({ ledger }) => ledger.grantPlayMoney(10000, 'USD', 'b2c'),
  },
  {
    id: 'grant-fraction',
    row: 1,
    label: emitted,
    run: ({ ledger }) => ledger.grantPlayMoney(0.005, 'USD', 'b2c'),
  },
  {
    id: 'grant-nan',
    row: 1,
    label: emitted,
    run: ({ ledger }) => ledger.grantPlayMoney(Number.NaN, 'USD', 'b2c'),
  },
  {
    id: 'grant-undefined-amount',
    row: 1,
    label: threw,
    run: ({ ledger }) => ledger.grantPlayMoney(undefined as never, 'USD', 'b2c'),
  },

  /* ── row 2 · createGoal ───────────────────────────────────────────────────────── */
  ...(
    [
      ['affordable', 1000, emitted],
      ['exact-balance', 10000, emitted],
      [
        'balance-plus-cent',
        10000.01,
        { expected: 'emitted', notes: ['fundingWithheld:insufficientAvailable'] },
      ],
      ['zero', 0, emitted],
      ['negative', -5, { expected: 'emitted', notes: ['fundingWithheld:invalidAmount'] }],
      ['nan', Number.NaN, { expected: 'emitted', notes: ['fundingWithheld:invalidAmount'] }],
      ['infinity', Infinity, { expected: 'emitted', notes: ['fundingWithheld:invalidAmount'] }],
      ['tenth-of-cent', 0.001, emitted],
    ] as const
  ).map(([name, fund, label]): CaseDef => ({
    id: `create-goal-fund-${name}`,
    row: 2,
    label,
    seed: granted().get(),
    inputs: [
      { name: '  Trip  ', icon: 'plane', targetAmount: 3000, horizonMonths: 24, fundAmount: fund },
    ],
    run: ({ ledger }) =>
      ledger.createGoal({
        name: '  Trip  ',
        icon: 'plane',
        targetAmount: 3000,
        horizonMonths: 24,
        fundAmount: fund,
      }),
  })),
  {
    id: 'create-goal-uninitialized',
    row: 2,
    label: { expected: 'emitted', notes: ['fundingWithheld:insufficientAvailable'] },
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: 10,
        horizonMonths: 1,
        fundAmount: 5,
      }),
  },
  {
    id: 'create-goal-target-sub-cent',
    row: 2,
    label: emitted,
    pinnedDefect: '5.543',
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: 0.004,
        horizonMonths: 1,
        fundAmount: 0,
      }),
  },
  {
    id: 'create-goal-horizon-nan',
    row: 2,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: 10,
        horizonMonths: Number.NaN,
        fundAmount: 0,
      }),
  },
  {
    id: 'create-goal-target-undefined',
    row: 2,
    label: threw,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: undefined as never,
        horizonMonths: 1,
        fundAmount: 0,
      }),
  },
  /* S1b's rules, accepted today (plan §4.1): an empty name, target 0, a horizon out of range. */
  {
    id: 'create-goal-accepted-today-empty-name',
    row: 2,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: '   ',
        icon: 'x',
        targetAmount: 10,
        horizonMonths: 1,
        fundAmount: 0,
      }),
  },
  {
    id: 'create-goal-accepted-today-target-zero',
    row: 2,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({ name: 'A', icon: 'x', targetAmount: 0, horizonMonths: 1, fundAmount: 0 }),
  },
  {
    id: 'create-goal-accepted-today-horizon-out-of-range',
    row: 2,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: 10,
        horizonMonths: 1200,
        fundAmount: 0,
      }),
  },
  {
    id: 'create-goal-accepted-today-negative-target',
    row: 2,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) =>
      ledger.createGoal({
        name: 'A',
        icon: 'x',
        targetAmount: -10,
        horizonMonths: 1,
        fundAmount: 0,
      }),
  },

  /* ── rows 3–5 · pause, resume, accomplish ─────────────────────────────────────── */
  {
    id: 'pause-active',
    row: 3,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.pauseGoal('g1'),
  },
  {
    id: 'pause-missing',
    row: 3,
    label: noop('goalNotActive'),
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.pauseGoal('nope'),
  },
  {
    id: 'pause-paused',
    row: 3,
    label: noop('goalNotActive'),
    seed: paused().get(),
    run: ({ ledger }) => ledger.pauseGoal('g1'),
  },
  {
    id: 'pause-accomplished',
    row: 3,
    label: noop('goalNotActive'),
    seed: accomplished().get(),
    run: ({ ledger }) => ledger.pauseGoal('g1'),
  },
  {
    id: 'resume-paused',
    row: 4,
    label: emitted,
    seed: paused().get(),
    run: ({ ledger }) => ledger.resumeGoal('g1'),
  },
  {
    id: 'resume-active',
    row: 4,
    label: noop('goalNotPaused'),
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.resumeGoal('g1'),
  },
  {
    id: 'resume-missing',
    row: 4,
    label: noop('goalNotPaused'),
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.resumeGoal('nope'),
  },
  ...(['kept-working', 'held-as-cash', 'transferred'] as const).map((d): CaseDef => ({
    id: `accomplish-active-${d}`,
    row: 5,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.accomplishGoal('g1', d),
  })),
  {
    id: 'accomplish-paused',
    row: 5,
    label: emitted,
    seed: paused().get(),
    run: ({ ledger }) => ledger.accomplishGoal('g1', 'held-as-cash'),
  },
  {
    id: 'accomplish-dropped',
    row: 5,
    label: noop('goalClosed'),
    seed: dropped().get(),
    run: ({ ledger }) => ledger.accomplishGoal('g1', 'kept-working'),
  },
  {
    id: 'accomplish-missing',
    row: 5,
    label: noop('goalClosed'),
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.accomplishGoal('nope', 'kept-working'),
  },

  /* ── row 6 · transferGoalCash ─────────────────────────────────────────────────── */
  {
    id: 'transfer-with-cash',
    row: 6,
    label: emitted,
    seed: twoGoals().get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g2'),
  },
  {
    id: 'transfer-no-cash',
    row: 6,
    label: emitted,
    seed: granted().goal('g1').goal('g2').get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g2'),
  },
  {
    id: 'transfer-from-paused',
    row: 6,
    label: emitted,
    seed: twoGoals().add('GoalPaused', { goalId: 'g1', expectedVersion: 0 }).get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g2'),
  },
  {
    id: 'transfer-same-goal',
    row: 6,
    label: noop('sameGoal'),
    seed: twoGoals().get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g1'),
  },
  {
    id: 'transfer-from-missing',
    row: 6,
    label: noop('goalMissing'),
    seed: twoGoals().get(),
    run: ({ ledger }) => ledger.transferGoalCash('nope', 'g2'),
  },
  {
    id: 'transfer-to-missing',
    row: 6,
    label: noop('goalMissing'),
    seed: twoGoals().get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'nope'),
  },
  {
    id: 'transfer-from-closed',
    row: 6,
    label: noop('sourceClosed'),
    seed: twoGoals()
      .add('GoalAccomplished', { goalId: 'g1', disposition: 'kept-working', expectedVersion: 0 })
      .get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g2'),
  },
  {
    id: 'transfer-to-paused',
    row: 6,
    label: noop('destinationNotActive'),
    seed: twoGoals().add('GoalPaused', { goalId: 'g2', expectedVersion: 0 }).get(),
    run: ({ ledger }) => ledger.transferGoalCash('g1', 'g2'),
  },

  /* ── row 7 · raiseGoalTarget ──────────────────────────────────────────────────── */
  ...(
    [
      ['higher', '4000', emitted],
      ['higher-from-paused', '4000', emitted],
      ['equal', '3000', noop('notARaise')],
      ['lower', '10', noop('notARaise')],
      ['unparseable', 'abc', noop('unparseable')],
      ['empty', '', noop('unparseable')],
      ['nan', 'NaN', noop('notARaise')],
      ['infinity', 'Infinity', noop('notARaise')],
      ['beyond-float', '9007199254740993', emitted],
      ['sub-cent', '3000.004', emitted],
    ] as const
  ).map(([name, value, label]): CaseDef => ({
    id: `raise-target-${name}`,
    row: 7,
    label,
    seed: (name === 'higher-from-paused' ? paused() : withGoal()).get(),
    run: ({ ledger }) => ledger.raiseGoalTarget('g1', value),
  })),
  {
    id: 'raise-target-missing',
    row: 7,
    label: noop('goalClosed'),
    seed: withGoal().get(),
    run: ({ ledger }) => ledger.raiseGoalTarget('nope', '4000'),
  },
  {
    id: 'raise-target-dropped',
    row: 7,
    label: noop('goalClosed'),
    seed: dropped().get(),
    run: ({ ledger }) => ledger.raiseGoalTarget('g1', '4000'),
  },

  /* ── row 8 · enterStrategy ────────────────────────────────────────────────────── */
  ...(
    [
      ['plain', 500, 0.5],
      ['sub-cent-fee', 25, 0.005],
      ['fee-above-total', 1, 5],
      ['zero-fee', 100, 0],
      ['nan-fee', 100, Number.NaN],
      ['nan-total', Number.NaN, 0.5],
      ['fraction-total', 100.005, 0.5],
    ] as const
  ).map(([name, total, fee]): CaseDef => ({
    id: `enter-${name}`,
    row: 8,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.enterStrategy({
        goalId: 'g1',
        strategyId: 'safeHarbor',
        totalFromCash: total,
        networkFeeLocal: fee,
      }),
  })),
  {
    id: 'enter-unknown-goal',
    row: 8,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.enterStrategy({
        goalId: 'nope',
        strategyId: 'safeHarbor',
        totalFromCash: 10,
        networkFeeLocal: 0,
      }),
  },
  {
    id: 'enter-unknown-strategy',
    row: 8,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.enterStrategy({
        goalId: 'g1',
        strategyId: 'nope' as never,
        totalFromCash: 10,
        networkFeeLocal: 0,
      }),
  },
  {
    id: 'enter-undefined-fee',
    row: 8,
    label: threw,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.enterStrategy({
        goalId: 'g1',
        strategyId: 'safeHarbor',
        totalFromCash: 10,
        networkFeeLocal: undefined as never,
      }),
  },
  /* S1b: an unaffordable entry, accepted today (the projection refuses it). */
  {
    id: 'enter-accepted-today-unaffordable',
    row: 8,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.enterStrategy({
        goalId: 'g1',
        strategyId: 'safeHarbor',
        totalFromCash: 999999,
        networkFeeLocal: 0,
      }),
  },

  /* ── row 10 · setRecurring ────────────────────────────────────────────────────── */
  ...(
    [
      ['monthly', 100],
      ['stop', 0],
      ['accepted-today-negative', -50],
      ['nan', Number.NaN],
      ['fraction', 10.005],
    ] as const
  ).map(([name, amount]): CaseDef => ({
    id: `recurring-${name}`,
    row: 10,
    label: emitted,
    seed: openPositions().advance(30).get(),
    run: ({ ledger }) =>
      ledger.setRecurring({ goalId: 'g1', positionId: 'p2', monthlyAmount: amount }),
  })),
  {
    id: 'recurring-closed-position',
    row: 10,
    label: emitted,
    seed: withGoal().get(),
    run: ({ ledger }) =>
      ledger.setRecurring({ goalId: 'g1', positionId: 'nope', monthlyAmount: 100 }),
  },
  {
    id: 'recurring-undefined-amount',
    row: 10,
    label: threw,
    seed: openPositions().get(),
    run: ({ ledger }) =>
      ledger.setRecurring({ goalId: 'g1', positionId: 'p2', monthlyAmount: undefined as never }),
  },

  /* ── row 11 · exitPosition (fee floor per currency, plan §4.1 currency × mode) ── */
  ...CURRENCIES.flatMap((c) =>
    MODES.flatMap((m) =>
      (['p1', 'p2'] as const).map((positionId): CaseDef => ({
        id: `exit-${positionId}-${c}-${m}`,
        row: 11,
        label: emitted,
        seed: openPositions(c, m).get(),
        run: ({ ledger }) => ledger.exitPosition({ positionId, networkFeeLocal: 0.005 }),
      }))
    )
  ),
  ...CURRENCIES.map((c): CaseDef => ({
    id: `exit-below-fee-floor-${c}`,
    row: 11,
    label: emitted,
    seed: granted(c).goal('g1').fund('g1', '10.00').enterV2('g1', 'p9', '1.00').get(),
    run: ({ ledger }) => ledger.exitPosition({ positionId: 'p9', networkFeeLocal: 0.01 }),
  })),
  {
    id: 'exit-missing',
    row: 11,
    label: noop('positionNotOpen'),
    seed: openPositions().get(),
    run: ({ ledger }) => ledger.exitPosition({ positionId: 'nope', networkFeeLocal: 0 }),
  },
  {
    id: 'exit-closed',
    row: 11,
    label: noop('positionNotOpen'),
    seed: openPositions()
      .add('StrategyExited', {
        positionId: 'p2',
        goalId: 'g1',
        grossAmount: '1000.00',
        schemaVersion: 2,
        modeledExitFee: '3.90',
        modeledNetworkFee: '0.50',
      })
      .get(),
    run: ({ ledger }) => ledger.exitPosition({ positionId: 'p2', networkFeeLocal: 0 }),
  },

  /* ── row 12 · stopGoalStrategies ──────────────────────────────────────────────── */
  ...CURRENCIES.flatMap((c) =>
    MODES.map((m): CaseDef => ({
      id: `stop-all-${c}-${m}`,
      row: 12,
      label: emitted,
      seed: openPositions(c, m).get(),
      run: ({ ledger, feeFor }) =>
        ledger.stopGoalStrategies('g1', feeFor({ p1: 0.005, p2: 1.237 })),
    }))
  ),
  {
    id: 'stop-all-none-open',
    row: 12,
    label: noop('nothingOpen'),
    seed: withGoal().get(),
    run: ({ ledger, feeFor }) => ledger.stopGoalStrategies('g1', feeFor({})),
  },
  {
    id: 'stop-all-unknown-goal',
    row: 12,
    label: noop('nothingOpen'),
    seed: openPositions().get(),
    run: ({ ledger, feeFor }) => ledger.stopGoalStrategies('nope', feeFor({})),
  },
  {
    id: 'stop-all-fee-throws',
    row: 12,
    label: threw,
    seed: openPositions().get(),
    run: ({ ledger }) =>
      ledger.stopGoalStrategies('g1', () => {
        throw new TypeError('fee unavailable');
      }),
  },
];

export { granted, withGoal, openPositions, paused };
