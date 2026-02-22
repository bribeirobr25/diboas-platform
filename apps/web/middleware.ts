import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware: CSP nonce generation + i18n locale detection
 *
 * Security: Per-request nonce eliminates 'unsafe-inline' for scripts.
 * The nonce is forwarded via the x-nonce response header so layout.tsx can
 * read it and pass it to <Script> components.
 */

const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

function detectLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (firstSegment && (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)) {
    return firstSegment;
  }
  return null;
}

export function middleware(request: NextRequest): NextResponse {
  const nonce = crypto.randomUUID();
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
    `connect-src 'self' https://vitals.vercel-analytics.com https://api.diboas.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net${isDev ? ' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://diboas.com https://app.diboas.com`,
  ].join('; ');

  // If no locale in path, redirect to default locale
  const localeInPath = detectLocaleFromPath(pathname);
  if (!localeInPath && pathname !== '/') {
    const redirectUrl = new URL(`/en${pathname}${search}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('x-nonce', nonce);
    return response;
  }

  // Set nonce in request headers for downstream use (layout.tsx)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);

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
