// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { GoalCompletionScreen } from '../GoalCompletionScreen';

const M = {
  'common.back': 'Back',
  'goalDetail.milestoneTitle': 'Target reached',
  'goalComplete.saved': 'You saved',
  'goalComplete.ofTarget': 'of {target}',
  'goalComplete.wellDone': 'You stayed consistent and took care of future you. Well done.',
  'goalComplete.whatNext': 'What would you like to do next?',
  'goalComplete.keepWorking': 'Keep working',
  'goalComplete.keepWorkingNote': 'The money stays in its strategy, and this goal closes.',
  'goalComplete.stopStrategy': 'Stop strategy',
  'goalComplete.stopStrategyNote': "Take the money out first. You'll see the full cost.",
  'goalComplete.holdAsCash': 'Hold as cash',
  'goalComplete.holdAsCashNote': 'The money stays here as cash, and this goal closes.',
  'goalComplete.moveToGoal': 'Move to another goal',
  'goalComplete.moveToGoalNote': 'Move {amount} to another goal and close this one.',
  'goalComplete.raiseTarget': 'Raise the target',
  'goalComplete.raiseTargetNote': 'Keep this goal open and aim further.',
  'goalComplete.transferTitle': 'Which goal should it move to?',
  'goalComplete.transferPositionsStay': 'Money working in a strategy stays where it is.',
  'goalComplete.transferEmpty': "There's no other open goal to move it to.",
  'goalComplete.raiseTitle': 'Raise the target',
  'goalComplete.newTargetLabel': 'New target',
  'goalComplete.currentTarget': 'Now: {amount}',
  'goalComplete.raiseCta': 'Save the new target',
};

function renderCompletion(goalId: string) {
  const state = getLedgerState();
  const goal = state.goals.find((g) => g.goalId === goalId)!;
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <GoalCompletionScreen goal={goal} state={state} onClose={() => {}} />
    </IntlProvider>
  );
}

/** A reached goal: target 500, funded 500 (cash only, no positions). */
function reachedGoal(name = 'Done goal') {
  return createGoal({
    name,
    icon: 'target',
    targetAmount: 500,
    horizonMonths: 6,
    fundAmount: 500,
  });
}

