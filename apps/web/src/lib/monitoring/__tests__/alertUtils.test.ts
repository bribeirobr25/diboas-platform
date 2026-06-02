import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateActionUrl } from '../alertUtils';

/**
 * 5.30 (Bar R2 exception, 2026-06-02): generateActionUrl previously pointed at
 * `${baseUrl}/admin/monitoring/${type}` — a route that does not exist.
 *
 * It now links to the GENERIC Sentry / PostHog console roots. This is a
 * deliberate privacy decision: the function ships in a client JS chunk
 * (MonitoringInit dynamically imports AlertingService in the browser) and its
 * output is embedded in alert-email HTML, so the URL can be seen outside the
 * team — it must NOT carry internal project / dashboard IDs or query filters.
 * These tests lock that contract so a future change can't re-introduce a
 * precise (ID-bearing) URL into client-exposed code.
 */
describe('generateActionUrl (5.30 — generic, client-bundle-safe console links)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_ORG = 'diboas';
    process.env.NEXT_PUBLIC_SENTRY_PROJECT = 'web';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('routes error alerts to the generic Sentry org console', () => {
    expect(generateActionUrl('error', { errorName: 'TypeError' })).toBe('https://diboas.sentry.io/');
  });

  it('routes performance alerts to the generic Sentry org console', () => {
    expect(generateActionUrl('performance', { metric: 'LCP' })).toBe('https://diboas.sentry.io/');
  });

  it('routes business alerts to the generic PostHog console (ingest → console host)', () => {
    expect(generateActionUrl('business', { metric: 'signups' })).toBe('https://us.posthog.com/');
  });

  it('never leaks internal IDs/filters/params or the removed /admin/monitoring route', () => {
    for (const type of ['error', 'performance', 'business']) {
      // params are passed but must NOT appear in the (client-exposed) URL
      const url = generateActionUrl(type, { project: '4510647511810128', dashboard: '968991' });
      expect(url).not.toContain('/admin/monitoring');
      expect(url).not.toMatch(/project=|dashboard\/|statsPeriod|\/issues\/|\/traces\/|\d{6,}/);
    }
  });

  it('falls back to generic roots when env is unset (not the dead route)', () => {
    delete process.env.NEXT_PUBLIC_SENTRY_ORG;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    expect(generateActionUrl('error', {})).toBe('https://diboas.sentry.io/');
    expect(generateActionUrl('business', {})).toBe('https://us.posthog.com/');
  });
});
