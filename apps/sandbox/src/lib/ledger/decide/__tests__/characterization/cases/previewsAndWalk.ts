/**
 * ⛑ LEDGER-CHAR-1 · the previews (PR-2 changes their imports, D8) and the seeded random walk
 * (plan P12 §4.1). The walk drives 500 commands drawn from rows 1–19 with ids taken from live
 * state; each step's outcome, appended events and state are hashed; the count table below
 * keeps it from sliding into no-ops, and is what a reviewer reads, not the golden.
 */
import { createHash } from 'node:crypto';
import type { LedgerEvent } from '@diboas/banking';
import type { ProtocolApyHistory, ProtocolPriceHistory } from '@diboas/defi';
import type { CaseApi, CaseDef } from '../harness';
import { encode } from '../recorder';
import { history } from '../seed';

const open = (c: 'USD' | 'BRL' | 'EUR' = 'USD') =>
  history().grant('10000.00', c).goal('g1').fund('g1', '3000.00').enterV1('g1', 'p1', '0.99').enterV2('g1', 'p2', '1000.00', 'stableGrowth').enterV2('g1', 'p3', '2.00');
const preview = { expected: 'noop:preview' };

/* ── previews ─────────────────────────────────────────────────────────────────────── */
export const previewCases: CaseDef[] = [
  ...(['USD', 'BRL', 'EUR'] as const).flatMap((c): CaseDef[] => [
    { id: `preview-exit-${c}`, row: 'preview', label: preview, seed: open(c).get(), run: ({ ledger }) => ['p1', 'p2', 'p3', 'nope'].map((p) => ledger.previewExit(ledger.getLedgerState(), p, 0.005)) },
    { id: `preview-position-stop-${c}`, row: 'preview', label: preview, seed: open(c).get(), run: ({ ledger }) => ['p1', 'p2', 'nope'].map((p) => ledger.previewPositionStop(ledger.getLedgerState(), p, 1.237)) },
    { id: `preview-goal-stop-${c}`, row: 'preview', label: preview, seed: open(c).get(), run: ({ ledger, feeFor }) => [ledger.previewGoalStop(ledger.getLedgerState(), 'g1', feeFor({ p1: 0.004, p2: 0.006, p3: 9 })), ledger.previewGoalStop(ledger.getLedgerState(), 'nope', feeFor({}))] },
  ]),
  { id: 'preview-closed-position', row: 'preview', label: preview, seed: open().add('StrategyExited', { positionId: 'p2', goalId: 'g1', grossAmount: '1000.00', schemaVersion: 2, modeledExitFee: '3.90', modeledNetworkFee: '0.50' }).get(), run: ({ ledger, feeFor }) => [ledger.previewExit(ledger.getLedgerState(), 'p2', 1), ledger.previewPositionStop(ledger.getLedgerState(), 'p2', 1), ledger.previewGoalStop(ledger.getLedgerState(), 'g1', feeFor({ p1: 0.5 }))] },
  { id: 'preview-split-entry', row: 'preview', label: preview, run: ({ ledger }) => [[25, 0.005], [1, 5], [100.005, 0.5], [0, 0], [Number.NaN, 1]].map(([t, f]) => ledger.splitEntry(t, f)) },
];

