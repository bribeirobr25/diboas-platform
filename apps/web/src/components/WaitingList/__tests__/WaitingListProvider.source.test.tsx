/**
 * @vitest-environment happy-dom
 *
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 3: the OPENER's source reaches the request (plan P11, D1).
 *
 * The modal posted `source: 'modal'`, which the route refused for every signup from
 * 2026-03-20. Now each opener names its path and the provider hands it to the form. This
 * renders the real provider (its interceptor included) and the real form hook behind a
 * stand-in modal that calls the hook exactly as `WaitingListModal` does, captures the
 * request body, and checks it against the server's own validator. With guard 2 (every
 * listed source is stored by the route) that ties what the client sends to what the server
 * accepts.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidSource } from '@/lib/api/validators';
import type { WaitlistSource } from '@/lib/waitingList/store/types';
import { useWaitlistModalForm } from '../hooks/useWaitlistModalForm';

const track = vi.fn();
vi.mock('@/lib/analytics', () => ({
  analyticsService: { track: (...a: unknown[]) => track(...a) },
}));

const posted: Record<string, unknown>[] = [];
vi.mock('@/lib/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async (_url: string, init: { body: string }) => {
    posted.push(JSON.parse(init.body) as Record<string, unknown>);
    return { ok: true, json: async () => ({ success: true, position: 7 }) };
  }),
}));

function StandInModal({
  isOpen,
  source,
  onJoined,
}: {
  isOpen: boolean;
  onClose: () => void;
  source: WaitlistSource;
  onJoined: () => void;
}) {
  const { handleInputChange, handleSubmit, isSuccess } = useWaitlistModalForm({
    locale: 'en',
    t: (key) => key,
    source,
    onJoined,
  });
  if (!isOpen) return null;
  return (
    <form onSubmit={handleSubmit}>
      <input aria-label="email" name="email" onChange={handleInputChange} />
      <input
        aria-label="consent"
        name="gdprAccepted"
        type="checkbox"
        onChange={handleInputChange}
      />
      <button type="submit">Join</button>
      {isSuccess ? <p>stored</p> : null}
    </form>
  );
}
vi.mock('next/dynamic', () => ({ default: () => StandInModal }));

import { WaitingListProvider, useWaitingListModal } from '../WaitingListProvider';

function DreamModeOpener() {
  const { openModal, joined } = useWaitingListModal();
  return (
    <>
      <button type="button" onClick={() => openModal('dream_mode')}>
        open from dream mode
      </button>
      <p>{joined ? 'joined' : 'not joined'}</p>
      <a href="https://app.diboas.com/start">open the app</a>
    </>
  );
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('email'), {
    target: { name: 'email', value: 'reader@example.com' },
  });
  fireEvent.click(screen.getByLabelText('consent'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
  });
}

describe('5.979 · the opener names the source the modal posts', () => {
  beforeEach(() => {
    posted.length = 0;
    track.mockClear();
  });

  it('should post dream_mode when Dream Mode opens the modal', async () => {
    render(
      <WaitingListProvider>
        <DreamModeOpener />
      </WaitingListProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'open from dream mode' }));
    });
    await fillAndSubmit();
    expect(posted).toHaveLength(1);
    expect(posted[0]!.source).toBe('dream_mode');
    expect(isValidSource(posted[0]!.source as string)).toBe(true);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'waiting_list_modal_opened',
        parameters: expect.objectContaining({ source: 'dream_mode' }),
      })
    );
  });

  it('should post app_link when the interceptor opens the modal from an app link', async () => {
    render(
      <WaitingListProvider>
        <DreamModeOpener />
      </WaitingListProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'open the app' }));
    });
    await fillAndSubmit();
    expect(posted).toHaveLength(1);
    expect(posted[0]!.source).toBe('app_link');
    expect(isValidSource(posted[0]!.source as string)).toBe(true);
  });

  it('should mark the reader as joined once the signup is stored, and not before', async () => {
    render(
      <WaitingListProvider>
        <DreamModeOpener />
      </WaitingListProvider>
    );
    expect(screen.getByText('not joined')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'open from dream mode' }));
    });
    expect(screen.getByText('not joined')).toBeTruthy();
    await fillAndSubmit();
    expect(screen.getByText('stored')).toBeTruthy();
    expect(screen.getByText('joined')).toBeTruthy();
  });

  it('should keep the control: the server refuses a source outside the list', () => {
    expect(isValidSource('popup')).toBe(false);
    expect(vi.isMockFunction(isValidSource)).toBe(false);
  });
});
