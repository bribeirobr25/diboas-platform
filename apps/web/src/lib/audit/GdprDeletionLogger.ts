import { sql } from '@/lib/database';
import { Logger } from '@/lib/monitoring/Logger';

export async function logGdprDeletion(params: {
  entityType: string;
  entityId?: string;
  deletedBy: string;
  reason: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO gdpr_deletion_logs (
        entity_type,
        entity_id,
        deleted_by,
        reason,
        correlation_id,
        metadata
      ) VALUES (
        ${params.entityType},
        ${params.entityId ?? null},
        ${params.deletedBy},
        ${params.reason},
        ${params.correlationId ?? null},
        ${params.metadata ? JSON.stringify(params.metadata) : null}
      )
    `;
  } catch (error) {
    Logger.error('[GdprDeletionLogger] Failed to log deletion', { entityType: params.entityType }, error instanceof Error ? error : undefined);
  }
}
