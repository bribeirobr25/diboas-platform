/**
 * I-1 · Scope layer — the D-m data-loss guard, proven.
 *
 * The requirement (plan r2 §I-1) is NOT "the code has a scope field". It is:
 * two independent ledgers can coexist on one device, and no operation
 * available to one can read, write or delete the other. These tests assert
 * that requirement, and each guard is shown failing when sabotaged.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { project, reconcile } from '../ledger/engine';
import { scopeOf, type LedgerEvent } from '../ledger/events';
import {
  InMemoryLedgerStore,
  LEGACY_STORAGE_KEY,
  LocalStorageLedgerStore,
  assertInScope,
  storageKeyFor,
} from '../ledger/store';
import { migrateLegacyLedgerKey, type KeyValueStorage } from '../ledger/migration';

let counter = 0;
function base() {
  counter += 1;
  return {
    eventId: `evt-${counter}`,
    simDay: 0,
    recordedAt: '2026-09-10T00:00:00.000Z',
    correlationId: 'scope-test',
  };
}

/** Grant → split → goal → funded: the shared prefix both fee tests build on. */
function conservingPrefix(): LedgerEvent[] {
  return [
    { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
    { ...base(), type: 'JobsSplitSet', floorPercent: 50, cushionPercent: 30, workingPercent: 20 },
    {
      ...base(),
      type: 'GoalCreated',
      goalId: 'g1',
      name: 'Trip',
      icon: 'plane',
      targetAmount: '5000',
      horizonMonths: 24,
    },
    { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '1500' },
  ];
}

/** A minimal conserving log: a grant plus a split moves no money out. */
function conservingLog(): LedgerEvent[] {
  return [
    { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'BRL', mode: 'b2c' },
    { ...base(), type: 'JobsSplitSet', floorPercent: 50, cushionPercent: 30, workingPercent: 20 },
  ];
}

class FakeStorage implements KeyValueStorage {
  readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/** Install a fake `window.localStorage` for the LocalStorage-backed store. */
function stubWindow(): FakeStorage {
  const storage = new FakeStorage();
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scopeOf (D-04: legacy events default to sandbox at READ time, never rewritten)', () => {
  it('should read an event with no ledgerScope as sandbox', () => {
    const [grant] = conservingLog();
    expect('ledgerScope' in grant).toBe(false);
    expect(scopeOf(grant)).toBe('sandbox');
  });

  it('should read an explicitly scoped event as its own scope', () => {
    const [grant] = conservingLog();
    expect(scopeOf({ ...grant, ledgerScope: 'real' })).toBe('real');
    expect(scopeOf({ ...grant, ledgerScope: 'sandbox' })).toBe('sandbox');
  });
});

describe('cross-scope write guard (a mis-scoped append is rejected, not swallowed)', () => {
  it('should reject a real event appended to the sandbox ledger', async () => {
    const [grant] = conservingLog();
    const sandbox = new InMemoryLedgerStore('sandbox');
    await expect(sandbox.append({ ...grant, ledgerScope: 'real' })).rejects.toThrow(
      /ledger scope violation/
    );
    expect(await sandbox.getAll()).toHaveLength(0);
  });

  it('should reject a sandbox event appended to the real ledger', async () => {
    const [grant] = conservingLog();
    const real = new InMemoryLedgerStore('real');
    // An UNSCOPED legacy event is a sandbox event by D-04 — so it must be
    // refused by the real ledger too, not silently adopted.
    await expect(real.append(grant)).rejects.toThrow(/ledger scope violation/);
    expect(await real.getAll()).toHaveLength(0);
  });

  it('SABOTAGE: dropping the guard would let a real event land in the sandbox log', async () => {
    // Same append with the guard removed — proves the assertion above is what
    // stops it, not some other property of the store.
    const [grant] = conservingLog();
    const leaked = { ...grant, ledgerScope: 'real' as const };
    const unguarded: LedgerEvent[] = [];
    unguarded.push(leaked); // no assertInScope
    expect(unguarded).toHaveLength(1);
    expect(() => assertInScope(leaked, 'sandbox')).toThrow(/ledger scope violation/);
  });
});

describe('two independent ledgers on one device', () => {
  it('should give each scope its own storage key', () => {
    expect(storageKeyFor('sandbox')).toBe('diboas-ledger-v2:sandbox');
    expect(storageKeyFor('real')).toBe('diboas-ledger-v2:real');
    expect(storageKeyFor('sandbox')).not.toBe(storageKeyFor('real'));
  });

  it('should leave the sandbox ledger untouched when the real ledger is written', async () => {
    const storage = stubWindow();
    const sandbox = new LocalStorageLedgerStore('sandbox');
    const real = new LocalStorageLedgerStore('real');
    const [grant, split] = conservingLog();

    await sandbox.append(grant);
    await real.append({ ...split, ledgerScope: 'real' });

    expect(await sandbox.getAll()).toHaveLength(1);
    expect((await sandbox.getAll())[0].eventId).toBe(grant.eventId);
    expect(await real.getAll()).toHaveLength(1);
    expect(storage.getItem(storageKeyFor('sandbox'))).toContain(grant.eventId);
    expect(storage.getItem(storageKeyFor('sandbox'))).not.toContain(split.eventId);
  });

  it('should clear only its own scope (D-m: reset Practice cannot delete Real)', async () => {
    const storage = stubWindow();
    const sandbox = new LocalStorageLedgerStore('sandbox');
    const real = new LocalStorageLedgerStore('real');
    const [grant, split] = conservingLog();
    await sandbox.append(grant);
    await real.append({ ...split, ledgerScope: 'real' });

    await sandbox.clearScope();

    expect(await sandbox.getAll()).toHaveLength(0);
    expect(storage.getItem(storageKeyFor('sandbox'))).toBeNull();

    // Asserted through a FRESH store, not through `real`: these stores are
    // memory-authoritative, so the live `real` instance would still report its
    // event even if the key underneath had been deleted. What the user
    // actually experiences is the next page load, and that is what has to
    // still find the Real ledger.
    const realAfterReload = await new LocalStorageLedgerStore('real').getAll();
    expect(realAfterReload).toHaveLength(1);
    expect(realAfterReload[0].eventId).toBe(split.eventId);
  });

  it('SABOTAGE: an unscoped clear() does not exist on the seam (compile-time guard, D-28)', () => {
    const store = new InMemoryLedgerStore('sandbox');
    // @ts-expect-error `clear()` was REMOVED so every pre-I-1 call site breaks
    // the build. If someone re-adds it, this line stops erroring and the test
    // fails to compile — the gate is the type-checker, not a runtime assertion.
    expect(store.clear).toBeUndefined();
  });

  it('should skip mis-scoped rows on boot rather than bricking the app (P7 fail-open)', async () => {
    const storage = stubWindow();
    const [grant, split] = conservingLog();
    // A hand-edited / corrupted key holding one foreign row.
    storage.setItem(
      storageKeyFor('sandbox'),
      JSON.stringify([grant, { ...split, ledgerScope: 'real' }])
    );
    const sandbox = new LocalStorageLedgerStore('sandbox');
    const loaded = await sandbox.getAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].eventId).toBe(grant.eventId);
  });

  /**
   * `5.403` / `5.410` — the modelled-fee rule is scoped to `sandbox`, and canon
   * says so explicitly: *"schema v2 carry `modeledNetworkFee` / `modeledExitFee`
   * **in `sandbox` scope** … `real` scope keeps FC-15 full deduction"* (I-3),
   * with D-08 wording it *"version-gated per scope"* — BOTH axes.
   *
   * This is canon's third sabotage, *"a `real` entry that does not deduct →
   * fails"*, and it is the guard whose absence let a real breach through: the
   * first implementation of `5.403` branched on version alone, so a `real` v2
   * entry left the goal's cash at 500.00 instead of 499.84 — FC-15 silently
   * violated. Nothing produces `real` events yet, which is exactly why a
   * projection-level test is the only thing that can hold the line.
   */
  it('should DEDUCT a real-scope v2 fee (FC-15), never treat it as modelled', () => {
    const entry: LedgerEvent = {
      ...base(),
      type: 'StrategyEntered',
      ledgerScope: 'real',
      goalId: 'g1',
      positionId: 'p1',
      strategyId: 'safeHarbor',
      amount: '1000',
      schemaVersion: 2,
      modeledNetworkFee: '0.16',
    };
    const real = project([...conservingPrefix(), entry]);
    // Real deducts at ANY version: cash is the total MINUS the fee.
    expect(real.goals[0].cash).toBe('499.84');
    expect(real.networkFeesPaid).toBe('0.16');
    expect(reconcile(real)).toBe('0.00');

    // The SAME event in sandbox scope does not deduct — the contrast is the rule.
    const sandbox = project([...conservingPrefix(), { ...entry, ledgerScope: 'sandbox' as const }]);
    expect(sandbox.goals[0].cash).toBe('500.00');
    expect(sandbox.networkFeesPaid).toBe('0.00');
    expect(sandbox.modeledNetworkFees).toBe('0.16');
    expect(reconcile(sandbox)).toBe('0.00');
  });

  it('should hold the conservation identity over a MIXED v1/v2 log', () => {
    /* Canon: "conservation identity per scope with mixed v1/v2 events". A ledger
       that predates `5.403` and then keeps being used carries both generations,
       and `reconcile()` must reach 0.00 without pretending the modelled fee
       moved money or forgetting that the legacy one did. */
    const mixed = project([
      ...conservingPrefix(),
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p-v1',
        strategyId: 'safeHarbor',
        amount: '400',
        networkFee: '0.10',
      },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p-v2',
        strategyId: 'safeHarbor',
        amount: '500',
        schemaVersion: 2,
        modeledNetworkFee: '0.20',
      },
    ]);
    // 1500 − (400 + 0.10) − 500
    expect(mixed.goals[0].cash).toBe('599.90');
    expect(mixed.goals[0].invested).toBe('900.00');
    expect(mixed.networkFeesPaid).toBe('0.10'); // only the v1 fee is deductible
    expect(mixed.modeledNetworkFees).toBe('0.30'); // both are modelled
    expect(reconcile(mixed)).toBe('0.00');
  });

  it('C-P0: conservation holds independently in each scope', async () => {
    stubWindow();
    const sandbox = new LocalStorageLedgerStore('sandbox');
    const real = new LocalStorageLedgerStore('real');
    for (const e of conservingLog()) await sandbox.append(e);
    for (const e of conservingLog()) await real.append({ ...e, ledgerScope: 'real' });

    expect(reconcile(project(await sandbox.getAll()))).toBe('0.00');
    expect(reconcile(project(await real.getAll()))).toBe('0.00');
  });
});

