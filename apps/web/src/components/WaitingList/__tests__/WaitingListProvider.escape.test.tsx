/**
 * @vitest-environment happy-dom
 *
 * Fifteenth audit: the provider listened for Escape on `document` AND the modal's focus trap
 * closed on Escape, so one Escape closed twice and sent two `waiting_list_modal_closed` events.
 * The modal here is a stand-in that uses the real focus trap exactly as the real modal does
 * (`useFocusTrap(ref, isOpen, { …, onEscape: onClose })`).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const track = vi.fn();
vi.mock('@/lib/analytics', () => ({
  analyticsService: { track: (...a: unknown[]) => track(...a) },
}));

function StandInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, isOpen, { onEscape: onClose });
  return isOpen ? (
    <div ref={ref} role="dialog">
      <button type="button">Join</button>
    </div>
  ) : null;
}
vi.mock('next/dynamic', () => ({ default: () => StandInModal }));

import { WaitingListProvider, useWaitingListModal } from '../WaitingListProvider';

function Opener() {
  const { openModal, isOpen } = useWaitingListModal();
  return (
    <button type="button" onClick={openModal}>
      {isOpen ? 'open' : 'closed'}
    </button>
  );
}

describe('the waitlist modal on Escape', () => {
  it('should close once and send exactly one close event', async () => {
    render(
      <WaitingListProvider>
        <Opener />
      </WaitingListProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'closed' }));
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    track.mockClear();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    const closes = track.mock.calls.filter(
      ([e]) => (e as { name: string }).name === 'waiting_list_modal_closed'
    );
    expect(closes).toHaveLength(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
