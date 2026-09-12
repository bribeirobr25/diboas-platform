import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import {
  selectAmountSign,
  selectCanInvest,
  selectEntrySplit,
  selectExitPreview,
  selectEventMagnitude,
  selectGoalCompletionView,
  selectGoalDetailView,
  selectGoalProgress,
  selectGoalRowView,
  selectHistorySummary,
  selectHomeTriad,
  selectMoveBalance,
  selectPositionValue,
  selectRecurringView,
  selectRulesPreview,
  selectWeeklyCycleView,
  selectWithdrawFeeExample,
} from '../home';

/**
 * The seam's own tests. No DOM, no network, no React — which is the property
 * `VIEW-1` exists to protect and the reason the honesty assertions live here
 * rather than in a render test.
 *
 * Every assertion below is a RESOLVED VALUE (a string, a number, a boolean),
 * never a flag that is supposed to produce one. That is the standing lesson
 * from I-1e, where 722 tests passed over a live re-tint because each asked
 * whether an attribute was absent instead of what colour actually resolved.
 */
const base = (over: Partial<LedgerState> = {}): LedgerState =>
  ({
    initialized: true,
    mode: 'b2c',
    currency: 'USD',
    simDay: 0,
    genesisRecordedAt: null,
    realSettledDays: 0,
    split: null,
    buckets: { working: '0.00', floor: '0.00', cushion: '0.00' },
    goals: [],
    positions: [],
    rules: [],
    recurring: [],
    networkFeesPaid: '0.00',
    exitFeesPaid: '0.00',
    credited: '0.00',
    events: [],
    ...over,
  }) as unknown as LedgerState;

describe('selectHomeTriad', () => {
  it('should sum the three tones to the hero total, so the headline cannot understate the balance', () => {
    const t = selectHomeTriad(
      base({
        buckets: { working: '100.00', floor: '50.00', cushion: '25.00' },
        goals: [{ goalId: 'g1', cash: '200.00' }],
        positions: [{ goalId: 'g1', open: true, principal: '300.00', accrued: '12.34' }],
      } as Partial<LedgerState>)
    );
    expect(t.available).toBe('150.00');
    expect(t.working).toBe('512.34');
    expect(t.emergency).toBe('25.00');
    expect(t.playBalance).toBe('687.34');
    // the identity, asserted rather than trusted
    expect(new Decimal(t.available).plus(t.working).plus(t.emergency).toFixed(2)).toBe(
      t.playBalance
    );
  });

  it('should count uninvested goal cash as working — the omission that once understated the hero', () => {
    const t = selectHomeTriad(
      base({
        buckets: { working: '0.00', floor: '0.00', cushion: '0.00' },
        goals: [{ goalId: 'g1', cash: '1000.00' }],
      } as Partial<LedgerState>)
    );
    expect(t.working).toBe('1000.00');
    expect(t.playBalance).toBe('1000.00');
  });

  it('should exclude closed positions from working', () => {
    const t = selectHomeTriad(
      base({
        positions: [
          { goalId: 'g1', open: false, principal: '999.00', accrued: '1.00' },
          { goalId: 'g1', open: true, principal: '10.00', accrued: '0.50' },
        ],
      } as Partial<LedgerState>)
    );
    expect(t.working).toBe('10.50');
  });

  it('should hide the emergency column at zero and show it the moment a producer writes to the bucket', () => {
    expect(selectHomeTriad(base()).showEmergency).toBe(false);
    expect(
      selectHomeTriad(
        base({
          buckets: { working: '0.00', floor: '0.00', cushion: '0.01' },
        } as Partial<LedgerState>)
      ).showEmergency
    ).toBe(true);
  });

  it('should return fixed 2-decimal strings, so no component needs Decimal to render money', () => {
    const t = selectHomeTriad(
      base({ buckets: { working: '1.5', floor: '0', cushion: '0' } } as Partial<LedgerState>)
    );
    expect(t.available).toBe('1.50');
    Object.entries(t).forEach(([k, v]) => {
      if (k !== 'showEmergency') expect(typeof v).toBe('string');
    });
  });
});

