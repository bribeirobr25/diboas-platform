import { beforeEach, describe, expect, it } from 'vitest';
import { project, reconcile } from '@diboas/banking';
import {
  applyRuleProposal,
  collectWeeklyCredits,
  createRule,
  declineProposal,
  getLedgerState,
  grantComparisonCredit,
  grantPlayMoney,
  createGoal,
  enterStrategy,
  resetSandbox,
  updateRule,
} from '@/lib/ledgerClient';
import { deriveStandingProposal, getCollectView, unresolvedWeeks } from '@/lib/weeklyCycle';
import { getDeclinedWeeks } from '@/lib/proposalStore';

/**
 * §2.3 weekly cycle — the app-service layer over the WG-1/D-r engine legs
 * (node env, in-memory store degradation — same harness as ledgerClient.test).
 * The engine math itself (collectibleWeeks meter, ceiling base, projection
 * idempotency) is proven in @diboas/banking; here we prove the WIRING: the
 * Collect tap, the standing-proposal derivation, and the W-8 ceremony guards.
 */

const DAY = 24 * 60 * 60 * 1000;

/** ISO timestamp n days after the ledger's genesis (the grant's recordedAt). */
function afterGenesis(days: number): string {
  const genesis = getLedgerState().genesisRecordedAt;
  if (!genesis) throw new Error('no genesis in fixture');
  return new Date(Date.parse(genesis) + days * DAY).toISOString();
}

describe('weekly cycle — Collect tap + standing proposal + ceremony guards (§2.3)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should collect nothing before the first week completes, then exactly the due weeks', () => {
    expect(collectWeeklyCredits(afterGenesis(6)).granted).toEqual([]);
    const result = collectWeeklyCredits(afterGenesis(8));
    expect(result).toEqual({ granted: [1], ceilingPaused: false });
    const state = getLedgerState();
    expect(state.credited).toBe('1000.00');
    expect(state.collectedWeeks).toEqual([1]);
    expect(reconcile(state)).toBe('0.00');
  });

  it('should be a harmless no-op on a double tap (same now)', () => {
    collectWeeklyCredits(afterGenesis(8));
    expect(collectWeeklyCredits(afterGenesis(8)).granted).toEqual([]);
    expect(getLedgerState().credited).toBe('1000.00');
  });

  it('should cap an idle stretch at 2 weeks (pause, never loss)', () => {
    const result = collectWeeklyCredits(afterGenesis(70));
    expect(result.granted).toEqual([1, 2]);
    expect(getLedgerState().credited).toBe('2000.00');
  });

  it('should pause at the refill ceiling with calm state, not an error', () => {
    // Drive the ceiling base to 2× the grant via collected credits: 10 weeks
    // of 1,000 on top of the 10,000 grant. Collect in 2-week bites.
    for (let i = 1; i <= 5; i += 1) collectWeeklyCredits(afterGenesis(i * 100));
    expect(getLedgerState().credited).toBe('10000.00');
    const view = getCollectView(getLedgerState(), afterGenesis(600));
    expect(view).toEqual({ weeks: [], ceilingPaused: true });
    expect(collectWeeklyCredits(afterGenesis(600))).toEqual({ granted: [], ceilingPaused: true });
  });

  it('should grant the comparison credit only after the first strategy entry, once', () => {
    expect(grantComparisonCredit()).toBe(false); // nothing to compare yet
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 2000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 1000, networkFeeLocal: 1 });
    expect(grantComparisonCredit()).toBe(true);
    expect(grantComparisonCredit()).toBe(false); // once, ever
    const state = getLedgerState();
    expect(state.comparisonCredited).toBe(true);
    expect(state.credited).toBe('1000.00');
    expect(reconcile(state)).toBe('0.00');
  });

  describe('the standing proposal + the W-8 ceremony', () => {
    let goalId: string;

    beforeEach(() => {
      goalId = createGoal({
        name: 'Trip',
        icon: 'plane',
        targetAmount: 3000,
        horizonMonths: 12,
        fundAmount: 0,
      });
      createRule([{ goalId, percent: 50 }]);
      collectWeeklyCredits(afterGenesis(15)); // weeks 1+2 → 2,000 unresolved
    });

    function standing() {
      return deriveStandingProposal(getLedgerState(), getDeclinedWeeks(), 'pr-test');
    }

    it('should derive ONE combined proposal for all unresolved weeks', () => {
      const proposal = standing();
      expect(proposal?.weekSet).toEqual([1, 2]);
      expect(proposal?.lines).toEqual([{ goalId, amount: 1000 }]); // 50% of 2,000
      expect(proposal?.remainderToAvailable).toBe(1000);
      expect(proposal?.repairNeeded).toBe(false);
    });

    it('should apply on approval: RuleApplied + GoalFunded legs, conserving, then nothing left unresolved', () => {
      const proposal = standing();
      expect(applyRuleProposal(proposal!)).toEqual({ ok: true });
      const state = getLedgerState();
      expect(state.goals.find((g) => g.goalId === goalId)?.cash).toBe('1000.00');
      expect(state.buckets.working).toBe('11000.00'); // 10,000 + 2,000 − 1,000
      expect(reconcile(state)).toBe('0.00');
      expect(unresolvedWeeks(state, getDeclinedWeeks())).toEqual([]);
      expect(standing()).toBeNull();
    });

    it('should refuse a second application of the same week-set (double-tap safety)', () => {
      const proposal = standing();
      expect(applyRuleProposal(proposal!)).toEqual({ ok: true });
      expect(applyRuleProposal(proposal!)).toEqual({ ok: false, reason: 'alreadyApplied' });
      expect(getLedgerState().goals.find((g) => g.goalId === goalId)?.cash).toBe('1000.00');
    });

    it('should NEVER apply a stale rule version — edit between display and approval re-presents (version-safety)', () => {
      const proposal = standing();
      const rule = getLedgerState().rules[0];
      updateRule(rule.ruleId, [{ goalId, percent: 80 }], rule.ruleVersion);
      expect(applyRuleProposal(proposal!)).toEqual({ ok: false, reason: 'staleRuleVersion' });
      // The regenerated proposal carries the new version and applies cleanly.
      const regenerated = standing();
      expect(regenerated?.ruleVersion).toBe(rule.ruleVersion + 1);
      expect(regenerated?.lines).toEqual([{ goalId, amount: 1600 }]); // 80% of 2,000
      expect(applyRuleProposal(regenerated!)).toEqual({ ok: true });
    });

    it('should re-validate destinations at approval (RT-G3): a changed/unknown destination re-presents, never applies', () => {
      // The approval-time guard is independent of what generation saw: a
      // proposal whose destination is no longer an ACTIVE goal must fail-safe.
      // (No pause/drop emitter exists until §4's screens, so exercise the guard
      // with a destination the ledger cannot validate — same branch; the full
      // pause-between-display-and-approval journey rides G3/G10.)
      const proposal = standing()!;
      const tampered = { ...proposal, lines: [{ goalId: 'ghost', amount: 100 }] };
      expect(applyRuleProposal(tampered)).toEqual({ ok: false, reason: 'destinationChanged' });
      expect(getLedgerState().buckets.working).toBe('12000.00'); // nothing moved
    });

    it('should honor adjust-this-once with conservation limits, and reject invalid adjustments', () => {
      const proposal = standing();
      expect(
        applyRuleProposal(proposal!, [{ goalId, amount: 700 }]) // user turned 1,000 down to 700
      ).toEqual({ ok: true });
      expect(getLedgerState().goals.find((g) => g.goalId === goalId)?.cash).toBe('700.00');
      expect(reconcile(getLedgerState())).toBe('0.00');
    });

    it('should reject an over-total or foreign-goal adjustment', () => {
      const proposal = standing();
      expect(applyRuleProposal(proposal!, [{ goalId, amount: 2001 }]).ok).toBe(false);
      expect(applyRuleProposal(proposal!, [{ goalId: 'ghost', amount: 10 }]).ok).toBe(false);
    });

    it('should decline quietly: nothing moves, weeks resolve, no proposal re-nags', () => {
      const proposal = standing();
      declineProposal(proposal!);
      expect(getLedgerState().buckets.working).toBe('12000.00'); // credits simply stay in Available
      expect(standing()).toBeNull();
      // New credits later DO propose again — only the declined weeks are settled.
      collectWeeklyCredits(afterGenesis(29));
      const next = standing();
      expect(next?.weekSet).toEqual([3, 4]);
    });
  });
});

