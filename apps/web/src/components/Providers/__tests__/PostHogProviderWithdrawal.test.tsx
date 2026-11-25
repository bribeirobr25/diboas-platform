/**
 * WITHDRAW-1 (PostHog half) · the provider, rendered, with the real application event bus
 * (market clean-up W-D1, spec §3.7). Only `posthog-js` (loaded by dynamic import after consent)
 * and the consent read are stubbed.
 *
 * @vitest-environment happy-dom
 */
import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const consent = vi.hoisted(() => ({ given: false }));
vi.mock('@/components/CookieConsent', () => ({ hasAnalyticsConsent: () => consent.given }));
vi.mock('@/config/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config/env')>()),
  POSTHOG_CONFIG: { apiKey: 'phc_test', host: 'https://eu.i.posthog.com' },
}));

const ph = vi.hoisted(() => ({
  calls: [] as string[],
  status: 'pending' as 'granted' | 'denied' | 'pending',
  failNext: false,
  initOptions: null as Record<string, unknown> | null,
}));
vi.mock('posthog-js', () => {
  return {
    default: {
      init: (_key: string, options: Record<string, unknown>) => {
        if (ph.failNext) {
          ph.failNext = false;
          throw new Error('init failed');
        }
        ph.calls.push('init');
        ph.initOptions = options;
      },
      opt_out_capturing: () => ph.calls.push('opt_out'),
      opt_in_capturing: (o?: { captureEventName?: unknown }) =>
        ph.calls.push(`opt_in:${String(o?.captureEventName)}`),
      reset: (all?: boolean) => ph.calls.push(`reset:${all}`),
      get_explicit_consent_status: () => ph.status,
    },
  };
});

import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { PostHogProvider } from '../PostHogProvider';

const emit = (type: ApplicationEventType) =>
  applicationEventBus.emit(type, {
    domain: 'consent',
    source: 'consent',
    timestamp: Date.now(),
    consentType: 'analytics',
    newState: type === ApplicationEventType.CONSENT_GIVEN,
  });
const flush = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

let mounts = 0;
function Child() {
  useEffect(() => {
    mounts += 1;
  }, []);
  return <p>page</p>;
}

beforeEach(() => {
  ph.calls.length = 0;
  consent.given = false;
  ph.status = 'pending';
  ph.initOptions = null;
  mounts = 0;
});
afterEach(() => vi.restoreAllMocks());

describe('WITHDRAW-1: the PostHog provider', () => {
  it('should load nothing without consent, and render its children directly', async () => {
    const { container } = render(
      <PostHogProvider>
        <Child />
      </PostHogProvider>
    );
    await flush();
    expect(ph.calls).toEqual([]);
    expect(container.textContent).toBe('page');
  });

  it('should initialise once with the W-D1 options, even after two consent emits', async () => {
    consent.given = true;
    render(
      <PostHogProvider>
        <Child />
      </PostHogProvider>
    );
    emit(ApplicationEventType.CONSENT_GIVEN);
    emit(ApplicationEventType.CONSENT_GIVEN);
    await flush();
    expect(ph.calls.filter((c) => c === 'init')).toHaveLength(1);
    expect(ph.initOptions).toMatchObject({
      opt_out_persistence_by_default: true,
      save_campaign_params: false,
      save_referrer: false,
      mask_personal_data_properties: true,
      respect_dnt: true,
    });
  });

  it('should keep the page mounted when PostHog starts (one stable tree)', async () => {
    render(
      <PostHogProvider>
        <Child />
      </PostHogProvider>
    );
    await flush();
    consent.given = true;
    emit(ApplicationEventType.CONSENT_GIVEN);
    await flush();
    expect(ph.calls).toContain('init');
    expect(mounts).toBe(1);
  });

  it('should withdraw in the pinned order, and opt back in on consent', async () => {
    consent.given = true;
    render(<PostHogProvider>x</PostHogProvider>);
    await flush();
    ph.calls.length = 0;
    emit(ApplicationEventType.CONSENT_WITHDRAWN);
    expect(ph.calls).toEqual(['opt_out', 'reset:true', 'opt_out']);
    ph.calls.length = 0;
    emit(ApplicationEventType.CONSENT_GIVEN);
    await flush();
    expect(ph.calls).toEqual(['opt_in:false']);
  });

  it('should opt back in after init when an earlier withdrawal stored "denied"', async () => {
    consent.given = true;
    ph.status = 'denied';
    render(<PostHogProvider>x</PostHogProvider>);
    await flush();
    expect(ph.calls).toEqual(['init', 'opt_in:false']);
  });

  it('should initialise nothing when consent is withdrawn while the library loads', async () => {
    consent.given = true;
    render(<PostHogProvider>x</PostHogProvider>);
    consent.given = false;
    await flush();
    expect(ph.calls).toEqual([]);
  });

  it('should clear its in-flight guard after a failed start, so the next consent retries', async () => {
    consent.given = true;
    ph.failNext = true;
    render(<PostHogProvider>x</PostHogProvider>);
    await flush();
    expect(ph.calls).toEqual([]);
    emit(ApplicationEventType.CONSENT_GIVEN);
    await flush();
    expect(ph.calls).toEqual(['init']);
  });

  it('should do nothing on withdrawal before PostHog ever started', async () => {
    render(<PostHogProvider>x</PostHogProvider>);
    emit(ApplicationEventType.CONSENT_WITHDRAWN);
    await flush();
    expect(ph.calls).toEqual([]);
  });
});
