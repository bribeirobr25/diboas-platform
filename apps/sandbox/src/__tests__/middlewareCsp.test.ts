import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

/**
 * The Content-Security-Policy the middleware attaches (`5.212`).
 *
 * REQUIREMENT: `app.diboas.com` shipped NO CSP while `diboas.com` served a full
 * nonce-based one — verified against production headers before this change. The
 * policy here is deliberately TIGHTER than the marketing site's, and each
 * narrowing is a measured fact rather than a preference:
 *
 *   connect-src 'self'  — the market providers are instantiated ONLY in
 *                         `app/api/market/route.ts` and `.../history/route.ts`,
 *                         so every external call is server-side and the browser
 *                         never contacts yields.llama.fi or api.coingecko.com.
 *   font-src 'self'     — `next/font/google` self-hosts Fraunces at build time;
 *                         the served document names no Google font host.
 *   no analytics hosts  — the app ships none (INSTRUMENTATION_CONTRACT is
 *                         documentation-only; nothing fires).
 *
 * Kept in its own file so a CSP failure never reads as a geofence failure:
 * `middleware.test.ts` guards the ORDER of the security decisions, this guards
 * the headers that ride along with them.
 */

const BASE = 'https://app.diboas.com';

function request(path: string, country?: string) {
  const headers = new Headers();
  if (country) headers.set('x-vercel-ip-country', country);
  return new NextRequest(new URL(path, BASE), { headers });
}

const csp = (path: string, country?: string) =>
  middleware(request(path, country)).headers.get('Content-Security-Policy') ?? '';

describe('the CSP rides on EVERY response path (5.212)', () => {
  /**
   * The claim worth testing: not "a CSP exists" but that no branch forgets it.
   * The middleware has six response-producing paths — the 451 geofence rewrite,
   * the bare-path redirect, the API passthrough, the capability 404, the direct
   * /missing 404, and the ordinary next(). A policy attached to the happy path
   * only is the shape this test exists to refuse.
   */
  const paths: ReadonlyArray<[string, string, string | undefined]> = [
    ['geofence 451 rewrite', '/en/goals', 'CN'],
    ['bare-path locale redirect', '/', undefined],
    ['API passthrough', '/api/market', undefined],
    ['capability-gated 404 rewrite', '/en/handle-claim', undefined],
    ['direct /missing 404 rewrite', '/en/missing', undefined],
    ['ordinary page', '/en/welcome', undefined],
  ];

  it.each(paths)('should set the policy on the %s', (_label, path, country) => {
    expect(csp(path, country)).toContain("default-src 'self'");
  });

  it.each(paths)('should set x-nonce on the %s', (_label, path, country) => {
    const res = middleware(request(path, country));
    expect(res.headers.get('x-nonce')).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });
});

