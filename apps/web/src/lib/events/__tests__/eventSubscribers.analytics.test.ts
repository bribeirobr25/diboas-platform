/**
 * eventSubscribers — A16/O-3 funnel→analytics bridges.
 *
 * Verifies the client-side bridges added in A16/O-3:
 *   - WAITLIST_SIGNUP_COMPLETED → waitlist_signup_completed (has_referral + position)
 *   - a referred signup ALSO derives referral_used (the canonical
 *     WAITLIST_REFERRAL_USED fires server-side and can't reach this client bus)
 *   - WAITLIST_SIGNUP_COMPLETED forwards only its two named fields, never anything else in the
 *     metadata (the PII-exclusion proof; it lived on the demo's send bridge until P13 retired it)
 *   - no retired surface keeps an event type or a schema entry (P13 · D9)
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// The bridges use `import('@/lib/analytics/service')` — mock that exact path.
const trackMock = vi.fn();
vi.mock('@/lib/analytics/service', () => ({
  analyticsService: { track: (...args: unknown[]) => trackMock(...args) },
}));

import { applicationEventBus, ApplicationEventType } from '../ApplicationEventBus';
import { EVENT_VALIDATION_SCHEMA } from '../applicationEventTypes';
import { registerEventSubscribers } from '../eventSubscribers';

type TrackArg = { name: string; parameters?: Record<string, unknown> };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const names = () => trackMock.mock.calls.map(([e]) => (e as TrackArg).name);
const paramsFor = (name: string): Record<string, unknown> | undefined =>
  (trackMock.mock.calls.find(([e]) => (e as TrackArg).name === name)?.[0] as TrackArg | undefined)
    ?.parameters;

beforeAll(() => {
  registerEventSubscribers();
});
beforeEach(() => {
  trackMock.mockClear();
});

describe('eventSubscribers — A16/O-3 analytics bridges', () => {
  it('bridges WAITLIST_SIGNUP_COMPLETED → waitlist_signup_completed without referral_used when not referred', async () => {
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
      domain: 'waitlist',
      source: 'waitlist',
      timestamp: 1,
      metadata: { position: 42, hasReferral: false },
    });
    await flush();
    expect(names()).toContain('waitlist_signup_completed');
    expect(names()).not.toContain('referral_used');
    expect(paramsFor('waitlist_signup_completed')).toEqual({ has_referral: false, position: 42 });
  });

  it('derives referral_used when a referred signup completes', async () => {
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
      domain: 'waitlist',
      source: 'waitlist',
      timestamp: 1,
      metadata: { position: 7, hasReferral: true },
    });
    await flush();
    expect(names()).toContain('waitlist_signup_completed');
    expect(names()).toContain('referral_used');
    expect(paramsFor('waitlist_signup_completed')).toEqual({ has_referral: true, position: 7 });
  });

  it('should forward no personal field from a signup when its metadata carries one', async () => {
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
      domain: 'waitlist',
      source: 'waitlist',
      timestamp: 1,
      metadata: { position: 3, hasReferral: false, email: 'alice@example.com', name: 'Alice' },
    });
    await flush();
    const params = paramsFor('waitlist_signup_completed');
    expect(params).toEqual({ has_referral: false, position: 3 });
    expect(JSON.stringify(trackMock.mock.calls)).not.toMatch(/alice/i);
  });

  it('should keep no event type or schema entry for the retired demo or Dream Mode (P13 · D9)', () => {
    const retired = (v: string) => /^(preDemo|preDream):/.test(v);
    expect(Object.values(ApplicationEventType).filter(retired)).toEqual([]);
    expect(Object.keys(EVENT_VALIDATION_SCHEMA).filter(retired)).toEqual([]);
    // non-vacuity: the reader sees the live types
    expect(Object.keys(EVENT_VALIDATION_SCHEMA)).toContain(ApplicationEventType.SHARE_COMPLETED);
  });
});
