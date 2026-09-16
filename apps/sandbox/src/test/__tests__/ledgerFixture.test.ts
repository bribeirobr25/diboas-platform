import { describe, expect, it } from 'vitest';
import { oneOfEachLog } from '../ledgerFixture';

/**
 * `5.395` — the rider that row left open.
 *
 * The fixture shipped two events with one `eventId` (`e11`, twice), and
 * `InMemoryLedgerStore.append` is `if (this.ids.has(event.eventId)) return;` —
 * a silent no-op. So on any store-backed path one of the two simply never
 * arrived, and a fixture whose entire purpose is to carry ONE OF EACH event type
 * would have covered 27 of 28. Nothing caught it: the mapped-`Record` type guard
 * proves every TYPE is present and says nothing about ids, and no uniqueness
 * assertion existed anywhere in the workspace (measured with a broad grep).
 *
 * Found by counting, not by a test. This is the counting, kept.
 */
describe('the ONE OF EACH ledger fixture', () => {
  it('should give every event a unique eventId (the store DEDUPES by it)', () => {
    const ids = oneOfEachLog().map((e) => e.eventId);
    const seen = new Map<string, number>();
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
    const dups = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dups, `duplicate eventId(s): ${dups.join(', ')}`).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should carry every event exactly once, so a store append cannot silently drop one', () => {
    const log = oneOfEachLog();
    const types = log.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
    // Ids and types agree on the count — the guard the duplicate defeated.
    expect(new Set(log.map((e) => e.eventId)).size).toBe(new Set(types).size);
  });
});
