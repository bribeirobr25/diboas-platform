/**
 * Simplified i18n for immediate functionality
 * 
 * This provides basic i18n functionality while we transition to the full package
 */

export const SUPPORTED_LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function getSafeLocale(locale: string | null | undefined): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;
  
  const sanitizedLocale = locale.replace(/[^a-zA-Z-]/g, '').slice(0, 10);
  
  return isValidLocale(sanitizedLocale) ? sanitizedLocale : DEFAULT_LOCALE;
}