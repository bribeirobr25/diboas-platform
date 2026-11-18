/**
 * @vitest-environment happy-dom
 *
 * ⛑ `5.979` · WAITLIST-SOURCE-1: the REAL modal component passes its source and its
 * "joined" callback through to the form (plan P11, D1 and D5). The provider tests use a
 * stand-in modal; this renders the real one (only the network, analytics, the translation
 * hook, the image and the locale link are replaced), so a modal that hard-codes a source
 * or drops `onJoined` fails here, not only in the browser suite.
 */
import { act, fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WaitlistSource } from '@/lib/waitingList/store/types';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/UI/LocaleLink', () => ({
  LocaleLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));

const answer = vi.hoisted(() => ({ ok: true }));
const posted: Record<string, unknown>[] = [];
vi.mock('@/lib/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(async (_url: string, init: { body: string }) => {
    posted.push(JSON.parse(init.body) as Record<string, unknown>);
    return answer.ok
      ? { ok: true, json: async () => ({ success: true, position: 7 }) }
      : { ok: false, json: async () => ({ success: false, errorCode: 'INVALID_SOURCE' }) };
  }),
}));

import { WaitingListModal } from '../WaitingListModal';

async function submitThroughTheRealModal(source: WaitlistSource, onJoined: () => void) {
  const { container } = render(
    <WaitingListModal isOpen onClose={() => {}} source={source} onJoined={onJoined} />
  );
  const email = container.querySelector('input[name="email"]') as HTMLInputElement;
  const consent = container.querySelector('input[name="gdprAccepted"]') as HTMLInputElement;
  fireEvent.change(email, { target: { name: 'email', value: 'reader@example.com' } });
  fireEvent.click(consent);
  await act(async () => {
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
  });
}

describe("5.979 · the real modal posts its opener's source and reports a stored signup", () => {
  beforeEach(() => {
    posted.length = 0;
    answer.ok = true;
  });

  it.each(['dream_mode', 'app_link'] as const)(
    'should post %s and call onJoined once the signup is stored',
    async (source) => {
      const onJoined = vi.fn();
      await submitThroughTheRealModal(source, onJoined);
      expect(posted).toHaveLength(1);
      expect(posted[0]!.source).toBe(source);
      expect(onJoined).toHaveBeenCalledTimes(1);
    }
  );

  it('should not call onJoined when the server refuses the signup', async () => {
    answer.ok = false;
    const onJoined = vi.fn();
    await submitThroughTheRealModal('dream_mode', onJoined);
    expect(posted).toHaveLength(1);
    expect(onJoined).not.toHaveBeenCalled();
  });
});
