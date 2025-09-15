/**
 * DRY Principle: Re-export from centralized i18n package
 * 
 * This eliminates code duplication by using the single source of truth
 */

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
  isValidLocale,
  getSafeLocale
} from '@diboas/i18n';