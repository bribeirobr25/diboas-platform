/**
 * ATTR-2 · the waitlist hook and the signup note (market clean-up W-C, decision H; rewritten by
 * W-D1: registers 5.923, 5.924, 5.996, 5.991; spec §3.1–§3.4).
 *
 * The held label and campaign values are sent ONLY with the note box ticked, with the box's text
 * and version; the label stays after a failed attempt (for the retry) and is cleared after a
 * success; the success event carries the label only under analytics consent; a refused request
 * (any 4xx) sends `waiting_list_submission_failure` with a bounded `errorCode`; the Money Jobs gate
 * never reads the label.
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ analyticsService: { track } }));
const consent = vi.hoisted(() => ({ given: true }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { captureUtmFromUrl, getNoteForSignup, setCtaSource } from '@/lib/analytics/utmAttribution';
import { SIGNUP_FAILURE_CODES, WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { useWaitlistForm } from '../useWaitlistForm';

const HOLD = Symbol.for('diboas.attributionHold');
const respond = (ok: boolean, body: Record<string, unknown>, status = ok ? 200 : 400) =>
  vi.mocked(fetchWithRetry).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  } as unknown as Response);

interface SentBody {
  tags?: string[];
  attributionConsent?: { text: string; version: number };
  gdprAccepted?: unknown;
}

async function submit({
  ticked = true,
  readCtaSource,
}: { ticked?: boolean; readCtaSource?: boolean } = {}) {
  const onSuccess = vi.fn();
  const { result } = renderHook(() => useWaitlistForm({ onSuccess, t: (k) => k, readCtaSource }));
  act(() => {
    result.current.handleInputChange({
      target: { name: 'email', value: 'ana@example.com', type: 'email', checked: false },
    } as React.ChangeEvent<HTMLInputElement>);
  });
  if (ticked) {
    act(() => {
      result.current.handleInputChange({
        target: { name: 'noteConsent', value: 'on', type: 'checkbox', checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
    });
  }
  await act(async () => {
    await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  });
  const call = vi.mocked(fetchWithRetry).mock.calls.at(-1);
  return call ? (JSON.parse((call[1] as RequestInit).body as string) as SentBody) : null;
}

const tracked = (name: string) =>
  track.mock.calls.map(([event]) => event).filter((event) => event.name === name);

beforeEach(() => {
  vi.mocked(fetchWithRetry).mockReset();
  track.mockReset();
  delete (globalThis as Record<symbol, unknown>)[HOLD];
  captureUtmFromUrl('https://diboas.com/en?utm_source=Newsletter');
  setCtaSource('market');
  consent.given = true;
});

describe('ATTR-2: the note goes only with the ticked box', () => {
  it('should send the note, the box text and its version when ticked', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit();
    expect(body?.tags).toEqual(['utm_source:newsletter', 'cta_source:market']);
    expect(body?.attributionConsent).toEqual({ text: 'note', version: 1 });
    expect(body?.gdprAccepted).toBe(true);
  });

  it('should send neither the note nor its consent field when unticked, even with analytics on', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit({ ticked: false });
    expect(body?.tags).toBeUndefined();
    expect(body?.attributionConsent).toBeUndefined();
    expect(body?.gdprAccepted).toBe(true);
  });

  it('should send the note whatever the analytics choice (the box is the consent)', async () => {
    consent.given = false;
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit();
    expect(body?.tags).toContain('cta_source:market');
  });

  it('should keep the label when the attempt is refused or the network fails, for the retry', async () => {
    respond(false, { errorCode: 'SERVER_ERROR' }, 500);
    expect((await submit())?.tags).toContain('cta_source:market');
    expect(getNoteForSignup().ctaLabel).toBe('market');
    vi.mocked(fetchWithRetry).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect((await submit())?.tags).toContain('cta_source:market');
    expect(getNoteForSignup().ctaLabel).toBe('market');
  });

  it('should clear the label after a success, so a later signup never resends it', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    await submit();
    expect(getNoteForSignup().ctaLabel).toBeNull();
    respond(true, { position: 2, referralCode: 'R', referralUrl: 'u' });
    expect((await submit())?.tags).toEqual(['utm_source:newsletter']);
  });

  it('should neither send nor clear the label when the Money Jobs gate submits', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit({ readCtaSource: false });
    expect(body?.tags).toEqual(['utm_source:newsletter']);
    expect(body?.attributionConsent).toEqual({ text: 'note-campaign', version: 1 });
    expect(getNoteForSignup().ctaLabel).toBe('market');
  });
});

describe('ATTR-2: what the analytics events carry', () => {
  it('should put the label on the success event only under analytics consent', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    await submit();
    expect(tracked(WAITING_LIST_EVENTS.SUBMISSION_SUCCESS)[0].parameters.cta_source).toBe('market');
    setCtaSource('market');
    consent.given = false;
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    await submit();
    expect(tracked(WAITING_LIST_EVENTS.SUBMISSION_SUCCESS)[1].parameters).not.toHaveProperty(
      'cta_source'
    );
  });

  it('should send a failure event with a bounded errorCode for every refused request (5.996, 5.991)', async () => {
    respond(false, { errorCode: 'RATE_LIMITED' }, 429);
    await submit();
    respond(false, { errorCode: 'something_new' }, 400);
    await submit();
    respond(false, {}, 403);
    await submit();
    const codes = tracked(WAITING_LIST_EVENTS.SUBMISSION_FAILURE).map(
      (e) => e.parameters.errorCode
    );
    expect(codes).toEqual(['RATE_LIMITED', 'OTHER', 'OTHER']);
    for (const code of codes) expect([...SIGNUP_FAILURE_CODES, 'OTHER']).toContain(code);
  });
});

describe('ATTR-2: the Money Jobs gate opts out', () => {
  it('should pass readCtaSource: false from the Money Jobs gate', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const src = readFileSync(
      join(__dirname, '../../../Sections/MoneyJobsCalculator/MoneyJobsGate.tsx'),
      'utf8'
    );
    const call = src.slice(
      src.indexOf('useWaitlistForm({'),
      src.indexOf('onSuccess:', src.indexOf('useWaitlistForm({'))
    );
    expect(call).toMatch(/\breadCtaSource: false\b/);
    expect(src.match(/useWaitlistForm\(\{/g)).toHaveLength(1);
  });
});
