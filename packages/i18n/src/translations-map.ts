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
 */

import type { SupportedLocale } from './config';

type LazyLoader = () => Promise<Record<string, any>>;
type NamespaceLoaders = Record<string, LazyLoader>;

const resolveDefault = (m: any) => m.default || m;

/**
 * Per-locale, per-namespace dynamic import loaders.
 * Each loader is a zero-cost function reference until called.
 */
const NAMESPACE_LOADERS: Record<SupportedLocale, NamespaceLoaders> = {
  en: {
    common: () => import('../translations/en/common.json').then(resolveDefault),
    calculator: () => import('../translations/en/calculator.json').then(resolveDefault),
    dreamMode: () => import('../translations/en/dreamMode.json').then(resolveDefault),
    waitlist: () => import('../translations/en/waitlist.json').then(resolveDefault),
    share: () => import('../translations/en/share.json').then(resolveDefault),
    'landing-b2c': () => import('../translations/en/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import('../translations/en/landing-b2b.json').then(resolveDefault),
    'future-you': () => import('../translations/en/future-you.json').then(resolveDefault),
    strategies: () => import('../translations/en/strategies.json').then(resolveDefault),
    faq: () => import('../translations/en/faq.json').then(resolveDefault),
    marketing: () => import('../translations/en/marketing.json').then(resolveDefault),
    home: () => import('../translations/en/home.json').then(resolveDefault),
    about: () => import('../translations/en/about.json').then(resolveDefault),
    protocols: () => import('../translations/en/protocols.json').then(resolveDefault),
    preDemo: () => import('../translations/en/preDemo.json').then(resolveDefault),
    preDream: () => import('../translations/en/preDream.json').then(resolveDefault),
    security: () => import('../translations/en/security.json').then(resolveDefault),
  },
  de: {
    common: () => import('../translations/de/common.json').then(resolveDefault),
    calculator: () => import('../translations/de/calculator.json').then(resolveDefault),
    dreamMode: () => import('../translations/de/dreamMode.json').then(resolveDefault),
    waitlist: () => import('../translations/de/waitlist.json').then(resolveDefault),
    share: () => import('../translations/de/share.json').then(resolveDefault),
    'landing-b2c': () => import('../translations/de/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import('../translations/de/landing-b2b.json').then(resolveDefault),
    'future-you': () => import('../translations/de/future-you.json').then(resolveDefault),
    strategies: () => import('../translations/de/strategies.json').then(resolveDefault),
    faq: () => import('../translations/de/faq.json').then(resolveDefault),
    marketing: () => import('../translations/de/marketing.json').then(resolveDefault),
    home: () => import('../translations/de/home.json').then(resolveDefault),
    about: () => import('../translations/de/about.json').then(resolveDefault),
    protocols: () => import('../translations/de/protocols.json').then(resolveDefault),
    preDemo: () => import('../translations/de/preDemo.json').then(resolveDefault),
    preDream: () => import('../translations/de/preDream.json').then(resolveDefault),
    security: () => import('../translations/de/security.json').then(resolveDefault),
  },
  es: {
    common: () => import('../translations/es/common.json').then(resolveDefault),
    calculator: () => import('../translations/es/calculator.json').then(resolveDefault),
    dreamMode: () => import('../translations/es/dreamMode.json').then(resolveDefault),
    waitlist: () => import('../translations/es/waitlist.json').then(resolveDefault),
    share: () => import('../translations/es/share.json').then(resolveDefault),
    'landing-b2c': () => import('../translations/es/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import('../translations/es/landing-b2b.json').then(resolveDefault),
    'future-you': () => import('../translations/es/future-you.json').then(resolveDefault),
    strategies: () => import('../translations/es/strategies.json').then(resolveDefault),
    faq: () => import('../translations/es/faq.json').then(resolveDefault),
    marketing: () => import('../translations/es/marketing.json').then(resolveDefault),
    home: () => import('../translations/es/home.json').then(resolveDefault),
    about: () => import('../translations/es/about.json').then(resolveDefault),
    protocols: () => import('../translations/es/protocols.json').then(resolveDefault),
    preDemo: () => import('../translations/es/preDemo.json').then(resolveDefault),
    preDream: () => import('../translations/es/preDream.json').then(resolveDefault),
    security: () => import('../translations/es/security.json').then(resolveDefault),
  },
  'pt-BR': {
    common: () => import('../translations/pt-BR/common.json').then(resolveDefault),
    calculator: () => import('../translations/pt-BR/calculator.json').then(resolveDefault),
    dreamMode: () => import('../translations/pt-BR/dreamMode.json').then(resolveDefault),
    waitlist: () => import('../translations/pt-BR/waitlist.json').then(resolveDefault),
    share: () => import('../translations/pt-BR/share.json').then(resolveDefault),
    'landing-b2c': () => import('../translations/pt-BR/landing-b2c.json').then(resolveDefault),
    'landing-b2b': () => import('../translations/pt-BR/landing-b2b.json').then(resolveDefault),
    'future-you': () => import('../translations/pt-BR/future-you.json').then(resolveDefault),
    strategies: () => import('../translations/pt-BR/strategies.json').then(resolveDefault),
    faq: () => import('../translations/pt-BR/faq.json').then(resolveDefault),
    marketing: () => import('../translations/pt-BR/marketing.json').then(resolveDefault),
    home: () => import('../translations/pt-BR/home.json').then(resolveDefault),
    about: () => import('../translations/pt-BR/about.json').then(resolveDefault),
    protocols: () => import('../translations/pt-BR/protocols.json').then(resolveDefault),
    preDemo: () => import('../translations/pt-BR/preDemo.json').then(resolveDefault),
    preDream: () => import('../translations/pt-BR/preDream.json').then(resolveDefault),
    security: () => import('../translations/pt-BR/security.json').then(resolveDefault),
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
): Promise<Record<string, any>> {
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
