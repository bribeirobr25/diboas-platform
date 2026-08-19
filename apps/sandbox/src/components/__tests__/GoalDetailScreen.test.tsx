// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { createGoal, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { GoalDetailScreen } from '../GoalDetailScreen';

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
  'goalDetail.exitTitle': 'Stop {strategy}',
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
  'goalNew.reviewPath': 'See the path before it moves',
  'goalNew.riskStable': 'Stable',
  'goalNew.growthExposure': '{percent}% growth',
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
