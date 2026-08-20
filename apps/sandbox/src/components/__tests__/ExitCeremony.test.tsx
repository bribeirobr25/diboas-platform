// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import type { StopPreview } from '@/lib/ledgerClient';
import { ExitCeremony } from '../ExitCeremony';

/**
 * G7 exit ceremony (§4.7). The fee-truth surface: what it must never do is let
 * a user approve a stop without seeing every cost that will actually be
 * charged, or tell them the money lands somewhere it does not.
 */
const M = {
  'common.back': 'Back',
  'exitCeremony.title': 'Review before you stop',
  'exitCeremony.subtitlePosition': 'Here is exactly what comes back, and what it costs.',
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
  'catalog.strategies.safeHarbor.name': 'Safe Harbor',
  'catalog.strategies.steadyClimb.name': 'Steady Climb',
};

const ONE: StopPreview = {
  lines: [
    {
      positionId: 'p1',
      strategyId: 'safeHarbor',
      gross: '990.00',
      exitFee: '3.86',
      networkFee: '0.03',
      net: '986.11',
    },
  ],
  gross: '990.00',
  exitFee: '3.86',
  networkFee: '0.03',
  net: '986.11',
};

/** Two SMALL positions: both pay the $0.25 floor, so the total floor is 0.50. */
const TWO: StopPreview = {
  lines: [
    {
      positionId: 'p1',
      strategyId: 'safeHarbor',
      gross: '50.00',
      exitFee: '0.25',
      networkFee: '0.03',
      net: '49.72',
    },
    {
      positionId: 'p2',
      strategyId: 'steadyClimb',
      gross: '50.00',
      exitFee: '0.25',
      networkFee: '0.03',
      net: '49.72',
    },
  ],
  gross: '100.00',
  exitFee: '0.50',
  networkFee: '0.06',
  net: '99.44',
};

function renderCeremony(
  preview: StopPreview,
  props: Partial<Parameters<typeof ExitCeremony>[0]> = {}
) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <ExitCeremony
        preview={preview}
        goalName="Future cushion"
        goalIcon="plane"
        currency="USD"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </IntlProvider>
  );
  return { ...utils, onConfirm, onCancel };
}

describe('ExitCeremony — the G7 fee-truth surface (§4.7)', () => {
  it('should show gross, both fees, and the net before anything moves', () => {
    renderCeremony(ONE);
    expect(screen.getByText('Coming back before costs')).toBeTruthy();
    expect(screen.getByText('$990.00')).toBeTruthy();
    expect(screen.getByText('−$3.86')).toBeTruthy();
    expect(screen.getByText('−$0.03')).toBeTruthy();
    expect(screen.getByText('$986.11')).toBeTruthy();
  });

  it('should take the fee rate and floor from the CONSTANTS, not a copy literal', () => {
    renderCeremony(ONE);
    expect(screen.getByText(/diBoaS fee \(0\.39%\)/)).toBeTruthy(); // FEE_RATES.exit
    expect(screen.getByText(/at least \$0\.25 per strategy/)).toBeTruthy(); // EXIT_FEE_FLOOR
  });

  it('should ITEMIZE per position when stopping several, so N floors stay visible', () => {
    renderCeremony(TWO);
    // The summed row is honest only because the lines below prove where it
    // came from: two floors, not one.
    expect(screen.getByText('−$0.50')).toBeTruthy();
    expect(screen.getByText('Safe Harbor')).toBeTruthy();
    expect(screen.getByText('Steady Climb')).toBeTruthy();
    expect(screen.getAllByText(/less \$0\.25 fee and \$0\.03 network/)).toHaveLength(2);
  });

  it('should NOT itemize a single position (one line would just repeat the total)', () => {
    renderCeremony(ONE);
    expect(screen.queryByText(/less .* fee and .* network/)).toBeNull();
    expect(screen.getByText('1 strategy working')).toBeTruthy();
  });

  it('should say the money lands in the GOAL as cash, never in Available (D-e)', () => {
    renderCeremony(ONE);
    expect(screen.getByText('Where it lands')).toBeTruthy();
    expect(screen.getByText('$986.11 lands in Future cushion as cash.')).toBeTruthy();
    expect(screen.queryByText(/Available/i)).toBeNull();
  });

  it('should label the network cost as estimated (gas is a sandbox fixture)', () => {
    renderCeremony(ONE);
    expect(screen.getByText('Estimated')).toBeTruthy();
  });

  it('should name the action by SCOPE so a goal stop never reads as one strategy', () => {
    const single = renderCeremony(ONE);
    expect(screen.getByRole('button', { name: 'Stop this strategy' })).toBeTruthy();
    single.unmount();

    renderCeremony(TWO);
    expect(screen.getByRole('button', { name: 'Stop this goal' })).toBeTruthy();
    expect(screen.getByText('2 strategies working')).toBeTruthy();
  });

  it('should offer stopping and keeping at equal weight (no confirm-shaming)', () => {
    const { onConfirm, onCancel } = renderCeremony(ONE);
    fireEvent.click(screen.getByRole('button', { name: 'Keep it working' }));
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Stop this strategy' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should disable BOTH actions while settling (never a double-stop on a fast tap)', () => {
    const { onConfirm } = renderCeremony(ONE, { busy: true });
    const stop = screen.getByRole('button', { name: 'Stop this strategy' }) as HTMLButtonElement;
    expect(stop.disabled).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Keep it working' }) as HTMLButtonElement).disabled
    ).toBe(true);
    fireEvent.click(stop);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should move focus to the heading, since the opening control unmounts behind it', () => {
    renderCeremony(ONE);
    // Without this the reader is dropped on <body>: nothing announces the
    // screen changed, and the next Tab restarts from the top of the page.
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });

  it('should let the reader leave without stopping (back cancels, it does not commit)', () => {
    const { onCancel, onConfirm } = renderCeremony(ONE);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
