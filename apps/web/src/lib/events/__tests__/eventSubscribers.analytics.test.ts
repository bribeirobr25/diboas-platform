/**
 * eventSubscribers — A16/O-3 funnel→analytics bridges.
 *
 * Verifies the client-side bridges added in A16/O-3:
 *   - WAITLIST_SIGNUP_COMPLETED → waitlist_signup_completed (has_referral + position)
 *   - a referred signup ALSO derives referral_used (the canonical
 *     WAITLIST_REFERRAL_USED fires server-side and can't reach this client bus)
 *   - PRE_DEMO_SEND_COMPLETED drops the `recipient` field (potential PII)
 *   - PRE_DEMO_BUY_COMPLETED carries amount + asset
 *   - PRE_DREAM_SHARE_INITIATED carries platform only
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

  it('excludes the recipient (PII) field from pre_demo_send_completed', async () => {
    applicationEventBus.emit(ApplicationEventType.PRE_DEMO_SEND_COMPLETED, {
      domain: 'preDemo',
      source: 'preDemo',
      timestamp: 1,
      metadata: { amount: 100, recipient: 'alice-handle' },
    });
    await flush();
    const params = paramsFor('pre_demo_send_completed');
    expect(params).toEqual({ amount: 100 });
    expect(JSON.stringify(params)).not.toContain('alice');
  });

  it('bridges pre_demo_buy_completed with amount + asset', async () => {
    applicationEventBus.emit(ApplicationEventType.PRE_DEMO_BUY_COMPLETED, {
      domain: 'preDemo',
      source: 'preDemo',
      timestamp: 1,
      metadata: { amount: 50, asset: 'BTC' },
    });
    await flush();
    expect(paramsFor('pre_demo_buy_completed')).toEqual({ amount: 50, asset: 'BTC' });
  });

  it('bridges pre_dream_share_initiated with platform only', async () => {
    applicationEventBus.emit(ApplicationEventType.PRE_DREAM_SHARE_INITIATED, {
      domain: 'preDream',
      source: 'preDream',
      timestamp: 1,
      metadata: { platform: 'whatsapp' },
    });
    await flush();
    expect(paramsFor('pre_dream_share_initiated')).toEqual({ platform: 'whatsapp' });
  });
});
