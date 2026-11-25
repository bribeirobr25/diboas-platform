/**
 * Input validators — every API input passes through these before processing.
 *
 * Pins the SECURE outcome: anything outside the allow-lists or the size
 * bounds is rejected, including non-string values that reach the validators
 * through untyped JSON bodies and prototype-shaped keys.
 */

import { WAITLIST_SOURCES } from '@/lib/waitingList/store/types';
import { describe, it, expect } from 'vitest';
import {
  isValidLocale,
  isValidSource,
  sanitizeTags,
  isValidName,
  applyNoteConsent,
} from '../validators';

/** Untyped JSON reaches these validators at runtime; cast to exercise the guards. */
const asString = (value: unknown) => value as string;

describe('isValidLocale', () => {
  it('should accept a locale when it is one of the four supported locales', () => {
    for (const locale of ['en', 'pt-BR', 'es', 'de']) {
      expect(isValidLocale(locale)).toBe(true);
    }
  });

  it('should reject a locale when it is unsupported, mis-cased, empty or prototype-shaped', () => {
    for (const locale of ['fr', 'EN', 'pt-br', '', ' en', '__proto__', 'constructor']) {
      expect(isValidLocale(locale)).toBe(false);
    }
  });

  it('should reject a locale when the value is not a string', () => {
    for (const value of [undefined, null, 1, ['en'], { en: true }]) {
      expect(isValidLocale(asString(value))).toBe(false);
    }
  });
});

describe('isValidSource', () => {
  it('should accept a source when it is a known waitlist source', () => {
    for (const source of ['landing_b2c', 'landing_b2b', 'tool_money_jobs', 'referral', 'direct']) {
      expect(isValidSource(source)).toBe(true);
    }
  });

  it('should reject a source when it is unknown, mis-cased or prototype-shaped', () => {
    for (const source of ['admin', 'DIRECT', '', '__proto__', 'direct; DROP TABLE']) {
      expect(isValidSource(source)).toBe(false);
    }
  });

  /**
   * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 1: the one list, pinned. Adding or removing a
   * source is a deliberate edit of this line (plan P11, D2). `modal` (a container, not a path)
   * is refused. `dream_mode` and `calculator` left with Dream Mode and the modal (plan P13
   * PR-2); `interactive_demo` and
   * `app_link` left with the demo and the app-link interceptor (plan P13, D6).
   */
  it('should hold exactly the agreed sources when the one list is read', () => {
    expect([...WAITLIST_SOURCES]).toEqual([
      'landing_b2c',
      'landing_b2b',
      'tool_money_jobs',
      'referral',
      'direct',
    ]);
    for (const source of WAITLIST_SOURCES) expect(isValidSource(source), source).toBe(true);
    expect(isValidSource('modal')).toBe(false);
  });

  it('should reject a source when the value is not a string', () => {
    for (const value of [undefined, null, 0, ['direct']]) {
      expect(isValidSource(asString(value))).toBe(false);
    }
  });
});

describe('sanitizeTags', () => {
  const kept = (value: unknown) => sanitizeTags(value)?.tags;

  it('should keep every UTM and known cta_source tag of at most fifty chars', () => {
    expect(sanitizeTags([])).toEqual({ tags: [], dropped: 0 });
    const utm = [
      'utm_source:ig',
      'utm_medium:social',
      'utm_campaign:spring',
      'utm_term:x',
      'utm_content:y',
    ];
    expect(sanitizeTags([...utm, 'cta_source:market'])).toEqual({
      tags: [...utm, 'cta_source:market'],
      dropped: 0,
    });
  });

  it('should refuse the request when the value is not an array', () => {
    for (const value of ['a,b', null, undefined, '', 0, { 0: 'a', length: 1 }]) {
      expect(sanitizeTags(value)).toBeNull();
    }
  });

  it('should refuse the request when there are more than ten tags', () => {
    expect(sanitizeTags(Array.from({ length: 11 }, () => 'utm_source:a'))).toBeNull();
  });

  it('should refuse the request when any entry is not a string', () => {
    expect(sanitizeTags(['utm_source:ok', 1])).toBeNull();
    expect(sanitizeTags(['utm_source:ok', { toString: () => 'x' }])).toBeNull();
  });

  it('should drop an empty or over-long tag and keep the rest, counting the drops (5.922)', () => {
    const longCampaign = `utm_campaign:${'spring-launch-brazil-instagram-'.repeat(2)}`;
    expect(longCampaign.length).toBeGreaterThan(50);
    expect(sanitizeTags(['utm_source:ig', '', longCampaign])).toEqual({
      tags: ['utm_source:ig'],
      dropped: 2,
    });
  });

  it('should drop a tag whose key is not a UTM key or cta_source (no free text by another key)', () => {
    expect(
      kept(['x:ana@example.com', 'CTA_SOURCE:market', ' cta_source:market', 'utm_source:ig'])
    ).toEqual(['utm_source:ig']);
  });

  it('should keep a known cta_source label once and drop an unknown, free-text or second one', () => {
    for (const label of ['market', 'tool-idle-cash', 'learn-putting-it-together']) {
      expect(kept([`cta_source:${label}`])).toEqual([`cta_source:${label}`]);
    }
    expect(
      kept(['utm_source:ig', 'cta_source:ana@example.com', 'cta_source:', 'cta_source:tool-x'])
    ).toEqual(['utm_source:ig']);
    // P13 (D6): the demo launcher is gone, so its label is no longer accepted
    expect(kept(['cta_source:demo-launcher'])).toEqual([]);
    expect(kept(['cta_source:market', 'cta_source:tool-card-fees'])).toEqual(['cta_source:market']);
  });
});

