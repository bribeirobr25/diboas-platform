/**
 * AuditService — Inserts structured audit log events into the audit_logs table.
 *
 * Used to record security-relevant actions (waitlist signup, GDPR deletion,
 * consent changes, admin actions, etc.) for compliance and debugging.
 */

import { sql } from '@/lib/database';
import { Logger } from '@/lib/monitoring/Logger';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AuditEvent {
  /** Action category, e.g. "waitlist.signup", "gdpr.deletion.request" */
  eventType: string;
  /** Domain entity involved, e.g. "waitlist_entry", "user" */
  entityType: string;
  /** Primary key or identifier of the entity (nullable for bulk ops) */
  entityId?: string;
  /** Requester IP address (IPv4 or IPv6, max 45 chars) */
  actorIp?: string;
  /** Requester User-Agent header */
  actorUserAgent?: string;
  /** UUID correlation ID tying related events together */
  correlationId?: string;
  /** Arbitrary structured metadata */
  details?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  actor_ip: string | null;
  actor_user_agent: string | null;
  correlation_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

/**
 * Insert an audit event into the `audit_logs` table.
 *
 * Failures are logged but never thrown — audit logging must not break
 * the primary request path.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (
        event_type,
        entity_type,
        entity_id,
        actor_ip,
        actor_user_agent,
        correlation_id,
        details
      ) VALUES (
        ${event.eventType},
        ${event.entityType},
        ${event.entityId ?? null},
        ${event.actorIp ?? null},
        ${event.actorUserAgent ?? null},
        ${event.correlationId ?? null},
        ${event.details ? JSON.stringify(event.details) : null}
      )
    `;
  } catch (error) {
    Logger.error(
      '[AuditService] Failed to log audit event',
      { eventType: event.eventType, entityType: event.entityType },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Retention window for the audit trail. `audit_logs` stores raw `actor_ip`
 * under legitimate interest (security/forensics); GDPR storage-limitation
 * requires a bounded retention. Keep in lockstep with the COMMENT in
 * migrations/013_audit_logs_retention.sql. §5.39.
 */
export const AUDIT_LOG_RETENTION_DAYS = 90;

/**
 * Delete audit_logs rows older than the retention window. Safe to call
 * periodically (mirrors `dbCleanupIdempotencyCache`); invoked by the
 * `/api/cron/purge-audit-logs` Vercel cron. Returns the number of rows
 * deleted. Failures are logged, never thrown.
 */
export async function purgeExpiredAuditLogs(): Promise<number> {
  try {
    const rows = await sql`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - make_interval(days => ${AUDIT_LOG_RETENTION_DAYS})
      RETURNING id
    `;
    const deleted = rows.length;
    if (deleted > 0) {
      Logger.info('[AuditService] Purged expired audit logs', {
        deleted,
        retentionDays: AUDIT_LOG_RETENTION_DAYS,
      });
    }
    return deleted;
  } catch (error) {
    Logger.error(
      '[AuditService] Failed to purge expired audit logs',
      { retentionDays: AUDIT_LOG_RETENTION_DAYS },
      error instanceof Error ? error : undefined
    );
    return 0;
  }
}
