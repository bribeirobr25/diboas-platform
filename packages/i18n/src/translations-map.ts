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
 *
 * Marketing page namespaces removed 2026-04-04 (marketing pages deleted).
 */

import type { SupportedLocale } from './config';
import type { IntlMessages } from './types';

type LazyLoader = () => Promise<IntlMessages>;
type NamespaceLoaders = Record<string, LazyLoader>;

const resolveDefault = <T>(m: T | { default: T }): T =>
  (m as { default?: T }).default || (m as T);

/**
 * Per-locale, per-namespace dynamic import loaders.
 * Each loader is a zero-cost function reference until called.
 */
const NAMESPACE_LOADERS: Record<SupportedLocale, NamespaceLoaders> = {
  en: {
    common: () =>
      import(/* webpackChunkName: "i18n-en-common" */ '../translations/en/common.json').then(
        resolveDefault
      ),
    dreamMode: () =>
      import(/* webpackChunkName: "i18n-en-dreamMode" */ '../translations/en/dreamMode.json').then(
        resolveDefault
      ),
    waitlist: () =>
      import(/* webpackChunkName: "i18n-en-waitlist" */ '../translations/en/waitlist.json').then(
        resolveDefault
      ),
    share: () =>
      import(/* webpackChunkName: "i18n-en-share" */ '../translations/en/share.json').then(
        resolveDefault
      ),
    'landing-b2c': () =>
      import(
        /* webpackChunkName: "i18n-en-landing-b2c" */ '../translations/en/landing-b2c.json'
      ).then(resolveDefault),
    'landing-b2b': () =>
      import(
        /* webpackChunkName: "i18n-en-landing-b2b" */ '../translations/en/landing-b2b.json'
      ).then(resolveDefault),
    strategies: () =>
      import(
        /* webpackChunkName: "i18n-en-strategies" */ '../translations/en/strategies.json'
      ).then(resolveDefault),
    faq: () =>
      import(/* webpackChunkName: "i18n-en-faq" */ '../translations/en/faq.json').then(
        resolveDefault
      ),
    about: () =>
      import(/* webpackChunkName: "i18n-en-about" */ '../translations/en/about.json').then(
        resolveDefault
      ),
    protocols: () =>
      import(/* webpackChunkName: "i18n-en-protocols" */ '../translations/en/protocols.json').then(
        resolveDefault
      ),
    preDemo: () =>
      import(/* webpackChunkName: "i18n-en-preDemo" */ '../translations/en/preDemo.json').then(
        resolveDefault
      ),
    preDream: () =>
      import(/* webpackChunkName: "i18n-en-preDream" */ '../translations/en/preDream.json').then(
        resolveDefault
      ),
    security: () =>
      import(/* webpackChunkName: "i18n-en-security" */ '../translations/en/security.json').then(
        resolveDefault
      ),
    learn: () =>
      import(/* webpackChunkName: "i18n-en-learn" */ '../translations/en/learn.json').then(
        resolveDefault
      ),
    'learn-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-en-learn-compound-interest" */ '../translations/en/learn-compound-interest.json'
      ).then(resolveDefault),
    'tools-shared': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-shared" */ '../translations/en/tools-shared.json'
      ).then(resolveDefault),
    'tools-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-compound-interest" */ '../translations/en/tools-compound-interest.json'
      ).then(resolveDefault),
    'tools-retirement': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-retirement" */ '../translations/en/tools-retirement.json'
      ).then(resolveDefault),
    'tools-emergency-fund': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-emergency-fund" */ '../translations/en/tools-emergency-fund.json'
      ).then(resolveDefault),
    'tools-goal-savings': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-goal-savings" */ '../translations/en/tools-goal-savings.json'
      ).then(resolveDefault),
    'tools-inflation-impact': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-inflation-impact" */ '../translations/en/tools-inflation-impact.json'
      ).then(resolveDefault),
    'tools-time-to-target': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-time-to-target" */ '../translations/en/tools-time-to-target.json'
      ).then(resolveDefault),
    'tools-currency-depreciation': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-currency-depreciation" */ '../translations/en/tools-currency-depreciation.json'
      ).then(resolveDefault),
    'tools-card-fees': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-card-fees" */ '../translations/en/tools-card-fees.json'
      ).then(resolveDefault),
    'tools-idle-cash': () =>
      import(
        /* webpackChunkName: "i18n-en-tools-idle-cash" */ '../translations/en/tools-idle-cash.json'
      ).then(resolveDefault),
  },
  de: {
    common: () =>
      import(/* webpackChunkName: "i18n-de-common" */ '../translations/de/common.json').then(
        resolveDefault
      ),
    dreamMode: () =>
      import(/* webpackChunkName: "i18n-de-dreamMode" */ '../translations/de/dreamMode.json').then(
        resolveDefault
      ),
    waitlist: () =>
      import(/* webpackChunkName: "i18n-de-waitlist" */ '../translations/de/waitlist.json').then(
        resolveDefault
      ),
    share: () =>
      import(/* webpackChunkName: "i18n-de-share" */ '../translations/de/share.json').then(
        resolveDefault
      ),
    'landing-b2c': () =>
      import(
        /* webpackChunkName: "i18n-de-landing-b2c" */ '../translations/de/landing-b2c.json'
      ).then(resolveDefault),
    'landing-b2b': () =>
      import(
        /* webpackChunkName: "i18n-de-landing-b2b" */ '../translations/de/landing-b2b.json'
      ).then(resolveDefault),
    strategies: () =>
      import(
        /* webpackChunkName: "i18n-de-strategies" */ '../translations/de/strategies.json'
      ).then(resolveDefault),
    faq: () =>
      import(/* webpackChunkName: "i18n-de-faq" */ '../translations/de/faq.json').then(
        resolveDefault
      ),
    about: () =>
      import(/* webpackChunkName: "i18n-de-about" */ '../translations/de/about.json').then(
        resolveDefault
      ),
    protocols: () =>
      import(/* webpackChunkName: "i18n-de-protocols" */ '../translations/de/protocols.json').then(
        resolveDefault
      ),
    preDemo: () =>
      import(/* webpackChunkName: "i18n-de-preDemo" */ '../translations/de/preDemo.json').then(
        resolveDefault
      ),
    preDream: () =>
      import(/* webpackChunkName: "i18n-de-preDream" */ '../translations/de/preDream.json').then(
        resolveDefault
      ),
    security: () =>
      import(/* webpackChunkName: "i18n-de-security" */ '../translations/de/security.json').then(
        resolveDefault
      ),
    learn: () =>
      import(/* webpackChunkName: "i18n-de-learn" */ '../translations/de/learn.json').then(
        resolveDefault
      ),
    'learn-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-de-learn-compound-interest" */ '../translations/de/learn-compound-interest.json'
      ).then(resolveDefault),
    'tools-shared': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-shared" */ '../translations/de/tools-shared.json'
      ).then(resolveDefault),
    'tools-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-compound-interest" */ '../translations/de/tools-compound-interest.json'
      ).then(resolveDefault),
    'tools-retirement': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-retirement" */ '../translations/de/tools-retirement.json'
      ).then(resolveDefault),
    'tools-emergency-fund': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-emergency-fund" */ '../translations/de/tools-emergency-fund.json'
      ).then(resolveDefault),
    'tools-goal-savings': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-goal-savings" */ '../translations/de/tools-goal-savings.json'
      ).then(resolveDefault),
    'tools-inflation-impact': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-inflation-impact" */ '../translations/de/tools-inflation-impact.json'
      ).then(resolveDefault),
    'tools-time-to-target': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-time-to-target" */ '../translations/de/tools-time-to-target.json'
      ).then(resolveDefault),
    'tools-currency-depreciation': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-currency-depreciation" */ '../translations/de/tools-currency-depreciation.json'
      ).then(resolveDefault),
    'tools-card-fees': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-card-fees" */ '../translations/de/tools-card-fees.json'
      ).then(resolveDefault),
    'tools-idle-cash': () =>
      import(
        /* webpackChunkName: "i18n-de-tools-idle-cash" */ '../translations/de/tools-idle-cash.json'
      ).then(resolveDefault),
  },
  es: {
    common: () =>
      import(/* webpackChunkName: "i18n-es-common" */ '../translations/es/common.json').then(
        resolveDefault
      ),
    dreamMode: () =>
      import(/* webpackChunkName: "i18n-es-dreamMode" */ '../translations/es/dreamMode.json').then(
        resolveDefault
      ),
    waitlist: () =>
      import(/* webpackChunkName: "i18n-es-waitlist" */ '../translations/es/waitlist.json').then(
        resolveDefault
      ),
    share: () =>
      import(/* webpackChunkName: "i18n-es-share" */ '../translations/es/share.json').then(
        resolveDefault
      ),
    'landing-b2c': () =>
      import(
        /* webpackChunkName: "i18n-es-landing-b2c" */ '../translations/es/landing-b2c.json'
      ).then(resolveDefault),
    'landing-b2b': () =>
      import(
        /* webpackChunkName: "i18n-es-landing-b2b" */ '../translations/es/landing-b2b.json'
      ).then(resolveDefault),
    strategies: () =>
      import(
        /* webpackChunkName: "i18n-es-strategies" */ '../translations/es/strategies.json'
      ).then(resolveDefault),
    faq: () =>
      import(/* webpackChunkName: "i18n-es-faq" */ '../translations/es/faq.json').then(
        resolveDefault
      ),
    about: () =>
      import(/* webpackChunkName: "i18n-es-about" */ '../translations/es/about.json').then(
        resolveDefault
      ),
    protocols: () =>
      import(/* webpackChunkName: "i18n-es-protocols" */ '../translations/es/protocols.json').then(
        resolveDefault
      ),
    preDemo: () =>
      import(/* webpackChunkName: "i18n-es-preDemo" */ '../translations/es/preDemo.json').then(
        resolveDefault
      ),
    preDream: () =>
      import(/* webpackChunkName: "i18n-es-preDream" */ '../translations/es/preDream.json').then(
        resolveDefault
      ),
    security: () =>
      import(/* webpackChunkName: "i18n-es-security" */ '../translations/es/security.json').then(
        resolveDefault
      ),
    learn: () =>
      import(/* webpackChunkName: "i18n-es-learn" */ '../translations/es/learn.json').then(
        resolveDefault
      ),
    'learn-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-es-learn-compound-interest" */ '../translations/es/learn-compound-interest.json'
      ).then(resolveDefault),
    'tools-shared': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-shared" */ '../translations/es/tools-shared.json'
      ).then(resolveDefault),
    'tools-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-compound-interest" */ '../translations/es/tools-compound-interest.json'
      ).then(resolveDefault),
    'tools-retirement': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-retirement" */ '../translations/es/tools-retirement.json'
      ).then(resolveDefault),
    'tools-emergency-fund': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-emergency-fund" */ '../translations/es/tools-emergency-fund.json'
      ).then(resolveDefault),
    'tools-goal-savings': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-goal-savings" */ '../translations/es/tools-goal-savings.json'
      ).then(resolveDefault),
    'tools-inflation-impact': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-inflation-impact" */ '../translations/es/tools-inflation-impact.json'
      ).then(resolveDefault),
    'tools-time-to-target': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-time-to-target" */ '../translations/es/tools-time-to-target.json'
      ).then(resolveDefault),
    'tools-currency-depreciation': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-currency-depreciation" */ '../translations/es/tools-currency-depreciation.json'
      ).then(resolveDefault),
    'tools-card-fees': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-card-fees" */ '../translations/es/tools-card-fees.json'
      ).then(resolveDefault),
    'tools-idle-cash': () =>
      import(
        /* webpackChunkName: "i18n-es-tools-idle-cash" */ '../translations/es/tools-idle-cash.json'
      ).then(resolveDefault),
  },
  'pt-BR': {
    common: () =>
      import(/* webpackChunkName: "i18n-pt-BR-common" */ '../translations/pt-BR/common.json').then(
        resolveDefault
      ),
    dreamMode: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-dreamMode" */ '../translations/pt-BR/dreamMode.json'
      ).then(resolveDefault),
    waitlist: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-waitlist" */ '../translations/pt-BR/waitlist.json'
      ).then(resolveDefault),
    share: () =>
      import(/* webpackChunkName: "i18n-pt-BR-share" */ '../translations/pt-BR/share.json').then(
        resolveDefault
      ),
    'landing-b2c': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-landing-b2c" */ '../translations/pt-BR/landing-b2c.json'
      ).then(resolveDefault),
    'landing-b2b': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-landing-b2b" */ '../translations/pt-BR/landing-b2b.json'
      ).then(resolveDefault),
    strategies: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-strategies" */ '../translations/pt-BR/strategies.json'
      ).then(resolveDefault),
    faq: () =>
      import(/* webpackChunkName: "i18n-pt-BR-faq" */ '../translations/pt-BR/faq.json').then(
        resolveDefault
      ),
    about: () =>
      import(/* webpackChunkName: "i18n-pt-BR-about" */ '../translations/pt-BR/about.json').then(
        resolveDefault
      ),
    protocols: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-protocols" */ '../translations/pt-BR/protocols.json'
      ).then(resolveDefault),
    preDemo: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-preDemo" */ '../translations/pt-BR/preDemo.json'
      ).then(resolveDefault),
    preDream: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-preDream" */ '../translations/pt-BR/preDream.json'
      ).then(resolveDefault),
    security: () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-security" */ '../translations/pt-BR/security.json'
      ).then(resolveDefault),
    learn: () =>
      import(/* webpackChunkName: "i18n-pt-BR-learn" */ '../translations/pt-BR/learn.json').then(
        resolveDefault
      ),
    'learn-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-learn-compound-interest" */ '../translations/pt-BR/learn-compound-interest.json'
      ).then(resolveDefault),
    'tools-shared': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-shared" */ '../translations/pt-BR/tools-shared.json'
      ).then(resolveDefault),
    'tools-compound-interest': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-compound-interest" */ '../translations/pt-BR/tools-compound-interest.json'
      ).then(resolveDefault),
    'tools-retirement': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-retirement" */ '../translations/pt-BR/tools-retirement.json'
      ).then(resolveDefault),
    'tools-emergency-fund': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-emergency-fund" */ '../translations/pt-BR/tools-emergency-fund.json'
      ).then(resolveDefault),
    'tools-goal-savings': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-goal-savings" */ '../translations/pt-BR/tools-goal-savings.json'
      ).then(resolveDefault),
    'tools-inflation-impact': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-inflation-impact" */ '../translations/pt-BR/tools-inflation-impact.json'
      ).then(resolveDefault),
    'tools-time-to-target': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-time-to-target" */ '../translations/pt-BR/tools-time-to-target.json'
      ).then(resolveDefault),
    'tools-currency-depreciation': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-currency-depreciation" */ '../translations/pt-BR/tools-currency-depreciation.json'
      ).then(resolveDefault),
    'tools-card-fees': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-card-fees" */ '../translations/pt-BR/tools-card-fees.json'
      ).then(resolveDefault),
    'tools-idle-cash': () =>
      import(
        /* webpackChunkName: "i18n-pt-BR-tools-idle-cash" */ '../translations/pt-BR/tools-idle-cash.json'
      ).then(resolveDefault),
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
export function hasRegisteredNamespace(locale: SupportedLocale, namespace: string): boolean {
  return !!NAMESPACE_LOADERS[locale]?.[namespace];
}
