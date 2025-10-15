// @diboas/i18n - Internationalization Package
// DRY Principle: Re-export everything from a single import point

// Configuration exports (server-safe)
export * from './config';

// Utilities exports (server-safe)
export * from './utils';

// Client-only exports (use named imports to avoid bundling React in server components)
export { I18nProvider, type I18nProviderProps } from './provider';
export {
  useTranslation,
  useMessage,
  useMessageWithValues,
  usePluralMessage,
  useDateFormat,
  useNumberFormat,
  useCurrencyFormat
} from './hooks';

// Legacy exports for backward compatibility
export { SUPPORTED_LOCALES as locales, DEFAULT_LOCALE as defaultLocale } from './config';