describe('selectGoalProgress', () => {
  const withGoal = (target: string, cash: string) =>
    base({ goals: [{ goalId: 'g1', targetAmount: target, cash }] } as Partial<LedgerState>);

  it('should derive the ratio and clamp it at 100', () => {
    expect(selectGoalProgress(withGoal('1000.00', '250.00'), 'g1').ratioPercent).toBe(25);
    expect(selectGoalProgress(withGoal('1000.00', '5000.00'), 'g1').ratioPercent).toBe(100);
  });

  it('should never call a target-less goal reached — 0 >= 0 would make every one complete', () => {
    const p = selectGoalProgress(withGoal('0.00', '500.00'), 'g1');
    expect(p.hasTarget).toBe(false);
    expect(p.targetReached).toBe(false);
    expect(p.ratioPercent).toBe(0);
  });

  it('should report reached exactly at the target, and un-reach if value falls back below it', () => {
    expect(selectGoalProgress(withGoal('1000.00', '1000.00'), 'g1').targetReached).toBe(true);
    expect(selectGoalProgress(withGoal('1000.00', '999.99'), 'g1').targetReached).toBe(false);
  });

  it('should return zeros for an unknown goal rather than throwing', () => {
    const p = selectGoalProgress(base(), 'nope');
    expect(p.current).toBe('0.00');
    expect(p.targetReached).toBe(false);
  });
});

describe('selectRecurringView', () => {
  it('should report paused only when a schedule exists AND working money is exhausted', () => {
    // the honest cases: a schedule that can no longer be funded
    expect(selectRecurringView({ workingBalance: '0.00', hasSchedule: true }).paused).toBe(true);
    expect(selectRecurringView({ workingBalance: '0.01', hasSchedule: true }).paused).toBe(false);
  });

  it('should never report paused without a schedule — there is nothing to pause', () => {
    expect(selectRecurringView({ workingBalance: '0.00', hasSchedule: false }).paused).toBe(false);
  });

  it('should treat a negative balance as exhausted, not as a separate state', () => {
    expect(selectRecurringView({ workingBalance: '-5.00', hasSchedule: true }).paused).toBe(true);
  });
});

describe('selectGoalRowView', () => {
  const withGoal = (over: Record<string, unknown>) =>
    base({
      goals: [{ goalId: 'g1', targetAmount: '1000.00', cash: '250.00', status: 'active', ...over }],
    } as Partial<LedgerState>);

  it('should derive the clamped ratio and the display strings the row renders', () => {
    const v = selectGoalRowView(withGoal({}), 'g1');
    expect(v.current).toBe('250.00');
    expect(v.target).toBe('1000.00');
    expect(v.ratioPercent).toBe(25);
    expect(v.closed).toBe(false);
    expect(v.paused).toBe(false);
  });

  it('should mark dropped and accomplished goals closed — history stays visible', () => {
    expect(selectGoalRowView(withGoal({ status: 'dropped' }), 'g1').closed).toBe(true);
    expect(selectGoalRowView(withGoal({ status: 'accomplished' }), 'g1').closed).toBe(true);
  });

  it('should mark a paused goal paused without marking it closed', () => {
    const v = selectGoalRowView(withGoal({ status: 'paused' }), 'g1');
    expect(v.paused).toBe(true);
    expect(v.closed).toBe(false);
  });

  it('should return a 0 ratio for a target-less goal rather than dividing by zero', () => {
    expect(selectGoalRowView(withGoal({ targetAmount: '0.00' }), 'g1').ratioPercent).toBe(0);
  });
});

describe('selectGoalCompletionView', () => {
  const st = (target: string, cash: string) =>
    base({ goals: [{ goalId: 'g1', targetAmount: target, cash }] } as Partial<LedgerState>);

  it('should treat an EQUAL target as not a raise — the off-by-one a float compare invites', () => {
    expect(selectGoalCompletionView(st('1000.00', '1000.00'), 'g1', '1000').canRaise).toBe(false);
    expect(selectGoalCompletionView(st('1000.00', '1000.00'), 'g1', '1000.01').canRaise).toBe(true);
  });

  it('should not call an empty or junk entry a raise', () => {
    expect(selectGoalCompletionView(st('1000.00', '0.00'), 'g1', '').canRaise).toBe(false);
    expect(selectGoalCompletionView(st('1000.00', '0.00'), 'g1', 'abc').canRaise).toBe(false);
  });

  it('should report cash and current value as display strings', () => {
    const v = selectGoalCompletionView(st('3000.00', '250.5'), 'g1', '');
    expect(v.cash).toBe('250.50');
    expect(v.current).toBe('250.50');
    expect(v.hasPositions).toBe(false);
  });

  it('should include open positions in current value but not in cash', () => {
    const s2 = base({
      goals: [{ goalId: 'g1', targetAmount: '3000.00', cash: '100.00' }],
      positions: [{ goalId: 'g1', open: true, principal: '400.00', accrued: '5.00' }],
    } as Partial<LedgerState>);
    const v = selectGoalCompletionView(s2, 'g1', '');
    expect(v.cash).toBe('100.00');
    expect(v.current).toBe('505.00');
    expect(v.hasPositions).toBe(true);
  });
});

