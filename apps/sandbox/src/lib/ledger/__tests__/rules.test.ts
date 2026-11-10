import { beforeEach, describe, expect, it } from 'vitest';
import { reconcile, refusedEvents } from '@diboas/banking';
import {
  accomplishGoal,
  applyRuleProposal,
  collectWeeklyCredits,
  createGoal,
  createRule,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  updateRule,
} from '@/lib/ledgerClient';
import { deriveStandingProposal } from '@/lib/weeklyCycle';
import { getDeclinedWeeks } from '@/lib/proposalStore';

/**
 * The D-r rule actions' REFUSAL branches (register 5.70). `weeklyCycle.test.ts` proves the
 * ceremony's happy path and its version/idempotency/destination guards; these are the guards
 * it never reached. Every refusal is shown to write NOTHING: the ledger's event count is the
 * witness, because an append is the only way these actions change anything.
 *
 * Expectations come from `rules.ts`'s own contracts: `createRule` returns null "when the split
 * is invalid or a live rule already exists" (one active rule per account, W-19a); a
 * repair-flagged proposal "needs the user's re-shape first" (D-r §3); and a fundable line of
 * zero moves nothing, so it emits no `GoalFunded` leg.
 */
const DAY = 24 * 60 * 60 * 1000;

function afterGenesis(days: number): string {
  const genesis = getLedgerState().genesisRecordedAt;
  if (!genesis) throw new Error('no genesis in fixture');
  return new Date(Date.parse(genesis) + days * DAY).toISOString();
}

function goal(name: string): string {
  return createGoal({ name, icon: 'plane', targetAmount: 3000, horizonMonths: 12, fundAmount: 0 });
}

const eventCount = () => getLedgerState().events.length;
const newEventTypes = (before: number) =>
  getLedgerState()
    .events.slice(before)
    .map((e) => e.type);

beforeEach(() => resetSandbox());

describe('createRule · refusals write nothing', () => {
  it('should refuse a rule when the ledger has not been granted yet', () => {
    expect(getLedgerState().initialized).toBe(false);
    expect(createRule([{ goalId: 'any', percent: 50 }])).toBeNull();
    expect(eventCount()).toBe(0);
    expect(getLedgerState().rules).toEqual([]);
  });

  it.each([
    ['an empty split', []],
    ['a zero percent', [{ goalId: 'g', percent: 0 }]],
    ['a fractional percent', [{ goalId: 'g', percent: 12.5 }]],
    ['a split over 100%', [{ goalId: 'g', percent: 101 }]],
  ])('should refuse %s on an initialized ledger', (_name, split) => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const before = eventCount();
    expect(createRule(split)).toBeNull();
    expect(eventCount()).toBe(before);
    expect(getLedgerState().rules).toEqual([]);
  });

  it('should refuse a SECOND rule while one is live (one active rule per account, W-19a)', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const g = goal('Trip');
    const first = createRule([{ goalId: g, percent: 50 }]);
    expect(first).not.toBeNull();
    const before = eventCount();
    expect(createRule([{ goalId: g, percent: 20 }])).toBeNull();
    expect(eventCount()).toBe(before);
    expect(getLedgerState().rules.map((r) => r.ruleId)).toEqual([first]);
  });
});

describe('updateRule · an invalid split writes nothing', () => {
  it('should leave the rule at its version when the new split is invalid', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const g = goal('Trip');
    createRule([{ goalId: g, percent: 50 }]);
    const rule = getLedgerState().rules[0];
    const before = eventCount();
    updateRule(
      rule.ruleId,
      [
        { goalId: g, percent: 60 },
        { goalId: g, percent: 10 }, // the same destination twice
      ],
      rule.ruleVersion
    );
    expect(eventCount()).toBe(before);
    expect(getLedgerState().rules[0]).toEqual(rule);
  });
});

describe('applyRuleProposal · refusal and zero-line branches', () => {
  beforeEach(() => grantPlayMoney(10_000, 'USD', 'b2c'));

  it('should refuse a repair-flagged proposal and move nothing (D-r §3)', () => {
    const g = goal('Trip');
    createRule([{ goalId: g, percent: 50 }]);
    collectWeeklyCredits(afterGenesis(8)); // week 1 → 1,000 unresolved
    accomplishGoal(g, 'kept-working'); // the destination closes under the rule
    const proposal = deriveStandingProposal(getLedgerState(), getDeclinedWeeks(), 'pr-repair');
    expect(proposal?.repairNeeded).toBe(true);
    const working = getLedgerState().buckets.working;
    const before = eventCount();
    expect(applyRuleProposal(proposal!)).toEqual({ ok: false, reason: 'repairNeeded' });
    expect(eventCount()).toBe(before);
    expect(getLedgerState().buckets.working).toBe(working);
  });

  it('should emit no GoalFunded leg for an adjusted line of zero', () => {
    const a = goal('Trip');
    const b = goal('Car');
    createRule([
      { goalId: a, percent: 50 },
      { goalId: b, percent: 30 },
    ]);
    collectWeeklyCredits(afterGenesis(8)); // week 1 → 1,000 unresolved
    const proposal = deriveStandingProposal(getLedgerState(), getDeclinedWeeks(), 'pr-zero');
    expect(proposal?.lines).toEqual([
      { goalId: a, amount: 500 },
      { goalId: b, amount: 300 },
    ]);
    const before = eventCount();
    expect(
      applyRuleProposal(proposal!, [
        { goalId: a, amount: 400 },
        { goalId: b, amount: 0 }, // the user turned this share down to nothing
      ])
    ).toEqual({ ok: true });
    expect(newEventTypes(before)).toEqual(['RuleApplied', 'GoalFunded']);
    const state = getLedgerState();
    expect(state.goals.find((x) => x.goalId === a)?.cash).toBe('400.00');
    expect(state.goals.find((x) => x.goalId === b)?.cash).toBe('0.00');
    expect(refusedEvents(state)).toEqual([]);
    expect(reconcile(state)).toBe('0.00');
  });
});
