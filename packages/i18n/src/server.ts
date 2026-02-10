/**
 * Server-Safe i18n Exports
 * Use this for Server Components and Middleware
 */

// Configuration exports
export * from './config';

// Utilities exports
export * from './utils';

// Middleware exports
export {
  createI18nMiddleware,
  config as middlewareConfig,
  type I18nMiddlewareOptions,
} from './middleware';

// Legacy exports
export { SUPPORTED_LOCALES as locales, DEFAULT_LOCALE as defaultLocale } from './config';
