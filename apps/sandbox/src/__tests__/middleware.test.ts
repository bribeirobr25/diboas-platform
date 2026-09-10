import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

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
