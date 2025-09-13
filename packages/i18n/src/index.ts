// @diboas/i18n - Internationalization Package
// DRY Principle: Re-export everything from config for single import point

export * from './config';

// Legacy exports for backward compatibility
export { SUPPORTED_LOCALES as locales, DEFAULT_LOCALE as defaultLocale } from './config';