import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, isValidLocale, getSafeLocale, type SupportedLocale } from '@diboas/i18n/server';

/**
 * Simplified Middleware for Immediate Functionality
 * 
 * i18n: Basic locale detection and routing
 * Security: Essential security headers
 */

export async function middleware(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;
  
  // Security: Basic request validation
  if (!isValidRequest(request)) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Check if locale is already in URL
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (isValidLocale(potentialLocale)) {
    const response = NextResponse.next();
    // Persist locale in cookie for future requests
    response.cookies.set('NEXT_LOCALE', potentialLocale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return addSecurityHeaders(response);
  }

  // Detect user's preferred locale
  const detectedLocale = detectUserLocale(request);
  const safeLocale = getSafeLocale(detectedLocale);

  // Redirect to locale-prefixed URL
  const redirectUrl = new URL(`/${safeLocale}${pathname}${search}`, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Persist detected locale in cookie
  response.cookies.set('NEXT_LOCALE', safeLocale, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  return addSecurityHeaders(response);
}

// Locale detection with cookie persistence priority
// Priority: 1. Cookie preference, 2. Accept-Language header, 3. Default
function detectUserLocale(request: NextRequest): SupportedLocale {
  try {
    // Priority 1: Check cookie for user's explicit choice
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && isValidLocale(cookieLocale)) {
      return cookieLocale as SupportedLocale;
    }

    // Priority 2: Check Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';

    // Simple language detection without negotiator
    for (const locale of SUPPORTED_LOCALES) {
      if (acceptLanguage.includes(locale) || acceptLanguage.includes(locale.split('-')[0])) {
        return locale;
      }
    }

    // Priority 3: Fall back to default
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

// Security: Request validation
function isValidRequest(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;
  
  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /[<>\"']/,        // Potential XSS
    /__[a-z]+__/,     // Python-style attacks
    /\.(php|asp|jsp)/, // Server file extensions
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(pathname)) {
      console.warn(`Blocked suspicious request: ${pathname}`);
      return false;
    }
  }
  
  // Validate search parameters
  for (const [key, value] of searchParams.entries()) {
    if (value.length > 1000) { // Prevent DoS via large params
      console.warn(`Blocked request with large parameter: ${key}`);
      return false;
    }
  }
  
  return true;
}

// Security: Add comprehensive security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com *.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.diboas.com *.google-analytics.com *.googletagmanager.com",
      "connect-src 'self' *.google-analytics.com *.doubleclick.net *.vercel-insights.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

// Configuration for middleware matcher
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon\\..*|robots\\.txt|sitemap\\.xml|security\\.txt|sw\\.js|manifest\\.json|assets|.*\\.well-known).*)',
  ],
};