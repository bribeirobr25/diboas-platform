/**
 * ATTR-3 · the attribution hold (market clean-up W-D1, registers 5.923, 5.924; spec §3.1). Held at
 * 100% (COV-1). Nothing is written to the device; first touch wins; the readers respect the box
 * (note) and analytics consent (events); withdrawal leaves the hold alone; the hold is one per
 * page even if the module is loaded twice.
 *
 * @vitest-environment happy-dom
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripComments } from '@diboas/test-support';

const consent = vi.hoisted(() => ({ given: false }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));

import {
  LEGACY_ATTRIBUTION_KEYS,
  captureUtmFromUrl,
  clearCtaSource,
  getConsentedCtaLabel,
  getConsentedUtmParams,
  getNoteForSignup,
  noteTags,
  removeLegacyAttributionStorage,
  setCtaSource,
} from '../utmAttribution';
import { UTM_KEYS, readRawQueryValues } from '../utmShape';

const HOLD = Symbol.for('diboas.attributionHold');
const writes: string[] = [];

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[HOLD];
  consent.given = false;
  writes.length = 0;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string) {
    writes.push(key);
  });
});
afterEach(() => vi.restoreAllMocks());

describe('ATTR-3: first touch, in memory only', () => {
  it('should hold the first shaped campaign values and ignore later ones', () => {
    captureUtmFromUrl('https://diboas.com/en?utm_source=Newsletter&utm_term=two+words');
    captureUtmFromUrl('https://diboas.com/en?utm_source=other');
    expect(getNoteForSignup().utm).toEqual({ utm_source: 'newsletter' });
    expect(writes).toEqual([]);
  });

  it('should not let a URL without campaign values take the first touch', () => {
    captureUtmFromUrl('https://diboas.com/en');
    captureUtmFromUrl('https://diboas.com/en?utm_source=later');
    expect(getNoteForSignup().utm).toEqual({ utm_source: 'later' });
  });

  it('should read no value from a name PostHog would not mask', () => {
    for (const url of ['/?utm%5Fsource=x', '/?UTM_SOURCE=x', '/#?utm_source=x', '/?utm_source'])
      captureUtmFromUrl(url);
    expect(getNoteForSignup().utm).toEqual({});
  });

  it('should keep one hold per page even when the module is loaded twice', async () => {
    captureUtmFromUrl('/?utm_source=a');
    vi.resetModules();
    const again = await import('../utmAttribution');
    expect(again.getNoteForSignup().utm).toEqual({ utm_source: 'a' });
    again.setCtaSource('market');
    expect(getNoteForSignup().ctaLabel).toBe('market');
  });

  it('should return copies, so a reader cannot change the hold', () => {
    captureUtmFromUrl('/?utm_source=a');
    getNoteForSignup().utm.utm_source = 'changed';
    expect(getNoteForSignup().utm).toEqual({ utm_source: 'a' });
  });
});

describe('ATTR-3: a label before any campaign value', () => {
  it('should still take the first campaign values, and hold no unknown label', () => {
    setCtaSource('market');
    setCtaSource('not-a-label' as never);
    captureUtmFromUrl('/?utm_source=a');
    expect(getNoteForSignup()).toEqual({ utm: { utm_source: 'a' }, ctaLabel: 'market' });
  });
});

describe('ATTR-3: the readers', () => {
  beforeEach(() => {
    captureUtmFromUrl('/?utm_source=a&utm_medium=b');
    setCtaSource('learn-ten-percent');
  });

  it('should give the note to a ticked box whatever the analytics choice', () => {
    expect(getNoteForSignup()).toEqual({
      utm: { utm_source: 'a', utm_medium: 'b' },
      ctaLabel: 'learn-ten-percent',
    });
  });

  it('should give the analytics readers nothing without consent, and the values with it', () => {
    expect(getConsentedUtmParams()).toEqual({});
    expect(getConsentedCtaLabel()).toBeNull();
    consent.given = true;
    expect(getConsentedUtmParams()).toEqual({ utm_source: 'a', utm_medium: 'b' });
    expect(getConsentedCtaLabel()).toBe('learn-ten-percent');
  });

  it('should keep the hold when analytics is withdrawn (it belongs to the box)', () => {
    consent.given = true;
    consent.given = false;
    expect(getNoteForSignup().ctaLabel).toBe('learn-ten-percent');
    clearCtaSource();
    expect(getNoteForSignup()).toEqual({
      utm: { utm_source: 'a', utm_medium: 'b' },
      ctaLabel: null,
    });
  });

  it('should build the note tags, with the label only when asked', () => {
    expect(noteTags(getNoteForSignup(), true)).toEqual([
      'utm_source:a',
      'utm_medium:b',
      'cta_source:learn-ten-percent',
    ]);
    expect(noteTags(getNoteForSignup(), false)).toEqual(['utm_source:a', 'utm_medium:b']);
  });
});

describe('ATTR-3: an empty page', () => {
  it('should read nothing and clear nothing before any write', () => {
    expect(getNoteForSignup()).toEqual({ utm: {}, ctaLabel: null });
    consent.given = true;
    expect(getConsentedUtmParams()).toEqual({});
    expect(getConsentedCtaLabel()).toBeNull();
    clearCtaSource();
    expect((globalThis as Record<symbol, unknown>)[HOLD]).toBeUndefined();
  });
});

describe('ATTR-3: the legacy keys', () => {
  it('should remove exactly the two keys earlier versions wrote, and survive blocked storage', () => {
    const removed: string[] = [];
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (key: string) {
      removed.push(key);
    });
    removeLegacyAttributionStorage();
    expect(removed).toEqual(['diboas-utm-params', 'diboas-cta-source']);
    expect([...LEGACY_ATTRIBUTION_KEYS]).toEqual(removed);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => removeLegacyAttributionStorage()).not.toThrow();
  });
});

describe('ATTR-3: no top-level call writes the hold', () => {
  it('should define functions only at module level (no call runs at import)', () => {
    const src = stripComments(
      readFileSync(join(__dirname, '../utmAttribution.ts'), 'utf8'),
      'utmAttribution.ts'
    );
    const topLevel = src
      .split('\n')
      .filter(
        (line) =>
          /^\S/.test(line) && !/^(import|export|const|type|interface|function|\}|\)|$)/.test(line)
      );
    expect(topLevel).toEqual([]);
    for (const line of src.split('\n').filter((l) => /^(export )?const /.test(l)))
      expect(line).not.toMatch(/writableHold|captureUtmFromUrl|setCtaSource/);
  });
});

/**
 * Parity with PostHog's own masking (`maskQueryParams`, loaded from the copy posthog-js bundles):
 * no campaign name the site reads a value for survives unmasked in PostHog's output.
 */
