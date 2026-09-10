import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

const GATED = ['handle-claim', 'practice-record'];

/**
 * The edge middleware's two duties and — the part worth a test — their ORDER.
 *
 * `1c` moved the bare-path locale redirect here, out of the deleted
 * `app/page.tsx`, because `[locale]` had to become the root layout for
 * `<html lang>` to be correct at all (`5.203`). That put a redirect in the same
 * function as the CN/RU/KP geofence, so the order became load-bearing: a
 * refused visitor asking for `/` must be REFUSED, never handed a redirect into
 * the app. That is a covenant, not a preference.
 *
 * Every expectation is derived from the stated contracts — the geofence's exact
 * set and its 451, and `detectSandboxLocale`'s documented chain (saved cookie →
 * Accept-Language → default) — not from running the code.
 */

const BASE = 'https://app.diboas.com';

function request(
  path: string,
  {
    country,
    acceptLanguage,
    cookie,
  }: { country?: string; acceptLanguage?: string; cookie?: string } = {}
) {
  const headers = new Headers();
  if (country) headers.set('x-vercel-ip-country', country);
  if (acceptLanguage) headers.set('accept-language', acceptLanguage);
  if (cookie) headers.set('cookie', `NEXT_LOCALE=${cookie}`);
  return new NextRequest(new URL(path, BASE), { headers });
}

/** Where a redirect or rewrite points, path only. */
function target(res: Response): string {
  const to = res.headers.get('location') ?? res.headers.get('x-middleware-rewrite');
  return new URL(to ?? BASE).pathname;
}

describe('the bare path picks a language (1c, 5.203)', () => {
  it('should send / to the default locale when the visitor states no preference', () => {
    const res = middleware(request('/'));
    expect(res.status).toBe(307);
    expect(target(res)).toBe('/en');
  });

  it('should honour Accept-Language, including a regional variant of a supported language', () => {
    // `de-AT` is not a supported locale; its primary subtag is. The documented
    // chain resolves by primary subtag, so an Austrian visitor gets German.
    expect(target(middleware(request('/', { acceptLanguage: 'de-AT,de;q=0.9' })))).toBe('/de');
    expect(target(middleware(request('/', { acceptLanguage: 'pt-BR,pt;q=0.9' })))).toBe('/pt-BR');
    expect(target(middleware(request('/', { acceptLanguage: 'es-419,es;q=0.8' })))).toBe('/es');
  });

  it('should let the SAVED choice beat the browser, because the user chose it deliberately', () => {
    // The LocaleSwitcher writes NEXT_LOCALE. A returning visitor must land in
    // the language they picked, not the one their browser advertises.
    expect(target(middleware(request('/', { cookie: 'es', acceptLanguage: 'de' })))).toBe('/es');
  });

  it('should ignore an unsupported or junk saved value rather than trusting it', () => {
    expect(target(middleware(request('/', { cookie: 'fr' })))).toBe('/en');
    expect(target(middleware(request('/', { cookie: '../evil' })))).toBe('/en');
  });

  it('should carry the query string into the localized path', () => {
    /**
     * A BEHAVIOUR CHANGE found by the 2026-09-10 audit, pinned so it is a
     * decision rather than an accident. The deleted `app/page.tsx` called
     * `redirect(`/${locale}`)`, which DROPPED the query — so a shared link
     * carrying `?utm_source=…` lost its attribution at the front door.
     * `req.nextUrl.clone()` preserves it. Same origin either way: the URL is
     * cloned from the request and only its pathname is replaced.
     */
    const res = middleware(request('/?utm_source=x&ref=y'));
    const to = new URL(res.headers.get('location') ?? '');
    expect(to.pathname).toBe('/en');
    expect(to.search).toBe('?utm_source=x&ref=y');
  });

  it('should resolve every hostile locale input to a same-origin path from the closed set', () => {
    // Principle 8: the cookie and `Accept-Language` are untrusted input feeding
    // a redirect. `detectSandboxLocale` returns only one of four literals, so
    // there is no open-redirect or header-injection surface — asserted rather
    // than assumed, because the redirect target is attacker-adjacent.
    for (const value of ['//evil.com', '../../etc/passwd', 'https://evil.com', '%2F%2Fevil.com']) {
      const res = middleware(request('/', { cookie: value }));
      const to = new URL(res.headers.get('location') ?? '');
      expect(to.origin).toBe(BASE);
      expect(['/en', '/de', '/es', '/pt-BR']).toContain(to.pathname);
    }
  });

  it('should be unable to receive a CRLF-injected cookie in the first place', () => {
    // The header-injection case cannot even be CONSTRUCTED: the platform's
    // `Headers` refuses a value containing CRLF, so the defence sits below this
    // code rather than in it. Asserted so the reasoning is on record — an
    // untested claim of "not possible" is just a claim.
    expect(() => request('/', { cookie: 'en\r\nX-Injected: 1' })).toThrow();
  });

  it('should leave every already-localized path alone', () => {
    // The redirect is for `/` only; anything else must fall through to routing.
    for (const path of ['/en', '/de/welcome', '/pt-BR/goals', '/api/health']) {
      const res = middleware(request(path));
      expect(res.headers.get('location')).toBeNull();
      expect(res.status).toBe(200); // NextResponse.next()
    }
  });
});

