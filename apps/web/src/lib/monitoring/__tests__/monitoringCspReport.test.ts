/**
 * UTM-SHAPE-1 (CSP-report half) · the monitoring service's CSP-violation report sends scrubbed
 * addresses (market clean-up W-D1, spec §3.10).
 *
 * The report carried `documentURI` and `blockedURI` as the browser gave them, so a violation on
 * `/delete-confirm?token=` or a campaign link sent the token or the campaign values to the
 * monitoring endpoint. Both now pass through the DEFAULT scrubber (no campaign value, no token),
 * keeping the path. Production-configured service per case: NODE_ENV and the endpoint set before
 * a fresh import; its window listeners (and the error service's) removed afterwards.
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ENDPOINT = 'https://monitoring.example.test/ingest';

describe('UTM-SHAPE-1: the CSP-violation report is scrubbed', () => {
  let destroy: () => void = () => {};

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_MONITORING_ENDPOINT', ENDPOINT);
  });
  afterEach(() => {
    destroy();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('should send the page and the blocked address without token or campaign values', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const { monitoringService } = await import('../service');
    const { errorReportingService } = await import('@/lib/errors/ErrorReportingService');
    destroy = () => {
      monitoringService.destroy();
      errorReportingService.destroy();
    };

    const violation = Object.assign(new Event('securitypolicyviolation'), {
      documentURI: 'https://diboas.com/en/delete-confirm?token=SECRET&utm_source=mail',
      blockedURI: 'https://evil.example/x.js?utm_campaign=spring&t=SECRET2',
      violatedDirective: 'script-src',
      originalPolicy: "script-src 'self'",
    });
    window.dispatchEvent(violation);
    await monitoringService.flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe(ENDPOINT);
    const body = init.body;
    for (const secret of ['SECRET', 'SECRET2', 'utm_', 'token=', 't='])
      expect(body).not.toContain(secret);
    const [report] = JSON.parse(body).security;
    expect(report.url).toBe('https://diboas.com/en/delete-confirm');
    expect(report.metadata.blockedURI).toBe('https://evil.example/x.js');
    expect(report.type).toBe('csp_violation');
  });
});