/* ── the random walk ──────────────────────────────────────────────────────────────── */
/** mulberry32: a tiny seeded PRNG, so the walk is the same on every machine. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAMP = { source: 'fixture', origin: 'MODELLED', asOf: '2026-12-31', observedAt: null, fallbackUsed: false, fixtureVersion: 'walk-1' } as never;
const day = (i: number) => { const d = new Date('2026-01-01T00:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };
const APY: ProtocolApyHistory[] = ['skySsr', 'aaveV3', 'compoundV3'].map((protocolId, k) => ({ protocolId: protocolId as never, points: Array.from({ length: 120 }, (_, i) => ({ date: day(i), apyPercent: 3 + k + (i % 5) * 0.1 })), stamp: STAMP }));
const PRICES: ProtocolPriceHistory[] = ['sanctumInf', 'jupiterJlp'].map((protocolId, k) => ({ protocolId: protocolId as never, points: Array.from({ length: 120 }, (_, i) => ({ date: day(i), priceUsd: (1 + k) * (1 + 0.02 * Math.sin(i / 4)) })), stamp: STAMP }));
const STRATEGIES = ['safeHarbor', 'stableGrowth', 'goalKeeper', 'balancedBuilder'] as const;

export const WALK_STEPS = 500;
export const WALK_ROWS = Array.from({ length: 19 }, (_, i) => i + 1);

export function walk({ ledger }: CaseApi) {
  const rnd = prng(0x5a1a);
  const pick = <T,>(xs: readonly T[]): T | undefined => (xs.length ? xs[Math.floor(rnd() * xs.length)] : undefined);
  const amount = () => [0, 0.004, 0.005, 1, 10, 99.99, 250, 1000, 5000, Number.NaN, -3][Math.floor(rnd() * 11)]!;
  const steps: string[] = [];
  const counts: Record<number, { emitted: number; noop: number; throw: number }> = {};
  let week = 1;
  for (let i = 0; i < WALK_STEPS; i++) {
    const s = ledger.getLedgerState();
    const goalId = pick(s.goals.map((g) => g.goalId)) ?? 'g-none';
    const otherGoal = pick(s.goals.map((g) => g.goalId)) ?? 'g-none';
    const position = pick(s.positions.map((p) => p.positionId)) ?? 'p-none';
    const ruleId = s.rules.find((r) => r.status !== 'deleted')?.ruleId ?? 'r-none';
    const ruleVersion = s.rules.find((r) => r.ruleId === ruleId)?.ruleVersion ?? 0;
    const row = WALK_ROWS[Math.floor(rnd() * WALK_ROWS.length)]!;
    const before = s.events.length;
    let outcome: unknown;
    let kind: 'emitted' | 'noop' | 'throw';
    try {
      switch (row) {
        case 1: outcome = ledger.grantPlayMoney(10000, pick(['USD', 'BRL', 'EUR'] as const)!, pick(['b2c', 'b2b'] as const)!); break;
        case 2: outcome = ledger.createGoal({ name: ` goal ${i} `, icon: 'x', targetAmount: 100 + i, horizonMonths: 12, fundAmount: amount() }); break;
        case 3: outcome = ledger.pauseGoal(goalId); break;
        case 4: outcome = ledger.resumeGoal(goalId); break;
        case 5: outcome = ledger.accomplishGoal(goalId, pick(['kept-working', 'held-as-cash'] as const)!); break;
        case 6: outcome = ledger.transferGoalCash(goalId, otherGoal); break;
        case 7: outcome = ledger.raiseGoalTarget(goalId, pick(['5000', 'abc', '10', '100000.005'])!); break;
        case 8: outcome = ledger.enterStrategy({ goalId, strategyId: pick(STRATEGIES)!, totalFromCash: amount(), networkFeeLocal: pick([0, 0.005, 0.5])! }); break;
        case 9: outcome = ledger.advanceTime(1 + Math.floor(rnd() * 20), APY, pick(['machine', 'real'] as const), PRICES); break;
        case 10: outcome = ledger.setRecurring({ goalId, positionId: position, monthlyAmount: pick([0, 25, 100])! }); break;
        case 11: outcome = ledger.exitPosition({ positionId: position, networkFeeLocal: pick([0, 0.005, 2])! }); break;
        case 12: outcome = ledger.stopGoalStrategies(goalId, () => 0.25); break;
        case 13: outcome = ledger.createRule([{ goalId, percent: 50 }, { goalId: otherGoal, percent: 30 }]); break;
        case 14: outcome = ledger.updateRule(ruleId, [{ goalId, percent: pick([40, 0, 101])! }], ruleVersion); break;
        case 15: outcome = ledger.applyRuleProposal({ proposalId: `pr${i}`, ruleId, ruleVersion, weekSet: [pick([week, week - 1, 1])!], lines: [{ goalId, amount: Math.floor(rnd() * 200) }], remainderToAvailable: 0, status: 'proposed', repairNeeded: rnd() < 0.1 }); break;
        case 16: outcome = ledger.declineProposal({ proposalId: `pr${i}`, ruleId, ruleVersion, weekSet: [week], lines: [], remainderToAvailable: 0, status: 'proposed', repairNeeded: false }); break;
        case 17: week += 1; outcome = ledger.collectWeeklyCredits(new Date(Date.UTC(2026, 6, 24) + week * 7 * 86_400_000).toISOString()); break;
        case 18: outcome = ledger.grantComparisonCredit(); break;
        default: outcome = ledger.resolveSimulatedExpense({ eventInstanceId: `ev${i % 7}`, eventType: 'x', amount: amount(), via: pick([{ path: 'available' as const }, { path: 'reserve' as const, goalId }, { path: 'split' as const, goalId, fromGoal: 5 }])! });
      }
      kind = ledger.getLedgerState().events.length > before ? 'emitted' : 'noop';
    } catch (error) {
      outcome = { threw: error instanceof Error ? error.name : String(error) };
      kind = 'throw';
    }
    counts[row] ??= { emitted: 0, noop: 0, throw: 0 };
    counts[row][kind] += 1;
    const appended: LedgerEvent[] = ledger.getLedgerState().events.slice(before);
    steps.push(createHash('sha256').update(encode({ row, outcome, appended, state: ledger.getLedgerState() })).digest('hex').slice(0, 16));
  }
  return { counts, steps };
}

export const walkCases: CaseDef[] = [
  { id: 'random-walk-500', row: 'walk', label: { expected: 'emitted' }, compact: true, run: walk },
];
