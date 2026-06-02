/**
 * Sentry Tunnel Route — proxy Sentry SDK events to bypass ad-blockers.
 *
 * Phase 5.1.b (audit/2026-05-09): manual handler. Under Turbopack the Sentry
 * webpack plugin does NOT auto-generate this route, so configuring
 * `tunnelRoute: '/api/monitoring'` in `next.config.js` alone leaves the path
 * unresolved (404). The SDK still POSTs there; we forward to Sentry's
 * ingestion endpoint server-side.
 *
 * The middleware matcher at `apps/web/middleware.ts:114` already excludes
 * `/api/...`, so this path bypasses the locale-prefix redirect that broke
 * the previous `/monitoring` config.
 *
 * Reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/#configure-tunneling-to-avoid-ad-blockers
 *
 * Security:
 *   - Only forwards to host `*.ingest(.<region>)?.sentry.io` (validated from
 *     envelope DSN via regex)
 *   - Method-restricted to POST (Next.js app-router only invokes the
 *     exported handler; GET/PUT/DELETE 405 automatically)
 *   - Body size capped at 1 MB (Sentry envelopes are typically <100 KB; a
 *     real-world replay envelope tops out around 500 KB. The cap protects
 *     against memory-exhaustion attacks since req.text() buffers fully.)
 *   - Returns upstream status verbatim
 *   - **Permissive per-IP rate limit (F9, 2026-06-02): 1000/min** via
 *     `checkMonitoringTunnelRateLimit` — high enough never to block legitimate
 *     Sentry bursts (~40× the SDK's ~25/min/session rate), low enough to cap a
 *     single-source billing-amplification flood. Returns 429 + `Retry-After`
 *     so the SDK's offline buffer re-delivers later.
 *   - **Deliberately skips `applyCsrf`**: the Sentry SDK posts on every
 *     error/replay-segment without a CSRF token. Defense in depth is the
 *     body-size cap + DSN host validation + the per-IP rate limit above.
 *
 * No-op if `NEXT_PUBLIC_SENTRY_DSN` is unset (returns 204) — keeps local /
 * stub-env builds quiet without 404 noise in browser consoles.
 */

import { NextResponse } from 'next/server';
import {
  checkMonitoringTunnelRateLimit,
  getClientIP,
  createRateLimitHeaders,
} from '@/lib/security/rateLimiter';

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export async function POST(req: Request): Promise<Response> {
  // Quick-exit if Sentry isn't configured for this environment.
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return new NextResponse(null, { status: 204 });
  }

  // F9 (Bar R2 exception, 2026-06-02): permissive per-IP rate limit, checked
  // before the envelope parse for the cheapest exit on an amplification flood.
  // Fail-closed in production (handled inside the limiter); 429 + Retry-After
  // lets the Sentry SDK's offline buffer re-deliver rather than drop telemetry.
  const monitoringRateLimit = await checkMonitoringTunnelRateLimit(getClientIP(req));
  if (!monitoringRateLimit.success) {
    const headers = createRateLimitHeaders(monitoringRateLimit);
    headers.set('Content-Type', 'application/json');
    return new NextResponse(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  // Reject oversized bodies up front (Content-Length isn't trusted by itself
  // because chunked transfer-encoding can hide it; we re-check after read).
  const declaredLen = Number(req.headers.get('content-length') ?? 0);
  if (declaredLen > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let envelope: string;
  try {
    envelope = await req.text();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (envelope.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  // The first line of a Sentry envelope is a JSON header that includes the
  // `dsn` the SDK was initialized with. We extract it to derive the upstream
  // ingestion URL (host + project ID) and validate it points at Sentry.
  const headerLine = envelope.split('\n', 1)[0];
  let header: { dsn?: string };
  try {
    header = JSON.parse(headerLine);
  } catch {
    return NextResponse.json({ error: 'invalid_envelope' }, { status: 400 });
  }
  if (!header.dsn) {
    return NextResponse.json({ error: 'missing_dsn' }, { status: 400 });
  }

  let dsnUrl: URL;
  try {
    dsnUrl = new URL(header.dsn);
  } catch {
    return NextResponse.json({ error: 'invalid_dsn' }, { status: 400 });
  }

  // Defense in depth: only forward to Sentry ingestion. Sentry has multiple
  // regional endpoints (US `*.ingest.sentry.io`, EU `*.ingest.de.sentry.io`,
  // newer `*.ingest.us.sentry.io`, plus the bare `sentry.io`). The match
  // checks that the host is some `*.sentry.io` ingestion subdomain.
  const host = dsnUrl.hostname;
  const isSentryIngestion =
    /^([a-z0-9-]+\.)?ingest(\.[a-z]{2})?\.sentry\.io$/i.test(host) || host === 'sentry.io';
  if (!isSentryIngestion) {
    return NextResponse.json({ error: 'forbidden_host' }, { status: 403 });
  }

  const projectId = dsnUrl.pathname.replace(/^\//, '');
  if (!/^\d+$/.test(projectId)) {
    return NextResponse.json({ error: 'invalid_project_id' }, { status: 400 });
  }

  const upstream = `https://${dsnUrl.hostname}/api/${projectId}/envelope/`;

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: envelope,
    });
    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: { 'Content-Type': upstreamRes.headers.get('Content-Type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
}
