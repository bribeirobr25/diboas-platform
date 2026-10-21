// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectedLogs } from '@/test/expectedLogs';
import { clearSimulatedEvents, getResolutions, recordResolution } from '../simulatedEventStore';

/**
 * REQUIREMENT (2026-10-19 lane sweep): the choice-record store is read from device
 * storage, so it PARSES what it reads. A malformed entry made `recordResolution` throw on
 * `r.eventInstanceId` — AFTER the expense's money had already moved, so the screen threw
 * instead of finishing. Now a malformed entry is never used, never destroyed (it may have
 * been written by a newer build), and its presence is logged as a count, not a value.
 */
const KEY = 'diboas.sandbox.simulatedEvents.v1';
const GOOD = {
  eventInstanceId: 'e1',
  eventType: 'carRepair',
  choice: 'cash',
  catalogueVersion: 1,
  resolvedAt: '2026-10-19T12:00:00.000Z',
};

const logs = expectedLogs({
  strict: true,
  warn: ['simulated-event store holds unreadable records'],
  error: ['simulated-event store persist failed'],
  requiredIn: /malformed|save FAILS/,
});

describe('simulatedEventStore reads device storage defensively', () => {
  beforeEach(() => {
    clearSimulatedEvents();
    localStorage.clear();
  });

  it('should record a resolution even when a malformed entry is stored, and keep that entry', () => {
    localStorage.setItem(KEY, JSON.stringify([null, GOOD, { eventInstanceId: 7 }]));
    expect(() =>
      recordResolution({
        eventInstanceId: 'e2',
        eventType: 'x',
        choice: 'c',
        resolvedAt: GOOD.resolvedAt,
      })
    ).not.toThrow();
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored).toHaveLength(4); // null and the odd entry are KEPT, the new one appended
    expect(stored[0]).toBeNull();
    expect(getResolutions().map((r) => r.eventInstanceId)).toEqual(['e1', 'e2']);
    expect(JSON.stringify(logs.calls('warn'))).not.toContain('carRepair');
  });

  it('should still refuse a second record for the same event when entries are malformed', () => {
    localStorage.setItem(KEY, JSON.stringify([GOOD, 'junk']));
    recordResolution({
      eventInstanceId: 'e1',
      eventType: 'other',
      choice: 'other',
      resolvedAt: GOOD.resolvedAt,
    });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toHaveLength(2);
  });

  it('should refuse a second record beside a malformed entry that names the SAME event', () => {
    // e.g. a newer build's shape: readable id, a field this build does not understand.
    localStorage.setItem(KEY, JSON.stringify([{ ...GOOD, catalogueVersion: '2' }]));
    recordResolution({
      eventInstanceId: 'e1',
      eventType: 'x',
      choice: 'c',
      resolvedAt: GOOD.resolvedAt,
    });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toHaveLength(1);
  });

  it('should read valid records unchanged', () => {
    localStorage.setItem(KEY, JSON.stringify([GOOD]));
    expect(getResolutions()).toEqual([GOOD]);
  });
});

/**
 * REQUIREMENT (lane audit 2026-10-20): a choice record whose save FAILS (quota, private mode)
 * is still on record for the session. The reader used to consult the memory fallback only
 * when storage was absent, so the record vanished at once. (Money is not at stake: the
 * ledger itself refuses a second resolution — this is the CHOICE record.)
 */
describe('a resolution record survives a failed save', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should keep the record in this session when the save FAILS', () => {
    clearSimulatedEvents();
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    });
    recordResolution({
      eventInstanceId: 'e9',
      eventType: GOOD.eventType,
      choice: 'cash',
      resolvedAt: GOOD.resolvedAt,
    });
    expect(getResolutions().map((r) => r.eventInstanceId)).toEqual(['e9']);
    /* First record still wins against the memory-held one. */
    recordResolution({
      eventInstanceId: 'e9',
      eventType: GOOD.eventType,
      choice: 'other',
      resolvedAt: GOOD.resolvedAt,
    });
    expect(getResolutions()).toHaveLength(1);
    expect(getResolutions()[0].choice).toBe('cash');
  });
});
