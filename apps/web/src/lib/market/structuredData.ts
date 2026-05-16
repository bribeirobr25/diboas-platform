/**
 * Structured data (schema.org JSON-LD) for the Adelaide Daily (/market) route.
 *
 * Iteration 4 §3.4 — `Article` per Schema.org with `datePublished` derived
 * from `regime.last_updated_at`. Mirrors the feature-specific pattern at
 * `lib/tools/structuredData.ts` and `lib/learn/structuredData.ts` (M7
 * round-2 — feature-specific structured-data lives with its feature).
 *
 * Iteration 5 swap: when `@analytics-platform/client` ships, this file can
 * stay as-is — the helper consumes `AnalyticsInitialData` (the SDK contract
 * shape) which the real SDK returns. Only the upstream import path changes.
 *
 * `datePublished` / `dateModified` MVP decision (M4 round-1): set both equal
 * to `regime.last_updated_at`. Adelaide Daily is a daily-cadence editorial
 * product where each day's regime data IS a new publication, not an update
 * to a prior article. Re-evaluate if iter-5+ introduces archived/permalinked
 * historical regime views.
 */

import type { SupportedLocale } from '@diboas/i18n/server';
import { seoService } from '@/lib/seo';
import { SEO_DEFAULTS } from '@/lib/seo/constants';
import type { AnalyticsInitialData } from '@/lib/analytics-sdk/types';

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'diBoaS',
  url: 'https://diboas.com',
} as const;

const ANALYTICS_PUBLISHER = {
  '@type': 'Organization',
  name: 'diBoaS Analytics',
  url: 'https://diboas-analytics.com',
} as const;

/**
 * Map a `SupportedLocale` to its BCP-47 / Schema.org `inLanguage` tag.
 * Iter-4 §6.7 locked convention: en → en-US, others stay as-is.
 */
function localeToBCP47(locale: SupportedLocale): string {
  return locale === 'en' ? 'en-US' : locale;
}

/**
 * Verify a string is in ISO-8601 format (Schema.org Article#datePublished
 * requires ISO-8601 — `new Date("01/15/2026")` parses but is not ISO).
 * Mirrors the iter-3 fixture-drift guard's ISO-8601 regex.
 */
function isISO8601(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value);
}

/**
 * Build the Article JSON-LD payload for `/market`.
 *
 * Returns `null` if `regime.last_updated_at` is missing or not ISO-8601.
 * The caller emits `<StructuredData data={[breadcrumbData, articleData].filter(Boolean)} />`
 * so breadcrumbs still render when Article cannot.
 *
 * Per iter-4 §6.7.5 (L7 round-2) — signature accepts the full
 * `AnalyticsInitialData` composite (not just `regime`) so future fallback
 * sources (`methodology.published_at`, etc.) are reachable without changing
 * the signature. iter-4 v1 only consults `regime.last_updated_at`.
 *
 * Per iter-4 §6.7.5 (P1 round-3) — `description` is sourced from the
 * page-level `generateMetadata` so the Article schema and the page meta
 * description always share a single source of truth.
 */
export function marketArticleSchema(args: {
  data: AnalyticsInitialData;
  locale: SupportedLocale;
  siteUrl?: string;
  description: string;
  headline: string;
}): Record<string, unknown> | null {
  const datePublished = args.data.regime?.last_updated_at;
  if (!isISO8601(datePublished)) return null;

  const siteUrl = args.siteUrl ?? SEO_DEFAULTS.siteUrl;
  const url = seoService.generateCanonicalUrl('/market', args.locale);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    url,
    headline: args.headline,
    description: args.description,
    datePublished,
    dateModified: datePublished,
    author: ANALYTICS_PUBLISHER,
    publisher: {
      ...ORGANIZATION,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/assets/logos/logo-icon.avif`,
      },
    },
    inLanguage: localeToBCP47(args.locale),
    isAccessibleForFree: true,
  };
}
