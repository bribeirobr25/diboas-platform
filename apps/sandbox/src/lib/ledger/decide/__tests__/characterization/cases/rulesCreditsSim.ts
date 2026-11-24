/**
 * ⛑ LEDGER-CHAR-1 · rules (rows 13–16), credits (17–18) and the simulated expense (19).
 */
import type { Proposal } from '@diboas/investing';
import { creditCeilingAmount } from '@/lib/growthConstants';
import type { CaseDef } from '../harness';
import { history } from '../seed';

type Ccy = 'USD' | 'BRL' | 'EUR';
type Mode = 'b2c' | 'b2b';
const CURRENCIES: Ccy[] = ['USD', 'BRL', 'EUR'];
const MODES: Mode[] = ['b2c', 'b2b'];

const emitted = { expected: 'emitted' };
const noop = (reason: string) => ({ expected: `noop:${reason}` });
const threw = { expected: 'throw' };

const granted = (c: Ccy = 'USD', m: Mode = 'b2c') => history().grant('10000.00', c, m);
const goals = () => granted().goal('g1').fund('g1', '1000.00').goal('g2', '500.00', 'Car');
const withRule = () =>
  goals().add('RuleCreated', {
    ruleId: 'r1',
    split: [
      { goalId: 'g1', percent: 60 },
      { goalId: 'g2', percent: 40 },
    ],
  });

/* ── rows 13–14 · createRule, updateRule ──────────────────────────────────────── */
const validSplit = () => [
  { goalId: 'g1', percent: 60 },
  { goalId: 'g2', percent: 40 },
];
const splits: Array<[string, unknown, string]> = [
  ['valid', validSplit(), 'emitted'],
  ['partial-sum', [{ goalId: 'g1', percent: 30 }], 'emitted'],
  ['empty', [], 'noop:invalidSplit'],
  [
    'over-100',
    [
      { goalId: 'g1', percent: 70 },
      { goalId: 'g2', percent: 40 },
    ],
    'noop:invalidSplit',
  ],
  ['zero-percent', [{ goalId: 'g1', percent: 0 }], 'noop:invalidSplit'],
  ['fraction-percent', [{ goalId: 'g1', percent: 50.5 }], 'noop:invalidSplit'],
  [
    'duplicate-goal',
    [
      { goalId: 'g1', percent: 20 },
      { goalId: 'g1', percent: 20 },
    ],
    'noop:invalidSplit',
  ],
  ['nan-percent', [{ goalId: 'g1', percent: Number.NaN }], 'noop:invalidSplit'],
  ['unknown-goal', [{ goalId: 'nope', percent: 50 }], 'emitted'],
];

/* ── row 15 · applyRuleProposal ───────────────────────────────────────────────── */
/** A proposal for weeks [1] under r1 v0: 60 to g1, 40 to g2, remainder 0. */
const proposal = (over: Partial<Proposal> = {}): Proposal => ({
  proposalId: 'pr1',
  ruleId: 'r1',
  ruleVersion: 0,
  weekSet: [1],
  lines: [
    { goalId: 'g1', amount: 60 },
    { goalId: 'g2', amount: 40 },
  ],
  remainderToAvailable: 0,
  status: 'proposed',
  repairNeeded: false,
  ...over,
});

/**
 * The six refusal checks of row 15, each as a (seed, proposal, adjusted) mutation, so every
 * PAIR can be planted together and a swapped check shows (plan §4.1, sabotage (c)).
 */
const ROW15_CHECKS = {
  repairNeeded: { proposal: { repairNeeded: true } },
  staleRuleVersion: { proposal: { ruleVersion: 7 } },
  alreadyApplied: { seedApplied: true },
  adjustedInvalid: { adjusted: [{ goalId: 'g1', amount: 1.5 }] },
  destinationChanged: { pauseG2: true },
  insufficientAvailable: {
    proposal: {
      lines: [
        { goalId: 'g1', amount: 600000 },
        { goalId: 'g2', amount: 40 },
      ],
    },
  },
} as const;
type Row15Check = keyof typeof ROW15_CHECKS;

