import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

/**
 * 5.861 (twelfth audit) — NO ROUTE TAKES AN EMAIL ADDRESS IN ITS URL.
 *
 * `GET /api/waitlist/signup?email=` and `GET /api/waitlist/position?email=` put the address in
 * the query string, which reaches request logs and, on a server error, Sentry's `extra.path`.
 * The position lookup also leaked whether an email was on the list (its dummy rotated each UTC
 * day; a real code never changed). Nothing called either, and both were removed. An email
 * reaches a route only in a POST body.
 *
 * Scope limit: matches `searchParams.get/getAll/set/append/has('email')`, a `URLSearchParams({ email })`
 * object, and an `?email=` built into a URL string, anywhere under `src/` (comments stripped).
 * An email carried under a differently named parameter is not matched.
 */

const SRC = resolve(__dirname, '../../..');
const APP = join(SRC, 'app');
/** Reading `email` from a query (get/getAll) or writing one into a URL (set/append, a params object). */
const EMAIL_PARAM =
  /searchParams\s*\.\s*(?:get|getAll|set|append|has)\s*\(\s*['"`]email['"`]|new\s+URLSearchParams\s*\(\s*\{[^}]*\bemail\b/;
const EMAIL_IN_URL = /[?&]email=/;

const files = (dir: string, keep: (name: string) => boolean): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === '__tests__' || name === 'node_modules' ? [] : files(path, keep);
    return keep(name) ? [path] : [];
  });

/** Parse only files whose raw text could match: comment-stripping parses, and parsing all of src is slow. */
const hits = (f: string, re: RegExp): boolean => {
  const raw = readFileSync(f, 'utf8');
  return re.test(raw) && re.test(stripComments(raw, f));
};

describe('5.861 · no route takes an email address in its URL', { timeout: 30_000 }, () => {
  it('should read every API route (non-vacuity)', () => {
    expect(files(join(APP, 'api'), (n) => n === 'route.ts').length).toBeGreaterThanOrEqual(10);
  });

  it('should read or write no email in any query string, in routes, pages or library code', () => {
    const offenders = files(SRC, (n) => /\.(ts|tsx)$/.test(n) && !/\.(test|stories)\./.test(n))
      .filter((f) => hits(f, EMAIL_PARAM))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it('should build no URL that carries an email in its query', () => {
    const offenders = files(SRC, (n) => /\.(ts|tsx)$/.test(n) && !/\.(test|stories)\./.test(n))
      .filter((f) => hits(f, EMAIL_IN_URL))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it('should match the reads it exists to catch (detector self-test)', () => {
    for (const bad of [
      "const email = searchParams.get('email');",
      'request.nextUrl.searchParams .get( "email" )',
      "searchParams.getAll('email')", // thirteenth audit: three forms passed the first guard
      "url.searchParams.set('email', email)",
      "fetch('/api/x?' + new URLSearchParams({ email }))",
    ])
      expect(EMAIL_PARAM.test(bad), bad).toBe(true);
    expect(EMAIL_IN_URL.test('fetch(`/api/waitlist/position?email=${e}`)')).toBe(true);
    expect(EMAIL_IN_URL.test('fetch(`/api/x?a=1&email=${e}`)')).toBe(true);
    expect(EMAIL_PARAM.test("searchParams.get('t')")).toBe(false);
    expect(EMAIL_IN_URL.test("const label = 'email';")).toBe(false);
  });
});
