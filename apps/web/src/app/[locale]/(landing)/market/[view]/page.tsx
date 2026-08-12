import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { getRoutableView, routableViewSlugs } from '@/lib/market/viewRegistry';
import { MarketViewShell } from '../MarketViewShell';
import { buildMarketViewMetadata } from '../viewMetadata';
import type { Metadata } from 'next';

export const dynamic = 'auto';
export const revalidate = 3600;

/**
 * `/market/[view]` — per-market views (M2, `MARKET_MACRO_PROGRAM_2026-08-12`
 * plan v3 D-M2-1). Routes ONLY registry entries with `status: 'live'`; every
 * other slug (unknown, 'announced', or the root view while it lives at
 * `/market`) responds `notFound()` — the status-flip mechanism, no redirects.
 *
 * Going live per view = registry status flip + PAGE_SEO_CONFIG entry (which
 * auto-emits the sitemap URL) + pa11y/Lighthouse page-list registration, in
 * one PR (plan §9 rider 4e; the registry drift test enforces the pairing).
 */

interface MarketViewPageProps {
  params: Promise<{ locale: string; view: string }>;
}

export function generateStaticParams(): Array<{ view: string }> {
  // Live slugs only — empty while Bitcoin lives at the root, so nothing
  // prerenders and every unknown slug 404s dynamically. The registry drift
  // test asserts this stays ≡ the registry's live set.
  return routableViewSlugs().map((view) => ({ view }));
}

export async function generateMetadata({ params }: MarketViewPageProps): Promise<Metadata> {
  const { locale, view: slug } = await params;
  const view = getRoutableView(slug);
  if (!view) return {};
  return buildMarketViewMetadata(locale, view);
}

export default async function MarketViewPage({ params }: MarketViewPageProps) {
  const { locale: localeParam, view: slug } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const view = getRoutableView(slug);
  if (!view) {
    notFound();
  }

  return <MarketViewShell locale={locale} view={view} />;
}