describe('audit fixes (2026-08-19): affordability at the ceremony + quiet-cancel + never-Expired', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should cap the derived proposal at Available when credits were moved elsewhere — preview == appliable', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 0,
    });
    createRule([{ goalId, percent: 50 }]);
    collectWeeklyCredits(afterGenesis(15)); // 2,000 collected → working 12,000
    // Drain Available below the credit sum via a second, manually-funded goal.
    createGoal({
      name: 'Drain',
      icon: 'target',
      targetAmount: 20000,
      horizonMonths: 12,
      fundAmount: 11_500,
    });
    expect(getLedgerState().buckets.working).toBe('500.00');
    const proposal = deriveStandingProposal(getLedgerState(), getDeclinedWeeks(), 'pr-cap');
    expect(proposal?.lines).toEqual([{ goalId, amount: 250 }]); // 50% of the capped 500
    expect(proposal?.remainderToAvailable).toBe(250);
    expect(proposal?.status).toBe('proposed'); // sandbox never enters 'expired' (D-r §2)
    expect(applyRuleProposal(proposal!)).toEqual({ ok: true });
    expect(reconcile(getLedgerState())).toBe('0.00');
  });

  it('should refuse an approval Available cannot cover — never a silent partial apply', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 0,
    });
    createRule([{ goalId, percent: 50 }]);
    collectWeeklyCredits(afterGenesis(15));
    const proposal = deriveStandingProposal(getLedgerState(), getDeclinedWeeks(), 'pr-big')!;
    // Tampered/stale lines beyond Available: the ceremony must refuse whole,
    // not let the engine silently drop the leg while marking weeks applied.
    const stale = { ...proposal, lines: [{ goalId, amount: 50_000 }] };
    expect(applyRuleProposal(stale)).toEqual({ ok: false, reason: 'insufficientAvailable' });
    const state = getLedgerState();
    expect(state.events.filter((e) => e.type === 'RuleApplied')).toHaveLength(0);
    expect(state.goals.find((g) => g.goalId === goalId)?.cash).toBe('0.00');
  });

  it('should quiet-cancel by derivation: rule deleted while credits wait → no proposal, credits stay (W-19c)', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 0,
    });
    createRule([{ goalId, percent: 50 }]);
    collectWeeklyCredits(afterGenesis(15));
    // Delete the rule at the engine level (the G9 delete surface is §4).
    const rule = getLedgerState().rules[0];
    const deleted = project([
      ...getLedgerState().events,
      {
        eventId: 'test-del',
        simDay: 0,
        recordedAt: new Date().toISOString(),
        correlationId: 'test',
        type: 'RuleDeleted',
        ruleId: rule.ruleId,
        expectedRuleVersion: rule.ruleVersion,
      },
    ]);
    expect(deleted.rules[0].status).toBe('deleted');
    expect(deriveStandingProposal(deleted, [], 'pr-x')).toBeNull(); // calm: no proposal, no nag
    expect(deleted.buckets.working).toBe('12000.00'); // the credits simply wait in Available
  });
});
