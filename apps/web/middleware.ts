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
    const nonce = crypto.randomUUID();
    const requestId = crypto.randomUUID();
    const isDev = process.env.NODE_ENV !== 'production';
    const { pathname, search } = request.nextUrl;

    // Build CSP with nonce — 'unsafe-inline' removed for scripts in production
    const scriptSrc = isDev
      ? `'self' 'unsafe-eval' 'nonce-${nonce}' https://vercel.live https://nextjs.org https://*.googletagmanager.com https://*.google-analytics.com`
      : `'self' 'nonce-${nonce}' https://vercel.live https://*.googletagmanager.com https://*.google-analytics.com`;

    const csp = [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://diboas.com https://cdn.diboas.com${isDev ? ' http://localhost:* https://localhost:*' : ''}`,
      `font-src 'self' data:`,
      // Added 2026-05-07 (audit/A.0.5) so Phase A.3's video player can fetch
      // from cdn.diboas.com. Without this directive, <video src="..."> falls
      // back to default-src 'self' and CDN URLs are blocked.
      `media-src 'self' https://cdn.diboas.com${isDev ? ' http://localhost:* https://localhost:*' : ''}`,
      `connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com https://app.posthog.com https://*.posthog.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net${isDev ? ' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
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
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon|robots.txt|sitemap.xml|security.txt|assets/|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
