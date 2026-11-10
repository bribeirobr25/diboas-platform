/**
 * Sentry tunnel — /api/monitoring (Phase 5.1.b; F9 rate limit).
 *
 * Pins the SECURE outcomes: the tunnel forwards ONLY to a Sentry ingestion
 * host over https, to a numeric project path it builds itself (no
 * attacker-chosen host, port, scheme or path); oversized bodies and floods are
 * refused before any upstream call; and with Sentry unconfigured it does
 * nothing at all. No test touches the network: `fetch` is stubbed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const checkMonitoringTunnelRateLimit = vi.fn();
vi.mock('@/lib/security/rateLimiter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security/rateLimiter')>();
  return {
    ...actual, // real getClientIP + createRateLimitHeaders
    checkMonitoringTunnelRateLimit: (...args: unknown[]) => checkMonitoringTunnelRateLimit(...args),
  };
});

import { POST } from '../route';

const URL_ = 'https://diboas.com/api/monitoring';
const MAX = 1024 * 1024;
const VALID_DSN = 'https://publickey@o123.ingest.sentry.io/4507';
const envelope = (header: unknown) =>
  `${typeof header === 'string' ? header : JSON.stringify(header)}\n{"type":"event"}\n{}`;
const tunnel = (body: string, headers: Record<string, string> = {}) =>
  new Request(URL_, { method: 'POST', body, headers });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_DSN);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock
    .mockReset()
    .mockResolvedValue(
      new Response('{"id":"abc"}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
  checkMonitoringTunnelRateLimit
    .mockReset()
    .mockResolvedValue({ success: true, limit: 1000, remaining: 999, reset: 0 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('POST /api/monitoring — gating', () => {
  it('should return 204 and forward nothing when Sentry is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    const res = await POST(tunnel(envelope({ dsn: VALID_DSN })));
    expect(res.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(checkMonitoringTunnelRateLimit).not.toHaveBeenCalled();
  });

  it('should return 429 with Retry-After and forward nothing when the client IP is rate limited', async () => {
    const reset = Math.floor(Date.now() / 1000) + 60;
    checkMonitoringTunnelRateLimit.mockResolvedValue({
      success: false,
      limit: 1000,
      remaining: 0,
      reset,
    });
    const res = await POST(
      tunnel(envelope({ dsn: VALID_DSN }), { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(checkMonitoringTunnelRateLimit).toHaveBeenCalledWith('203.0.113.7');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/monitoring — body bounds', () => {
  it('should return 413 without reading the body when the declared length exceeds 1 MB', async () => {
    const text = vi.fn();
    const req = {
      headers: new Headers({ 'content-length': String(MAX + 1) }),
      text,
    } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'payload_too_large' });
    expect(text).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return 413 when the actual body exceeds 1 MB without a declared length', async () => {
    const big = envelope({ dsn: VALID_DSN }) + 'x'.repeat(MAX);
    const req = { headers: new Headers(), text: async () => big } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return 400 when the body cannot be read', async () => {
    const req = {
      headers: new Headers(),
      text: () => Promise.reject(new Error('stream aborted')),
    } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/monitoring — envelope and DSN validation', () => {
  it.each([
    ['the header line is not JSON', envelope('not json'), 'invalid_envelope'],
    ['the header has no dsn', envelope({ event_id: '1' }), 'missing_dsn'],
    /* twelfth audit: `null` parsed fine and then threw on `header.dsn` (a 500). */
    ['the header line is JSON null', envelope('null'), 'invalid_envelope'],
    ['the header line is a number', envelope('42'), 'invalid_envelope'],
    ['the header line is an array', envelope('[]'), 'invalid_envelope'],
    ['the dsn is not a string', envelope({ dsn: 42 }), 'missing_dsn'],
    ['the dsn is not a URL', envelope({ dsn: 'not a url' }), 'invalid_dsn'],
  ])('should return 400 and forward nothing when %s', async (_label, body, error) => {
    const res = await POST(tunnel(body));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://k@evil.example/4507',
    'https://k@o123.ingest.sentry.io.evil.example/4507',
    'https://k@evil.example/?.ingest.sentry.io/4507',
    'https://k@evilsentry.io/4507',
    'https://k@notingest.sentry.io/4507',
    'https://k@a.b.ingest.sentry.io/4507',
    'https://k@o123.ingest.sentry.com/4507',
    'https://k@127.0.0.1/4507',
    'https://k@localhost/4507',
  ])('should return 403 and forward nothing when the dsn host is %s', async (dsn) => {
    const res = await POST(tunnel(envelope({ dsn })));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden_host' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://k@o123.ingest.sentry.io/abc',
    'https://k@o123.ingest.sentry.io/4507/extra',
    'https://k@o123.ingest.sentry.io/',
    'https://k@o123.ingest.sentry.io/../../api/0/organizations',
  ])('should return 400 and forward nothing when the project path is %s', async (dsn) => {
    const res = await POST(tunnel(envelope({ dsn })));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_project_id' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/monitoring — forwarding', () => {
  it.each([
    ['https://k@o123.ingest.sentry.io/4507', 'https://o123.ingest.sentry.io/api/4507/envelope/'],
    ['https://k@o1.ingest.de.sentry.io/9', 'https://o1.ingest.de.sentry.io/api/9/envelope/'],
    ['https://k@o1.ingest.us.sentry.io/9', 'https://o1.ingest.us.sentry.io/api/9/envelope/'],
    ['https://k@ingest.sentry.io/9', 'https://ingest.sentry.io/api/9/envelope/'],
    ['https://k@sentry.io/9', 'https://sentry.io/api/9/envelope/'],
    // Scheme, port and credentials from the DSN never reach the upstream URL.
    [
      'http://k@o123.ingest.sentry.io:8080/4507',
      'https://o123.ingest.sentry.io/api/4507/envelope/',
    ],
  ])('should forward the envelope verbatim when the dsn is %s', async (dsn, upstream) => {
    const body = envelope({ dsn });
    const res = await POST(tunnel(body));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'abc' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
    });
  });

  it('should pass the upstream status through and default the content type when upstream sends none', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));
    const res = await POST(tunnel(envelope({ dsn: VALID_DSN })));
    expect(res.status).toBe(429);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('should return 502 without the network detail when the upstream is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('getaddrinfo ENOTFOUND internal-host'));
    const res = await POST(tunnel(envelope({ dsn: VALID_DSN })));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ error: 'upstream_unreachable' });
    expect(JSON.stringify(body)).not.toContain('internal-host');
  });
});
