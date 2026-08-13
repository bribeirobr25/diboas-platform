/**
 * Shared metadata builder for market pages (M2, umbrella-generalized in the
 * M3c audit). `/market` (umbrella), and `/market/[view]` (live views) all
 * flow through one core so canonical URLs, hreflang, robots, and OG cards
 * stay one implementation (principles #4/#6).
 *
 * OG note (plan §9 rider 4a): per-view OG types registered with the M3c
 * status flip ('market-bitcoin', 'market-backdrop'); the umbrella keeps the
 * shared 'market' OG template.
 */

import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { socialCardMetadata } from '@/lib/seo';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { viewPath, type MarketViewDef } from '@/lib/market/viewRegistry';
import type { OGPageType } from '@/lib/og/templates';
import type { Metadata } from 'next';

const MARKET_INDEXABLE = process.env.NEXT_PUBLIC_MARKET_INDEXABLE === 'true';

interface MarketMetadataSource {
  namespace: string;
  seoConfigKey: OGPageType;
  path: string;
}

async function buildMarketMetadata(
  localeParam: string,
  { namespace, seoConfigKey, path }: MarketMetadataSource
): Promise<Metadata> {
  const validLocale = isValidLocale(localeParam) ? (localeParam as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  const messages = await loadPageNamespaces(validLocale, [namespace]);
  const title = messages[`${namespace}.seo.title`] ?? 'Adelaide Market';
  const description =
    messages[`${namespace}.seo.description`] ??
    'Calm macro intelligence for the financial markets, starting with Bitcoin. Understand the environment, not the next candle.';
  const ogTitle = messages[`${namespace}.seo.ogTitle`] ?? title;
  const ogDescription = messages[`${namespace}.seo.ogDescription`] ?? description;

  return {
    title,
    description,
    // SEO-6 / SEO-1 OG half: emit the render-ready OG template + Twitter card.
    // Social cards matter even while `MARKET_INDEXABLE` is false (shares, not
    // SERP) — same rationale as the noindex share page.
    ...socialCardMetadata(seoConfigKey, ogTitle, ogDescription, validLocale),
    robots: MARKET_INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
    // SEO-1 index-flip half (5.38, founder go 2026-07-16 — the professional-translator
    // language gate was collapsed by the founder's native-approval ruling): hreflang
    // alternates mirror the `about` pattern. Only emitted when MARKET_INDEXABLE is
    // true (hreflang belongs on indexable pages, per the original A17 deferral).
    alternates: {
      canonical: `${siteUrl}/${validLocale}${path}`,
      ...(MARKET_INDEXABLE
        ? {
            languages: {
              en: `${siteUrl}/en${path}`,
              de: `${siteUrl}/de${path}`,
              es: `${siteUrl}/es${path}`,
              'pt-br': `${siteUrl}/pt-BR${path}`,
              'x-default': `${siteUrl}/en${path}`,
            },
          }
        : {}),
    },
  };
}

export function buildMarketViewMetadata(
  localeParam: string,
  view: MarketViewDef
): Promise<Metadata> {
  return buildMarketMetadata(localeParam, {
    namespace: view.namespace,
    seoConfigKey: view.seoConfigKey,
    path: viewPath(view),
  });
}

/**
 * The /market umbrella (M3c). Same core as the views — the M3c audit caught
 * the first umbrella branch returning bare title+description, which would
 * have REGRESSED the root page's canonical + OG card vs pre-activation prod.
 */
export function buildMarketUmbrellaMetadata(localeParam: string): Promise<Metadata> {
  return buildMarketMetadata(localeParam, {
    namespace: 'market',
    seoConfigKey: 'market',
    path: '/market',
  });
}
