/**
 * ⛑ LEDGER-CHAR-1 · where each command FIRST reads state (plan P12 §1.4, §4.1; D3, D7).
 *
 * The stored history holds an event the projection cannot handle, written before the modules
 * load, so the first state read throws. Today's order is then visible per row: a command that
 * reads state before its input checks throws; one whose check comes first refuses (row 14) or
 * never reads (row 16). Every row gets a case with valid input; every row with an input-only
 * check gets one more with an input that check refuses, so a check hoisted above the read
 * shows (sabotage (z)), and `stamp` reading state before its id draw shows (sabotage (x)).
 */
import type { LedgerEvent } from '@diboas/banking';
import type { CaseDef, CaseApi } from '../harness';

const LEDGER_KEY = 'diboas-ledger-v2:sandbox';
const stored: LedgerEvent[] = [
  { eventId: 'raw-1', simDay: 0, recordedAt: '2026-07-24T00:00:00.000Z', correlationId: 'raw-c1', type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
  { eventId: 'raw-2', simDay: 0, recordedAt: '2026-07-24T00:00:00.000Z', correlationId: 'raw-c2', type: 'FutureEventFromNewerCode', payload: 1 } as unknown as LedgerEvent,
];
const RAW = { [LEDGER_KEY]: JSON.stringify(stored) };
const proposal = (over: object = {}) => ({ proposalId: 'pr1', ruleId: 'r1', ruleVersion: 0, weekSet: [1], lines: [{ goalId: 'g1', amount: 10 }], remainderToAvailable: 0, status: 'proposed', repairNeeded: false, ...over }) as never;

const lazy = (id: string, row: number, expected: string, run: (api: CaseApi) => unknown): CaseDef => ({
  id: `lazy-read-${id}`,
  row,
  label: { expected },
  rawStorage: RAW,
  run,
});

export const lazyReadCases: CaseDef[] = [
  lazy('grant', 1, 'throw', ({ ledger }) => ledger.grantPlayMoney(100, 'USD', 'b2c')),
  lazy('create-goal', 2, 'throw', ({ ledger }) => ledger.createGoal({ name: 'A', icon: 'x', targetAmount: 10, horizonMonths: 1, fundAmount: 5 })),
  lazy('pause', 3, 'throw', ({ ledger }) => ledger.pauseGoal('g1')),
  lazy('resume', 4, 'throw', ({ ledger }) => ledger.resumeGoal('g1')),
  lazy('accomplish', 5, 'throw', ({ ledger }) => ledger.accomplishGoal('g1', 'kept-working')),
  lazy('transfer', 6, 'throw', ({ ledger }) => ledger.transferGoalCash('g1', 'g2')),
  lazy('raise-target', 7, 'throw', ({ ledger }) => ledger.raiseGoalTarget('g1', '4000')),
  lazy('raise-target-unparseable', 7, 'throw', ({ ledger }) => ledger.raiseGoalTarget('g1', 'abc')),
  lazy('enter', 8, 'throw', ({ ledger }) => ledger.enterStrategy({ goalId: 'g1', strategyId: 'safeHarbor', totalFromCash: 10, networkFeeLocal: 0 })),
  lazy('advance', 9, 'throw', ({ ledger }) => ledger.advanceTime(1, [], 'machine', [])),
  lazy('recurring', 10, 'throw', ({ ledger }) => ledger.setRecurring({ goalId: 'g1', positionId: 'p1', monthlyAmount: 10 })),
  lazy('exit', 11, 'throw', ({ ledger }) => ledger.exitPosition({ positionId: 'p1', networkFeeLocal: 0 })),
  lazy('stop-all', 12, 'throw', ({ ledger }) => ledger.stopGoalStrategies('g1', () => 0)),
  lazy('create-rule', 13, 'throw', ({ ledger }) => ledger.createRule([{ goalId: 'g1', percent: 50 }])),
  lazy('create-rule-invalid-split', 13, 'throw', ({ ledger }) => ledger.createRule([])),
  lazy('update-rule', 14, 'throw', ({ ledger }) => ledger.updateRule('r1', [{ goalId: 'g1', percent: 50 }], 0)),
  lazy('update-rule-invalid-split', 14, 'noop:invalidSplit', ({ ledger }) => ledger.updateRule('r1', [], 0)),
  lazy('apply', 15, 'throw', ({ ledger }) => ledger.applyRuleProposal(proposal())),
  lazy('apply-repair-needed', 15, 'throw', ({ ledger }) => ledger.applyRuleProposal(proposal({ repairNeeded: true }))),
  lazy('decline', 16, 'effect', ({ ledger }) => ledger.declineProposal(proposal())),
  lazy('collect', 17, 'throw', ({ ledger }) => ledger.collectWeeklyCredits()),
  lazy('comparison', 18, 'throw', ({ ledger }) => ledger.grantComparisonCredit()),
  lazy('resolve', 19, 'throw', ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: 10, via: { path: 'available' } })),
  lazy('resolve-nan-amount', 19, 'throw', ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: Number.NaN, via: { path: 'available' } })),
  lazy('resolve-split-nan', 19, 'throw', ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: 10, via: { path: 'split', goalId: 'g1', fromGoal: Number.NaN } })),
  lazy('resolve-zero', 19, 'throw', ({ ledger }) => ledger.resolveSimulatedExpense({ eventInstanceId: 'ev1', eventType: 'x', amount: 0, via: { path: 'available' } })),
];
