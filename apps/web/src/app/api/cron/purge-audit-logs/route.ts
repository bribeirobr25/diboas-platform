/**
 * Audit-log retention cron — §5.39.
 *
 * Deletes `audit_logs` rows older than AUDIT_LOG_RETENTION_DAYS (90), enforcing
 * GDPR storage-limitation on the raw-IP audit trail. Scheduled via the `crons`
 * entry in vercel.json (Vercel invokes it with `Authorization: Bearer
 * ${CRON_SECRET}` on the production deployment only).
 *
 * Security:
 *   - Inert until configured: if CRON_SECRET is unset → 503 (it can NEVER run
 *     an unauthenticated purge).
 *   - Constant-time-ish bearer check against CRON_SECRET.
 *   - No request body, no PII in the response.
 *
 * Usage (manual): GET /api/cron/purge-audit-logs  with header
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredAuditLogs, AUDIT_LOG_RETENTION_DAYS } from '@/lib/audit/AuditService';
import { Logger } from '@/lib/monitoring/Logger';

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' } as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  // Inert until configured — never run an unauthenticated purge.
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'not_configured' },
      { status: 503, headers: NO_STORE }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }

  try {
    const deleted = await purgeExpiredAuditLogs();
    return NextResponse.json(
      { ok: true, deleted, retentionDays: AUDIT_LOG_RETENTION_DAYS },
      { status: 200, headers: NO_STORE }
    );
  } catch (error) {
    Logger.error(
      '[cron/purge-audit-logs] purge failed',
      {},
      error instanceof Error ? error : undefined
    );
    return NextResponse.json({ error: 'purge_failed' }, { status: 500, headers: NO_STORE });
  }
}
