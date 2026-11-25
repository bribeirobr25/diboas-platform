/**
 * WITHDRAW-1 (the reopened banner) · "Cookie settings" reopens the choice (market clean-up W-D1,
 * D6 + F2, D2; spec §3.8). Rendered with the real event bus and consent utilities.
 *
 * - The reopened banner is a modal dialog focused itself (no button first), not announced twice.
 * - The choice in force is marked `aria-current="true"` with a check icon: a current-version
 *   choice, or an older decline; an older accept is marked on neither button.
 * - Pressing the current current-version choice only closes (nothing saved or sent); any other
 *   press is a full save under the current version.
 * - Escape closes it unchanged; focus returns to the control that opened it.
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

import { CookieConsent } from '../CookieConsent';
import { CookieSettingsButton } from '../CookieSettingsButton';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

const KEY = COOKIE_CONFIG.consentLocalStorageKey;
const CURRENT = COOKIE_CONFIG.consentVersion;
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
const store = (analytics: boolean, version: string = CURRENT) =>
  window.localStorage.setItem(KEY, JSON.stringify({ analytics, version, timestamp: 1 }));

let fetchSpy: ReturnType<typeof vi.fn>;
let emitted: string[];
let unsubscribe: Array<() => void>;

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  fetchSpy = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  vi.stubGlobal('fetch', fetchSpy);
  emitted = [];
  unsubscribe = [ApplicationEventType.CONSENT_GIVEN, ApplicationEventType.CONSENT_WITHDRAWN].map(
    (type) =>
      applicationEventBus.on(type, () => {
        emitted.push(type);
      })
  );
});
afterEach(() => {
  unsubscribe.forEach((u) => u());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openFromSettings() {
  const view = render(
    <>
      <CookieConsent />
      <CookieSettingsButton />
    </>
  );
  await act(async () => {});
  const control = screen.getByText('common.cookieConsent.settings');
  control.focus();
  await act(async () => {
    fireEvent.click(control);
  });
  return { ...view, control };
}
const button = (name: 'accept' | 'decline') =>
  screen.getByText(`common.cookieConsent.${name}`).closest('button')!;

describe('WITHDRAW-1: the reopened banner', () => {
  it('should open as a focused modal dialog, not a live region', async () => {
    store(true);
    await openFromSettings();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.hasAttribute('aria-live')).toBe(false);
    expect(dialog.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(dialog);
  });

  it('should mark a current-version accept as current, with its icon', async () => {
    store(true);
    await openFromSettings();
    expect(button('accept').getAttribute('aria-current')).toBe('true');
    expect(button('accept').querySelector('svg')).not.toBeNull();
    expect(button('decline').hasAttribute('aria-current')).toBe(false);
    expect(button('decline').querySelector('svg')).toBeNull();
  });

  it('should mark an older decline as current, and an older accept on neither button', async () => {
    store(false, '0.9');
    const first = await openFromSettings();
    expect(button('decline').getAttribute('aria-current')).toBe('true');
    first.unmount();
    store(true, '0.9');
    await openFromSettings();
    expect(button('accept').hasAttribute('aria-current')).toBe(false);
    expect(button('decline').hasAttribute('aria-current')).toBe(false);
  });

  it('should only close when the current current-version choice is pressed again', async () => {
    store(true);
    await openFromSettings();
    const before = window.localStorage.getItem(KEY);
    await act(async () => {
      fireEvent.click(button('accept'));
    });
    expect(window.localStorage.getItem(KEY)).toBe(before);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('should save, post and emit a change of choice', async () => {
    store(true);
    await openFromSettings();
    await act(async () => {
      fireEvent.click(button('decline'));
    });
    expect(stored()).toMatchObject({ analytics: false, version: CURRENT });
    expect(fetchSpy).toHaveBeenCalled();
    expect(emitted).toContain(ApplicationEventType.CONSENT_WITHDRAWN);
  });

  it('should save an older decline again under the current version when it is re-pressed', async () => {
    store(false, '0.9');
    await openFromSettings();
    await act(async () => {
      fireEvent.click(button('decline'));
    });
    expect(stored()).toMatchObject({ analytics: false, version: CURRENT });
    expect(emitted).toContain(ApplicationEventType.CONSENT_WITHDRAWN);
  });

  it('should close on Escape with the choice unchanged and return focus to the control', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    store(true);
    const { control } = await openFromSettings();
    const before = window.localStorage.getItem(KEY);
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(window.localStorage.getItem(KEY)).toBe(before);
    expect(emitted).toEqual([]);
    expect(document.activeElement).toBe(control);
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    vi.useRealTimers();
  });

  it('should return focus to the control in the event, not to whatever had focus (Safari click)', async () => {
    store(true);
    render(
      <>
        <CookieConsent />
        <CookieSettingsButton />
        <CookieSettingsButton />
      </>
    );
    await act(async () => {});
    const [, second] = screen.getAllByText('common.cookieConsent.settings');
    (document.activeElement as HTMLElement | null)?.blur();
    await act(async () => {
      fireEvent.click(second);
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(document.activeElement).toBe(second);
  });

  it('should send Shift+Tab from the dialog to its last control', async () => {
    store(true);
    await openFromSettings();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(button('accept'));
  });
});