function row15Case(id: string, checks: Row15Check[], expected: string): CaseDef {
  let h = withRule();
  let over: Partial<Proposal> = {};
  let adjusted: { goalId: string; amount: number }[] | undefined;
  for (const check of checks) {
    const c = ROW15_CHECKS[check] as {
      proposal?: Partial<Proposal>;
      seedApplied?: boolean;
      adjusted?: { goalId: string; amount: number }[];
      pauseG2?: boolean;
    };
    if (c.proposal) over = { ...over, ...c.proposal };
    if (c.seedApplied)
      h = h.add('RuleApplied', { ruleId: 'r1', ruleVersion: 0, proposalId: 'pr0', weekSet: [1] });
    if (c.adjusted) adjusted = c.adjusted;
    if (c.pauseG2) h = h.add('GoalPaused', { goalId: 'g2', expectedVersion: 0 });
  }
  const p = proposal(over);
  return {
    id,
    row: 15,
    label: { expected },
    seed: h.get(),
    inputs: adjusted ? [p, adjusted] : [p],
    run: ({ ledger }) => ledger.applyRuleProposal(p, adjusted),
  };
}

/** Today's check order (`rules.ts:73-109`): the first failing check names the reason. */
const ORDER: Row15Check[] = [
  'repairNeeded',
  'staleRuleVersion',
  'alreadyApplied',
  'adjustedInvalid',
  'destinationChanged',
  'insufficientAvailable',
];
const reasonOf = (c: Row15Check) => (c === 'adjustedInvalid' ? 'destinationChanged' : c);
const row15Pairs: CaseDef[] = ORDER.flatMap((a, i) =>
  ORDER.slice(i + 1).map((b) => row15Case(`apply-pair-${a}-${b}`, [a, b], `noop:${reasonOf(a)}`))
);

/* ── row 19 · resolveSimulatedExpense ─────────────────────────────────────────── */
const simBase = () => granted().goal('g1').fund('g1', '500.00');
type Via =
  | { path: 'available' }
  | { path: 'reserve'; goalId: string }
  | { path: 'split'; goalId: string; fromGoal: number };
const resolve = (
  id: string,
  label: { expected: string },
  via: Via,
  amount = 150,
  seed = simBase().get(),
  extra: Partial<CaseDef> = {}
): CaseDef => ({
  id,
  row: 19,
  label,
  seed,
  run: ({ ledger }) =>
    ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'carRepair', amount, via }),
  ...extra,
});

