import { describe, expect, it } from 'vitest';
// Next's own compiler for `config.matcher` — the same function the build uses, so the test
// reads the regex Next will actually run, not a re-implementation of it. It is exported at
// runtime but absent from Next's type declarations, hence the one narrow type below; if a
// Next upgrade renames or removes it, this test fails loudly instead of passing vacuously.
import * as nextStaticInfo from 'next/dist/build/analysis/get-page-static-info';
import { config } from '../middleware';

const { getMiddlewareMatchers } = nextStaticInfo as unknown as {
  getMiddlewareMatchers: (matcher: unknown, nextConfig: object) => { regexp: string }[];
};

/**
 * REQUIREMENT: the CN/RU/KP geofence and the nonce CSP are EDGE-enforced on every
 * page (covenant; `CSP-1`). The matcher may skip only real static files.
 *
 * The defect this pins: the static-file exclusion `.*\.(png|…|txt|…)$` matched the
 * extension at ANY depth, so `/en/goals/x.png` — which still renders the dynamic
 * `goals/[id]` page — skipped the middleware entirely: no geofence, no CSP. Every
 * public asset lives at the root (`public/*`, `app/favicon.ico`), so the exclusion is
 * now limited to root-level files. This tightens the guard; nothing is relaxed.
 */
type HasHeader = { key: string; value?: RegExp };
type Compiled = { re: RegExp; headers: HasHeader[] };
const matchers: Compiled[] = getMiddlewareMatchers(config.matcher, {}).map((m) => {
  const { regexp, has = [] } = m as {
    regexp: string;
    has?: { type: string; key: string; value?: string }[];
  };
  /* Only header conditions are used here; any other kind would be unmodelled, so fail. */
  for (const h of has) if (h.type !== 'header') throw new Error(`unmodelled has: ${h.type}`);
  /* Next matches a `value` as `^value$` against the header (`prepare-destination.js`
     `matchHas`); a `has` without a value only requires the header to be present. */
  return {
    re: new RegExp(regexp),
    headers: has.map((h) => ({
      key: h.key.toLowerCase(),
      value: h.value === undefined ? undefined : new RegExp(`^${h.value}$`),
    })),
  };
});
it('should compile the matcher with Next’s own function (never vacuous)', () => {
  expect(matchers.length).toBeGreaterThan(0);
});
/** Does middleware run for this path, given the request headers? (`has` honoured, values too.) */
const runsMiddleware = (path: string, headers: Record<string, string> = {}) =>
  matchers.some(
    (m) =>
      m.re.test(path) &&
      m.headers.every((h) => h.key in headers && (!h.value || h.value.test(headers[h.key])))
  );

describe('middleware matcher (geofence + CSP coverage)', () => {
  it('should run on a page whose LAST segment looks like a file (the bypass)', () => {
    for (const path of [
      '/en/goals/x.png',
      '/de/goals/q.svg',
      '/pt-BR/goals/a.txt',
      '/es/goals/b.xml',
    ]) {
      expect(runsMiddleware(path), path).toBe(true);
    }
  });

  it('should run on ordinary pages and API routes', () => {
    for (const path of ['/', '/en', '/en/goals/abc', '/en/claim', '/api/market']) {
      expect(runsMiddleware(path), path).toBe(true);
    }
  });

  it('should still skip the real root-level static files and Next internals', () => {
    for (const path of [
      '/hero-welcome.png',
      '/hero-welcome-dark.png',
      '/logo-wordmark.webp',
      '/robots.txt',
      '/favicon.ico',
      '/_next/static/chunks/app.js',
      '/_next/image',
    ]) {
      expect(runsMiddleware(path), path).toBe(false);
    }
  });
});

describe('a server action reaches middleware at ANY path (lane audit 2026-10-20)', () => {
  it('should run on an action POST even where a root static-file name would be skipped', () => {
    for (const path of ['/x.png', '/en.png', '/robots.txt', '/en/goals/x.png', '/en/gate']) {
      expect(runsMiddleware(path, { 'next-action': 'a1' }), path).toBe(true);
    }
  });

  it('should still skip real root files when no action header is present', () => {
    for (const path of ['/x.png', '/robots.txt', '/hero-welcome.png']) {
      expect(runsMiddleware(path), path).toBe(false);
    }
  });
});

describe('a headerless FORM action reaches middleware at any path (2026-10-20 validation)', () => {
  /* Next treats a multipart body (and, unsupported but classified, an urlencoded one) as a
     possible server action with NO `Next-Action` header — measured on a production build:
     such a POST at `/x.png` skipped middleware entirely. */
  it('should run on a multipart or urlencoded POST at a root static-looking path', () => {
    for (const contentType of [
      'multipart/form-data; boundary=test',
      'application/x-www-form-urlencoded',
      'application/x-www-form-urlencoded;charset=UTF-8',
    ]) {
      expect(runsMiddleware('/x.png', { 'content-type': contentType }), contentType).toBe(true);
    }
  });

  it('should still skip real static files fetched with no form body', () => {
    const cases: Record<string, string>[] = [
      {},
      { 'content-type': 'image/png' },
      { 'content-type': 'text/plain' },
    ];
    for (const headers of cases) {
      expect(runsMiddleware('/hero-welcome.png', headers), JSON.stringify(headers)).toBe(false);
      expect(runsMiddleware('/robots.txt', headers), JSON.stringify(headers)).toBe(false);
    }
  });
});