describe('the policy says what it must, and refuses what it must', () => {
  it('should carry a nonce in script-src, and NEVER unsafe-inline for scripts', () => {
    const policy = csp('/en/welcome');
    const scriptSrc = policy.split('; ').find((d) => d.startsWith('script-src')) ?? '';
    expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/]+={0,2}'/);
    // CLAUDE.md § Security: 'unsafe-inline' is prohibited for scripts. The three
    // inline scripts in the document (ThemeScript + two Next RSC bootstraps) are
    // covered by the nonce instead.
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('should keep the nonce in the header and the response IDENTICAL, or the script is blocked', () => {
    // The plumbing contract: the layout reads `x-nonce` and puts that value on
    // the inline script. If the header and the policy ever disagree, the theme
    // script is blocked and the page silently flashes the wrong design.
    const res = middleware(request('/en/welcome'));
    const nonce = res.headers.get('x-nonce');
    expect(nonce).toBeTruthy();
    expect(res.headers.get('Content-Security-Policy')).toContain(`'nonce-${nonce}'`);
  });

  it('should scope connect-src to self, because every market call is server-side', () => {
    const policy = csp('/en/welcome');
    const connect = policy.split('; ').find((d) => d.startsWith('connect-src')) ?? '';
    expect(connect).toContain("'self'");
    expect(connect).not.toContain('llama.fi');
    expect(connect).not.toContain('coingecko');
  });

  it('should scope font-src to self, because next/font self-hosts the typeface', () => {
    expect(csp('/en/welcome')).toContain("font-src 'self'");
    expect(csp('/en/welcome')).not.toContain('fonts.gstatic.com');
    expect(csp('/en/welcome')).not.toContain('fonts.googleapis.com');
  });

  it('should refuse framing in both directions — the app embeds nothing and may not be embedded', () => {
    const policy = csp('/en/welcome');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("frame-src 'none'");
  });

  it('should NOT send upgrade-insecure-requests, which breaks any HTTP origin', () => {
    // Found by the visual pass, not by a unit test: the directive rewrites every
    // subresource to https://, so on a plain-HTTP origin (local `next start`,
    // a LAN preview) every asset request fails with ERR_SSL_PROTOCOL_ERROR
    // (20 on the Home document, 24 across the four screens walked) and the app
    // renders with no CSS, fonts or JS.
    // Production is already HTTPS-only via HSTS, so it buys nothing there.
    // The live diboas.com policy omits it as well.
    expect(csp('/en/welcome')).not.toContain('upgrade-insecure-requests');
  });

  it('should lock object-src, base-uri and form-action', () => {
    const policy = csp('/en/welcome');
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
  });

  it('should mint a DIFFERENT nonce per request, or the nonce is decoration', () => {
    const a = middleware(request('/en/welcome')).headers.get('x-nonce');
    const b = middleware(request('/en/welcome')).headers.get('x-nonce');
    expect(a).not.toBe(b);
  });

  it('should not weaken the geofence it now shares a function with', () => {
    // The order is load-bearing (geofence → locale → capability). Adding headers
    // must not let a refused visitor through: still 451, still no redirect.
    const res = middleware(request('/', 'RU'));
    expect(res.status).toBe(451);
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });
});

describe('a CSP that cannot be built must not take the covenants with it', () => {
  /**
   * This guards a defect of MINE, found by reading the diff rather than by any
   * test: the nonce mint's `catch` used to `return NextResponse.next()`, and
   * that return sat ABOVE the geofence. A thrown `getRandomValues` would then
   * have served a refused country and skipped every capability refusal — a
   * defence-in-depth header disabling a compliance covenant.
   *
   * The CSP is best-effort. The geofence is not.
   */
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const breakMinting = () =>
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(() => {
      throw new Error('no entropy');
    });

  it('should still refuse a geofenced country with 451 when the nonce cannot be minted', () => {
    breakMinting();
    const res = middleware(request('/en/goals', 'CN'));
    expect(res.status).toBe(451);
    expect(res.headers.get('location')).toBeNull();
  });

  it('should still refuse a capability-gated path with 404 when the nonce cannot be minted', () => {
    breakMinting();
    expect(middleware(request('/en/handle-claim')).status).toBe(404);
  });

  it('should send NO policy rather than one carrying an empty nonce', () => {
    // `script-src 'nonce-'` matches nothing: it would block Next's own RSC
    // bootstrap and render a blank page. Absent beats broken.
    breakMinting();
    const res = middleware(request('/en/welcome'));
    expect(res.headers.get('Content-Security-Policy')).toBeNull();
    expect(res.headers.get('x-nonce')).toBeNull();
  });

  it('should prove the sabotage actually bites — the policy IS present without it', () => {
    // Without this control the three tests above could pass because the CSP was
    // never attached on any path, rather than because the mint failed.
    expect(csp('/en/welcome')).toContain("default-src 'self'");
    expect(middleware(request('/en/welcome')).headers.get('x-nonce')).toBeTruthy();
  });
});
