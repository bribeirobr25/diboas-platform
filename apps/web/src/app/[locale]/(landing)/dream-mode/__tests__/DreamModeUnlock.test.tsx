/**
 * @vitest-environment happy-dom
 *
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 4: a modal signup unlocks Dream Mode, once the modal has
 * closed (plan P11, D5).
 *
 * Accepting the modal's signups was not enough: Dream Mode's gate read only the stored
 * email, which the modal never writes, so a reader who signed up stayed locked out. And
 * unlocking UNDER the open modal would mount Dream Mode's own full-screen dialog beneath it
 * (its focus trap takes the keyboard; the scroll locks fight). This renders the real gate and
 * the real provider; the modal and the experience are stand-ins (the experience keeps the
 * real one's body-scroll lock, `PreDream.tsx`).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WaitlistSource } from '@/lib/waitingList/store/types';
import { useWaitlistModalForm } from '@/components/WaitingList/hooks/useWaitlistModalForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@diboas/ui', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('@/lib/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async () => ({
    ok: true,
    json: async () => ({ success: true, position: 7 }),
  })),
}));

function StandInModal({
  isOpen,
  onClose,
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
    <div role="dialog">
      <form onSubmit={handleSubmit}>
        <input aria-label="email" name="email" onChange={handleInputChange} />
        <input
          aria-label="consent"
          name="gdprAccepted"
          type="checkbox"
          onChange={handleInputChange}
        />
        <button type="submit">Join</button>
      </form>
      {isSuccess ? <p>stored</p> : null}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function StandInDreamExperience() {
  /* The real experience's body-scroll lock (`PreDream.tsx`), kept as written. */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);
  return <p>dream experience</p>;
}

vi.mock('next/dynamic', () => ({
  default: (loader: () => unknown) =>
    String(loader).includes('PreDream') ? StandInDreamExperience : StandInModal,
}));

import { WaitingListProvider } from '@/components/WaitingList/WaitingListProvider';
import { DreamModePageContent } from '../DreamModePageContent';

async function signUpThroughTheGate() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'dreamMode.gate.cta' }));
  });
  fireEvent.change(screen.getByLabelText('email'), {
    target: { name: 'email', value: 'reader@example.com' },
  });
  fireEvent.click(screen.getByLabelText('consent'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
  });
}

describe('5.979 · Dream Mode after a modal signup', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.overflow = '';
  });

  it('should stay gated when the reader has not signed up', async () => {
    await act(async () => {
      render(
        <WaitingListProvider>
          <DreamModePageContent locale="en" />
        </WaitingListProvider>
      );
    });
    expect(screen.getByText('dreamMode.gate.title')).toBeTruthy();
    expect(screen.queryByText('dream experience')).toBeNull();
  });

  it('should stay gated while the modal shows the stored signup, then unlock once it closes', async () => {
    await act(async () => {
      render(
        <WaitingListProvider>
          <DreamModePageContent locale="en" />
        </WaitingListProvider>
      );
    });
    await signUpThroughTheGate();
    /* Stored, modal still open: the experience must not mount under it. */
    expect(screen.getByText('stored')).toBeTruthy();
    expect(screen.queryByText('dream experience')).toBeNull();
    expect(screen.getByText('dreamMode.gate.title')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    });
    expect(screen.getByText('dream experience')).toBeTruthy();
    expect(screen.queryByText('dreamMode.gate.title')).toBeNull();
  });

  it('should leave the page scrollable after the unlocked experience goes away', async () => {
    let unmount = () => {};
    await act(async () => {
      ({ unmount } = render(
        <WaitingListProvider>
          <DreamModePageContent locale="en" />
        </WaitingListProvider>
      ));
    });
    await signUpThroughTheGate();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    });
    expect(document.body.style.overflow).toBe('hidden'); // the experience's own lock
    act(() => unmount());
    expect(document.body.style.overflow).toBe('');
  });

  it('should write nothing to storage when it unlocks (no new personal data kept)', async () => {
    await act(async () => {
      render(
        <WaitingListProvider>
          <DreamModePageContent locale="en" />
        </WaitingListProvider>
      );
    });
    await signUpThroughTheGate();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    });
    expect(localStorage.length).toBe(0);
  });
});
