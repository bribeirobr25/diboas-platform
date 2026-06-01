import { NextRequest, NextResponse } from 'next/server';
import { detectLocaleFromPath, detectPreferredLocale } from '@diboas/i18n/config';

/**
 * Middleware: CSP nonce generation + i18n locale detection
 *
 * Security: Per-request nonce eliminates 'unsafe-inline' for scripts.
 * The nonce is forwarded via the x-nonce response header so layout.tsx can
 * read it and pass it to <Script> components.
 *
 * Locale detection chain: cookie (NEXT_LOCALE) → Accept-Language → default (en)
 * Uses shared detectPreferredLocale from @diboas/i18n (single source of truth).
 *
 * Root "/" redirect is handled by app/page.tsx — Next.js 16 routes "/" to
 * the page component before middleware can intercept it.
 */

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest): NextResponse {
  try {
    // F4 (2026-05-29): CSP nonce as base64 of 16 random bytes per RFC 7762 §1
    // and CSP Level 3 recommendation. UUID format embeds hyphens and is outside
    // the canonical CSP nonce charset (`A-Za-z0-9+/=`). Web Crypto API only —
    // Edge Runtime has no `node:crypto`. `crypto.getRandomValues` + `btoa` are
    // globally available in Edge.
    const nonceBytes = new Uint8Array(16);
    crypto.getRandomValues(nonceBytes);
    const nonce = btoa(String.fromCharCode(...nonceBytes));
    const requestId = crypto.randomUUID();
    const isDev = process.env.NODE_ENV !== 'production';
    const { pathname, search } = request.nextUrl;

    // Build CSP with nonce — 'unsafe-inline' removed for scripts in production.
    //
    // PostHog assets (2026-06-01): the PostHog SDK loads `array.js` and other
    // dynamic helpers (`recorder.js`, `surveys.js`, etc.) from a separate
    // assets host derived by string-replacing `.i.posthog.com` → `-assets.i.posthog.com`
    // on `api_host`. For US Cloud that's `https://us-assets.i.posthog.com`; for
    // EU it's `https://eu-assets.i.posthog.com`. The `https://*-assets.i.posthog.com`
    // pattern covers both regions without needing future middleware edits when
    // PostHog migrates or self-hosting changes. Event ingest (POST traffic) goes
    // to `connect-src` instead (see below).
    const scriptSrc = isDev
      ? `'self' 'unsafe-eval' 'nonce-${nonce}' https://vercel.live https://nextjs.org https://*.googletagmanager.com https://*.google-analytics.com https://*-assets.i.posthog.com`
      : `'self' 'nonce-${nonce}' https://vercel.live https://*.googletagmanager.com https://*.google-analytics.com https://*-assets.i.posthog.com`;

    const csp = [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      // Phase 5.1.a (audit/2026-05-09): Sentry session-replay spawns a worker
      // from a `blob:` URL. Without an explicit `worker-src` directive, the
      // browser falls back to `script-src` (which excludes `blob:`) and
      // blocks the worker — net effect: replay never captures sessions in
      // production. `'self' blob:` keeps the scope narrow (workers only,
      // not scripts) and the source is trusted (Sentry SDK code).
      `worker-src 'self' blob:`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://diboas.com https://cdn.diboas.com${isDev ? ' http://localhost:* https://localhost:*' : ''}`,
      `font-src 'self' data:`,
      // Added 2026-05-07 (audit/A.0.5) so Phase A.3's video player can fetch
      // from cdn.diboas.com. Without this directive, <video src="..."> falls
      // back to default-src 'self' and CDN URLs are blocked.
      `media-src 'self' https://cdn.diboas.com${isDev ? ' http://localhost:* https://localhost:*' : ''}`,
      // 2026-05-14 (iter-2 CC5): adds `api.diboas-analytics.com` (analytics
      // product's API) to support SDK fetches when iteration 5 swaps the mock
      // for the real `@analytics-platform/client`. Staging origin gated on
      // `isDev` to keep production CSP minimal. Mock mode (iter-2 / iter-3)
      // makes no cross-origin fetches, but the allowlist is in place before
      // the swap so production never ships a broken CSP.
      `connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com https://api.diboas-analytics.com${isDev ? ' https://staging.api.diboas-analytics.com' : ''} https://app.posthog.com https://*.posthog.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net${isDev ? ' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
      `frame-ancestors 'none'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self' https://diboas.com https://app.diboas.com`,
    ].join('; ');

    // If no locale in path, redirect using detection chain
    const localeInPath = detectLocaleFromPath(pathname);
    if (!localeInPath && pathname !== '/') {
      const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
      const acceptLang = request.headers.get('Accept-Language');
      const detectedLocale = detectPreferredLocale(cookieLocale, acceptLang);
      const redirectUrl = new URL(`/${detectedLocale}${pathname}${search}`, request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('Content-Security-Policy', csp);
      response.headers.set('x-nonce', nonce);
      response.headers.set('x-request-id', requestId);
      return response;
    }

    // Root "/" redirect is handled by app/page.tsx (preserves query params).
    // Next.js 16 routes "/" to the page component before this middleware block executes.

    // Set nonce and request ID in request headers for downstream use (layout.tsx)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('x-request-id', requestId);
    // V3 (audit/2026-05-08 visual review): expose detected locale to the
    // root layout so SSR can emit `<html lang={locale}>` per request.
    // Falls back to 'en' for the root '/' path (which redirects).
    if (localeInPath) {
      requestHeaders.set('x-locale', localeInPath);
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    response.headers.set('x-request-id', requestId);

    if (localeInPath) {
      response.headers.set('Content-Language', localeInPath);
    }

    return response;
  } catch (error) {
    // Middleware runs on every request — a crash here returns 500 for the entire site.
    // Fail open: allow the request through without CSP nonce rather than break the site.
    // Edge Runtime: Logger unavailable (no localStorage). console.error is correct here.
    console.error('[middleware] Unhandled error — failing open:', error);

    let requestId: string | undefined;
    try {
      requestId = crypto.randomUUID();
    } catch {
      // crypto may be unavailable in edge runtime error scenarios
    }

    const response = NextResponse.next();
    if (requestId) {
      response.headers.set('x-request-id', requestId);
    }
    return response;
  }
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes.
    // `\.well-known/` added 2026-05-30 (Phase 1 fallback step 1.3.b per
    // SECURITY_IMPLEMENTATION_PLAN_2026-05-27.md §3 Step 1.3): production U4
    // confirmed the matcher was redirecting `/.well-known/security.txt` to
    // `/en/.well-known/security.txt` (307), which violates RFC 9116 — the file
    // must serve as 200 plain text at the canonical path. The literal
    // `security.txt` token excludes `/security.txt` (root) but does NOT cover
    // the nested `/.well-known/security.txt`. The Vercel `/.well-known is
    // reserved` doc note was hopeful but production disproved it — middleware
    // does run on this path. Trailing slash matches `assets/` convention.
    '/((?!api|_next/static|_next/image|favicon|robots.txt|sitemap.xml|security.txt|\\.well-known/|assets/|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