describe('the geofence decides FIRST — the covenant this reordering could have broken', () => {
  it.each(['CN', 'RU', 'KP'])('should refuse %s with 451, not a redirect, even at /', (country) => {
    // The whole point of the ordering: at `/` both rules match. If the redirect
    // ran first, a blocked visitor would be sent into the app and only refused
    // on the next request — and a redirect is not a refusal.
    const res = middleware(request('/', { country }));
    expect(res.status).toBe(451);
    expect(res.headers.get('location')).toBeNull();
    expect(target(res)).toBe('/en/unavailable');
  });

  it('should refuse a blocked country on interior paths and on the API', () => {
    for (const path of ['/en/welcome', '/de/goals', '/api/health']) {
      expect(middleware(request(path, { country: 'CN' })).status).toBe(451);
    }
  });

  it('should route the refusal to the requested language, so the notice is readable', () => {
    expect(target(middleware(request('/de/goals', { country: 'RU' })))).toBe('/de/unavailable');
    expect(target(middleware(request('/pt-BR/goals', { country: 'CN' })))).toBe(
      '/pt-BR/unavailable'
    );
  });

  it('should keep the blocked set EXACTLY CN/RU/KP and let everyone else through', () => {
    // Do-not-regress: the set is a Legal covenant, not a tunable.
    for (const country of ['BR', 'DE', 'US', 'PT', 'ES', 'GB', 'CH', 'HK', 'TW', 'BY', 'IR']) {
      expect(middleware(request('/en/welcome', { country })).status).toBe(200);
    }
  });
});

describe('a capability that is off is refused BEFORE anything renders (5.270)', () => {
  afterEach(() => {
    delete process.env.PRACTICE_ACCOUNTS_ENABLED;
  });

  it.each(GATED)('should rewrite /%s to the localized 404 with a REAL 404 status', (segment) => {
    /**
     * The defect this closes: the page-level `notFound()` fires and the screen
     * never renders, but `(app)/layout.tsx` is async (`await cookies()`), so the
     * document has already begun streaming — headers are sent and the status
     * stays 200. A soft 404 tells crawlers and monitors the page exists.
     * Middleware is the only layer structurally earlier than a layout.
     */
    const res = middleware(request(`/de/${segment}`));
    expect(res.status).toBe(404);
    expect(target(res)).toBe('/de/missing');
    // A rewrite, never a redirect: the visitor keeps the URL they asked for.
    expect(res.headers.get('location')).toBeNull();
  });

  it('should refuse in the language that was asked for', () => {
    for (const locale of ['en', 'de', 'es', 'pt-BR']) {
      expect(target(middleware(request(`/${locale}/handle-claim`)))).toBe(`/${locale}/missing`);
    }
  });

  it('should let the routes THROUGH once the capability is explicitly enabled (P-Q2)', () => {
    // Preserve capability, not placement: the flag opens the door again, and
    // the screens render as built. A permanent block here would delete a
    // capability the register requires to survive.
    process.env.PRACTICE_ACCOUNTS_ENABLED = 'true';
    for (const segment of GATED) {
      const res = middleware(request(`/en/${segment}`));
      expect(res.status).toBe(200); // NextResponse.next()
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    }
  });

  it('should not refuse a route that merely CONTAINS a gated name', () => {
    // Segment equality, not substring: `/en/handle-claim-history` is not the
    // gated route and must not be swallowed by it.
    const res = middleware(request('/en/handle-claim-history'));
    expect(res.status).toBe(200);
  });

  it('should still let the GEOFENCE decide first, even on a gated route', () => {
    // Ordering again: a refused country asking for a gated path must get the
    // 451, not the 404 — the covenant outranks the capability.
    const res = middleware(request('/de/handle-claim', { country: 'CN' }));
    expect(res.status).toBe(451);
    expect(target(res)).toBe('/de/unavailable');
  });
});
