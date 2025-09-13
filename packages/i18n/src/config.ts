/**
 * Internationalization Configuration
 * 
 * Single Source of Truth for i18n across all applications
 * Security: Locale validation and sanitization
 * Performance: Optimized locale detection
 */

// DRY Principle: Supported locales defined once
export const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Semantic Naming: Clear locale configuration interface
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  region: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

// File Decoupling: Locale metadata separated from logic
export const LOCALE_CONFIG: Record<SupportedLocale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'US',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    region: 'BR',
    direction: 'ltr',
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    region: 'ES',
    direction: 'ltr',
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    region: 'DE',
    direction: 'ltr',
    currency: 'EUR',
    dateFormat: 'dd.MM.yyyy',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
};

// Domain-specific configuration for different applications
export interface DomainI18nConfig {
  domain: string;
  defaultLocale: SupportedLocale;
  locales: SupportedLocale[];
  namespace: string;
  fallbackNamespace?: string;
}

export const DOMAIN_CONFIGS: Record<string, DomainI18nConfig> = {
  marketing: {
    domain: 'diboas.com',
    defaultLocale: 'en',
    locales: ['en', 'pt-BR', 'es', 'de'],
    namespace: 'marketing',
    fallbackNamespace: 'common',
  },
  app: {
    domain: 'app.diboas.com',
    defaultLocale: 'en',
    locales: ['en', 'pt-BR', 'es', 'de'],
    namespace: 'app',
    fallbackNamespace: 'common',
  },
  business: {
    domain: 'business.diboas.com',
    defaultLocale: 'en',
    locales: ['en', 'pt-BR', 'es', 'de'],
    namespace: 'business',
    fallbackNamespace: 'common',
  },
};

// Security: Validate and sanitize locale input
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

// Error Handling: Safe locale resolution
export function getSafeLocale(locale: string | null | undefined): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;
  
  // Security: Sanitize input
  const sanitizedLocale = locale.replace(/[^a-zA-Z-]/g, '').slice(0, 10);
  
  return isValidLocale(sanitizedLocale) ? sanitizedLocale : DEFAULT_LOCALE;
}

// Performance: Locale detection utilities
export function detectLocaleFromPath(pathname: string): SupportedLocale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  return isValidLocale(potentialLocale) ? potentialLocale : null;
}

// SEO: Generate alternate language URLs
export function generateAlternateUrls(
  basePath: string, 
  domain: string,
  locales: SupportedLocale[] = SUPPORTED_LOCALES
): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  for (const locale of locales) {
    alternates[locale] = `https://${domain}/${locale}${basePath}`;
  }
  
  return alternates;
}