/**
 * WITHDRAW-1 (PostHog options) · the init options and the `loaded` clean-up (market clean-up W-D1,
 * spec §3.7). The storage names are checked against the INSTALLED library's constants, so a
 * rename in a posthog-js bump fails here instead of silently turning the clean-up into a no-op.
 */
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import {
  POSTHOG_CLIENT_SESSION_PROPS,
  POSTHOG_INITIAL_PERSON_INFO,
  buildPostHogInitOptions,
  cleanLegacyPostHogState,
  maskCapturedNetworkRequest,
  type PostHogLoadedInstance,
} from '../posthogInitOptions';
import { UTM_KEYS } from '../utmShape';

const posthogRequire = createRequire(createRequire(import.meta.url).resolve('posthog-js'));
const library = posthogRequire('posthog-js/lib/src/constants') as {
  CLIENT_SESSION_PROPS: string;
  INITIAL_PERSON_INFO: string;
};
const ORIGIN = 'https://diboas.com';

function fakePostHog(stored: Record<string, unknown>) {
  const removed: string[] = [];
  const ph: PostHogLoadedInstance = {
    get_property: (name) => stored[name],
    unregister: (name) => {
      removed.push(name);
    },
    debug: () => {},
  };
  return { ph, removed };
}

describe('the PostHog storage names', () => {
  it("should be the installed library's own", () => {
    expect(POSTHOG_CLIENT_SESSION_PROPS).toBe(library.CLIENT_SESSION_PROPS);
    expect(POSTHOG_INITIAL_PERSON_INFO).toBe(library.INITIAL_PERSON_INFO);
  });
});

describe('cleanLegacyPostHogState', () => {
  it('should always remove the stored first-visit person info', () => {
    const { ph, removed } = fakePostHog({});
    cleanLegacyPostHogState(ph, ORIGIN, vi.fn());
    expect(removed).toEqual([library.INITIAL_PERSON_INFO]);
  });

  it('should clear a pre-W-D1 session copy and keep a current one', () => {
    const legacy = fakePostHog({
      [library.CLIENT_SESSION_PROPS]: {
        sessionId: 's',
        props: { r: '$direct', u: `${ORIGIN}/en?utm_source=x` },
      },
    });
    cleanLegacyPostHogState(legacy.ph, ORIGIN, vi.fn());
    expect(legacy.removed).toEqual([library.INITIAL_PERSON_INFO, library.CLIENT_SESSION_PROPS]);
    const current = fakePostHog({
      [library.CLIENT_SESSION_PROPS]: {
        sessionId: 's',
        props: { r: `${ORIGIN}/`, u: `${ORIGIN}/en?utm_source=<masked>` },
      },
    });
    cleanLegacyPostHogState(current.ph, ORIGIN, vi.fn());
    expect(current.removed).toEqual([library.INITIAL_PERSON_INFO]);
  });

  it('should report a failure once and never throw', () => {
    const report = vi.fn();
    const ph = {
      get_property: () => undefined,
      unregister: () => {
        throw new Error('storage blocked');
      },
      debug: () => {},
    };
    expect(() => cleanLegacyPostHogState(ph, ORIGIN, report)).not.toThrow();
    expect(report).toHaveBeenCalledTimes(1);
  });
});

describe('buildPostHogInitOptions', () => {
  const options = buildPostHogInitOptions({
    apiHost: 'https://eu.i.posthog.com',
    onLoaded: vi.fn(),
  });

  it('should save no campaign values or referrer, persist nothing before opt-in, and keep masking on', () => {
    expect(options).toMatchObject({
      opt_out_persistence_by_default: true,
      save_campaign_params: false,
      save_referrer: false,
      mask_personal_data_properties: true,
      respect_dnt: true,
      advanced_disable_feature_flags: true,
      api_host: 'https://eu.i.posthog.com',
    });
    expect(options.custom_personal_data_properties).toEqual([
      't',
      'token',
      'id',
      'email',
      ...UTM_KEYS,
    ]);
  });

  it('should pass every recorded URL through the shaped scrubber', () => {
    const recording = options.session_recording as {
      maskCapturedNetworkRequestFn: typeof maskCapturedNetworkRequest;
    };
    expect(recording.maskCapturedNetworkRequestFn).toBe(maskCapturedNetworkRequest);
    expect(
      maskCapturedNetworkRequest({
        name: `${ORIGIN}/en/delete-confirm?token=x&utm_source=Mail`,
        method: 'GET',
      })
    ).toEqual({ name: `${ORIGIN}/en/delete-confirm?utm_source=mail`, method: 'GET' });
    expect(maskCapturedNetworkRequest({ url: '/api/x?t=1' })).toEqual({ url: '/api/x' });
    expect(maskCapturedNetworkRequest({ method: 'GET' })).toEqual({ method: 'GET' });
  });
});
