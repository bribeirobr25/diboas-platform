/**
 * Structured data (schema.org JSON-LD) for the Money Tools route group.
 *
 * Phase 6F.1 — `SoftwareApplication` per tool, `ItemList` on the /tools landing.
 * Mirrors the lesson pattern at `lib/learn/structuredData.ts`.
 */

import type { SupportedLocale } from '@diboas/i18n/config';
import { seoService } from '@/lib/seo';
import { TOOL_DESCRIPTORS } from './constants';
import type { ToolKey } from './types';

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'diBoaS',
  url: 'https://diboas.com',
} as const;

/**
 * SoftwareApplication record for a single tool.
 *
 * Caller passes localized name + description (already resolved from i18n in
 * the page component) so the JSON-LD respects locale parity. Each tool is
 * marked as a free calculator under the FinanceApplication category.
 */
export function buildToolStructuredData(args: {
  toolKey: ToolKey;
  locale: SupportedLocale;
  name: string;
  description: string;
}) {
  const descriptor = TOOL_DESCRIPTORS[args.toolKey];
  const path = `/tools/${descriptor.slug}`;
  const url = seoService.generateCanonicalUrl(path, args.locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': url,
    url,
    name: args.name,
    description: args.description,
    applicationCategory: 'FinanceApplication',
    applicationSubCategory: 'Calculator',
    operatingSystem: 'Web',
    inLanguage: args.locale,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: ORGANIZATION,
    publisher: ORGANIZATION,
  };
}

/**
 * ItemList of all shipped tools for the /tools landing page.
 *
 * Search engines treat ItemList as an entity carousel; including it improves
 * the chance of rich-results display when the index page is indexed.
 */
export function buildToolsIndexStructuredData(args: {
  locale: SupportedLocale;
  shippedTools: ReadonlyArray<ToolKey>;
  toolNames: Partial<Record<ToolKey, string>>;
}) {
  if (args.shippedTools.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'diBoaS Money Tools',
    inLanguage: args.locale,
    itemListElement: args.shippedTools.map((toolKey, index) => {
      const descriptor = TOOL_DESCRIPTORS[toolKey];
      const path = `/tools/${descriptor.slug}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: seoService.generateCanonicalUrl(path, args.locale),
        name: args.toolNames[toolKey] ?? toolKey,
      };
    }),
  };
}
