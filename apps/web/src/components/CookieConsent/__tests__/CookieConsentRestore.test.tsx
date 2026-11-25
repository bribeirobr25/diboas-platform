/**
 * CONSENT-RESTORE-1 · a restored choice keeps the version it was given under (market clean-up
 * W-D1, spec §3.9).
 *
 * Before W-D1, a choice read back from the readable cookie or `/api/consent` was re-stamped with
 * the CURRENT banner version, so after a version bump an old Accept would have passed silently.
 * The rule for both paths now: a current-version choice stands; an older DECLINE stands; an older
 * ACCEPT is asked again, and analytics stays off until it is answered. Rendered with the real
 * event bus and the real consent utilities; only the network, the text and the locale are stubbed.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { COOKIE_CONFIG } from '@/config/env';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));

const KEY = COOKIE_CONFIG.consentLocalStorageKey;
const CURRENT = COOKIE_CONFIG.consentVersion;
const OLDER = '0.9';
const SHADOW = `${COOKIE_CONFIG.consentCookieName}_js`;

const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
const setShadowCookie = (value: unknown) => {
  document.cookie = `${SHADOW}=${encodeURIComponent(JSON.stringify(value))}; path=/`;
};
const apiAnswers = (consent: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ consent }) }))
  );

/** A fresh module graph per case: `checkConsentFromApiOnce` caches its answer per page. */
async function renderBanner() {
  vi.resetModules();
  const { CookieConsent } = await import('../CookieConsent');
  const utils = await import('../consentUtils');
  render(<CookieConsent />);
  return utils;
}

/** Lets the effect's async check finish (the banner's own first-visit delay is 1.5 s). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('CONSENT-RESTORE-1: a restored choice keeps its version', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = `${SHADOW}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    apiAnswers(null);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('should stay silent for a same-version choice in local storage', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: true, version: CURRENT, timestamp: 1 })
    );
    await renderBanner();
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should keep an older decline without asking again', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: false, version: OLDER, timestamp: 1 })
    );
    await renderBanner();
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stored()).toMatchObject({ analytics: false, version: OLDER });
  });

  it('should ask again for an older accept, and keep analytics off meanwhile', async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: true, version: OLDER, timestamp: 1 })
    );
    const { hasAnalyticsConsent } = await renderBanner();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('should restore the readable cookie with its own version, never the current one', async () => {
    setShadowCookie({ analytics: true, version: OLDER });
    const { hasAnalyticsConsent } = await renderBanner();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(stored()).toMatchObject({ analytics: true, version: OLDER });
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('should restore a same-version cookie silently', async () => {
    setShadowCookie({ analytics: true, version: CURRENT });
    const { hasAnalyticsConsent } = await renderBanner();
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stored()).toMatchObject({ analytics: true, version: CURRENT });
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('should restore an older decline from the API without asking again', async () => {
    apiAnswers({ analytics: false, version: OLDER });
    await renderBanner();
    await waitFor(() => expect(stored()).toMatchObject({ analytics: false, version: OLDER }));
    await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should ask again for an older accept restored from the API', async () => {
    apiAnswers({ analytics: true, version: OLDER });
    await renderBanner();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(stored()).toMatchObject({ analytics: true, version: OLDER });
  });

  it('should treat a restored choice with no version as older', async () => {
    apiAnswers({ analytics: true });
    await renderBanner();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(stored().version).not.toBe(CURRENT);
  });
});
