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

function renderSheet(props?: {
  onConfirm?: () => void;
  onDismiss?: () => void;
  hasOpenPositions?: boolean;
  onStopStrategy?: () => void;
}) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <GoalPauseSheet
        currency="USD"
        onConfirm={props?.onConfirm}
        onDismiss={props?.onDismiss ?? vi.fn()}
        hasOpenPositions={props?.hasOpenPositions ?? true}
        onStopStrategy={'onStopStrategy' in (props ?? {}) ? props?.onStopStrategy : vi.fn()}
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
    // `5.420` — the ratified wording states the floor as a MINIMUM PER EXITED
    // POSITION. The requirement being protected is unchanged and is NOT weakened:
    // FE-1 says the floor travels with the rate wherever the rate appears, so the
    // assertion still demands a floor, in the words the product now ships.
    expect(screen.getByText(/minimum of \$0\.25 per exited position/)).toBeTruthy();
    // And it must no longer claim the fee is levied in Practice (`5.420`).
    expect(screen.getByText(/not charged or deducted in Practice/)).toBeTruthy();
  });

  /**
   * K1 (B14, 5.534) — the state table, by the rendered TEXT: a goal with nothing invested is never
   * told its invested money keeps working, and the stop question appears only with its button.
   */
  it.each([
    ['cash only', false, false],
    ['invested, exit not priceable now', true, false],
    ['invested, stop offered', true, true],
  ] as const)('should say only what is true — %s', (_label, invested, stoppable) => {
    renderSheet({ hasOpenPositions: invested, onStopStrategy: stoppable ? vi.fn() : undefined });
    expect(screen.getByText('Plan paused')).toBeTruthy(); // what happens is always stated
    expect(screen.queryByText('Invested money still working') !== null).toBe(invested);
    expect(screen.queryByText(/your invested money keeps working/i) !== null).toBe(invested);
    expect(screen.queryByText(/0\.39\s*%/) !== null).toBe(stoppable);
    expect(screen.queryByRole('button', { name: M['goalPause.stopCta'] }) !== null).toBe(stoppable);
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
