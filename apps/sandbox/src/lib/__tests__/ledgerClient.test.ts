import { beforeEach, describe, expect, it } from 'vitest';
import { getLedgerState, getReady, grantAndSplit, resetSandbox } from '@/lib/ledgerClient';

/**
 * P1.2 slice 1c — the hydration gate + one-grant guard (node env; the store is
 * node-safe and degrades to in-memory, so this exercises the app-service logic
 * without a DOM). The `<LedgerReadyGate>` render behaviour is verified in the
 * Docker MCP interaction matrix (render tests are Phase-2 slice-0).
 */
const ALL_WORKING = { floorPercent: 0, cushionPercent: 0, workingPercent: 100 };

function grantCount(): number {
  return getLedgerState().events.filter((e) => e.type === 'PlayMoneyGranted').length;
}

describe('ledgerClient — slice 1c hydration gating', () => {
  beforeEach(() => {
    resetSandbox();
  });

  it('should report ready after module-init hydrate settles', async () => {
    // `void hydrate()` runs at import; `ready` flips true once it settles
    // (one microtask for the in-memory store). Drain the queue, then assert.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getReady()).toBe(true);
  });

  it('should mint exactly one grant when grantAndSplit is called once', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(getLedgerState().initialized).toBe(true);
    expect(grantCount()).toBe(1);
  });

  it('should no-op a second grant (one-grant guard — double-grant reconcile cannot catch)', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    const workingAfterFirst = getLedgerState().buckets.working;

    // A stray double-fire (fast double-tap / remount) must not mint a 2nd grant.
    grantAndSplit(9999, 'BRL', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    expect(getLedgerState().buckets.working).toBe(workingAfterFirst);
  });

  it('should allow a fresh grant after resetSandbox clears the ledger', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    resetSandbox();
    expect(getLedgerState().initialized).toBe(false);
    grantAndSplit(500, 'EUR', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    expect(getLedgerState().initialized).toBe(true);
  });
});
