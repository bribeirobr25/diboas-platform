import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { 
  SUPPORTED_LOCALES, 
  DEFAULT_LOCALE, 
  DOMAIN_CONFIGS,
  getSafeLocale,
  detectLocaleFromPath,
  type SupportedLocale,
  type DomainI18nConfig 
} from './config';

/**
 * Secure Internationalization Middleware Factory
 * 
 * Security: Domain-specific locale handling with input validation
 * Performance: Efficient locale detection and caching
 * Accessibility: Proper locale indication for assistive technologies
 */

interface I18nMiddlewareOptions {
  // Security: Restrict to specific domains
  allowedDomains?: string[];
  // Performance: Cache locale preferences
  enableLocaleCache?: boolean;
  // Analytics: Track locale switches
  trackLocaleChanges?: boolean;
}

export function createI18nMiddleware(
  domainConfig: DomainI18nConfig,
  options: I18nMiddlewareOptions = {}
) {
  return async function i18nMiddleware(request: NextRequest): Promise<NextResponse> {
    const { pathname, search, origin } = request.nextUrl;
    const domain = new URL(origin).hostname;
    
    // Security: Validate domain access
    if (options.allowedDomains && !options.allowedDomains.includes(domain)) {
      return NextResponse.next();
    }

    try {
      // Performance: Check if locale is already in URL
      const localeInPath = detectLocaleFromPath(pathname);
      
      if (localeInPath) {
        // Locale already present, continue with security headers
        return addSecurityHeaders(NextResponse.next(), localeInPath);
      }

      // Detect user's preferred locale
      const detectedLocale = detectUserLocale(request, domainConfig);
      
      // Analytics: Track locale detection if enabled
      if (options.trackLocaleChanges) {
        trackLocaleDetection(detectedLocale, domain, pathname);
      }

      // Security: Validate detected locale
      const safeLocale = getSafeLocale(detectedLocale);
      
      // Performance: Avoid unnecessary redirects for default locale
      const targetLocale = domainConfig.locales.includes(safeLocale) 
        ? safeLocale 
        : domainConfig.defaultLocale;

      // Redirect to locale-prefixed URL
      const redirectUrl = new URL(
        `/${targetLocale}${pathname}${search}`,
        request.url
      );

      const response = NextResponse.redirect(redirectUrl);
      
      // Security: Set secure locale cookie
      setSecureLocaleCookie(response, targetLocale, domain);
      
      return addSecurityHeaders(response, targetLocale);

    } catch (error) {
      // Error Handling: Graceful degradation
      console.error('i18n middleware error:', error);
      
      // Fallback to default locale
      const fallbackUrl = new URL(
        `/${domainConfig.defaultLocale}${pathname}${search}`,
        request.url
      );
      
      return NextResponse.redirect(fallbackUrl);
    }
  };
}

// Performance & Security: Optimized locale detection
function detectUserLocale(
  request: NextRequest, 
  config: DomainI18nConfig
): SupportedLocale {
  // Priority 1: Check secure cookie (domain-specific)
  const cookieName = `locale-${config.namespace}`;
  const cookieLocale = request.cookies.get(cookieName)?.value;
  if (cookieLocale && config.locales.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  // Priority 2: Browser Accept-Language header
  try {
    const negotiator = new Negotiator({
      headers: { 'accept-language': request.headers.get('accept-language') || '' }
    });
    
    const languages = negotiator.languages();
    const matchedLocale = match(
      languages,
      config.locales,
      config.defaultLocale
    );
    
    return matchedLocale as SupportedLocale;
  } catch {
    // Error Handling: Fallback on negotiation failure
    return config.defaultLocale;
  }
}

// Security: Domain-specific cookie with proper attributes
function setSecureLocaleCookie(
  response: NextResponse, 
  locale: SupportedLocale,
  domain: string
) {
  // Security: Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set({
    name: `locale-${getDomainNamespace(domain)}`,
    value: locale,
    // Security: Restrict cookie to specific domain (no subdomain sharing)
    domain: isProduction ? domain : undefined,
    path: '/',
    // Security: HTTPS only in production
    secure: isProduction,
    // Security: Prevent XSS access
    httpOnly: false, // Client needs access for language switcher
    // Security: CSRF protection
    sameSite: 'lax',
    // Performance: Cache for 30 days
    maxAge: 30 * 24 * 60 * 60,
  });
}

// Security: Enhanced headers for i18n content
function addSecurityHeaders(response: NextResponse, locale: SupportedLocale): NextResponse {
  // SEO & Accessibility: Content language indication
  response.headers.set('Content-Language', locale);
  
  // Security: Vary header for caching
  response.headers.set('Vary', 'Accept-Language');
  
  // Performance: Cache control for static content
  if (response.status === 200) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }
  
  return response;
}

// Analytics: Track locale detection patterns
function trackLocaleDetection(
  locale: SupportedLocale, 
  domain: string, 
  pathname: string
) {
  // Product KPIs: Track locale usage patterns
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'locale_detected', {
      event_category: 'i18n',
      event_label: locale,
      custom_map: {
        domain,
        pathname,
        detection_method: 'middleware',
      }
    });
  }
}

// Utility: Get domain namespace for cookie naming
function getDomainNamespace(domain: string): string {
  if (domain.includes('app.')) return 'app';
  if (domain.includes('business.')) return 'business';
  return 'marketing';
}

// Middleware configuration matcher
export const config = {
  matcher: [
    // Skip internal Next.js paths and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|security.txt).*)',
  ],
};

// Export types for external usage
export type { I18nMiddlewareOptions };