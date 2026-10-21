import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageLedgerStore, type LedgerEvent } from '@diboas/banking';
import { getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { appendAll, base, flush } from '@/lib/ledger/core';
import { generateId } from '@/lib/ids';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * The append path's error contract (third P8a review, R-13). `appendAll` projects before
 * it persists; when the projection THROWS — an event its code cannot handle — the append
 * is taken back, so the in-memory log stays projectable and nothing reaches the store.
 */
describe('appendAll · an event the projection cannot handle', () => {
  beforeEach(() => resetSandbox());
  afterEach(() => vi.restoreAllMocks());

  it('should throw, take the append back, persist nothing, and leave the ledger readable', async () => {
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
    const persisted = vi.spyOn(LocalStorageLedgerStore.prototype, 'append');
    grantPlayMoney(10_000, 'USD', 'b2c');
    const before = getLedgerState().events.length;
    const alien = { ...base(generateId()), type: 'NotAnEventType' } as unknown as LedgerEvent;
    expect(() => appendAll([alien])).toThrow(/unhandled ledger event/);
    expect(getLedgerState().events).toHaveLength(before);
    await flush();
    expect(persisted.mock.calls.map(([e]) => e.type)).not.toContain('NotAnEventType');
    // Still appendable afterwards: the log is not poisoned.
    appendAll([{ ...base(generateId()), type: 'WeeklyCreditGranted', week: 1, amount: '25.00' }]);
    expect(getLedgerState().events).toHaveLength(before + 1);
  });
});
