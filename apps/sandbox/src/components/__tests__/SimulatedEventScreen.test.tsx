// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { SIM_EVENT_DEFAULT_MULTIPLE } from '@/lib/growthConstants';
import { SimulatedEventScreen } from '../SimulatedEventScreen';

/**
 * G11 simulated event (§4.11, mockups 25/26). The governing constraints are
 * D-s's: a LIFE event never a market one, clearly fictional, impact preview
 * before any choice, and the reserve path never judged.
 */
const M = {
  'simEvent.title': 'Simulated event',
  'simEvent.subtitle': 'Something came up in your practice world.',
  'simEvent.practiceScenario': 'PRACTICE SCENARIO',
  'simEvent.headline': 'A surprise {amount} expense showed up today.',
  'simEvent.nothingReal': 'Nothing real happened.',
  'simEvent.purpose': 'A practice scenario. The decision is real; the money is not.',
  'simEvent.howHandle': 'How would you like to handle it in your practice plan?',
  'simEvent.option.coverFromAvailable': 'Cover from Available',
  'simEvent.option.useReserve': 'Use {goal}',
  'simEvent.option.split': 'Split it with {goal}',
  'simEvent.optionNote.split': 'Some from your reserve, the rest from Available.',
  'simEvent.splitLabel': 'How much comes from {goal}?',
  'simEvent.splitRange': 'Anything from {min} to {max}.',
  'simEvent.splitRest': 'The remaining {rest} comes from Available.',
  'simEvent.splitHint': 'Enter an amount inside that range to choose this.',
  'simEvent.manifest.fromReserve': 'From your reserve',
  'simEvent.manifest.fromAvailable': 'From Available',
  'simEvent.optionNote.coverFromAvailable': 'Money that is ready to spend.',
  'simEvent.optionNote.useReserve': 'Money you set aside for exactly this.',
  'simEvent.previewImpact': 'See what each one does',
  'simEvent.previewTitle': 'What each choice does',
  'simEvent.previewSubtitle': 'The same money, depending on what you pick.',
  'simEvent.projection': 'Projection',
  'simEvent.available': 'Available',
  'simEvent.reserveDidItsJob': 'The reserve did its job.',
  'simEvent.choose': 'Choose this',
  'simEvent.chooseLabel': 'Choose {option}',
  'simEvent.projectionsNote': 'These are projections to help you decide.',
  'simEvent.back': 'Back to the options',
  'simEvent.waitingTitle': 'This one waits for now',
  'simEvent.waitingBody': 'Practice money never goes below zero.',
  'simEvent.noneTitle': 'Nothing to handle',
  'simEvent.noneBody': 'No practice scenario is waiting for you right now.',
  'simEvent.backHome': 'Back to home',
  'simEvent.name': 'An unexpected expense',
  'simEvent.confirmTitle': 'Confirm how you handle it',
  'simEvent.manifest.event': 'Practice scenario',
  'simEvent.manifest.amount': 'Amount',
  'simEvent.manifest.from': 'Comes from',
  'simEvent.manifest.cta': 'Confirm',
  'simEvent.manifest.reassurance': 'Play money only. The decision is real; the money is not.',
  'manifest.footer': 'You can cancel.',
  'manifest.cancel': 'Cancel',
};

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const renderScreen = () =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <SimulatedEventScreen locale="en" />
    </IntlProvider>
  );

const GENESIS = '2026-08-01T09:00:00Z';
/** The expense is 1.5× the weekly credit = 1,500 on the b2c grant. */
const EXPENSE = 10_000 * 0.1 * SIM_EVENT_DEFAULT_MULTIPLE;

/** Genesis three weeks ago, so the ruled personal-week-3 slot is live. */
function seedAtWeek3({ goalCash = 0 }: { goalCash?: number } = {}) {
  vi.setSystemTime(new Date(GENESIS));
  grantPlayMoney(10_000, 'USD', 'b2c');
  if (goalCash > 0) {
    createGoal({
      name: 'Safety net',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: goalCash,
    });
  }
  vi.setSystemTime(new Date(Date.parse(GENESIS) + 21 * 86_400_000));
}

