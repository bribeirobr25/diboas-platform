// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { GoalPauseSheet } from '../GoalPauseSheet';

/**
 * The REAL catalog, not a hand-copied map.
 *
 * This test used to inline its own copy of `goalPause.alsoStop`, and that copy
 * went stale: it still read "a small 0.39% fee applies)" after the shipped
 * string had gained the floor ("...at least {min}"). So the test passed while
 * documenting the FE-1-violating wording as the expected one — quoting the exit
 * rate without its floor understates the price on a small exit ($0.25 on a $50
 * position is 0.5%, not 0.39%), which is the same defect class as live-web
 * 5.103. A test that hand-copies copy cannot notice when the copy is corrected,
 * and it teaches the next reader the wrong requirement (PENDING_ALL 5.114).
 */
const M = getMessages('en');

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
    // The label never implies the money stopped; the stop option carries the
    // honest fee — the RATE **and** its floor, per FE-1's design principle
    // ("disclosed next to the rate wherever the rate appears"). Asserting the
    // rate alone is what let the stale wording sit here unnoticed.
    expect(screen.getByText(/0\.39\s*%/)).toBeTruthy();
    expect(screen.getByText(/at least \$0\.25/)).toBeTruthy();
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
