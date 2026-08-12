/**
 * Shared metadata builder for market views (M2). `/market` (root view) and
 * `/market/[view]` (live views) both call this so canonical URLs, hreflang,
 * robots, and OG cards stay one implementation (principles #4/#6).
 *
 * OG note (plan §9 rider 4a): per-view OG types register with each view's
 * status flip (M3); until then every view renders the shared 'market' OG
 * template via `view.seoConfigKey`.
 */

import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { socialCardMetadata } from '@/lib/seo';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { viewPath, type MarketViewDef } from '@/lib/market/viewRegistry';
import type { Metadata } from 'next';

const MARKET_INDEXABLE = process.env.NEXT_PUBLIC_MARKET_INDEXABLE === 'true';

export async function buildMarketViewMetadata(
  localeParam: string,
  view: MarketViewDef
): Promise<Metadata> {
  const validLocale = isValidLocale(localeParam) ? (localeParam as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';
  const path = viewPath(view);

  const messages = await loadPageNamespaces(validLocale, [view.namespace]);
  const title = messages[`${view.namespace}.seo.title`] ?? 'Adelaide Market';
  const description =
    messages[`${view.namespace}.seo.description`] ??
    'Calm macro intelligence for the financial markets, starting with Bitcoin. Understand the environment, not the next candle.';
  const ogTitle = messages[`${view.namespace}.seo.ogTitle`] ?? title;
  const ogDescription = messages[`${view.namespace}.seo.ogDescription`] ?? description;

  return {
    title,
    description,
    // SEO-6 / SEO-1 OG half: emit the render-ready OG template + Twitter card.
    // Social cards matter even while `MARKET_INDEXABLE` is false (shares, not
    // SERP) — same rationale as the noindex share page.
    ...socialCardMetadata(view.seoConfigKey, ogTitle, ogDescription, validLocale),
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
