/**
 * The daily retention job (plan P14, E1/E10′; register `5.863`, `5.825`).
 *
 * Runs every registered purge, each independently: one that throws, or whose brake trips, is
 * reported and the others still run. The result names each purge with its status and count,
 * never an identity. Production strips `Logger.info`, so the counts live in the route's
 * response; logs carry failures (`Logger.error`, which reaches Sentry) and a count-only
 * `Logger.warn` when the orphan sweep deletes a row.
 *
 * Only the cron route imports this runner (`index.test.ts` source scan).
 */
import { sql } from '@/lib/database/client';
import { Logger } from '@/lib/monitoring/Logger';
import { auditLogsPurge } from './auditLogs';
import { deletionTokensPurge } from './deletionTokens';
import { emailDeliveryLegacyTextPurge } from './emailDeliveryLegacyText';
import { emailDeliveryLogsPurge } from './emailDeliveryLogs';
import { emailDeliveryOrphansPurge } from './emailDeliveryOrphans';
import { idempotencyCachePurge } from './idempotencyCache';
import type { Purge, QueryFn } from './types';

export const PURGES: readonly Purge[] = [
  auditLogsPurge,
  emailDeliveryLogsPurge,
  emailDeliveryOrphansPurge,
  emailDeliveryLegacyTextPurge,
  deletionTokensPurge,
  idempotencyCachePurge,
];

export interface PurgeOutcome {
  name: string;
  status: 'ok' | 'failed' | 'brake';
  count: number;
}

export interface RetentionRun {
  ok: boolean;
  purges: PurgeOutcome[];
}

export async function runRetention(
  query: QueryFn = sql,
  purges: readonly Purge[] = PURGES
): Promise<RetentionRun> {
  const outcomes: PurgeOutcome[] = [];
  for (const purge of purges) {
    try {
      const result = await purge.run(query);
      if (result.brakeTripped) {
        Logger.error('[retention] brake tripped; nothing deleted', { purge: purge.name });
        outcomes.push({ name: purge.name, status: 'brake', count: 0 });
        continue;
      }
      if (purge.warnOnDelete && result.count > 0) {
        Logger.warn('[retention] rows deleted by a sweep', {
          purge: purge.name,
          count: result.count,
        });
      }
      outcomes.push({ name: purge.name, status: 'ok', count: result.count });
    } catch (error) {
      Logger.error(
        '[retention] purge failed',
        { purge: purge.name },
        error instanceof Error ? error : undefined
      );
      outcomes.push({ name: purge.name, status: 'failed', count: 0 });
    }
  }
  return { ok: outcomes.every((o) => o.status === 'ok'), purges: outcomes };
}
