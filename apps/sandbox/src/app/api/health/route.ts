/**
 * GET /api/health — liveness for external uptime monitoring (PENDING_ALL 5.64).
 *
 * Added when `app.diboas.com` went public (2026-08-22): nothing external pinged
 * it, so a 3am outage's first alert would have been a user. The founder's
 * uptime monitors (Sentry Uptime / UptimeRobot-class) point HERE rather than at
 * `/en`, because a page render can 200 from a CDN cache while the origin is
 * down — this route is always dynamic, so a 200 means the app is actually up.
 *
 * Deliberately LIVENESS ONLY, unlike the web app's readiness probe: this app's
 * ledger is client-side (localStorage) and its market providers fail open to
 * fixtures by design, so there is no dependency whose failure should page
 * anyone. A dependency check that cannot fail is decoration.
 *
 * `no-store` — a cached health response defeats the entire purpose.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json(
    { status: 'ok', app: 'sandbox', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
