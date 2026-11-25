/**
 * WITHDRAW-1 (Sentry half) · session replay follows consent without ever stacking (market
 * clean-up W-D1, spec §3.7). Accept → Decline → Accept used to register a SECOND replay
 * integration (after `stop()`, `getReplay()` still returns the instance). The integration is
 * added once; withdrawal stops it; nothing calls start, flush or startBuffering (sample rates 0).
 *
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const consent = vi.hoisted(() => ({ given: false }));
const sentry = vi.hoisted(() => {
  const replay = {
    stop: vi.fn(async () => {}),
    start: vi.fn(),
    flush: vi.fn(),
    startBuffering: vi.fn(),
  };
  const state = { added: 0 as number };
  return {
    replay,
    state,
    client: { addIntegration: vi.fn(() => (state.added += 1)) },
  };
});
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  getClient: () => sentry.client,
  getReplay: () => (sentry.state.added > 0 ? sentry.replay : undefined),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  captureRouterTransitionStart: vi.fn(),
}));
vi.mock('botid/client/core', () => ({ initBotId: vi.fn() }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));

const emit = async (type: 'consent_given' | 'consent_withdrawn') => {
  const { applicationEventBus, ApplicationEventType } =
    await import('@/lib/events/ApplicationEventBus');
  applicationEventBus.emit(
    type === 'consent_given'
      ? ApplicationEventType.CONSENT_GIVEN
      : ApplicationEventType.CONSENT_WITHDRAWN,
    {
      domain: 'consent',
      source: 'consent',
      timestamp: Date.now(),
      consentType: 'analytics',
      newState: type === 'consent_given',
    }
  );
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://k@o.ingest.sentry.io/1');
  consent.given = false;
  sentry.state.added = 0;
  vi.clearAllMocks();
});

describe('WITHDRAW-1: Sentry replay and consent', () => {
  it('should add the replay once across Accept, Decline, Accept, and stop it on Decline', async () => {
    await import('../../../instrumentation-client');
    await emit('consent_given');
    await emit('consent_withdrawn');
    await emit('consent_given');
    expect(sentry.client.addIntegration).toHaveBeenCalledTimes(1);
    expect(sentry.replay.stop).toHaveBeenCalledTimes(1);
    for (const never of [sentry.replay.start, sentry.replay.flush, sentry.replay.startBuffering])
      expect(never).not.toHaveBeenCalled();
  });

  it('should add it at load when consent already exists, and only once', async () => {
    consent.given = true;
    await import('../../../instrumentation-client');
    await emit('consent_given');
    expect(sentry.client.addIntegration).toHaveBeenCalledTimes(1);
  });
});
