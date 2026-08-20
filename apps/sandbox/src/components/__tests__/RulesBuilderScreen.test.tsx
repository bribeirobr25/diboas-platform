// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { RulesBuilderScreen } from '../RulesBuilderScreen';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

/**
 * G9 rules builder (§4.9, mockup 20). The compliance surface: this screen
 * decides where someone's money goes by default, so its whole job is to NOT
 * decide for them.
 */
const M = {
  'rules.title': 'Your system',
  'rules.subtitle': 'Decide how each dollar moves toward your goals.',
  'rules.sendTo': 'Send my money to',
  'rules.destinationLabel': 'Destination {n}',
  'rules.chooseDestination': 'Choose destination',
  'rules.decrease': 'Decrease destination {n} share',
  'rules.increase': 'Increase destination {n} share',
  'rules.staysInAvailable': 'Stays in Available',
  'rules.staysNote': 'This is the remainder after your rules.',
  'rules.livePreview': 'Live preview',
  'rules.previewBasis': 'Based on your real waiting credits',
  'rules.waitingCredits': 'Your waiting credits',
  'rules.willBeDistributed': 'Will be distributed',
  'rules.previewNote': 'The preview updates as you adjust the percentages.',
  'rules.noWaitingCredits':
    'Nothing is waiting to be collected right now, so the preview shows zero.',
  'rules.create': 'Create system',
  'rules.createHint': 'Choose at least one destination and give it a share above 0%.',
  'rules.noGoalsTitle': 'No goals to send money to yet',
  'rules.noGoalsBody': 'A system decides where incoming money goes.',
  'rules.createGoal': 'Create a goal',
};

function renderBuilder() {
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <RulesBuilderScreen locale="en" />
    </IntlProvider>
  );
}

function seedGoals() {
  grantPlayMoney(10_000, 'USD', 'b2c');
  createGoal({ name: 'Trip', icon: 'plane', targetAmount: 3000, horizonMonths: 12, fundAmount: 0 });
  createGoal({
    name: 'Safety',
    icon: 'shield',
    targetAmount: 2000,
    horizonMonths: 24,
    fundAmount: 0,
  });
}

describe('RulesBuilderScreen — G9 (§4.9)', () => {
  beforeEach(() => resetSandbox());

  it('should open with NOTHING chosen and every share at 0% (veto rows 13 + 17)', () => {
    seedGoals();
    renderBuilder();
    // A pre-filled split is a default that decides for the user. The builder
    // must open empty, every time.
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);
    for (const s of selects) expect((s as HTMLSelectElement).value).toBe('');
    expect(screen.getAllByText('0%')).toHaveLength(3);
  });

  it('should show the whole 100% staying in Available before any rule exists', () => {
    seedGoals();
    renderBuilder();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('This is the remainder after your rules.')).toBeTruthy();
  });

  it('should keep the remainder honest as shares are added', () => {
    seedGoals();
    const goalId = getLedgerState().goals[0].goalId;
    renderBuilder();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: goalId } });
    const inc = screen.getByRole('button', { name: 'Increase destination 1 share' });
    for (let i = 0; i < 30; i += 1) fireEvent.click(inc);
    // 30% allocated → 70% must be shown as staying put, never absorbed silently.
    expect(screen.getByText('70%')).toBeTruthy();
  });

  it('should NOT count a share whose destination is still unchosen', () => {
    // A percentage pointing nowhere routes nothing, so the remainder stays
    // whole. Claiming otherwise would show an allocation that does not exist.
    seedGoals();
    renderBuilder();
    const inc = screen.getByRole('button', { name: 'Increase destination 1 share' });
    for (let i = 0; i < 30; i += 1) fireEvent.click(inc);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('should never let the shares exceed 100% in total', () => {
    seedGoals();
    const goalId = getLedgerState().goals[0].goalId;
    renderBuilder();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: goalId } });
    const inc1 = screen.getByRole('button', { name: 'Increase destination 1 share' });
    for (let i = 0; i < 120; i += 1) fireEvent.click(inc1);
    expect(screen.getByText('100%')).toBeTruthy(); // row 1 capped
    const inc2 = screen.getByRole('button', { name: 'Increase destination 2 share' });
    expect((inc2 as HTMLButtonElement).disabled).toBe(true); // nothing left to give
  });

  it('should DISABLE create until a real destination has a real share, and say why', () => {
    seedGoals();
    renderBuilder();
    const cta = screen.getByRole('button', { name: 'Create system' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(screen.getByText(/Choose at least one destination/)).toBeTruthy();
  });

  it("should emit RuleCreated only from the user's own choices", () => {
    seedGoals();
    const goalId = getLedgerState().goals[0].goalId;
    renderBuilder();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: goalId } });
    const inc = screen.getByRole('button', { name: 'Increase destination 1 share' });
    for (let i = 0; i < 25; i += 1) fireEvent.click(inc);
    fireEvent.click(screen.getByRole('button', { name: 'Create system' }));
    const created = getLedgerState().events.filter((e) => e.type === 'RuleCreated') as Array<{
      split: Array<{ goalId: string; percent: number }>;
    }>;
    expect(created).toHaveLength(1);
    expect(created[0].split).toEqual([{ goalId, percent: 25 }]);
  });

  it('should not offer the same goal twice across rows', () => {
    seedGoals();
    const goalId = getLedgerState().goals[0].goalId;
    renderBuilder();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: goalId } });
    const secondRowOptions = [...(screen.getAllByRole('combobox')[1] as HTMLSelectElement).options];
    expect(secondRowOptions.some((o) => o.value === goalId)).toBe(false);
  });

  it('should state plainly when there are no waiting credits (never a demo figure)', () => {
    seedGoals();
    renderBuilder();
    // The label promises "your real waiting credits" — with none, the preview
    // shows zero and says so, rather than borrowing an illustrative number.
    expect(screen.getByText(/Nothing is waiting to be collected/)).toBeTruthy();
    expect(screen.getByText('Based on your real waiting credits')).toBeTruthy();
  });

  it('should not dead-end when there are no goals yet (row 19)', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    renderBuilder();
    expect(screen.getByText('No goals to send money to yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create a goal' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Create system' })).toBeNull();
  });
});
