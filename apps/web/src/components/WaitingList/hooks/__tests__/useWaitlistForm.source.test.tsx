/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1: the landing form sends exactly the source it was given,
 * and only a source the route accepts (plan P11, D3). The modal's source has its own guards;
 * this covers the other client poster.
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { isValidSource } from '@/lib/api/validators';
import { WAITLIST_SOURCES, type WaitlistSource } from '@/lib/waitingList/store/types';

vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { useWaitlistForm } from '../useWaitlistForm';

async function postedBody(source?: WaitlistSource) {
  vi.mocked(fetchWithRetry).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ position: 1, referralCode: 'R', referralUrl: 'u' }),
  } as unknown as Response);
  const { result } = renderHook(() =>
    useWaitlistForm({ compact: true, source, onSuccess: vi.fn(), t: (k) => k })
  );
  act(() => {
    result.current.handleInputChange({
      target: { name: 'email', value: 'ana@example.com', type: 'email', checked: false },
    } as React.ChangeEvent<HTMLInputElement>);
  });
  await act(async () => {
    await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  });
  const call = vi.mocked(fetchWithRetry).mock.calls.at(-1);
  return JSON.parse((call![1] as RequestInit).body as string) as Record<string, unknown>;
}

describe('5.979 · the landing form posts only an accepted source', () => {
  beforeEach(() => {
    vi.mocked(fetchWithRetry).mockReset();
    sessionStorage.clear();
  });

  it.each([...WAITLIST_SOURCES])('should post %s, unchanged, when given it', async (source) => {
    const body = await postedBody(source);
    expect(body.source).toBe(source);
    expect(isValidSource(body.source)).toBe(true);
  });

  it('should send no source when given none (the route then records the path itself)', async () => {
    const body = await postedBody(undefined);
    expect('source' in body).toBe(false);
  });
});
