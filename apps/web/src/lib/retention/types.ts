/**
 * The daily retention job's shapes (plan P14, E1; register `5.863`).
 */
import type { QueryFn } from '@/lib/database/client';

export type { QueryFn };

export interface PurgeResult {
  /** Rows deleted (or, for the legacy-text purge, rewritten). */
  count: number;
  /** A brake refused to act; nothing was deleted (E7). */
  brakeTripped?: boolean;
}

export interface Purge {
  /** Stable name, the only identifier in logs and the response (E10′). */
  name: string;
  /** Log a count-only warning whenever it deletes a row (the orphan sweep: drift, E7′). */
  warnOnDelete?: boolean;
  run(query: QueryFn): Promise<PurgeResult>;
}

/** Postgres counts can arrive as strings through some drivers. */
export const asCount = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