describe('ATTR-3: parity with PostHog masking', () => {
  const posthogRequire = createRequire(createRequire(import.meta.url).resolve('posthog-js'));
  const { maskQueryParams } = posthogRequire('@posthog/browser-common/utils/request-utils') as {
    maskQueryParams: (url: string, params: string[], mask: string) => string;
  };
  const MASK = '<masked>';
  it.each([
    'https://diboas.com/en?utm_source=x',
    'https://diboas.com/en?a=1?utm_source=x',
    'https://diboas.com/en?utm_source=a&utm_source=b',
    'https://diboas.com/en?utm_source=x?utm_medium=y',
    'https://diboas.com/en?ref=Y?utm_campaign=x&utm_term=t',
    'https://diboas.com/en?utm_campaign=spring+&utm_content=c#h',
    'https://diboas.com/en?utm%5Fsource=x&UTM_SOURCE=y&utm_source',
  ])('should read no value PostHog leaves unmasked: %s', (url) => {
    const read = readRawQueryValues(url, UTM_KEYS);
    const masked = maskQueryParams(url, [...UTM_KEYS], MASK);
    const survivors = readRawQueryValues(masked, UTM_KEYS);
    for (const name of Object.keys(read)) {
      expect(
        survivors[name] === undefined || survivors[name] === MASK,
        `${name} in ${masked}`
      ).toBe(true);
    }
  });
});
