/**
 * Server-side utility for loading page-specific translation namespaces
 * Optimizes performance by loading only required translations per page
 */

import { loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';

/**
 * Convert kebab-case path to flattened camelCase
 * Flattens directory structure and converts kebab-case to camelCase
 * @example 'personal/defi-strategies' -> 'personalDefiStrategies'
 * @example 'business/credit-solutions' -> 'businessCreditSolutions'
 * @example 'defi-strategies' -> 'defiStrategies'
 */
function pathToCamel(str: string): string {
  // Remove slashes and hyphens, capitalize the letter after each
  return str
    .replace(/[-\/](.)/g, (_, letter) => letter.toUpperCase());  // -a or /a -> A
}

/**
 * Load and flatten multiple namespaces for a page
 *
 * @param locale - The locale to load
 * @param namespaces - Array of namespace paths (e.g., ['home'], ['personal/account'])
 * @returns Flattened messages object ready for PageI18nProvider
 *
 * @example
 * const messages = await loadPageNamespaces(locale, ['home']);
 * const messages = await loadPageNamespaces(locale, ['personal/account', 'faq']);
 */
export async function loadPageNamespaces(
  locale: SupportedLocale,
  namespaces: string[]
): Promise<Record<string, string>> {
  const allMessages: Record<string, string> = {};

  for (const namespace of namespaces) {
    const namespaceMessages = await loadMessages(locale, namespace);

    // Determine prefix based on namespace path, converting kebab-case to camelCase
    // 'home' -> 'marketing.pages.home'
    // 'personal/defi-strategies' -> 'marketing.pages.personal.defiStrategies'
    // 'business/credit-solutions' -> 'marketing.pages.business.creditSolutions'
    // 'faq' -> 'marketing.faq'
    // 'landing-b2c' -> 'landing-b2c' (landing pages use their own prefix)
    // 'landing-b2b' -> 'landing-b2b' (landing pages use their own prefix)
    let prefix: string;
    if (namespace === 'faq') {
      prefix = 'marketing.faq';
    } else if (namespace.startsWith('landing-')) {
      // Landing pages use their namespace name as prefix directly
      prefix = namespace;
    } else if (namespace === 'calculator' || namespace === 'waitlist' || namespace === 'share' || namespace === 'dreamMode') {
      // Feature namespaces use their namespace name as prefix directly
      prefix = namespace;
    } else {
      prefix = `marketing.pages.${pathToCamel(namespace)}`;
    }

    const flattened = flattenMessages(namespaceMessages, prefix);
    Object.assign(allMessages, flattened);
  }

  return allMessages;
}