describe('isValidName', () => {
  it('should accept a name when it is non-empty after trim and at most one hundred chars', () => {
    expect(isValidName('Ana')).toBe(true);
    expect(isValidName('  Ana  ')).toBe(true);
    expect(isValidName('x'.repeat(100))).toBe(true);
    expect(isValidName(`  ${'x'.repeat(100)}  `)).toBe(true);
  });

  it('should reject a name when it is blank or longer than one hundred chars after trim', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('   \t\n ')).toBe(false);
    expect(isValidName('x'.repeat(101))).toBe(false);
  });

  it('should reject a name when the value is not a string', () => {
    for (const value of [undefined, null, 42, ['Ana']]) {
      expect(isValidName(asString(value))).toBe(false);
    }
  });
});

/**
 * CONSENT-EVIDENCE-1 (signup half) · `applyNoteConsent` (market clean-up W-D1, 5.923; spec §3.5).
 */
describe('applyNoteConsent', () => {
  it('should keep one value per campaign key, the first, from a request that repeats one', () => {
    expect(
      applyNoteConsent(
        ['utm_source:a', 'utm_source:b', 'utm_medium:m'],
        { text: 'note', version: 1 },
        NOW
      ).tags
    ).toEqual(['utm_source:a', 'utm_medium:m', 'consent:note:v1:2026-11-25']);
  });

  const NOW = new Date('2026-11-25T23:59:00Z');
  const NOTE = ['utm_source:ig', 'utm_campaign:Spring', 'cta_source:market'];

  it('should keep the shaped note and append one evidence tag under a current `note` box', () => {
    expect(applyNoteConsent(NOTE, { text: 'note', version: 1 }, NOW)).toEqual({
      tags: ['utm_source:ig', 'cta_source:market', 'consent:note:v1:2026-11-25'],
      dropped: 1,
    });
  });

  it('should keep campaign values only under the `note-campaign` box', () => {
    expect(applyNoteConsent(NOTE, { text: 'note-campaign', version: 1 }, NOW)).toEqual({
      tags: ['utm_source:ig', 'consent:note-campaign:v1:2026-11-25'],
      dropped: 2,
    });
  });

  it.each([
    ['no box', undefined],
    ['null', null],
    ['a string', 'note'],
    ['an unknown text', { text: 'all', version: 1 }],
    ['a text that is not a string', { text: 1, version: 1 }],
    ['a version that is not a number', { text: 'note', version: '1' }],
    ['a fractional version', { text: 'note', version: 1.5 }],
    ['an older version', { text: 'note', version: 0 }],
  ])(
    'should keep no note tag and add no evidence with %s (dropped, never refused)',
    (_l, consent) => {
      expect(applyNoteConsent(NOTE, consent, NOW)).toEqual({ tags: [], dropped: 3 });
    }
  );

  it('should add no evidence when nothing of the note survives, and accept no tags at all', () => {
    expect(applyNoteConsent(['utm_term:Bad Value'], { text: 'note', version: 1 }, NOW)).toEqual({
      tags: [],
      dropped: 1,
    });
    expect(applyNoteConsent(undefined, { text: 'note', version: 1 }, NOW)).toEqual({
      tags: [],
      dropped: 0,
    });
  });

  it('should drop any tag that is not part of the note, a client evidence tag included', () => {
    expect(
      applyNoteConsent(['consent:note:v1:2020-01-01', 'x:y'], { text: 'note', version: 1 }, NOW)
    ).toEqual({ tags: [], dropped: 2 });
  });
});