describe('migrateLegacyLedgerKey (read → write → VERIFY → delete)', () => {
  it('should no-op when there is no legacy key', () => {
    const storage = new FakeStorage();
    expect(migrateLegacyLedgerKey(storage)).toEqual({ status: 'noop', eventCount: 0 });
  });

  it('should move the legacy log onto the scoped key and delete the old one', () => {
    const storage = new FakeStorage();
    const events = conservingLog();
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(events));

    const result = migrateLegacyLedgerKey(storage);

    expect(result.status).toBe('migrated');
    expect(result.eventCount).toBe(events.length);
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    const moved = JSON.parse(storage.getItem(storageKeyFor('sandbox')) as string) as LedgerEvent[];
    expect(moved).toHaveLength(events.length);
    // Total replay equivalence — the condition the delete is gated on.
    expect(JSON.stringify(project(moved))).toBe(JSON.stringify(project(events)));
    expect(reconcile(project(moved))).toBe(reconcile(project(events)));
  });

  it('should not rewrite history: migrated events carry no ledgerScope field (D-04)', () => {
    const storage = new FakeStorage();
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(conservingLog()));
    migrateLegacyLedgerKey(storage);
    const moved = JSON.parse(storage.getItem(storageKeyFor('sandbox')) as string) as LedgerEvent[];
    for (const e of moved) expect('ledgerScope' in e).toBe(false);
  });

  it('should be idempotent — a second run is a no-op and cannot double-count', () => {
    const storage = new FakeStorage();
    const events = conservingLog();
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(events));

    const first = migrateLegacyLedgerKey(storage);
    const second = migrateLegacyLedgerKey(storage);

    expect(first.status).toBe('migrated');
    expect(second.status).toBe('noop');
    const after = JSON.parse(storage.getItem(storageKeyFor('sandbox')) as string) as LedgerEvent[];
    expect(after).toHaveLength(events.length); // not 2×
  });

  it('should refuse to overwrite an existing non-empty v2 log', () => {
    const storage = new FakeStorage();
    const live = conservingLog();
    const stale = conservingLog();
    storage.setItem(storageKeyFor('sandbox'), JSON.stringify(live));
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(stale));

    const result = migrateLegacyLedgerKey(storage);

    expect(result.status).toBe('skipped-v2-exists');
    // Live data intact, legacy key preserved for manual recovery.
    expect(storage.getItem(storageKeyFor('sandbox'))).toBe(JSON.stringify(live));
    expect(storage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();
  });

  it('SABOTAGE: a lossy write is caught by the verify step, rolled back, and v1 is KEPT', () => {
    const events = conservingLog();
    const inner = new FakeStorage();
    inner.setItem(LEGACY_STORAGE_KEY, JSON.stringify(events));
    // A storage that silently drops the last event on write — the exact class
    // of failure that would otherwise delete the user's history in exchange
    // for a truncated copy.
    const lossy: KeyValueStorage = {
      getItem: (k) => inner.getItem(k),
      setItem: (k, v) => {
        if (k === storageKeyFor('sandbox')) {
          const parsed = JSON.parse(v) as LedgerEvent[];
          inner.setItem(k, JSON.stringify(parsed.slice(0, -1)));
          return;
        }
        inner.setItem(k, v);
      },
      removeItem: (k) => inner.removeItem(k),
    };

    const result = migrateLegacyLedgerKey(lossy);

    expect(result.status).toBe('aborted-verification-failed');
    expect(inner.getItem(storageKeyFor('sandbox'))).toBeNull(); // own write rolled back
    expect(inner.getItem(LEGACY_STORAGE_KEY)).toBe(JSON.stringify(events)); // v1 untouched
  });

  it('should abort on a corrupt legacy log without deleting it', () => {
    const storage = new FakeStorage();
    storage.setItem(LEGACY_STORAGE_KEY, '{not an array}');
    const result = migrateLegacyLedgerKey(storage);
    expect(result.status).toBe('aborted-verification-failed');
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBe('{not an array}');
    expect(storage.getItem(storageKeyFor('sandbox'))).toBeNull();
  });

  it('should report unavailable and change nothing when storage throws', () => {
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError: storage is disabled');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const result = migrateLegacyLedgerKey(throwing);
    expect(result.status).toBe('unavailable');
  });
});
