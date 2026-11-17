/**
 * ANALYTICS-CONSENT-1 and ANALYTICS-FLUSH-1 (market clean-up W-C; founder decisions
 * DR-2026-11-11-market-cleanup-c2-decisions D and H).
 *
 * The service is a module singleton configured at import (`enabled` only when NODE_ENV is
 * production), so each case stubs production, resets the module registry and imports a fresh
 * service; both backends are replaced by spies. The service has THREE consent guards (track's
 * early return, flush's check, the withdrawal listener); each case below fails when its own
 * guard is removed, which a "no consent ever" case cannot show (flush would discard anyway).
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const consent = vi.hoisted(() => ({ given: false }));
const sent = vi.hoisted(() => ({
  calls: [] as Array<{ backend: string; names: string[]; unloading: boolean }>,
}));
const warmed = vi.hoisted(() => ({ count: 0 }));

vi.mock('@/components/CookieConsent', () => ({ hasAnalyticsConsent: () => consent.given }));
vi.mock('../backends', () => {
  class Spy {
    constructor(readonly name: string) {}
    sendEvents(events: Array<{ name: string }>, options: { unloading?: boolean } = {}) {
      sent.calls.push({
        backend: this.name,
        names: events.map((e) => e.name),
        unloading: !!options.unloading,
      });
      return Promise.resolve();
    }
    isAvailable() {
      return true;
    }
    warm() {
      warmed.count += 1;
    }
  }
  return {
    GA4Backend: class extends Spy {
      constructor() {
        super('GA4');
      }
    },
    PostHogBackend: class extends Spy {
      constructor() {
        super('PostHog');
      }
    },
  };
});

type Service = (typeof import('../service'))['analyticsService'];
let service: Service;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubEnv('NODE_ENV', 'production');
  vi.resetModules();
  consent.given = false;
  sent.calls = [];
  warmed.count = 0;
  service = (await import('../service')).analyticsService;
});

afterEach(() => {
  service.destroy();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const delivered = () => sent.calls.flatMap((c) => c.names);

describe('ANALYTICS-CONSENT-1: nothing is sent without consent', () => {
  it('should not send an event tracked before consent, even once consent is given', async () => {
    service.track({ name: 'before_consent' });
    consent.given = true;
    await service.flush();
    expect(delivered()).toEqual([]);
  });

  it('should not send queued events when consent is withdrawn before the flush', async () => {
    consent.given = true;
    service.track({ name: 'queued' });
    consent.given = false;
    await service.flush();
    expect(delivered()).toEqual([]);
  });

  it('should send an event tracked with consent when flushed (the control)', async () => {
    consent.given = true;
    service.track({ name: 'consented' });
    await service.flush();
    expect(delivered()).toEqual(['consented', 'consented']);
  });
});

describe('ANALYTICS-FLUSH-1: the queue is handed over when the page goes away', () => {
  it('should warm the backends on a consented track, and never before consent', () => {
    service.track({ name: 'no_consent' });
    expect(warmed.count).toBe(0);
    consent.given = true;
    service.track({ name: 'consented' });
    expect(warmed.count).toBeGreaterThan(0);
  });

  it('should send the queue on pagehide, marked as unloading, before the 30 s batch', () => {
    consent.given = true;
    service.track({ name: 'memo' });
    window.dispatchEvent(new Event('pagehide'));
    expect(sent.calls).toEqual([
      { backend: 'GA4', names: ['memo'], unloading: true },
      { backend: 'PostHog', names: ['memo'], unloading: true },
    ]);
  });

  it('should send on visibilitychange to hidden, and not on visible', () => {
    consent.given = true;
    const state = vi.spyOn(document, 'visibilityState', 'get');
    service.track({ name: 'one' });
    state.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sent.calls).toEqual([]);
    state.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sent.calls.map((c) => c.unloading)).toEqual([true, true]);
    state.mockRestore();
  });

  it('should send once when both pagehide and visibilitychange fire', () => {
    consent.given = true;
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    service.track({ name: 'once' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
    expect(delivered()).toEqual(['once', 'once']);
  });

  it('should stop listening after destroy', () => {
    consent.given = true;
    service.destroy();
    sent.calls = [];
    service.track({ name: 'after' });
    window.dispatchEvent(new Event('pagehide'));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sent.calls).toEqual([]);
  });
});
