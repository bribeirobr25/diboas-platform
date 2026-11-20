/**
 * `audit_logs`: rows older than 90 days (raw IPs under legitimate interest, GDPR storage
 * limitation, `5.39`). Moved unchanged from `AuditService` into the daily job (P14, E1).
 */
import { AUDIT_LOG_RETENTION_DAYS } from '@/lib/audit/AuditService';
import type { Purge } from './types';

export const auditLogsPurge: Purge = {
  name: 'auditLogs',
  async run(query) {
    const rows = await query`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - make_interval(days => ${AUDIT_LOG_RETENTION_DAYS})
      RETURNING id
    `;
    return { count: rows.length };
  },
};
