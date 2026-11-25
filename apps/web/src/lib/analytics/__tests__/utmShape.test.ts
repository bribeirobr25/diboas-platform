/**
 * UTM-SHAPE-1 · campaign values have one known shape (W-D1, register 5.924, spec §3.11), and the
 * raw query reader follows the rule PostHog masks by (spec §3.1). Held at 100% (COV-1).
 */
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  UTM_KEYS,
  isCampaignPropertyName,
  isShapedUtmValue,
  rawQueryPieces,
  readRawQueryValues,
  readUtmParams,
  shapeUtmValue,
} from '../utmShape';

describe('UTM-SHAPE-1: the shape', () => {
  it('should name the five campaign keys once', () => {
    expect(UTM_KEYS).toEqual([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]);
  });

  it('should keep slugs and lower-case them in the browser', () => {
    expect(shapeUtmValue(' Newsletter ')).toBe('newsletter');
    expect(shapeUtmValue('spring_2026.v-2')).toBe('spring_2026.v-2');
  });

  it('should hold the 37/38-character boundary (13 + 37 = 50, the tag limit)', () => {
    expect(shapeUtmValue(`a${'b'.repeat(36)}`)).toBe(`a${'b'.repeat(36)}`);
    expect(shapeUtmValue(`a${'b'.repeat(37)}`)).toBeNull();
  });

  it('should refuse anything else', () => {
    for (const bad of ['', ' ', '-lead', 'two words', 'ana@example.com', 'a/b', 'café', '%41'])
      expect(shapeUtmValue(bad)).toBeNull();
    expect(shapeUtmValue(undefined)).toBeNull();
    expect(shapeUtmValue(7)).toBeNull();
  });

  it('should test a server value as received, never rewriting it', () => {
    expect(isShapedUtmValue('newsletter')).toBe(true);
    expect(isShapedUtmValue('Newsletter')).toBe(false);
    expect(isShapedUtmValue(' newsletter')).toBe(false);
    expect(isShapedUtmValue(null)).toBe(false);
  });

  it('should recognise campaign property names and their prefixed copies', () => {
    expect(isCampaignPropertyName('utm_source')).toBe(true);
    expect(isCampaignPropertyName('$initial_utm_campaign')).toBe(true);
    expect(isCampaignPropertyName('$session_entry_utm_term')).toBe(true);
    expect(isCampaignPropertyName('utm_id')).toBe(false);
    expect(isCampaignPropertyName('xutm_source')).toBe(false);
    expect(isCampaignPropertyName('$current_url')).toBe(false);
  });
});

describe('UTM-SHAPE-1: the raw reader (the rule PostHog masks by)', () => {
  const read = (u: string) => readRawQueryValues(u, UTM_KEYS);

  it('should read names raw and never decode them', () => {
    expect(read('/?utm%5Fsource=x')).toEqual({});
    expect(read('/?UTM_SOURCE=x')).toEqual({});
    expect(read('/?amp;utm_source=x')).toEqual({});
    expect(read('/?utm_id=x')).toEqual({});
  });

  it('should take the part before the hash and after the first question mark', () => {
    expect(read('/en#?utm_source=x')).toEqual({});
    expect(read('/en?utm_source=x#utm_medium=y')).toEqual({ utm_source: 'x' });
    expect(read('/en')).toEqual({});
  });

  it('should split each part on question marks too', () => {
    expect(read('/?a=1?utm_source=x')).toEqual({ utm_source: 'x' });
    expect(read('/?utm_source=x?utm_medium=y')).toEqual({ utm_source: 'x', utm_medium: 'y' });
  });

  it('should read no value from a name without "=" and let the first occurrence win', () => {
    expect(read('/?utm_source')).toEqual({});
    expect(read('/?utm_source&utm_source=x')).toEqual({});
    expect(read('/?utm_source=a&utm_source=b')).toEqual({ utm_source: 'a' });
  });

  it('should read "+" as a space and decode the value, dropping an undecodable one', () => {
    expect(read('/?utm_campaign=spring+')).toEqual({ utm_campaign: 'spring ' });
    expect(read('/?utm_term=a%20b')).toEqual({ utm_term: 'a b' });
    expect(read('/?utm_term=%E0%A4%A&utm_term=ok')).toEqual({});
  });

  it('should return nothing for a non-string', () => {
    expect(readRawQueryValues(undefined as unknown as string, UTM_KEYS)).toEqual({});
  });

  it('should be self-contained, so its source can run in a fresh context', () => {
    const fresh = runInNewContext(`(${readRawQueryValues.toString()})`, {}) as typeof read;
    expect(
      (fresh as unknown as typeof readRawQueryValues)('/?a=1?utm_source=x', ['utm_source'])
    ).toEqual({ utm_source: 'x' });
  });
});

describe('UTM-SHAPE-1: raw pieces, undecoded', () => {
  it('should list every piece in order with its value left as stored', () => {
    expect(rawQueryPieces('/?a=1?utm_source=%3Cx%3E&b#utm_term=y')).toEqual([
      ['a', '1'],
      ['utm_source', '%3Cx%3E'],
      ['b', null],
    ]);
    expect(rawQueryPieces('/en')).toEqual([]);
    expect(rawQueryPieces(7 as unknown as string)).toEqual([]);
  });
});

describe('UTM-SHAPE-1: shaped campaign values', () => {
  it('should shape the first value of each key and drop the ones that fail', () => {
    expect(readUtmParams('/?utm_source=Newsletter&utm_campaign=spring+&utm_term=a b')).toEqual({
      utm_source: 'newsletter',
      utm_campaign: 'spring',
    });
    expect(readUtmParams('/?utm_source=Bad!&utm_source=ok')).toEqual({});
  });
});
