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
  'exitCeremony.subtitlePosition':
    'Review the Practice outcome and the reference cost information before you stop.',
  'exitCeremony.subtitleGoal':
    'This stops every strategy in this goal. Review the Practice outcome and the reference cost information before you stop.',
  'exitCeremony.onePosition': '1 strategy working',
  'exitCeremony.positionsCount': '{count} strategies working',
  'exitCeremony.gross': 'Practice amount before stopping',
  'exitCeremony.feesLabel': 'Reference costs',
  'exitCeremony.diboasFee': 'Reference diBoaS fee ({rate})',
  'exitCeremony.minimumSub': 'minimum {min} per exited position',
  'exitCeremony.networkCost': 'Reference network cost',
  'exitCeremony.estimated': 'Estimated',
  'exitCeremony.lineBreakdown':
    'Practice outcome: {gross}. Reference costs shown: diBoaS fee {fee}; network cost {network}.',
  'exitCeremony.net': 'Practice outcome',
  'exitCeremony.referenceCostQualifier':
    'For information only. Reference costs are not charged or deducted in Practice and do not reduce the Practice outcome.',
  'exitCeremony.whereItLands': 'Where it lands',
  'exitCeremony.landsBody':
    '{amount} lands in {goal} as cash. It stops working, and it stays yours to move.',
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
      net: '990.00',
    },
  ],
  gross: '990.00',
  exitFee: '3.86',
  networkFee: '0.03',
  net: '990.00',
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
      net: '50.00',
    },
    {
      positionId: 'p2',
      strategyId: 'steadyClimb',
      gross: '50.00',
      exitFee: '0.25',
      networkFee: '0.03',
      net: '50.00',
    },
  ],
  gross: '100.00',
  exitFee: '0.50',
  networkFee: '0.06',
  net: '100.00',
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
    expect(screen.getByText('Practice amount before stopping')).toBeTruthy();
    // `5.409`: ONE figure on both rows — the reference costs reduce nothing.
    expect(screen.getAllByText('$990.00')).toHaveLength(2);
    expect(screen.getByText('$3.86')).toBeTruthy();
    expect(screen.getByText('$0.03')).toBeTruthy();
  });

  it('should take the fee rate and floor from the CONSTANTS, not a copy literal', () => {
    renderCeremony(ONE);
    expect(screen.getByText(/Reference diBoaS fee \(0\.39%\)/)).toBeTruthy(); // FEE_RATES.exit
    expect(screen.getByText(/minimum \$0\.25 per exited position/)).toBeTruthy(); // EXIT_FEE_FLOOR
  });

  it('should ITEMIZE per position when stopping several, so N floors stay visible', () => {
    renderCeremony(TWO);
    // The summed row is honest only because the lines below prove where it
    // came from: two floors, not one.
    expect(screen.getByText('$0.50')).toBeTruthy();
    expect(screen.getByText('Safe Harbor')).toBeTruthy();
    expect(screen.getByText('Steady Climb')).toBeTruthy();
    expect(screen.getAllByText(/diBoaS fee \$0\.25; network cost \$0\.03/)).toHaveLength(2);
  });

  it('should NOT itemize a single position (one line would just repeat the total)', () => {
    renderCeremony(ONE);
    expect(screen.queryByText(/Reference costs shown:/)).toBeNull();
    expect(screen.getByText('1 strategy working')).toBeTruthy();
  });

  it('should say the money lands in the GOAL as cash, never in Available (D-e)', () => {
    renderCeremony(ONE);
    expect(screen.getByText('Where it lands')).toBeTruthy();
    expect(
      screen.getByText(
        '$990.00 lands in Future cushion as cash. It stops working, and it stays yours to move.'
      )
    ).toBeTruthy();
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

  it('should state the reference costs are NOT charged or deducted (`5.420`)', () => {
    renderCeremony(ONE);
    /* Brand + Legal + Strategy reconciliation. The qualifier must GOVERN the
       reference-cost group: present, in reading order, and bound to the group —
       never a tooltip or a detached footer (ruling §8). */
    const note = screen.getByText(
      'For information only. Reference costs are not charged or deducted in Practice and do not reduce the Practice outcome.'
    );
    expect(note).toBeTruthy();
    const group = note.closest('section');
    expect(group, 'the qualifier must sit INSIDE the reference-cost group').toBeTruthy();
    expect(group?.getAttribute('aria-describedby')).toBe(note.id);
    // The group is named by its heading, so a screen reader reaches heading →
    // qualifier → figures in that order.
    expect(group?.querySelector(`#${group.getAttribute('aria-labelledby')}`)?.textContent).toBe(
      'Reference costs'
    );
    // Both reference figures stay INSIDE the governed group (MISSING != 0).
    expect(group?.textContent).toContain('$3.86');
    expect(group?.textContent).toContain('$0.03');
  });

  it('should keep the Practice outcome OUTSIDE the reference-cost group (`5.420`)', () => {
    renderCeremony(ONE);
    const outcome = screen.getByText('Practice outcome');
    /* ⚑ The ceremony's own root is a <section>, so `closest('section')` can never
       be null — the first revision of this assertion tested an ancestor accident
       rather than the requirement. Scope it to the REFERENCE group instead. */
    const refGroup = document.getElementById('exit-ref-title')?.closest('section');
    expect(refGroup, 'the reference-cost group must exist').toBeTruthy();
    expect(
      refGroup?.contains(outcome),
      'the Practice outcome must sit OUTSIDE the reference-cost group'
    ).toBe(false);
    // ...and it must precede that group in reading order, never between two costs.
    expect(
      outcome.compareDocumentPosition(refGroup as Node) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // Unreduced, on both outcome rows.
    expect(screen.getAllByText('$990.00')).toHaveLength(2);
  });

  it('should carry no deduction vocabulary anywhere on the surface (`5.420`)', () => {
    renderCeremony(TWO);
    const text = document.body.textContent ?? '';
    // Sabotage: reintroduce any of these in the catalogue and this fails.
    for (const banned of ['less ', ' minus ', 'deducted from', 'net after', 'after fee']) {
      expect(text.toLowerCase(), `deduction vocabulary rendered: ${banned}`).not.toContain(banned);
    }
    expect(text).not.toContain('\u2212');
    // ...while the multi-position information itself stays inspectable.
    expect(screen.getAllByText(/Practice outcome: \$50\.00\./)).toHaveLength(2);
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

  it('should present reference costs as INFORMATION, never as a deduction (`5.409`)', () => {
    renderCeremony(ONE);
    /* Strategy ruling 2026-09-18: `PRACTICE REFERENCE / MODELLED COST =
       INFORMATIONAL = NON-EXECUTING = NON-DEDUCTED`. The measured defect was a
       surface showing a gross, two minus-signed cost rows, then an IDENTICAL
       total — which can only read as "the fees were absorbed" or "the total is
       wrong". Both cost figures must stay VISIBLE (`MISSING != 0`,
       `UNAVAILABLE != FREE`); they simply are not terms of a subtraction. */
    expect(screen.getByText('$3.86')).toBeTruthy();
    expect(screen.getByText('$0.03')).toBeTruthy();
    expect(screen.queryByText('\u2212$3.86')).toBeNull();
    expect(screen.queryByText('\u2212$0.03')).toBeNull();
    // No minus-prefixed amount anywhere on this surface. Sabotage: restore
    // either U+2212 prefix in ExitCeremony.tsx and this fails.
    expect(document.body.textContent).not.toContain('\u2212');
    // The outcome is the UNREDUCED amount on both rows: 990.00, not 990.00 less costs.
    expect(screen.getAllByText('$990.00')).toHaveLength(2);
  });

  it('should let the reader leave without stopping (back cancels, it does not commit)', () => {
    const { onCancel, onConfirm } = renderCeremony(ONE);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
