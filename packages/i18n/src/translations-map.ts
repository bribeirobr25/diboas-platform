/**
 * Lazy Translation Loaders
 *
 * Instead of statically importing ALL translations for ALL locales upfront
 * (which bundles ~2.8MB into every chunk), each locale+namespace pair is
 * loaded on-demand via dynamic import(). This means:
 *
 * - Only the requested locale's translations are loaded
 * - Only the requested namespace is loaded
 * - Bundle size drops from ~2.8MB to near-zero for the i18n module itself
 * - Translations are resolved at request time (server components) via await
 *
 * Explicit import paths (not template literals) ensure bundler compatibility
 * across webpack, Turbopack, and esbuild.
 *
 * Webpack magic comments (webpackChunkName) produce deterministic chunk names
 * for better caching and debugging (Task 71).
 */

import type { SupportedLocale } from './config';
import type { IntlMessages } from './types';

type LazyLoader = () => Promise<IntlMessages>;
type NamespaceLoaders = Record<string, LazyLoader>;

const resolveDefault = (m: any) => m.default || m;

/**
 * Per-locale, per-namespace dynamic import loaders.
 * Each loader is a zero-cost function reference until called.
 */
const NAMESPACE_LOADERS: Record<SupportedLocale, NamespaceLoaders> = {
  en: {
    common: () => import(/* webpackChunkName: "i18n-en-common" */ '../translations/en/common.json').then(resolveDefault),
    dreamMode: () => import(/* webpackChunkName: "i18n-en-dreamMode" */ '../translations/en/dreamMode.json').then(resolveDefault),
    waitlist: () => import(/* webpackChunkName: "i18n-en-waitlist" */ '../translations/en/waitlist.json').then(resolveDefault),
    share: () => import(/* webpackChunkName: "i18n-en-share" */ '../translations/en/share.json').then(resolveDefault),
    'landing-b2c': () => import(/* webpackChunkName: "i18n-en-landing-b2c" */ '../translations/en/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import(/* webpackChunkName: "i18n-en-landing-b2b" */ '../translations/en/landing-b2b.json').then(resolveDefault),

    strategies: () => import(/* webpackChunkName: "i18n-en-strategies" */ '../translations/en/strategies.json').then(resolveDefault),
    faq: () => import(/* webpackChunkName: "i18n-en-faq" */ '../translations/en/faq.json').then(resolveDefault),
    'marketing-personal': () => import(/* webpackChunkName: "i18n-en-marketing-personal" */ '../translations/en/marketing-personal.json').then(resolveDefault),
    'marketing-business': () => import(/* webpackChunkName: "i18n-en-marketing-business" */ '../translations/en/marketing-business.json').then(resolveDefault),
    'marketing-learn': () => import(/* webpackChunkName: "i18n-en-marketing-learn" */ '../translations/en/marketing-learn.json').then(resolveDefault),
    'marketing-rewards': () => import(/* webpackChunkName: "i18n-en-marketing-rewards" */ '../translations/en/marketing-rewards.json').then(resolveDefault),
    'marketing-security': () => import(/* webpackChunkName: "i18n-en-marketing-security" */ '../translations/en/marketing-security.json').then(resolveDefault),
    'marketing-help': () => import(/* webpackChunkName: "i18n-en-marketing-help" */ '../translations/en/marketing-help.json').then(resolveDefault),
    'marketing-other': () => import(/* webpackChunkName: "i18n-en-marketing-other" */ '../translations/en/marketing-other.json').then(resolveDefault),
    'marketing-common': () => import(/* webpackChunkName: "i18n-en-marketing-common" */ '../translations/en/marketing-common.json').then(resolveDefault),
    home: () => import(/* webpackChunkName: "i18n-en-home" */ '../translations/en/home.json').then(resolveDefault),
    about: () => import(/* webpackChunkName: "i18n-en-about" */ '../translations/en/about.json').then(resolveDefault),
    protocols: () => import(/* webpackChunkName: "i18n-en-protocols" */ '../translations/en/protocols.json').then(resolveDefault),
    preDemo: () => import(/* webpackChunkName: "i18n-en-preDemo" */ '../translations/en/preDemo.json').then(resolveDefault),
    preDream: () => import(/* webpackChunkName: "i18n-en-preDream" */ '../translations/en/preDream.json').then(resolveDefault),
    security: () => import(/* webpackChunkName: "i18n-en-security" */ '../translations/en/security.json').then(resolveDefault),
  },
  de: {
    common: () => import(/* webpackChunkName: "i18n-de-common" */ '../translations/de/common.json').then(resolveDefault),
    dreamMode: () => import(/* webpackChunkName: "i18n-de-dreamMode" */ '../translations/de/dreamMode.json').then(resolveDefault),
    waitlist: () => import(/* webpackChunkName: "i18n-de-waitlist" */ '../translations/de/waitlist.json').then(resolveDefault),
    share: () => import(/* webpackChunkName: "i18n-de-share" */ '../translations/de/share.json').then(resolveDefault),
    'landing-b2c': () => import(/* webpackChunkName: "i18n-de-landing-b2c" */ '../translations/de/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import(/* webpackChunkName: "i18n-de-landing-b2b" */ '../translations/de/landing-b2b.json').then(resolveDefault),

    strategies: () => import(/* webpackChunkName: "i18n-de-strategies" */ '../translations/de/strategies.json').then(resolveDefault),
    faq: () => import(/* webpackChunkName: "i18n-de-faq" */ '../translations/de/faq.json').then(resolveDefault),
    'marketing-personal': () => import(/* webpackChunkName: "i18n-de-marketing-personal" */ '../translations/de/marketing-personal.json').then(resolveDefault),
    'marketing-business': () => import(/* webpackChunkName: "i18n-de-marketing-business" */ '../translations/de/marketing-business.json').then(resolveDefault),
    'marketing-learn': () => import(/* webpackChunkName: "i18n-de-marketing-learn" */ '../translations/de/marketing-learn.json').then(resolveDefault),
    'marketing-rewards': () => import(/* webpackChunkName: "i18n-de-marketing-rewards" */ '../translations/de/marketing-rewards.json').then(resolveDefault),
    'marketing-security': () => import(/* webpackChunkName: "i18n-de-marketing-security" */ '../translations/de/marketing-security.json').then(resolveDefault),
    'marketing-help': () => import(/* webpackChunkName: "i18n-de-marketing-help" */ '../translations/de/marketing-help.json').then(resolveDefault),
    'marketing-other': () => import(/* webpackChunkName: "i18n-de-marketing-other" */ '../translations/de/marketing-other.json').then(resolveDefault),
    'marketing-common': () => import(/* webpackChunkName: "i18n-de-marketing-common" */ '../translations/de/marketing-common.json').then(resolveDefault),
    home: () => import(/* webpackChunkName: "i18n-de-home" */ '../translations/de/home.json').then(resolveDefault),
    about: () => import(/* webpackChunkName: "i18n-de-about" */ '../translations/de/about.json').then(resolveDefault),
    protocols: () => import(/* webpackChunkName: "i18n-de-protocols" */ '../translations/de/protocols.json').then(resolveDefault),
    preDemo: () => import(/* webpackChunkName: "i18n-de-preDemo" */ '../translations/de/preDemo.json').then(resolveDefault),
    preDream: () => import(/* webpackChunkName: "i18n-de-preDream" */ '../translations/de/preDream.json').then(resolveDefault),
    security: () => import(/* webpackChunkName: "i18n-de-security" */ '../translations/de/security.json').then(resolveDefault),
  },
  es: {
    common: () => import(/* webpackChunkName: "i18n-es-common" */ '../translations/es/common.json').then(resolveDefault),
    dreamMode: () => import(/* webpackChunkName: "i18n-es-dreamMode" */ '../translations/es/dreamMode.json').then(resolveDefault),
    waitlist: () => import(/* webpackChunkName: "i18n-es-waitlist" */ '../translations/es/waitlist.json').then(resolveDefault),
    share: () => import(/* webpackChunkName: "i18n-es-share" */ '../translations/es/share.json').then(resolveDefault),
    'landing-b2c': () => import(/* webpackChunkName: "i18n-es-landing-b2c" */ '../translations/es/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import(/* webpackChunkName: "i18n-es-landing-b2b" */ '../translations/es/landing-b2b.json').then(resolveDefault),

    strategies: () => import(/* webpackChunkName: "i18n-es-strategies" */ '../translations/es/strategies.json').then(resolveDefault),
    faq: () => import(/* webpackChunkName: "i18n-es-faq" */ '../translations/es/faq.json').then(resolveDefault),
    'marketing-personal': () => import(/* webpackChunkName: "i18n-es-marketing-personal" */ '../translations/es/marketing-personal.json').then(resolveDefault),
    'marketing-business': () => import(/* webpackChunkName: "i18n-es-marketing-business" */ '../translations/es/marketing-business.json').then(resolveDefault),
    'marketing-learn': () => import(/* webpackChunkName: "i18n-es-marketing-learn" */ '../translations/es/marketing-learn.json').then(resolveDefault),
    'marketing-rewards': () => import(/* webpackChunkName: "i18n-es-marketing-rewards" */ '../translations/es/marketing-rewards.json').then(resolveDefault),
    'marketing-security': () => import(/* webpackChunkName: "i18n-es-marketing-security" */ '../translations/es/marketing-security.json').then(resolveDefault),
    'marketing-help': () => import(/* webpackChunkName: "i18n-es-marketing-help" */ '../translations/es/marketing-help.json').then(resolveDefault),
    'marketing-other': () => import(/* webpackChunkName: "i18n-es-marketing-other" */ '../translations/es/marketing-other.json').then(resolveDefault),
    'marketing-common': () => import(/* webpackChunkName: "i18n-es-marketing-common" */ '../translations/es/marketing-common.json').then(resolveDefault),
    home: () => import(/* webpackChunkName: "i18n-es-home" */ '../translations/es/home.json').then(resolveDefault),
    about: () => import(/* webpackChunkName: "i18n-es-about" */ '../translations/es/about.json').then(resolveDefault),
    protocols: () => import(/* webpackChunkName: "i18n-es-protocols" */ '../translations/es/protocols.json').then(resolveDefault),
    preDemo: () => import(/* webpackChunkName: "i18n-es-preDemo" */ '../translations/es/preDemo.json').then(resolveDefault),
    preDream: () => import(/* webpackChunkName: "i18n-es-preDream" */ '../translations/es/preDream.json').then(resolveDefault),
    security: () => import(/* webpackChunkName: "i18n-es-security" */ '../translations/es/security.json').then(resolveDefault),
  },
  'pt-BR': {
    common: () => import(/* webpackChunkName: "i18n-pt-BR-common" */ '../translations/pt-BR/common.json').then(resolveDefault),
    dreamMode: () => import(/* webpackChunkName: "i18n-pt-BR-dreamMode" */ '../translations/pt-BR/dreamMode.json').then(resolveDefault),
    waitlist: () => import(/* webpackChunkName: "i18n-pt-BR-waitlist" */ '../translations/pt-BR/waitlist.json').then(resolveDefault),
    share: () => import(/* webpackChunkName: "i18n-pt-BR-share" */ '../translations/pt-BR/share.json').then(resolveDefault),
    'landing-b2c': () => import(/* webpackChunkName: "i18n-pt-BR-landing-b2c" */ '../translations/pt-BR/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import(/* webpackChunkName: "i18n-pt-BR-landing-b2b" */ '../translations/pt-BR/landing-b2b.json').then(resolveDefault),

    strategies: () => import(/* webpackChunkName: "i18n-pt-BR-strategies" */ '../translations/pt-BR/strategies.json').then(resolveDefault),
    faq: () => import(/* webpackChunkName: "i18n-pt-BR-faq" */ '../translations/pt-BR/faq.json').then(resolveDefault),
    'marketing-personal': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-personal" */ '../translations/pt-BR/marketing-personal.json').then(resolveDefault),
    'marketing-business': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-business" */ '../translations/pt-BR/marketing-business.json').then(resolveDefault),
    'marketing-learn': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-learn" */ '../translations/pt-BR/marketing-learn.json').then(resolveDefault),
    'marketing-rewards': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-rewards" */ '../translations/pt-BR/marketing-rewards.json').then(resolveDefault),
    'marketing-security': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-security" */ '../translations/pt-BR/marketing-security.json').then(resolveDefault),
    'marketing-help': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-help" */ '../translations/pt-BR/marketing-help.json').then(resolveDefault),
    'marketing-other': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-other" */ '../translations/pt-BR/marketing-other.json').then(resolveDefault),
    'marketing-common': () => import(/* webpackChunkName: "i18n-pt-BR-marketing-common" */ '../translations/pt-BR/marketing-common.json').then(resolveDefault),
    home: () => import(/* webpackChunkName: "i18n-pt-BR-home" */ '../translations/pt-BR/home.json').then(resolveDefault),
    about: () => import(/* webpackChunkName: "i18n-pt-BR-about" */ '../translations/pt-BR/about.json').then(resolveDefault),
    protocols: () => import(/* webpackChunkName: "i18n-pt-BR-protocols" */ '../translations/pt-BR/protocols.json').then(resolveDefault),
    preDemo: () => import(/* webpackChunkName: "i18n-pt-BR-preDemo" */ '../translations/pt-BR/preDemo.json').then(resolveDefault),
    preDream: () => import(/* webpackChunkName: "i18n-pt-BR-preDream" */ '../translations/pt-BR/preDream.json').then(resolveDefault),
    security: () => import(/* webpackChunkName: "i18n-pt-BR-security" */ '../translations/pt-BR/security.json').then(resolveDefault),
  },
};

/**
 * Load translations for a specific locale and namespace on-demand.
 * Falls back to English if the requested locale/namespace is unavailable.
 *
 * @param locale - Target locale
 * @param namespace - Translation namespace (e.g., 'common', 'landing-b2c')
 * @returns Translation messages object, or empty object if not found
 */
export async function getTranslations(
  locale: SupportedLocale,
  namespace: string
): Promise<IntlMessages> {
  const localeLoaders = NAMESPACE_LOADERS[locale];
  const loader = localeLoaders?.[namespace];

  if (loader) {
    try {
      return await loader();
    } catch (error) {
      console.warn(`Failed to load translations for ${locale}/${namespace}:`, error);
    }
  }

  // Fallback to English
  if (locale !== 'en') {
    const enLoader = NAMESPACE_LOADERS.en[namespace];
    if (enLoader) {
      try {
        return await enLoader();
      } catch {
        // Silent fallback
      }
    }
  }

  return {};
}

/**
 * Check if a namespace has a registered loader for the given locale.
 */
export function hasRegisteredNamespace(
  locale: SupportedLocale,
  namespace: string
): boolean {
  return !!NAMESPACE_LOADERS[locale]?.[namespace];
}