describe('selectHistorySummary', () => {
  it('should hide the fee line at exactly zero and show it at the first cent', () => {
    expect(
      selectHistorySummary(
        base({ networkFeesPaid: '0.00', exitFeesPaid: '0.00' } as Partial<LedgerState>)
      ).showFeeDrag
    ).toBe(false);
    expect(
      selectHistorySummary(
        base({ networkFeesPaid: '0.00', exitFeesPaid: '0.01' } as Partial<LedgerState>)
      ).showFeeDrag
    ).toBe(true);
  });

  it('should sum BOTH fee totals — the ledger tracks network and exit separately', () => {
    const v = selectHistorySummary(
      base({ networkFeesPaid: '1.25', exitFeesPaid: '0.50' } as Partial<LedgerState>)
    );
    expect(v.feesPaid).toBe('1.75');
  });
});

describe('selectEventMagnitude', () => {
  it('should drop the sign without the component reaching for Decimal', () => {
    expect(selectEventMagnitude('-42.50')).toBe(42.5);
    expect(selectEventMagnitude('42.50')).toBe(42.5);
    expect(selectEventMagnitude('0.00')).toBe(0);
  });
});

describe('selectWeeklyCycleView', () => {
  it('should multiply the weekly credit by the uncollected week count', () => {
    const v = selectWeeklyCycleView({
      weeklyCreditAmount: 25,
      uncollectedWeeks: 3,
      remainderToAvailable: 10.5,
    });
    expect(v.weeklyAmount).toBe('25.00');
    expect(v.collectable).toBe('75.00');
    expect(v.remainderToAvailable).toBe('10.50');
  });

  it('should return zero collectable when no week is uncollected', () => {
    expect(
      selectWeeklyCycleView({
        weeklyCreditAmount: 25,
        uncollectedWeeks: 0,
        remainderToAvailable: 0,
      }).collectable
    ).toBe('0.00');
  });
});

describe('selectRulesPreview', () => {
  // a stand-in for `allocateByRule`: floor-then-remainder, same contract
  const allocate = (total: number, split: ReadonlyArray<{ goalId: string; percent: number }>) => {
    const lines = split.map((r) => ({
      goalId: r.goalId,
      amount: Math.floor(total * r.percent) / 100,
    }));
    const allocated = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, remainderToAvailable: Number((total - allocated).toFixed(2)) };
  };

  it('should show real zeroes when nothing is waiting — never an invented illustration figure', () => {
    const v = selectRulesPreview({
      weeklyCreditAmount: 25,
      waitingWeeks: 0,
      allocate,
      split: [{ goalId: 'g1', percent: 100 }],
    });
    expect(v.waiting).toBe('0.00');
    expect(v.distributed).toBe('0.00');
    expect(v.remainderToAvailable).toBe('0.00');
  });

  it('should derive waiting from the weekly credit times the waiting weeks', () => {
    const v = selectRulesPreview({
      weeklyCreditAmount: 25,
      waitingWeeks: 4,
      allocate,
      split: [{ goalId: 'g1', percent: 50 }],
    });
    expect(v.waiting).toBe('100.00');
    expect(v.lines).toEqual([{ goalId: 'g1', amount: '50.00' }]);
    expect(v.distributed).toBe('50.00');
    expect(v.remainderToAvailable).toBe('50.00');
  });

  it('should keep distributed + remainder equal to waiting, so the preview explains every cent', () => {
    const v = selectRulesPreview({
      weeklyCreditAmount: 25,
      waitingWeeks: 3,
      allocate,
      split: [
        { goalId: 'a', percent: 33 },
        { goalId: 'b', percent: 33 },
      ],
    });
    expect(new Decimal(v.distributed).plus(v.remainderToAvailable).toFixed(2)).toBe(v.waiting);
  });
});

