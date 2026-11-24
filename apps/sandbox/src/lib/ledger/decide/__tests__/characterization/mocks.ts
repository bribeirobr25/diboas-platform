/**
 * ⛑ LEDGER-CHAR-1 · the module mocks behind the harness. Each test file declares them with
 * `vi.mock(path, (orig) => import('./mocks').then((m) => m.<name>(orig)))`, because `vi.mock`
 * is hoisted per file and its factory cannot use the file's imports.
 *
 * Only two modules are mocked, both stateless: ids and the banking package. A mocked module
 * survives `vi.resetModules()`, so the ledger's core and the side stores are NOT mocked — they
 * must load fresh for every case. Appends are seen from the projection, side-store writes
 * from `localStorage.setItem` (the harness).
 *
 * Every wrapper delegates to the real module and only RECORDS; none changes a result, except
 * the one-shot projection fault the case asks for.
 */
import type { LedgerEvent } from '@diboas/banking';
import { nextId, record, recorder, snapshot } from './recorder';

type Importer<T> = () => Promise<T>;

export function ids() {
  return { generateId: nextId };
}

/**
 * `project` runs once per append (`core.ts:170-172`) and on a cache miss. The events an append
 * added are the log's tail beyond what the previous projection saw, so the append is recorded
 * here, with the caller's own objects kept for the reference-identity check.
 */
export async function banking(importOriginal: Importer<typeof import('@diboas/banking')>) {
  const actual = await importOriginal();
  return {
    ...actual,
    project: (log: readonly LedgerEvent[]) => {
      const r = recorder();
      const g = globalThis as Record<string, unknown>;
      const seen = (g.__charSeenLength as number | undefined) ?? 0;
      const tail = log.length > seen ? log.slice(seen) : [];
      if (r.armed && tail.length > 0) {
        record('append', snapshot(tail));
        (g.__charAppended as LedgerEvent[][] | undefined)?.push([...tail]);
      }
      record('project');
      g.__charSeenLength = log.length;
      if (r.armed && r.faultOnce) {
        r.faultOnce = false;
        throw new Error('characterization: injected projection failure');
      }
      return actual.project(log as LedgerEvent[]);
    },
  };
}
