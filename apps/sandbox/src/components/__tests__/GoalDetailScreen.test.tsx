// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, enterStrategy, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { GoalDetailScreen } from '../GoalDetailScreen';

/**
 * The market must be PRESENT for these tests: an exit cannot be priced without
 * it, so every exit control is gated on it. Before this mock existed the exit
 * tests ran against a null market and were quietly asserting an unpriceable
 * ceremony (network fee $0.00) — the exact state the gate now refuses.
 */
const h = vi.hoisted(() => ({
  market: {
    apys: [],
    gas: [
      { chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: { source: 'fixture', asOf: '2026-07-18' } },
    ],
    usdPriceLocal: 1,
  } as unknown,
}));
const MARKET_OK = h.market;
vi.mock('@/hooks/useMarket', () => ({
  useMarket: () => ({ market: h.market, marketError: h.market === null, refreshMarket: () => {} }),
  fetchHistories: () => Promise.resolve([]),
}));

const M = {
  'common.back': 'Back',
  'goalDetail.backToGoal': 'Back to your goals',
  'goalDetail.progress': '{current} of {target}',
  'goalDetail.percentWay': 'of the way there',
  'goalDetail.cashInGoal': 'In the goal, not yet working: {amount}',
  'goalDetail.contributions': 'You moved in: {amount}',
  'goalDetail.noPositionTitle': 'Holding as cash',
  'goalDetail.noPosition': "This goal's money is sitting as cash.",
  'goalDetail.putToWork': 'Put it to work',
  'goalDetail.milestoneTitle': 'Target reached',
  'goalDetail.milestoneBody': 'Your call what happens next.',
  'goalDetail.investedLine': '{strategy}: {amount}',
  'goalDetail.earningsTitle': 'Earnings',
  'goalDetail.earningsLine': '{amount} so far',
  'goalDetail.exitCta': 'Stop this strategy',
  'goalDual.simple': 'Simple',
  'goalDual.detailed': 'Detailed',
  'goalDual.onTrackLabel': 'Am I on track to get there?',
  'goalDual.howLabel': "What your money's doing",
  'goalDual.nextLabel': 'What you can do next',
  'goalDual.add': 'Add money',
  'goalDual.seeDetail': 'See the detail',
  'goalDual.paused': 'Plan paused',
  'goalDual.moneyStillWorking': 'Invested money still working',
  'goalDual.contributions': 'Your contributions',
  'goalDual.marketChange': 'Market change',
  'goalsList.viewToggle': 'How much detail to show',
  'goalsList.status.accomplished': 'Accomplished',
  'goalNew.fundLabel': 'Amount',
  'goalNew.fundAvailable': '{amount} available',
  'goalNew.riskStable': 'Stable',
  'goalNew.growthExposure': '{percent}% growth',
  'goalDetail.exitPricingUnavailable':
    "Costs can't be priced right now, so stopping is unavailable. Your money keeps working.",
  'goalDual.pausePlan': 'Pause plan',
  'goalPause.title': 'Pause this plan?',
  'goalPause.body': 'Pausing stops your weekly plan.',
  'goalPause.statePlan': 'Plan paused',
  'goalPause.stateMoney': 'Invested money still working',
  'goalPause.alsoStop': 'Want out of the strategy too?',
  'goalPause.pause': 'Confirm pause',
  'goalPause.keepGoing': 'Keep going',
  'goalPause.stopCta': 'Also stop the strategy',
  'exitCeremony.title': 'Review before you stop',
  'exitCeremony.subtitlePosition': 'What comes back, and what it costs.',
  'exitCeremony.subtitleGoal': 'This stops every strategy in this goal.',
  'exitCeremony.onePosition': '1 strategy working',
  'exitCeremony.positionsCount': '{count} strategies working',
  'exitCeremony.gross': 'Coming back before costs',
  'exitCeremony.feesLabel': 'Fees and costs',
  'exitCeremony.diboasFee': 'diBoaS fee ({rate})',
  'exitCeremony.minimumSub': 'at least {min} per strategy',
  'exitCeremony.networkCost': 'Network cost',
  'exitCeremony.estimated': 'Estimated',
  'exitCeremony.lineBreakdown': '{gross} less {fee} fee and {network} network',
  'exitCeremony.net': 'What actually comes back',
  'exitCeremony.whereItLands': 'Where it lands',
  'exitCeremony.landsBody': '{amount} lands in {goal} as cash.',
  'exitCeremony.stopPosition': 'Stop this strategy',
  'exitCeremony.stopGoal': 'Stop this goal',
  'exitCeremony.cancel': 'Keep it working',
};

