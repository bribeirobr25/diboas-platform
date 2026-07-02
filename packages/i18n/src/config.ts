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

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Complete set of translation namespaces — one entry per JSON file under
 * `translations/<locale>/` (including the `legal/*` subdirectory). This is the
 * SINGLE source of truth for "what is a valid namespace": `isTranslationKey`
 * (config-translator) keys off it so config values from ANY namespace resolve,
 * not just a hardcoded subset (the I-4 foot-gun). Keep in sync with the file
 * set — the `config-translator` drift-guard test enforces parity.
 */
export const SUPPORTED_NAMESPACES = [
  'about',
  'common',
  'dreamMode',
  'faq',
  'investor',
  'investor-docs',
  'landing-b2b',
  'landing-b2c',
  'landing-help',
  'learn',
  'learn-compound-interest',
  'legal/cookies',
  'legal/privacy',
  'legal/terms',
  'market',
  'preDemo',
  'preDream',
  'protocols',
  'security',
  'share',
  'strategies',
  'tools-asset-history',
  'tools-card-fees',
  'tools-compound-interest',
  'tools-currency-depreciation',
  'tools-emergency-fund',
  'tools-goal-savings',
  'tools-idle-cash',
  'tools-inflation-impact',
  'tools-retirement',
  'tools-shared',
  'tools-time-to-target',
  'waitlist',
] as const;

export type SupportedNamespace = (typeof SUPPORTED_NAMESPACES)[number];

const NAMESPACE_SET: ReadonlySet<string> = new Set(SUPPORTED_NAMESPACES);

/**
 * Whether `namespace` (the segment before a translation key's first dot) is a
 * known translation namespace.
 */
export function isKnownNamespace(namespace: string): boolean {
  return NAMESPACE_SET.has(namespace);
}

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
  flag: string; // Unicode flag emoji for visual representation
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
    flag: '🇺🇸',
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
    flag: '🇧🇷',
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
    flag: '🇪🇸',
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
    flag: '🇩🇪',
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
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  return potentialLocale && isValidLocale(potentialLocale) ? potentialLocale : null;
}

/**
 * Parse Accept-Language header and return best matching supported locale.
 * Handles q-factor weighting (e.g., "en-US,en;q=0.9,pt-BR;q=0.8,de;q=0.7").
 */
export function matchAcceptLanguage(acceptLanguage: string | null): SupportedLocale | null {
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
    // Exact match (e.g., "pt-BR")
    if (isValidLocale(lang)) return lang;
    // Language-only match (e.g., "pt" → "pt-BR", "de-AT" → "de")
    const langPrefix = lang.split('-')[0];
    const match = SUPPORTED_LOCALES.find((l) => l === langPrefix || l.startsWith(`${langPrefix}-`));
    if (match) return match;
  }

  return null;
}

/**
 * Detect preferred locale from cookie value and Accept-Language header.
 * Chain: cookie → Accept-Language → DEFAULT_LOCALE
 */
export function detectPreferredLocale(
  cookieLocale: string | null | undefined,
  acceptLanguage: string | null | undefined
): SupportedLocale {
  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale;
  const matched = matchAcceptLanguage(acceptLanguage ?? null);
  if (matched) return matched;
  return DEFAULT_LOCALE;
}

// SEO: Generate alternate language URLs
export function generateAlternateUrls(
  basePath: string,
  domain: string,
  locales: SupportedLocale[] = [...SUPPORTED_LOCALES]
): Record<string, string> {
  const alternates: Record<string, string> = {};

  for (const locale of locales) {
    alternates[locale] = `https://${domain}/${locale}${basePath}`;
  }

  return alternates;
}