describe('GoalCompletionScreen — G4 dispositions (§4.4, mockup 16, board §3.1)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should offer the dispositions with equal weight and no default selection', () => {
    renderCompletion(reachedGoal());
    expect(screen.getByText('What would you like to do next?')).toBeTruthy();
    expect(screen.getByText('Keep working')).toBeTruthy();
    expect(screen.getByText('Hold as cash')).toBeTruthy();
    expect(screen.getByText('Move to another goal')).toBeTruthy();
    expect(screen.getByText('Raise the target')).toBeTruthy();
    // No position → no "Stop strategy" row (a control that would do nothing).
    expect(screen.queryByText('Stop strategy')).toBeNull();
    // Behaviour-framed, never a return claim or confetti.
    expect(screen.getByText(/You stayed consistent/)).toBeTruthy();
  });

  it('should close as kept-working, leaving the goal cash where it is', () => {
    const goalId = reachedGoal();
    renderCompletion(goalId);
    fireEvent.click(screen.getByText('Keep working'));
    const goal = getLedgerState().goals.find((g) => g.goalId === goalId)!;
    expect(goal.status).toBe('accomplished');
    expect(goal.cash).toBe('500.00');
  });

  it('should close as held-as-cash', () => {
    const goalId = reachedGoal();
    renderCompletion(goalId);
    fireEvent.click(screen.getByText('Hold as cash'));
    expect(getLedgerState().goals.find((g) => g.goalId === goalId)!.status).toBe('accomplished');
  });

  it('should transfer the cash to another goal and close as transferred (versions sequenced)', () => {
    const goalId = reachedGoal();
    const otherId = createGoal({
      name: 'Next goal',
      icon: 'plane',
      targetAmount: 2000,
      horizonMonths: 12,
      fundAmount: 0,
    });
    renderCompletion(goalId);
    fireEvent.click(screen.getByText('Move to another goal'));
    fireEvent.click(screen.getByText('Next goal'));
    const state = getLedgerState();
    const from = state.goals.find((g) => g.goalId === goalId)!;
    const to = state.goals.find((g) => g.goalId === otherId)!;
    expect(from.status).toBe('accomplished'); // the closing event applied…
    expect(from.cash).toBe('0.00'); // …and the release really happened
    expect(to.cash).toBe('500.00');
  });

  it('should tell the truth when there is nowhere to transfer to', () => {
    renderCompletion(reachedGoal());
    fireEvent.click(screen.getByText('Move to another goal'));
    expect(screen.getByText("There's no other open goal to move it to.")).toBeTruthy();
  });

  it('should raise the target WITHOUT accomplishing — the goal stays active and un-reaches', () => {
    const goalId = reachedGoal();
    renderCompletion(goalId);
    fireEvent.click(screen.getByText('Raise the target'));
    fireEvent.change(screen.getByLabelText('New target'), { target: { value: '900' } });
    fireEvent.click(screen.getByText('Save the new target'));
    const goal = getLedgerState().goals.find((g) => g.goalId === goalId)!;
    expect(goal.status).toBe('active'); // never accomplished (board §3.1)
    expect(goal.targetAmount).toBe('900.00');
    // target_reached is DERIVED, so it cleared itself with no extra event.
    expect(Number(goal.cash) >= Number(goal.targetAmount)).toBe(false);
    expect(getLedgerState().events.filter((e) => e.type === 'GoalAccomplished')).toHaveLength(0);
  });

  it('should refuse a LOWER target from the raise step (raise only)', () => {
    const goalId = reachedGoal();
    renderCompletion(goalId);
    fireEvent.click(screen.getByText('Raise the target'));
    fireEvent.change(screen.getByLabelText('New target'), { target: { value: '100' } });
    const cta = screen.getByText('Save the new target') as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    fireEvent.click(cta);
    expect(getLedgerState().goals.find((g) => g.goalId === goalId)!.targetAmount).toBe('500.00');
  });

  it('should return to the goal after a disposition applies (no visual dead-end)', () => {
    const goalId = reachedGoal();
    const state = getLedgerState();
    const goal = state.goals.find((g) => g.goalId === goalId)!;
    const onClose = vi.fn();
    render(
      <IntlProvider locale="en" messages={M} onError={() => {}}>
        <GoalCompletionScreen goal={goal} state={state} onClose={onClose} />
      </IntlProvider>
    );
    fireEvent.click(screen.getByText('Keep working'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should route Stop strategy to the caller (the real exit manifest), never closing on its own', () => {
    const goalId = reachedGoal();
    const onStop = vi.fn();
    const state = getLedgerState();
    const goal = state.goals.find((g) => g.goalId === goalId)!;
    // A goal WITH an open position: simulate by passing a state whose positions
    // include one for this goal (the screen only reads `state`).
    const withPosition = {
      ...state,
      positions: [
        {
          positionId: 'p1',
          goalId,
          strategyId: 'safeHarbor',
          principal: '100.00',
          accrued: '0.00',
          enteredSimDay: 0,
          accruedThroughSimDay: 0,
          open: true,
        },
      ],
    };
    render(
      <IntlProvider locale="en" messages={M} onError={() => {}}>
        <GoalCompletionScreen
          goal={goal}
          state={withPosition}
          onClose={() => {}}
          onStopStrategy={onStop}
        />
      </IntlProvider>
    );
    fireEvent.click(screen.getByText('Stop strategy'));
    expect(onStop).toHaveBeenCalledOnce();
    // The screen itself moved nothing and closed nothing.
    expect(getLedgerState().goals.find((g) => g.goalId === goalId)!.status).toBe('active');
  });
});
