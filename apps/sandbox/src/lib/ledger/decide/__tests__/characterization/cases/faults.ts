/**
 * ⛑ LEDGER-CHAR-1 · a failed append, for EVERY row that appends (rows 1–15, 17–19; plan P12
 * §4.1, final check M1). The projection inside the command's append throws once: today the
 * append is taken back, the error is logged and rethrown, nothing is persisted or notified,
 * and no effect runs (row 19). An adapter that swallowed the throw and returned its result
 * would change this case (sabotage (y)); row 19 is the take-back path of sabotage (k).
 */
import type { CaseDef } from '../harness';
import { history } from '../seed';

const granted = () => history().grant();
const goal = () => granted().goal('g1').fund('g1', '1000.00');
const two = () => goal().goal('g2', '500.00', 'Car');
const open = () => goal().enterV2('g1', 'p1', '500.00');
const rule = () => two().add('RuleCreated', { ruleId: 'r1', split: [{ goalId: 'g1', percent: 60 }, { goalId: 'g2', percent: 40 }] });
const proposal = { proposalId: 'pr1', ruleId: 'r1', ruleVersion: 0, weekSet: [1], lines: [{ goalId: 'g1', amount: 60 }, { goalId: 'g2', amount: 40 }], remainderToAvailable: 0, status: 'proposed', repairNeeded: false } as const;

const fault = (id: string, row: number, seed: ReturnType<typeof history> | null, run: CaseDef['run']): CaseDef => ({
  id: `fault-${id}`,
  row,
  label: { expected: 'throw' },
  seed: seed?.get(),
  faultOnAppend: true,
  run,
});

export const faultCases: CaseDef[] = [
  fault('grant', 1, null, ({ ledger }) => ledger.grantPlayMoney(100, 'USD', 'b2c')),
  fault('create-goal', 2, granted(), ({ ledger }) => ledger.createGoal({ name: 'A', icon: 'x', targetAmount: 10, horizonMonths: 1, fundAmount: 5 })),
  fault('pause', 3, goal(), ({ ledger }) => ledger.pauseGoal('g1')),
  fault('resume', 4, goal().add('GoalPaused', { goalId: 'g1', expectedVersion: 0 }), ({ ledger }) => ledger.resumeGoal('g1')),
  fault('accomplish', 5, goal(), ({ ledger }) => ledger.accomplishGoal('g1', 'kept-working')),
  fault('transfer', 6, two(), ({ ledger }) => ledger.transferGoalCash('g1', 'g2')),
  fault('raise-target', 7, goal(), ({ ledger }) => ledger.raiseGoalTarget('g1', '4000')),
  fault('enter', 8, goal(), ({ ledger }) => ledger.enterStrategy({ goalId: 'g1', strategyId: 'safeHarbor', totalFromCash: 10, networkFeeLocal: 0 })),
  fault('advance', 9, open(), ({ ledger }) => ledger.advanceTime(1, [], 'real', [])),
  fault('recurring', 10, open(), ({ ledger }) => ledger.setRecurring({ goalId: 'g1', positionId: 'p1', monthlyAmount: 10 })),
  fault('exit', 11, open(), ({ ledger }) => ledger.exitPosition({ positionId: 'p1', networkFeeLocal: 0 })),
  fault('stop-all', 12, open(), ({ ledger, feeFor }) => ledger.stopGoalStrategies('g1', feeFor({ p1: 0.5 }))),
  fault('create-rule', 13, two(), ({ ledger }) => ledger.createRule([{ goalId: 'g1', percent: 50 }])),
  fault('update-rule', 14, rule(), ({ ledger }) => ledger.updateRule('r1', [{ goalId: 'g1', percent: 50 }], 0)),
  fault('apply', 15, rule(), ({ ledger }) => ledger.applyRuleProposal({ ...proposal, weekSet: [1], lines: [...proposal.lines] })),
  fault('collect', 17, granted(), ({ ledger }) => ledger.collectWeeklyCredits('2026-08-08T00:00:00.000Z')),
  fault('comparison', 18, granted(), ({ ledger }) => ledger.grantComparisonCredit()),
  fault('resolve-reserve', 19, goal(), ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: 50, via: { path: 'reserve', goalId: 'g1' } })),
  fault('resolve-available', 19, goal(), ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: 50, via: { path: 'available' } })),
];