describe('selectMoveBalance', () => {
  it('should sum every bucket, open positions and uninvested goal cash', () => {
    const v = selectMoveBalance(
      base({
        buckets: { working: '100.00', floor: '50.00', cushion: '25.00' },
        goals: [{ goalId: 'g1', cash: '200.00' }],
        positions: [{ goalId: 'g1', open: true, principal: '300.00', accrued: '1.50' }],
      } as Partial<LedgerState>)
    );
    expect(v).toBe('676.50');
  });

  it('should exclude closed positions', () => {
    expect(
      selectMoveBalance(
        base({
          positions: [{ goalId: 'g1', open: false, principal: '999.00', accrued: '0.00' }],
        } as Partial<LedgerState>)
      )
    ).toBe('0.00');
  });

  it('should AGREE with the Home hero — two derivations of one number must not drift', () => {
    // The promise made in `selectMoveBalance`'s own docstring, asserted rather
    // than trusted: Home sums three named tones, /move sums buckets+positions+
    // goal cash. They agree today; if a future change makes them disagree, this
    // fails instead of shipping two different totals on two screens.
    const st = base({
      buckets: { working: '111.11', floor: '22.22', cushion: '33.33' },
      goals: [{ goalId: 'g1', cash: '44.44' }],
      positions: [{ goalId: 'g1', open: true, principal: '55.55', accrued: '6.66' }],
    } as Partial<LedgerState>);
    expect(selectMoveBalance(st)).toBe(selectHomeTriad(st).playBalance);
  });
});

describe('selectWithdrawFeeExample', () => {
  it('should derive the fee on the worked base as a display string', () => {
    // 0.48% of 100 = 0.48 — the FE-1 ramp rate
    expect(selectWithdrawFeeExample('0.0048')).toEqual({ fee: '0.48', base: '100.00' });
  });

  it('should accept a Decimal rate without the component converting it', () => {
    expect(selectWithdrawFeeExample(new Decimal('0.0048')).fee).toBe('0.48');
  });

  it('should be exact at rates a float would round badly', () => {
    expect(selectWithdrawFeeExample('0.0039').fee).toBe('0.39');
  });
});

describe('selectGoalDetailView', () => {
  const st = () =>
    base({
      goals: [{ goalId: 'g1', targetAmount: '3000.00', cash: '400.00' }],
      positions: [{ goalId: 'g1', open: true, principal: '500.00', accrued: '10.00' }],
      recurring: [
        { goalId: 'g1', monthlyAmount: '50.00' },
        { goalId: 'g2', monthlyAmount: '99.00' },
      ],
      events: [
        { type: 'GoalFunded', goalId: 'g1', amount: '400.00' },
        { type: 'GoalFunded', goalId: 'g2', amount: '777.00' },
        { type: 'PlayMoneyGranted', goalId: 'g1', amount: '1.00' },
      ],
    } as Partial<LedgerState>);

  it('should return BOTH shapes its consumers need — a display string and a number', () => {
    const v = selectGoalDetailView(st(), 'g1');
    expect(v.current).toBe('910.00');
    expect(v.currentValue).toBe(910);
    expect(typeof v.current).toBe('string');
    expect(typeof v.currentValue).toBe('number');
  });

  it('should sum recurring schedules for THIS goal only', () => {
    expect(selectGoalDetailView(st(), 'g1').goalMonthly).toBe(50);
  });

  it('should count only GoalFunded events for THIS goal — not other goals, not other types', () => {
    expect(selectGoalDetailView(st(), 'g1').contributionsTotal).toBe('400.00');
  });

  it('should not claim a target-less goal has reached its target', () => {
    const s2 = base({
      goals: [{ goalId: 'g1', targetAmount: '0.00', cash: '500.00' }],
    } as Partial<LedgerState>);
    const v = selectGoalDetailView(s2, 'g1');
    expect(v.hasTarget).toBe(false);
    expect(v.targetReached).toBe(false);
    expect(v.ratioPercent).toBe(0);
  });
});

describe('selectCanInvest', () => {
  const st = (cash: string) =>
    base({ goals: [{ goalId: 'g1', targetAmount: '1000.00', cash }] } as Partial<LedgerState>);

  it('should refuse a zero or negative amount', () => {
    expect(selectCanInvest(st('500.00'), 'g1', 0)).toBe(false);
    expect(selectCanInvest(st('500.00'), 'g1', -5)).toBe(false);
  });

  it('should allow exactly the available cash and refuse one cent more', () => {
    expect(selectCanInvest(st('500.00'), 'g1', 500)).toBe(true);
    expect(selectCanInvest(st('500.00'), 'g1', 500.01)).toBe(false);
  });

  it('should refuse when the goal does not exist rather than throwing', () => {
    expect(selectCanInvest(base(), 'nope', 10)).toBe(false);
  });
});

describe('selectPositionValue', () => {
  it('should sum principal and accrued exactly', () => {
    expect(selectPositionValue({ principal: '1000.00', accrued: '12.345' })).toBe('1012.35');
    expect(selectPositionValue({ principal: '0.01', accrued: '0.02' })).toBe('0.03');
  });
});

