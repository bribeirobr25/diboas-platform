// @vitest-environment happy-dom
/**
 * I-1 · Scope layer — the app-side half.
 *
 * `packages/banking` proves the store and migration mechanics in isolation.
 * What this file proves is the thing a user would actually feel:
 *
 *   1. an existing device's practice history survives the scope split, and
 *   2. resetting Practice cannot reach a Real ledger sitting on the same device.
 *
 * happy-dom is used for a real `window.localStorage`; the module graph is reset
 * per test because `core.ts` builds its store — and runs the migration — once,
 * at first access.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_STORAGE_KEY, project, reconcile, storageKeyFor } from '@diboas/banking';
import type { LedgerEvent } from '@diboas/banking';
import { ACTIVE_LEDGER_SCOPE, scopedStorageKey } from '../scope';

/** A real pre-scope device log: a grant plus a split. Conserves. */
function legacyLog(): LedgerEvent[] {
  const stamp = (n: number) => ({
    eventId: `legacy-${n}`,
    simDay: 0,
    recordedAt: '2026-08-01T00:00:00.000Z',
    correlationId: 'legacy',
  });
  return [
    { ...stamp(1), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
    { ...stamp(2), type: 'JobsSplitSet', floorPercent: 50, cushionPercent: 30, workingPercent: 20 },
  ];
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  localStorage.clear();
});

describe('scopedStorageKey (device-local derived stores)', () => {
  it('should address exactly one scope today', () => {
    expect(ACTIVE_LEDGER_SCOPE).toBe('sandbox');
  });

  it('should keep the pre-scope key for sandbox and suffix every other scope', () => {
    // The unsuffixed key was written when Practice was the only ledger, so it
    // IS the sandbox key. Renaming it would orphan real user state — and for
    // simulated-event resolutions, an orphaned record lets an already-answered
    // life event fire again and move money twice.
    expect(scopedStorageKey('diboas.sandbox.proposalDeclines.v1', 'sandbox')).toBe(
      'diboas.sandbox.proposalDeclines.v1'
    );
    expect(scopedStorageKey('diboas.sandbox.proposalDeclines.v1', 'real')).toBe(
      'diboas.sandbox.proposalDeclines.v1:real'
    );
  });

  it('should never let two scopes share a key', () => {
    for (const base of ['diboas.sandbox.proposalDeclines.v1', 'diboas.sandbox.simulatedEvents.v1'])
      expect(scopedStorageKey(base, 'sandbox')).not.toBe(scopedStorageKey(base, 'real'));
  });

  // D-r §3: a decline is remembered forever and never re-proposed ("no nag, ever"),
  // so losing the decline record would re-present a proposal the user already refused.
  it('should keep an existing device reading its own proposal declines after the split', async () => {
    const { getDeclinedWeeks, recordDecline } = await import('../proposalStore');
    recordDecline([3]);
    expect(localStorage.getItem('diboas.sandbox.proposalDeclines.v1')).toBe('[3]');
    expect(getDeclinedWeeks()).toEqual([3]);
  });

  // D-s §3 per-instance idempotency: the resolution record is what stops an already
  // answered life event from firing again and moving money a second time.
  it('should keep an existing device reading its own simulated-event resolutions', async () => {
    const { getResolutions, recordResolution } = await import('../simulatedEventStore');
    recordResolution({
      eventInstanceId: 'inst-1',
      eventType: 'car_repair',
      choice: 'available',
      resolvedAt: '2026-09-10T00:00:00.000Z',
    });
    expect(localStorage.getItem('diboas.sandbox.simulatedEvents.v1')).toContain('inst-1');
    expect(getResolutions()).toHaveLength(1);
  });
});

describe('core.ts — the v1 → v2 migration on first store access', () => {
  it("should carry a returning user's practice history onto the scoped key", async () => {
    const events = legacyLog();
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(events));

    const { getLedgerState, getReady } = await import('../ledgerClient');
    await new Promise((resolve) => setTimeout(resolve, 0)); // let hydrate settle

    expect(getReady()).toBe(true);
    const state = getLedgerState();
    expect(state.events.map((e) => e.eventId)).toEqual(['legacy-1', 'legacy-2']);
    // Total replay equivalence — the user's money did not change shape.
    expect(JSON.stringify(state)).toBe(JSON.stringify(project(events)));
    expect(reconcile(state)).toBe('0.00');

    // The old key is gone only because the verify passed.
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(storageKeyFor('sandbox'))).not.toBeNull();
  });

  it('should be a no-op on a device that has no legacy key', async () => {
    const { getLedgerState } = await import('../ledgerClient');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getLedgerState().events).toHaveLength(0);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('D-m: resetSandbox clears Practice and cannot touch a Real ledger on the same device', async () => {
    // A Real ledger already on the device (I-8 territory; placed here directly
    // because I-1 must be provably safe BEFORE anything writes one for real).
    const realEvents = legacyLog().map((e) => ({
      ...e,
      eventId: `${e.eventId}-real`,
      ledgerScope: 'real' as const,
    }));
    localStorage.setItem(storageKeyFor('real'), JSON.stringify(realEvents));

    const { grantPlayMoney, getLedgerState, resetSandbox, flush } = await import('../ledgerClient');
    grantPlayMoney(1000, 'USD', 'b2c');
    await flush();
    expect(localStorage.getItem(storageKeyFor('sandbox'))).not.toBeNull();

    resetSandbox();
    await flush();

    expect(getLedgerState().events).toHaveLength(0);
    expect(localStorage.getItem(storageKeyFor('sandbox'))).toBeNull();
    // Untouched, byte for byte.
    expect(localStorage.getItem(storageKeyFor('real'))).toBe(JSON.stringify(realEvents));
  });
});
