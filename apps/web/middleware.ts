import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware: CSP nonce generation + i18n locale detection
 *
 * Security: Per-request nonce eliminates 'unsafe-inline' for scripts.
 * The nonce is forwarded via the x-nonce response header so layout.tsx can
 * read it and pass it to <Script> components.
 *
 * Locale detection chain: cookie (NEXT_LOCALE) → Accept-Language → default (en)
 */

const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const DEFAULT_LOCALE = 'en';
const LOCALE_COOKIE = 'NEXT_LOCALE';

function detectLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)) {
    return firstSegment;
  }
  return null;
}

/**
 * Parse Accept-Language header and return best matching supported locale.
 * Handles q-factor weighting (e.g. "en-US,en;q=0.9,pt-BR;q=0.8,de;q=0.7").
 */
function matchAcceptLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;

  const parsed = acceptLanguage
    .split(',')
    .map((entry) => {
      const [lang, ...params] = entry.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { lang: lang.trim(), q: Number.isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of parsed) {
    // Exact match (e.g. "pt-BR")
    if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
      return lang;
    }
    // Language-only match (e.g. "pt" → "pt-BR", "de-AT" → "de")
    const langPrefix = lang.split('-')[0];
    const match = SUPPORTED_LOCALES.find(
      (l) => l === langPrefix || l.startsWith(`${langPrefix}-`)
    );
    if (match) return match;
  }

  return null;
}

/**
 * Detect locale from: cookie → Accept-Language → default
 */
function detectLocale(request: NextRequest): string {
  // 1. Cookie preference (set when user selects a language)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Accept-Language header
  const acceptLang = request.headers.get('Accept-Language');
  const matched = matchAcceptLanguage(acceptLang);
  if (matched) return matched;

  // 3. Default
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest): NextResponse {
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
    `connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com https://app.posthog.com https://*.posthog.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net${isDev ? ' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://diboas.com https://app.diboas.com`,
  ].join('; ');

  // If no locale in path, redirect using detection chain
  const localeInPath = detectLocaleFromPath(pathname);
  if (!localeInPath && pathname !== '/') {
    const detectedLocale = detectLocale(request);
    const redirectUrl = new URL(`/${detectedLocale}${pathname}${search}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Root path "/" also uses locale detection
  if (pathname === '/') {
    const detectedLocale = detectLocale(request);
    const redirectUrl = new URL(`/${detectedLocale}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    response.headers.set('x-request-id', requestId);
    return response;
  }

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
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon|robots.txt|sitemap.xml|security.txt|assets/|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
