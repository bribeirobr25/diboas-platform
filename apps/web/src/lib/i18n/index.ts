/**
 * i18n Module - Public API
 *
 * Note: config-translator is 'use client' — import it directly when needed
 * in client components rather than through this barrel.
 */

export {
  useConfigTranslation,
  createTranslationMap,
  useTranslate,
  useTranslateWithValues,
  useNamespacedTranslation,
  withTranslations,
  generateTranslationKeys,
  type TranslationKeys,
  type ResolvedTranslations,
} from './config-translator';

export { loadPageNamespaces } from './pageNamespaceLoader';
