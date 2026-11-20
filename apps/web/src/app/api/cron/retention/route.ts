/**
 * The daily retention job (plan P14, E1; registers `5.863`, `5.825`, `5.39`).
 *
 * Runs every purge in `lib/retention` (audit logs at 90 days, email delivery rows at 3 years,
 * their orphans, legacy error text, expired deletion links and idempotency rows). Scheduled by
 * the `crons` entry in apps/web/vercel.json, the project's Root Directory (5.816). Vercel invokes
 * it with `Authorization: Bearer ${CRON_SECRET}` on the production deployment only.
 *
 * Security:
 *   - Inert until configured: if CRON_SECRET is unset → 503 (it can NEVER run unauthenticated).
 *   - Timing-safe bearer check (crypto.timingSafeEqual, length-guarded).
 *   - No request body; the response names each purge and its count, never an identity.
 * A failed purge or a tripped brake answers 500 (the other purges still ran) and logs
 * `Logger.error`, which reaches Sentry; production strips info logs, so the counts are here.
 *
 * Usage (manual): GET /api/cron/retention  with header  Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runRetention } from '@/lib/retention';
import { Logger } from '@/lib/monitoring/Logger';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' } as const;

/** Constant-time compare; length mismatch is a non-match, not a timing signal. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  // Inert until configured — never run an unauthenticated purge.
  if (!cronSecret) {
    // The cron would fail every day without a trace (fourteenth audit, 5.892).
    Logger.error('[cron/retention] CRON_SECRET is not set; the job cannot run', {});
    return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: NO_STORE });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (!safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const run = await runRetention();
  return NextResponse.json(
    { ok: run.ok, purges: run.purges },
    { status: run.ok ? 200 : 500, headers: NO_STORE }
  );
}