describe('selectEntrySplit', () => {
  // stands in for the domain's `splitEntry`: fee to 2dp, invested = total - fee
  const split = (total: number, fee: number) => {
    const f = new Decimal(fee).toDecimalPlaces(2);
    return { invested: new Decimal(total).minus(f), fee: f };
  };

  it('should reconcile: invested + fee === the total taken from cash', () => {
    const v = selectEntrySplit({ totalFromCash: 100, networkFeeLocal: 0.37, split });
    expect(v.invested).toBe('99.63');
    expect(v.fee).toBe('0.37');
    expect(new Decimal(v.invested).plus(v.fee).toFixed(2)).toBe('100.00');
  });

  it('should hold the identity at a zero fee', () => {
    const v = selectEntrySplit({ totalFromCash: 250, networkFeeLocal: 0, split });
    expect(v.invested).toBe('250.00');
    expect(v.fee).toBe('0.00');
  });
});

describe('selectAmountSign', () => {
  it('should give a gain pos and a FALL neg — a fallen position must never read in the gain colour', () => {
    expect(selectAmountSign('12.34')).toBe('pos');
    expect(selectAmountSign('-12.34')).toBe('neg');
  });

  it('should let zero claim neither', () => {
    expect(selectAmountSign('0.00')).toBe('none');
    expect(selectAmountSign('0')).toBe('none');
  });

  it('should treat a sub-cent fall as negative, not as nothing', () => {
    // earnings can be negative since the §4.8 replay; the sign is the truth,
    // not the rounded display
    expect(selectAmountSign('-0.004')).toBe('neg');
  });
});

describe('selectGoalDetailView · hasCash', () => {
  const st = (cash: string) =>
    base({ goals: [{ goalId: 'g1', targetAmount: '1000.00', cash }] } as Partial<LedgerState>);

  it('should hide the invest affordance when there is nothing to invest', () => {
    expect(selectGoalDetailView(st('0.00'), 'g1').hasCash).toBe(false);
  });

  it('should show it from the first cent', () => {
    expect(selectGoalDetailView(st('0.01'), 'g1').hasCash).toBe(true);
  });

  it('should report false for a goal that does not exist rather than throwing', () => {
    expect(selectGoalDetailView(base(), 'nope').hasCash).toBe(false);
  });
});

describe('selectExitPreview', () => {
  type Preview =
    | { kind: 'goal'; goalId: string; positionId?: undefined; fee?: undefined }
    | { kind: 'position'; positionId: string; fee: number; goalId?: undefined };
  const previewGoal = (goalId: string): Preview | null => ({ kind: 'goal', goalId });
  const previewPosition = (positionId: string, fee: number): Preview | null => ({
    kind: 'position',
    positionId,
    fee,
  });
  const feeFor = (positionId: string) => (positionId === 'p1' ? 0.42 : 0);

  it('should return null with no intent — nothing to preview', () => {
    expect(
      selectExitPreview({
        intent: null,
        canPrice: true,
        goalId: 'g1',
        feeFor,
        previewGoal,
        previewPosition,
      })
    ).toBeNull();
  });

  it('should return null when the exit cannot be PRICED — no honest price, no operable control', () => {
    expect(
      selectExitPreview({
        intent: { scope: 'goal' },
        canPrice: false,
        goalId: 'g1',
        feeFor,
        previewGoal,
        previewPosition,
      })
    ).toBeNull();
  });

  it('should compose the WHOLE goal for a goal-scoped intent', () => {
    expect(
      selectExitPreview({
        intent: { scope: 'goal' },
        canPrice: true,
        goalId: 'g1',
        feeFor,
        previewGoal,
        previewPosition,
      })
    ).toEqual({ kind: 'goal', goalId: 'g1' });
  });

  it('should preview ONE position for a position-scoped intent, with that position own fee', () => {
    expect(
      selectExitPreview({
        intent: { scope: 'position', positionId: 'p1' },
        canPrice: true,
        goalId: 'g1',
        feeFor,
        previewGoal,
        previewPosition,
      })
    ).toEqual({ kind: 'position', positionId: 'p1', fee: 0.42 });
  });

  it('should return null for a position intent with no positionId rather than guessing', () => {
    expect(
      selectExitPreview({
        intent: { scope: 'position' },
        canPrice: true,
        goalId: 'g1',
        feeFor,
        previewGoal,
        previewPosition,
      })
    ).toBeNull();
  });

  it('should pass the domain null through — nothing open means no zeroed ceremony', () => {
    expect(
      selectExitPreview({
        intent: { scope: 'goal' },
        canPrice: true,
        goalId: 'g1',
        feeFor,
        previewGoal: (): Preview | null => null,
        previewPosition,
      })
    ).toBeNull();
  });
});
