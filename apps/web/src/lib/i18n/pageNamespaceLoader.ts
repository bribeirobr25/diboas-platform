/**
 * Server-side utility for loading page-specific translation namespaces
 * Optimizes performance by loading only required translations per page
 *
 * Marketing page namespace logic removed 2026-04-04 (marketing pages deleted).
 */

import { loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';

/**
 * Load and flatten multiple namespaces for a page
 *
 * @param locale - The locale to load
 * @param namespaces - Array of namespace paths
 * @returns Flattened messages object ready for PageI18nProvider
 */
export async function loadPageNamespaces(
  locale: SupportedLocale,
  namespaces: string[]
): Promise<Record<string, string>> {
  // Phase 1 (learn redesign, 2026-07-15): namespaces load in parallel; the
  // previous sequential loop made multi-namespace pages pay serial awaits.
  // Merge order still follows the caller's namespace order (prefixes are
  // namespace-unique, so overlap can't occur regardless).
  const flattenedPerNamespace = await Promise.all(
    namespaces.map(async (namespace) => {
      const namespaceMessages = await loadMessages(locale, namespace);
      // Each namespace uses its name as the prefix for flattened keys
      return flattenMessages(namespaceMessages, namespace);
    })
  );

  const allMessages: Record<string, string> = {};
  for (const flattened of flattenedPerNamespace) {
    Object.assign(allMessages, flattened);
  }

  return allMessages;
}
