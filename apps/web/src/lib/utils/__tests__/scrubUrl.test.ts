import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { SAFE_QUERY_PARAMS, SCRUB_URL_INLINE_JS, scrubUrl, scrubUrlsInText } from '../scrubUrl';

/**
 * The browser copy GA4's inline bootstrap runs, compiled in a fresh context that holds only what a
 * browser gives it here (`URL`, `URLSearchParams`), so it cannot lean on anything from this file.
 */
const inline = runInNewContext(`(${SCRUB_URL_INLINE_JS})`, { URL, URLSearchParams }) as (
  u: string
) => string;

/** [input, expected] — every case runs through BOTH implementations. */
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
  // allowlisted parameters survive, unknown ones do not
  [
    'https://diboas.com/?utm_source=ig&utm_campaign=w1&x=1',
    'https://diboas.com/?utm_source=ig&utm_campaign=w1',
  ],
  ['https://diboas.com/en?ref=REFABCD12', 'https://diboas.com/en?ref=REFABCD12'],
  ['/en/tools/money-jobs?for=business&token=x', '/en/tools/money-jobs?for=business'],
  [
    'https://diboas.com/?utm_term=ana@example.com',
    'https://diboas.com/?utm_term=%5BEMAIL_REDACTED%5D',
  ],
  // nothing to scrub: returned as given
  ['https://diboas.com/en/learn', 'https://diboas.com/en/learn'],
  ['/en/about', '/en/about'],
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

  it('should keep an allowlist of campaign tags and two public switches only', () => {
    expect([...SAFE_QUERY_PARAMS].sort()).toEqual(
      ['for', 'ref', 'utm_campaign', 'utm_content', 'utm_medium', 'utm_source', 'utm_term'].sort()
    );
  });
});

describe('SCRUB_URL_INLINE_JS (GA4 inline bootstrap)', () => {
  it.each(CASES)('should agree with scrubUrl on %s', (input, expected) => {
    expect(inline(input)).toBe(expected);
  });

  it('should agree with scrubUrl when the URL cannot be parsed', () => {
    expect(inline('http://[bad?token=x')).toBe(scrubUrl('http://[bad?token=x'));
  });
});

describe('scrubUrlsInText', () => {
  it('should scrub every URL inside free text and leave the rest', () => {
    expect(
      scrubUrlsInText('GET /en/delete-confirm?token=abc then https://diboas.com/x?t=1&ref=R1 ok')
    ).toBe('GET /en/delete-confirm then https://diboas.com/x?ref=R1 ok');
    expect(scrubUrlsInText('no url here, a/b and 50%')).toBe('no url here, a/b and 50%');
  });
});