export const rulesCreditsSimCases: CaseDef[] = [
  ...splits.map(([name, split, expected]): CaseDef => ({
    id: `create-rule-${name}`,
    row: 13,
    label: { expected },
    seed: goals().get(),
    inputs: [split],
    run: ({ ledger }) => ledger.createRule(split as never),
  })),
  {
    id: 'create-rule-uninitialized',
    row: 13,
    label: noop('notInitialized'),
    run: ({ ledger }) => ledger.createRule(validSplit()),
  },
  {
    id: 'create-rule-live-rule-exists',
    row: 13,
    label: noop('ruleExists'),
    seed: withRule().get(),
    run: ({ ledger }) => ledger.createRule(validSplit()),
  },
  {
    id: 'create-rule-after-delete',
    row: 13,
    label: emitted,
    seed: withRule().add('RuleDeleted', { ruleId: 'r1', expectedRuleVersion: 0 }).get(),
    run: ({ ledger }) => ledger.createRule(validSplit()),
  },
  {
    id: 'create-rule-non-array-initialized',
    row: 13,
    label: threw,
    seed: goals().get(),
    run: ({ ledger }) => ledger.createRule(5 as never),
  },
  {
    id: 'create-rule-non-array-uninitialized',
    row: 13,
    label: noop('notInitialized'),
    run: ({ ledger }) => ledger.createRule(5 as never),
  },
  {
    id: 'create-rule-string-split',
    row: 13,
    label: noop('invalidSplit'),
    seed: goals().get(),
    run: ({ ledger }) => ledger.createRule('x' as never),
  },
  ...splits.map(([name, split, expected]): CaseDef => ({
    id: `update-rule-${name}`,
    row: 14,
    label: { expected },
    seed: withRule().get(),
    inputs: [split],
    run: ({ ledger }) => ledger.updateRule('r1', split as never, 0),
  })),
  {
    id: 'update-rule-stale-version',
    row: 14,
    label: emitted,
    seed: withRule().get(),
    run: ({ ledger }) => ledger.updateRule('r1', validSplit(), 9),
  },
  {
    id: 'update-rule-unknown-rule',
    row: 14,
    label: emitted,
    seed: goals().get(),
    run: ({ ledger }) => ledger.updateRule('nope', validSplit(), 0),
  },
  {
    id: 'update-rule-non-array',
    row: 14,
    label: threw,
    seed: withRule().get(),
    run: ({ ledger }) => ledger.updateRule('r1', 5 as never, 0),
  },

  /* row 15 */
  row15Case('apply-ok', [], 'emitted'),
  ...ORDER.map((c) => row15Case(`apply-${c}`, [c], `noop:${reasonOf(c)}`)),
  ...row15Pairs,
  {
    ...row15Case('apply-adjusted-valid', [], 'emitted'),
    // The zero line is skipped, like apply-zero-line-skipped (label corrected in S1a PR-2).
    label: { expected: 'emitted', notes: ['linesDropped'] },
    inputs: undefined,
    run: ({ ledger }) =>
      ledger.applyRuleProposal(proposal(), [
        { goalId: 'g1', amount: 50 },
        { goalId: 'g2', amount: 0 },
      ]),
  },
  {
    ...row15Case('apply-adjusted-empty', [], 'emitted'),
    label: { expected: 'emitted', notes: ['weeksAppliedWithoutFunding'] },
    run: ({ ledger }) => ledger.applyRuleProposal(proposal(), []),
  },
  {
    ...row15Case('apply-adjusted-duplicate', [], 'noop:destinationChanged'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(proposal(), [
        { goalId: 'g1', amount: 1 },
        { goalId: 'g1', amount: 1 },
      ]),
  },
  {
    ...row15Case('apply-adjusted-over-total', [], 'noop:destinationChanged'),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal(), [{ goalId: 'g1', amount: 101 }]),
  },
  {
    ...row15Case('apply-adjusted-unknown-goal', [], 'noop:destinationChanged'),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal(), [{ goalId: 'g3', amount: 1 }]),
  },
  {
    ...row15Case('apply-paused-diversion', [], 'emitted'),
    label: { expected: 'emitted', notes: ['linesDropped'] },
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 60 },
            { goalId: 'g2', amount: 40, pausedDiversion: true },
          ],
        })
      ),
  },
  {
    ...row15Case('apply-nan-line', [], 'emitted'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(proposal({ lines: [{ goalId: 'g1', amount: Number.NaN }] })),
  },
  {
    ...row15Case('apply-float-sum', [], 'emitted'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 0.1 },
            { goalId: 'g2', amount: 0.2 },
          ],
        })
      ),
  },
  {
    ...row15Case('apply-zero-line-skipped', [], 'emitted'),
    label: { expected: 'emitted', notes: ['linesDropped'] },
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 0 },
            { goalId: 'g2', amount: 40 },
          ],
        })
      ),
  },
  {
    ...row15Case('apply-multi-week', [], 'emitted'),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal({ weekSet: [1, 2, 3] })),
  },
  {
    id: 'apply-twice-back-to-back',
    row: 15,
    label: emitted,
    seed: withRule().get(),
    run: ({ ledger }) => [
      ledger.applyRuleProposal(proposal()),
      ledger.applyRuleProposal(proposal()),
    ],
  },
  {
    id: 'apply-shares-weekset',
    row: 15,
    label: emitted,
    seed: withRule().get(),
    inputs: [proposal()],
    run: ({ ledger }) => {
      const p = proposal();
      return ledger.applyRuleProposal(p);
    },
  },

  /* Exact boundaries, each beside its neighbour (the PR-1 review found cases sitting beside
     the boundaries, never on them). */
  {
    ...row15Case('apply-adjusted-sum-equals-total', [], 'emitted'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(proposal(), [
        { goalId: 'g1', amount: 60 },
        { goalId: 'g2', amount: 40 },
      ]),
  },
  {
    ...row15Case('apply-fund-equals-available', [], 'emitted'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 5400 },
            { goalId: 'g2', amount: 3600 },
          ],
        })
      ),
  },
  {
    ...row15Case('apply-fund-one-over-available', [], 'noop:insufficientAvailable'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 5400 },
            { goalId: 'g2', amount: 3601 },
          ],
        })
      ),
  },
  /* A paused rule: its proposal is stale (the rule is not active), and it still blocks a new one. */
  {
    id: 'apply-paused-rule',
    row: 15,
    label: noop('staleRuleVersion'),
    seed: withRule().add('RulePaused', { ruleId: 'r1', expectedRuleVersion: 0 }).get(),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal()),
  },
  /* The paused-rule check on its own: the proposal carries the rule's CURRENT version, so only
     `status === 'active'` refuses it (an earlier case was refused by its version first). */
  {
    id: 'apply-paused-rule-current-version',
    row: 15,
    label: noop('staleRuleVersion'),
    seed: withRule().add('RulePaused', { ruleId: 'r1', expectedRuleVersion: 0 }).get(),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal({ ruleVersion: 1 })),
  },
  {
    id: 'apply-resumed-rule-new-version',
    row: 15,
    label: emitted,
    seed: withRule()
      .add('RulePaused', { ruleId: 'r1', expectedRuleVersion: 0 })
      .add('RuleResumed', { ruleId: 'r1', expectedRuleVersion: 1 })
      .get(),
    run: ({ ledger }) => ledger.applyRuleProposal(proposal({ ruleVersion: 2 })),
  },
  {
    id: 'create-rule-paused-rule-exists',
    row: 13,
    label: noop('ruleExists'),
    seed: withRule().add('RulePaused', { ruleId: 'r1', expectedRuleVersion: 0 }).get(),
    run: ({ ledger }) => ledger.createRule(validSplit()),
  },
  /* Sub-cent amounts: rounding of the funding legs. */
  {
    ...row15Case('apply-sub-cent-lines', [], 'emitted'),
    run: ({ ledger }) =>
      ledger.applyRuleProposal(
        proposal({
          lines: [
            { goalId: 'g1', amount: 10.005 },
            { goalId: 'g2', amount: 0.004 },
          ],
        })
      ),
  },

  /* row 16 */
  {
    id: 'decline',
    row: 16,
    label: { expected: 'effect' },
    seed: withRule().get(),
    run: ({ ledger }) => ledger.declineProposal(proposal()),
  },
  {
    id: 'decline-uninitialized',
    row: 16,
    label: { expected: 'effect' },
    run: ({ ledger }) => ledger.declineProposal(proposal({ weekSet: [4, 5] })),
  },
  {
    id: 'decline-twice',
    row: 16,
    label: { expected: 'effect' },
    seed: withRule().get(),
    sideStores: { declined: [[1]] },
    run: ({ ledger }) => ledger.declineProposal(proposal()),
  },
  {
    id: 'decline-non-iterable',
    row: 16,
    label: threw,
    run: ({ ledger }) => ledger.declineProposal(proposal({ weekSet: 5 as never })),
  },

  /* ── row 17 · collectWeeklyCredits (genesis 2026-07-24; weeks are 7 days) ────────── */
  ...CURRENCIES.flatMap((c) =>
    MODES.map((m): CaseDef => ({
      id: `collect-two-weeks-${c}-${m}`,
      row: 17,
      label: emitted,
      seed: granted(c, m).get(),
      run: ({ ledger }) => ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z'),
    }))
  ),
  {
    id: 'collect-uninitialized',
    row: 17,
    label: noop('notInitialized'),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z'),
  },
  {
    id: 'collect-nothing-due',
    row: 17,
    label: noop('nothingDue'),
    seed: granted().get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-07-25T00:00:00.000Z'),
  },
  {
    id: 'collect-capped-backlog',
    row: 17,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-10-31T00:00:00.000Z'),
  },
  {
    id: 'collect-default-clock',
    row: 17,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits(),
  },
  {
    id: 'collect-ceiling',
    row: 17,
    label: noop('ceilingPaused'),
    seed: granted().add('WeeklyCreditGranted', { week: 1, amount: '99000.00' }).get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z'),
  },
  /* The credit ceiling (grant × 2; creditCeilingReached: base ≥ ceiling) exactly, and a cent below. */
  {
    id: 'collect-ceiling-exact',
    row: 17,
    label: noop('ceilingPaused'),
    seed: granted()
      .add('WeeklyCreditGranted', {
        week: 1,
        amount: (creditCeilingAmount('b2c') - 10000).toFixed(2),
      })
      .get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-08-15T00:00:00.000Z'),
  },
  {
    id: 'collect-ceiling-cent-below',
    row: 17,
    label: emitted,
    seed: granted()
      .add('WeeklyCreditGranted', {
        week: 1,
        amount: (creditCeilingAmount('b2c') - 10000 - 0.01).toFixed(2),
      })
      .get(),
    run: ({ ledger }) => ledger.collectWeeklyCredits('2026-08-15T00:00:00.000Z'),
  },
  {
    id: 'collect-twice',
    row: 17,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) => [
      ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z'),
      ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z'),
    ],
  },

  /* ── row 18 · grantComparisonCredit ───────────────────────────────────────────── */
  ...CURRENCIES.flatMap((c) =>
    MODES.map((m): CaseDef => ({
      id: `comparison-${c}-${m}`,
      row: 18,
      label: emitted,
      seed: granted(c, m).get(),
      run: ({ ledger }) => ledger.grantComparisonCredit(),
    }))
  ),
  {
    id: 'comparison-uninitialized',
    row: 18,
    label: noop('notInitialized'),
    run: ({ ledger }) => ledger.grantComparisonCredit(),
  },
  {
    id: 'comparison-already',
    row: 18,
    label: noop('alreadyCredited'),
    seed: granted().add('ComparisonCreditGranted', { amount: '1000.00' }).get(),
    run: ({ ledger }) => ledger.grantComparisonCredit(),
  },
  {
    id: 'comparison-twice',
    row: 18,
    label: emitted,
    seed: granted().get(),
    run: ({ ledger }) => [ledger.grantComparisonCredit(), ledger.grantComparisonCredit()],
  },

  /* ── row 19 · resolveSimulatedExpense ─────────────────────────────────────────── */
  resolve('resolve-available', emitted, { path: 'available' }),
  resolve('resolve-reserve', emitted, { path: 'reserve', goalId: 'g1' }),
  resolve('resolve-split', emitted, { path: 'split', goalId: 'g1', fromGoal: 50 }),
  resolve(
    'resolve-reserve-paused-goal',
    emitted,
    { path: 'reserve', goalId: 'g1' },
    150,
    simBase().add('GoalPaused', { goalId: 'g1', expectedVersion: 0 }).get()
  ),
  resolve('resolve-uninitialized', noop('alreadyResolved'), { path: 'available' }, 150, []),
  resolve(
    'resolve-already',
    noop('alreadyResolved'),
    { path: 'available' },
    150,
    simBase()
      .add('SimulatedExpensePaid', { eventInstanceId: 'ev1', amount: '10.00', source: 'system' })
      .get()
  ),
  resolve('resolve-nan-amount', noop('notAffordable'), { path: 'available' }, Number.NaN),
  resolve('resolve-split-nan', noop('notAffordable'), {
    path: 'split',
    goalId: 'g1',
    fromGoal: Number.NaN,
  }),
  resolve('resolve-zero', noop('notAffordable'), { path: 'available' }, 0),
  resolve('resolve-negative', noop('notAffordable'), { path: 'available' }, -1),
  resolve('resolve-available-short', noop('notAffordable'), { path: 'available' }, 9600),
  resolve('resolve-available-exact', emitted, { path: 'available' }, 9500),
  resolve('resolve-available-cent-over', noop('notAffordable'), { path: 'available' }, 9500.01),
  resolve('resolve-reserve-unknown-goal', noop('notAffordable'), {
    path: 'reserve',
    goalId: 'nope',
  }),
  resolve(
    'resolve-reserve-closed-goal',
    noop('notAffordable'),
    { path: 'reserve', goalId: 'g1' },
    150,
    simBase()
      .add('GoalAccomplished', { goalId: 'g1', disposition: 'kept-working', expectedVersion: 0 })
      .get()
  ),
  resolve('resolve-reserve-short', noop('notAffordable'), { path: 'reserve', goalId: 'g1' }, 600),
  resolve('resolve-split-zero', noop('notAffordable'), {
    path: 'split',
    goalId: 'g1',
    fromGoal: 0,
  }),
  resolve('resolve-split-whole', noop('notAffordable'), {
    path: 'split',
    goalId: 'g1',
    fromGoal: 150,
  }),
  resolve('resolve-split-over', noop('notAffordable'), {
    path: 'split',
    goalId: 'g1',
    fromGoal: 200,
  }),
  resolve(
    'resolve-split-available-short',
    noop('notAffordable'),
    { path: 'split', goalId: 'g1', fromGoal: 100 },
    9700
  ),
  /* Exact boundaries: the whole reserve, and a split that empties the goal. */
  resolve('resolve-reserve-exact-cash', emitted, { path: 'reserve', goalId: 'g1' }, 500),
  resolve(
    'resolve-reserve-cent-over',
    noop('notAffordable'),
    { path: 'reserve', goalId: 'g1' },
    500.01
  ),
  resolve('resolve-split-exact-cash', emitted, { path: 'split', goalId: 'g1', fromGoal: 500 }, 600),
  resolve(
    'resolve-split-one-over-cash',
    noop('notAffordable'),
    { path: 'split', goalId: 'g1', fromGoal: 500.01 },
    600
  ),
  /* Sub-cent amounts: the release and the expense round on their own. */
  resolve('resolve-reserve-sub-cent', emitted, { path: 'reserve', goalId: 'g1' }, 10.005),
  resolve('resolve-split-sub-cent', emitted, { path: 'split', goalId: 'g1', fromGoal: 0.005 }, 10),
  /* Every pair of row 19's refusal checks (plan §4.1); the first check names the reason. The
     three notAffordable checks before the first id draw (simEvents.ts:49-53) give the same
     reason in any order and are equivalent pairs; each is paired with alreadyResolved. */
  ...(
    [
      ['nan-amount', Number.NaN, { path: 'available' }],
      ['zero', 0, { path: 'available' }],
      ['negative', -1, { path: 'available' }],
      ['split-nan', 10, { path: 'split', goalId: 'g1', fromGoal: Number.NaN }],
      ['short', 99999, { path: 'available' }],
    ] as const
  ).flatMap(([name, amount, via]): CaseDef[] => [
    resolve(
      `resolve-pair-already-${name}`,
      noop('alreadyResolved'),
      via as Via,
      amount,
      simBase()
        .add('SimulatedExpensePaid', { eventInstanceId: 'ev1', amount: '10.00', source: 'system' })
        .get()
    ),
    resolve(`resolve-pair-uninitialized-${name}`, noop('alreadyResolved'), via as Via, amount, []),
  ]),
  resolve(
    'resolve-pair-reserve-closed-and-short',
    noop('notAffordable'),
    { path: 'reserve', goalId: 'g1' },
    99999,
    simBase()
      .add('GoalAccomplished', { goalId: 'g1', disposition: 'kept-working', expectedVersion: 0 })
      .get()
  ),
  resolve('resolve-unknown-path', threw, { path: 'teleport' } as never),
  {
    id: 'resolve-missing-via',
    row: 19,
    label: threw,
    seed: simBase().get(),
    run: ({ ledger }) =>
      ledger.resolveSimulatedExpense({
        eventInstanceId: 'ev1',
        eventType: 'carRepair',
        amount: 150,
      } as never),
  },
  {
    id: 'resolve-twice',
    row: 19,
    label: emitted,
    seed: simBase().get(),
    run: ({ ledger }) => [
      ledger.resolveSimulatedExpense({
        eventInstanceId: 'ev1',
        eventType: 'x',
        amount: 10,
        via: { path: 'available' },
      }),
      ledger.resolveSimulatedExpense({
        eventInstanceId: 'ev1',
        eventType: 'x',
        amount: 10,
        via: { path: 'available' },
      }),
    ],
  },
];
