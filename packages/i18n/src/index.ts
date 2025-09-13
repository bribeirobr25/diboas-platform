// @diboas/i18n - Internationalization Package

export type SupportedLocale = 'en' | 'pt-BR' | 'es' | 'de';

export const locales: SupportedLocale[] = ['en', 'pt-BR', 'es', 'de'];

export const defaultLocale: SupportedLocale = 'en';

export function isValidLocale(locale: string): locale is SupportedLocale {
  return locales.includes(locale as SupportedLocale);
}