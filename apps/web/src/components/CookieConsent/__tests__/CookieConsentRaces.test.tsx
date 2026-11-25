/**
 * WITHDRAW-1 (the reopened banner's races) · a choice made in the reopened banner stands
 * (market clean-up W-D1 five-agent audit). Two races the reopen path opened:
 *
 * - The `/api/consent` restore was still in flight when the person answered the reopened banner:
 *   its answer arrived later and wrote the older choice back over theirs.
 * - The first-visit timers (1.5 s, then 100 ms) were still pending when the person opened
 *   "Cookie settings" and answered: the banner came back as the first-visit banner.
 *
 * @vitest-environment happy-dom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_CONFIG } from '@/config/env';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));

const api = vi.hoisted(() => ({
  resolve: (_value: { analytics: boolean; version: string } | null) => {},
}));
vi.mock('../consentUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../consentUtils')>()),
  checkConsentFromApiOnce: () =>
    new Promise<{ analytics: boolean; version: string } | null>((resolve) => {
      api.resolve = resolve;
    }),
}));

import { CookieConsent } from '../CookieConsent';
import { CookieSettingsButton } from '../CookieSettingsButton';

const KEY = COOKIE_CONFIG.consentLocalStorageKey;
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
const button = (name: 'accept' | 'decline') =>
  screen.getByText(`common.cookieConsent.${name}`).closest('button')!;

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }))
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mount() {
  render(
    <>
      <CookieConsent />
      <CookieSettingsButton />
    </>
  );
}
const openSettings = () =>
  act(async () => {
    fireEvent.click(screen.getByText('common.cookieConsent.settings'));
  });

describe('WITHDRAW-1: a choice in the reopened banner stands', () => {
  it('should never let a late /api/consent restore overwrite a decline made meanwhile', async () => {
    mount();
    await openSettings();
    await act(async () => {
      fireEvent.click(button('decline'));
    });
    expect(stored().analytics).toBe(false);
    await act(async () => {
      api.resolve({ analytics: true, version: COOKIE_CONFIG.consentVersion });
    });
    expect(stored().analytics).toBe(false);
  });

  it('should cancel the first-visit timers when "Cookie settings" opens the banner', async () => {
    vi.useFakeTimers();
    mount();
    await act(async () => {
      api.resolve(null);
    });
    await openSettings();
    await act(async () => {
      fireEvent.click(button('accept'));
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stored().analytics).toBe(true);
  });
});
