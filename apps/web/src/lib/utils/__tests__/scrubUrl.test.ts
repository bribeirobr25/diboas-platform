import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  SAFE_QUERY_PARAMS,
  SCRUB_URL_INLINE_JS_SHAPED,
  scrubUrl,
  scrubUrlsInText,
} from '../scrubUrl';

/**
 * The browser copy GA4's inline bootstrap runs, compiled in a fresh context that holds only what a
 * browser gives it here (`URL`, `URLSearchParams`), so it cannot lean on anything from this file.
 */
const inline = runInNewContext(`(${SCRUB_URL_INLINE_JS_SHAPED})`, { URL, URLSearchParams }) as (
  u: string
) => string;

/** [input, expected] — the default: no campaign value, whatever its shape (W-D1, spec §3.10). */
const CASES: Array<[string, string]> = [
  // the two bearer tokens the site puts in page addresses (5.864)
  ['https://diboas.com/en/delete-confirm?token=abc123', 'https://diboas.com/en/delete-confirm'],
  [
    'https://diboas.com/pt-BR/email-preferences?t=aWQ6dG9r',
    'https://diboas.com/pt-BR/email-preferences',
  ],
  // an email anywhere: query, path, fragment
  ['/api/x?email=ana%40example.com', '/api/x'],
  ['https://diboas.com/u/ana@example.com/x', 'https://diboas.com/u/[EMAIL_REDACTED]/x'],
  ['https://diboas.com/u/ana%40example.com/x', 'https://diboas.com/u/[EMAIL_REDACTED]/x'],
  ['https://diboas.com/a#token=x', 'https://diboas.com/a'],
  // the default drops campaign values; the two public switches survive, unknown ones do not
  ['https://diboas.com/?utm_source=ig&utm_campaign=w1&x=1', 'https://diboas.com/'],
  ['https://diboas.com/en?ref=REFABCD12&utm_source=ig', 'https://diboas.com/en?ref=REFABCD12'],
  ['/en/tools/money-jobs?for=business&token=x', '/en/tools/money-jobs?for=business'],
  ['https://diboas.com/?utm_term=ana@example.com', 'https://diboas.com/'],
  // nothing to scrub: returned as given
  ['https://diboas.com/en/learn', 'https://diboas.com/en/learn'],
  ['/en/about', '/en/about'],
  ['', ''],
];

/**
 * [input, expected] — `{ campaign: 'shaped' }`, run through BOTH shaped implementations (the module
 * and GA4's inline copy): campaign names by the raw rule of `utmShape.ts`, values only with the shape.
 */
const SHAPED_CASES: Array<[string, string]> = [
  ['https://diboas.com/en/delete-confirm?token=abc123', 'https://diboas.com/en/delete-confirm'],
  ['/api/x?email=ana%40example.com', '/api/x'],
  ['https://diboas.com/u/ana%40example.com/x', 'https://diboas.com/u/[EMAIL_REDACTED]/x'],
  ['https://diboas.com/a#token=x', 'https://diboas.com/a'],
  [
    'https://diboas.com/?utm_source=ig&utm_campaign=w1&x=1',
    'https://diboas.com/?utm_source=ig&utm_campaign=w1',
  ],
  // upper case lower-cased; the 37/38-character boundary
  ['/?utm_source=Newsletter', '/?utm_source=newsletter'],
  [`/?utm_campaign=a${'b'.repeat(36)}`, `/?utm_campaign=a${'b'.repeat(36)}`],
  [`/?utm_campaign=a${'b'.repeat(37)}`, '/'],
  // a value that does not have the shape is dropped, not rewritten
  ['https://diboas.com/?utm_term=ana@example.com', 'https://diboas.com/'],
  ['/?utm_source=Bad!&utm_source=ok', '/'],
  // first occurrence wins; names compared raw (an encoded or upper-case name is not a campaign key)
  ['/?utm_source=a&utm_source=b', '/?utm_source=a'],
  ['/?utm%5Fsource=x', '/'],
  ['/?UTM_SOURCE=x', '/'],
  ['/?utm_campaign=spring+', '/?utm_campaign=spring'],
  ['/?utm_source', '/'],
  // pieces split on `?` too: what PostHog masks, the site reads
  ['/?a=1?utm_source=x', '/?utm_source=x'],
  ['/?ref=Y?utm_source=x', '/?ref=Y%3Futm_source%3Dx&utm_source=x'],
  ['/en#?utm_source=x', '/en'],
  [
    'https://diboas.com/en?ref=REFABCD12&utm_medium=email',
    'https://diboas.com/en?ref=REFABCD12&utm_medium=email',
  ],
  ['/en/tools/money-jobs?for=business&token=x', '/en/tools/money-jobs?for=business'],
  ['https://diboas.com/en/learn', 'https://diboas.com/en/learn'],
  ['', ''],
];

describe('scrubUrl', () => {
  it.each(CASES)('should scrub %s to %s', (input, expected) => {
    expect(scrubUrl(input)).toBe(expected);
  });

  it('should drop the query and fragment, never throw, when the URL cannot be parsed', () => {
    expect(scrubUrl('http://[bad?token=x')).toBe('http://[bad');
    expect(scrubUrl('http://[bad/ana@example.com#x')).toBe('http://[bad/[EMAIL_REDACTED]');
  });

  it('should keep only two public switches by default (campaign values are opt-in, shaped)', () => {
    expect([...SAFE_QUERY_PARAMS].sort()).toEqual(['for', 'ref']);
  });

  it.each(SHAPED_CASES)('should scrub %s to %s with shaped campaign values', (input, expected) => {
    expect(scrubUrl(input, { campaign: 'shaped' })).toBe(expected);
  });

  it('should drop the query of an unparseable URL in shaped mode too', () => {
    expect(scrubUrl('http://[bad?utm_source=x', { campaign: 'shaped' })).toBe('http://[bad');
  });
});

describe('SCRUB_URL_INLINE_JS_SHAPED (GA4 inline bootstrap)', () => {
  it.each(SHAPED_CASES)('should agree with the shaped scrubUrl on %s', (input, expected) => {
    expect(inline(input)).toBe(expected);
  });

  it('should agree with the shaped scrubUrl when the URL cannot be parsed', () => {
    expect(inline('http://[bad?token=x')).toBe(
      scrubUrl('http://[bad?token=x', { campaign: 'shaped' })
    );
  });
});

describe('scrubUrlsInText', () => {
  it('should scrub every URL inside free text and leave the rest', () => {
    expect(
      scrubUrlsInText('GET /en/delete-confirm?token=abc then https://diboas.com/x?t=1&ref=R1 ok')
    ).toBe('GET /en/delete-confirm then https://diboas.com/x?ref=R1 ok');
    expect(scrubUrlsInText('see https://diboas.com/x?utm_source=ig&ref=R1')).toBe(
      'see https://diboas.com/x?ref=R1'
    );
    expect(scrubUrlsInText('no url here, a/b and 50%')).toBe('no url here, a/b and 50%');
  });
});
