/**
 * The one-off clean-up of PostHog's pre-W-D1 session copy (W-D1, spec §3.7; part of WITHDRAW-1).
 * Fixtures are in the library's real stored shape, `{ sessionId, props: { r, u } }`, built from
 * `location.origin`; the kept control is produced by the installed library's own masking.
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { POSTHOG_MASKED, hasUnmaskedCampaignSessionProps } from '../posthogLegacySessionCleanup';
import { UTM_KEYS } from '../utmShape';

const ORIGIN = 'https://diboas.com';
const stored = (r: unknown, u: unknown) => ({ sessionId: 's1', props: { r, u } });

/** The installed library's own helpers, resolved through posthog-js (the copy it bundles). */
const posthogRequire = createRequire(createRequire(import.meta.url).resolve('posthog-js'));
const { maskQueryParams } = posthogRequire('@posthog/browser-common/utils/request-utils') as {
  maskQueryParams: (url: string, params: string[], mask: string) => string;
};
const { MASKED } = posthogRequire('@posthog/browser-common/utils/event-utils') as {
  MASKED: string;
};

describe('hasUnmaskedCampaignSessionProps', () => {
  it("should use the library's own mask literal", () => {
    expect(POSTHOG_MASKED).toBe(MASKED);
  });

  it('should keep a session the library stored after W-D1 (its own masking, our bare origin)', () => {
    const u = maskQueryParams(`${ORIGIN}/en?utm_source=x&ref=R1`, [...UTM_KEYS], MASKED);
    expect(u).toContain(`utm_source=${MASKED}`);
    expect(hasUnmaskedCampaignSessionProps(stored(`${ORIGIN}/`, u), ORIGIN)).toBe(false);
    expect(hasUnmaskedCampaignSessionProps(stored('$direct', u), ORIGIN)).toBe(false);
  });

  it('should clear a session whose stored address holds a raw campaign value', () => {
    expect(
      hasUnmaskedCampaignSessionProps(stored('$direct', `${ORIGIN}/en?utm_source=x`), ORIGIN)
    ).toBe(true);
    expect(
      hasUnmaskedCampaignSessionProps(stored('$direct', `${ORIGIN}/en?a=1?utm_source=x`), ORIGIN)
    ).toBe(true);
    expect(
      hasUnmaskedCampaignSessionProps(stored('$direct', `${ORIGIN}/en?utm_term=`), ORIGIN)
    ).toBe(true);
  });

  it('should keep an address whose campaign-like names are not the five raw names', () => {
    for (const u of [
      `${ORIGIN}/en?utm%5Fsource=x`,
      `${ORIGIN}/en?UTM_SOURCE=x`,
      `${ORIGIN}/en?utm_source`,
      `${ORIGIN}/en#?utm_source=x`,
      `${ORIGIN}/en`,
    ])
      expect(hasUnmaskedCampaignSessionProps(stored('$direct', u), ORIGIN)).toBe(false);
  });

  it('should clear a session whose referrer is one of our pages beyond the bare origin', () => {
    expect(hasUnmaskedCampaignSessionProps(stored(`${ORIGIN}/en/x`, `${ORIGIN}/en`), ORIGIN)).toBe(
      true
    );
    expect(hasUnmaskedCampaignSessionProps(stored(`${ORIGIN}/?q=1`, `${ORIGIN}/en`), ORIGIN)).toBe(
      true
    );
  });

  it('should keep our bare origin, another site, $direct and an unparseable referrer', () => {
    for (const r of [
      `${ORIGIN}/`,
      'https://www.bing.com/search?q=x',
      '$direct',
      'not a url',
      '',
      7,
    ])
      expect(hasUnmaskedCampaignSessionProps(stored(r, `${ORIGIN}/en`), ORIGIN)).toBe(false);
  });

  it('should never throw on garbage, and answer false', () => {
    for (const value of [
      undefined,
      null,
      'x',
      7,
      [],
      {},
      { props: null },
      { props: 'x' },
      stored(undefined, undefined),
      stored({}, []),
    ])
      expect(hasUnmaskedCampaignSessionProps(value, ORIGIN)).toBe(false);
    const hostile = {
      get props(): never {
        throw new Error('boom');
      },
    };
    expect(hasUnmaskedCampaignSessionProps(hostile, ORIGIN)).toBe(false);
  });
});
