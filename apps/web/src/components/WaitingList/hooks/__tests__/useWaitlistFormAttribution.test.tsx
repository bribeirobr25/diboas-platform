/**
 * ATTR-2 · the waitlist hook sends the stored signup-source label, keeps it after a failed
 * attempt, clears it on success or "already registered", and the Money Jobs gate never reads
 * it (market clean-up W-C, founder decision H).
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));
const consent = vi.hoisted(() => ({ given: true }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));
vi.mock('@/lib/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { useWaitlistForm } from '../useWaitlistForm';

const KEY = 'diboas-cta-source';
const respond = (ok: boolean, body: Record<string, unknown>) =>
  vi.mocked(fetchWithRetry).mockResolvedValueOnce({
    ok,
    json: async () => body,
  } as unknown as Response);

async function submit(readCtaSource?: boolean) {
  const onSuccess = vi.fn();
  const { result } = renderHook(() =>
    useWaitlistForm({ compact: true, onSuccess, t: (k) => k, readCtaSource })
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
  return call ? (JSON.parse((call[1] as RequestInit).body as string) as { tags?: string[] }) : null;
}

beforeEach(() => {
  vi.mocked(fetchWithRetry).mockReset();
  sessionStorage.clear();
  sessionStorage.setItem(KEY, 'market');
  consent.given = true;
});

describe('ATTR-2: the waitlist hook and the signup-source label', () => {
  it('should send the label as a tag and keep it when the attempt fails', async () => {
    respond(false, { errorCode: 'INTERNAL_ERROR' });
    const body = await submit();
    expect(body?.tags).toContain('cta_source:market');
    expect(sessionStorage.getItem(KEY)).toBe('market');
  });

  it('should keep the label when the request throws (network error)', async () => {
    vi.mocked(fetchWithRetry).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const body = await submit();
    expect(body?.tags).toContain('cta_source:market');
    expect(sessionStorage.getItem(KEY)).toBe('market');
  });

  it('should clear a label it could not send (consent gone) when the signup succeeds', async () => {
    consent.given = false;
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit();
    expect(body?.tags ?? []).not.toContain('cta_source:market');
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('should clear the label when the signup succeeds', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    await submit();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('should clear the label when the address is already registered', async () => {
    respond(false, { errorCode: 'ALREADY_REGISTERED', position: 1, referralCode: 'R' });
    await submit();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('should neither send nor clear the label when the Money Jobs gate submits', async () => {
    respond(true, { position: 1, referralCode: 'R', referralUrl: 'u' });
    const body = await submit(false);
    expect(body?.tags ?? []).not.toContain('cta_source:market');
    expect(sessionStorage.getItem(KEY)).toBe('market');
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
    // The options object passed to useWaitlistForm, wherever the key sits in it.
    const call = src.slice(
      src.indexOf('useWaitlistForm({'),
      src.indexOf('onSuccess:', src.indexOf('useWaitlistForm({'))
    );
    expect(call).toMatch(/\breadCtaSource: false\b/);
    expect(src.match(/useWaitlistForm\(\{/g)).toHaveLength(1);
  });
});