function renderDetail(goalId: string) {
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <GoalDetailScreen locale="en" goalId={goalId} />
    </IntlProvider>
  );
}

describe('GoalDetailScreen — the dual-view host (§4.2, mockup 14)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should lead with the Simple view: numbered sections, percent, saved line — no pace claim without a plan', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    expect(screen.getByText(/Am I on track to get there/)).toBeTruthy();
    expect(screen.getByText(/What your money's doing/)).toBeTruthy();
    expect(screen.getByText(/What you can do next/)).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy(); // 1,000 of 4,000
    expect(screen.getByText(/of the way there/)).toBeTruthy();
    // No recurring plan → no projection/pace sentence (absent over false).
    expect(screen.queryByText(/At this pace/i)).toBeNull();
  });

  it('should switch to Detailed: the operational surface (source rows + put-to-work)', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    // Two 'Detailed' buttons exist (the toggle segment + the ③ tile) — the
    // segment carries aria-pressed; click that one.
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    expect(screen.getByText('Your contributions')).toBeTruthy();
    expect(screen.getByText('Market change')).toBeTruthy();
    expect(screen.getByText('Put it to work')).toBeTruthy();
  });

  it('should open the invest flow from the Simple "Add money" tile (switches to Detailed)', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    renderDetail(goalId);
    fireEvent.click(screen.getByText('Add money'));
    expect(screen.getByLabelText('Amount')).toBeTruthy(); // the invest field is live
  });

  it('should show the target-reached status line when current ≥ target', () => {
    const goalId = createGoal({
      name: 'Done goal',
      icon: 'target',
      targetAmount: 500,
      horizonMonths: 6,
      fundAmount: 500,
    });
    renderDetail(goalId);
    expect(screen.getAllByText('Target reached').length).toBeGreaterThan(0);
  });

  it('should render nothing but the back link for an unknown goal (no crash)', () => {
    renderDetail('ghost');
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

describe('GoalDetailScreen — exit scope (§4.7 G7, board §3.3)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  /** A goal with TWO open positions — the case that exposed the scope bug. */
  function goalWithTwoPositions(): string {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
    return goalId;
  }

  it('should stop the WHOLE goal from "Also stop the strategy" (regression: it stopped only the first position)', () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Also stop the strategy' }));

    // Goal scope: the ceremony covers BOTH positions and names the goal-level
    // action. Before this fix it opened on openPositions[0] alone, leaving the
    // second position quietly working behind a "stopped" label.
    expect(screen.getByText('2 strategies working')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop this goal' })).toBeTruthy();
    // Two floors, itemized (the arithmetic that a summed-gross fee would hide).
    expect(screen.getByText('−$0.50')).toBeTruthy();
  });

  it("should stop only ONE position from that position's own Stop control", () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Stop this strategy' })[0]);
    expect(screen.getByText('1 strategy working')).toBeTruthy();
  });

  it('should return to the goal on cancel, moving nothing', () => {
    const goalId = goalWithTwoPositions();
    renderDetail(goalId);
    fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Also stop the strategy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it working' }));
    expect(screen.queryByText('Review before you stop')).toBeNull();
    expect(screen.getByText(/of the way there/)).toBeTruthy();
  });
});

describe('GoalDetailScreen — an exit that cannot be priced is never offered (R-13, FC-15)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should disable the stop control and say why when market data is missing', () => {
    // `market` is null until the fetch resolves, and STAYS null if it fails.
    // Without the gate the ceremony renders "Network cost $0.00" and a net that
    // overstates what comes back — an understated cost on the fee-truth screen —
    // and the confirm silently no-ops on approveExit's !market guard.
    h.market = null;
    try {
      const goalId = createGoal({
        name: 'Trip',
        icon: 'plane',
        targetAmount: 4000,
        horizonMonths: 12,
        fundAmount: 1000,
      });
      enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 });
      renderDetail(goalId);
      fireEvent.click(
        screen
          .getAllByRole('button', { name: 'Detailed' })
          .find((b) => b.hasAttribute('aria-pressed'))!
      );
      const stop = screen.getByRole('button', { name: 'Stop this strategy' }) as HTMLButtonElement;
      expect(stop.disabled).toBe(true);
      expect(screen.getByText(/Costs can't be priced right now/)).toBeTruthy();
      // And it cannot be forced open.
      fireEvent.click(stop);
      expect(screen.queryByText('Review before you stop')).toBeNull();
    } finally {
      h.market = MARKET_OK;
    }
  });
});
