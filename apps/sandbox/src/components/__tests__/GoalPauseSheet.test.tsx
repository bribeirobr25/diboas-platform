// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { GoalPauseSheet } from '../GoalPauseSheet';

const M = {
  'goalPause.title': 'Pause this plan?',
  'goalPause.body':
    'Pausing stops your weekly plan and reminders. Your invested money keeps working.',
  'goalPause.statePlan': 'Plan paused',
  'goalPause.stateMoney': 'Invested money still working',
  'goalPause.alsoStop':
    'Want out of the strategy too? You can also stop it (a small 0.39% fee applies).',
  'goalPause.pause': 'Pause plan',
  'goalPause.keepGoing': 'Keep going',
  'common.close': 'Close',
};

function renderSheet(props?: { onConfirm?: () => void; onDismiss?: () => void }) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <GoalPauseSheet
        currency="USD"
        onConfirm={props?.onConfirm}
        onDismiss={props?.onDismiss ?? vi.fn()}
      />
    </IntlProvider>
  );
}

describe('GoalPauseSheet (Phase B — W-17d naming duality)', () => {
  it('should render the honest two-line duality AND the 0.39% stop note', () => {
    renderSheet();
    expect(screen.getByText('Plan paused')).toBeTruthy();
    expect(screen.getByText('Invested money still working')).toBeTruthy();
    // The label never implies the money stopped; the stop option carries the honest fee.
    expect(screen.getByText(/0.39% fee applies/)).toBeTruthy();
  });

  it('should fire onConfirm on Pause and onDismiss on Keep going', () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    renderSheet({ onConfirm, onDismiss });
    fireEvent.click(screen.getByRole('button', { name: 'Pause plan' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Keep going' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