describe('SimulatedEventScreen — G11 (§4.11)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should frame the scenario as fictional BEFORE any money is read', () => {
    seedAtWeek3();
    renderScreen();
    // Structural, not a footnote: both markers are present on first paint.
    expect(screen.getByText('PRACTICE SCENARIO')).toBeTruthy();
    expect(screen.getByText('Nothing real happened.')).toBeTruthy();
  });

  it('should carry no urgency, deadline or alarm framing (veto row 10)', () => {
    seedAtWeek3();
    const { container } = renderScreen();
    const text = container.textContent ?? '';
    for (const word of ['expires', 'urgent', 'deadline', 'hurry', 'last chance', 'warning']) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });

  it('should show the impact of EVERY option before any choice is made (14.8)', () => {
    seedAtWeek3({ goalCash: 3000 });
    renderScreen();
    // Nothing is choosable on the presented step — seeing comes first.
    expect(screen.queryByRole('button', { name: /Choose/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
    expect(screen.getAllByText('Projection')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Choose/ }).length).toBeGreaterThanOrEqual(2);
  });

  it('should never judge the reserve path — it did its job, and it is not warned about', () => {
    seedAtWeek3({ goalCash: 3000 });
    const { container } = renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
    expect(screen.getByText('The reserve did its job.')).toBeTruthy();
    // Same control, same weight as the other option — nothing marks a right answer.
    const choices = screen.getAllByRole('button', { name: /Choose/ });
    expect(new Set(choices.map((c) => c.className)).size).toBe(1);
    expect((container.textContent ?? '').toLowerCase()).not.toContain('are you sure');
  });

  it('should require the W-7 confirm before any money moves', () => {
    seedAtWeek3();
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Choose/ })[0]);
    // Still nothing appended — the choice opened a ceremony, it did not commit.
    expect(getLedgerState().resolvedEventInstances).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(getLedgerState().resolvedEventInstances).toHaveLength(1);
  });

  it('should spend from Available on the cover path', () => {
    seedAtWeek3();
    const before = Number(getLedgerState().buckets.working);
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Choose/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(Number(getLedgerState().buckets.working)).toBe(before - EXPENSE);
  });

  it('should take it from the goal, not from Available, on the reserve path', () => {
    seedAtWeek3({ goalCash: 3000 });
    const state = getLedgerState();
    const availableBefore = Number(state.buckets.working);
    const goalCashBefore = Number(state.goals[0].cash);
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Use Safety net' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const after = getLedgerState();
    // The money passes THROUGH Available — released, then spent — so the net
    // effect on Available is zero and the whole hit lands on the reserve.
    expect(Number(after.buckets.working)).toBe(availableBefore);
    expect(Number(after.goals[0].cash)).toBe(goalCashBefore - EXPENSE);
  });

  it('should offer NO operable choice when nothing can afford it (never a negative balance)', () => {
    vi.setSystemTime(new Date(GENESIS));
    grantPlayMoney(10, 'USD', 'b2c');
    vi.setSystemTime(new Date(Date.parse(GENESIS) + 21 * 86_400_000));
    renderScreen();
    // A fake control on a money surface is the failure mode this guards.
    expect(screen.queryByRole('button', { name: 'See what each one does' })).toBeNull();
    expect(screen.getByText('This one waits for now')).toBeTruthy();
  });

  it('should say plainly when nothing is waiting, and still offer a way out (row 19)', () => {
    vi.setSystemTime(new Date(GENESIS));
    grantPlayMoney(10_000, 'USD', 'b2c');
    // Week 1 — the event is not due yet.
    renderScreen();
    expect(screen.getByText('Nothing to handle')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to home' })).toBeTruthy();
  });
});

describe('SimulatedEventScreen — the user-set split (P2BD-17)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  /** Reach the preview with a reserve goal present. */
  function openPreview() {
    seedAtWeek3({ goalCash: 3000 });
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'See what each one does' }));
  }

  it('should open the split EMPTY — diBoaS never proposes how much of your reserve to spend', () => {
    openPreview();
    const field = screen.getByLabelText('How much comes from Safety net?') as HTMLInputElement;
    expect(field.value).toBe('');
    // The bounds are stated (arithmetic), but no amount inside them is.
    expect(screen.getByText(/Anything from/)).toBeTruthy();
  });

  it('should show NO projected after until a share is entered', () => {
    openPreview();
    const card = screen
      .getAllByRole('listitem')
      .find((li) => /Split it with/.test(li.textContent ?? ''))!;
    // before -> before would read as a projection of "nothing changes", when
    // the truth is that nothing has been chosen yet.
    expect(card.textContent).not.toMatch(/\$3,000\.00.*\$3,000\.00/);
    fireEvent.change(screen.getByLabelText('How much comes from Safety net?'), {
      target: { value: '400' },
    });
    const filled = screen
      .getAllByRole('listitem')
      .find((li) => /Split it with/.test(li.textContent ?? ''))!;
    expect(filled.textContent).toMatch(/\$2,600\.00/);
  });

  it('should not let the split be chosen until the user has entered a share', () => {
    openPreview();
    const choose = screen.getByRole('button', {
      name: 'Choose Split it with Safety net',
    }) as HTMLButtonElement;
    expect(choose.disabled).toBe(true);
    // A disabled control always says why.
    expect(screen.getByText('Enter an amount inside that range to choose this.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('How much comes from Safety net?'), {
      target: { value: '400' },
    });
    expect(
      (screen.getByRole('button', { name: 'Choose Split it with Safety net' }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
  });

  it('should refuse a share outside the stated range', () => {
    openPreview();
    // The goal holds 3,000; asking it for more than that is not a split it can make.
    fireEvent.change(screen.getByLabelText('How much comes from Safety net?'), {
      target: { value: '4000' },
    });
    expect(
      (screen.getByRole('button', { name: 'Choose Split it with Safety net' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('should move exactly what the user divided, from both places', () => {
    openPreview();
    const before = getLedgerState();
    fireEvent.change(screen.getByLabelText('How much comes from Safety net?'), {
      target: { value: '400' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Choose Split it with Safety net' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const after = getLedgerState();
    expect(Number(after.goals[0].cash)).toBe(Number(before.goals[0].cash) - 400);
    // Available paid the other 1,100 of the 1,500.
    expect(Number(after.buckets.working)).toBe(Number(before.buckets.working) - (EXPENSE - 400));
  });

  it('should itemize BOTH sources on the confirm sheet, never a single rounded one', () => {
    openPreview();
    fireEvent.change(screen.getByLabelText('How much comes from Safety net?'), {
      target: { value: '400' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Choose Split it with Safety net' }));
    expect(screen.getByText('From your reserve')).toBeTruthy();
    expect(screen.getByText('From Available')).toBeTruthy();
    expect(screen.getByText('Safety net · $400.00')).toBeTruthy();
    expect(screen.getByText('$1,100.00')).toBeTruthy();
  });
});
