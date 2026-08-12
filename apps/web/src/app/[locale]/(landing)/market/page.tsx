import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { rootView } from '@/lib/market/viewRegistry';
import { MarketViewShell } from './MarketViewShell';
import { buildMarketViewMetadata } from './viewMetadata';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';
export const revalidate = 3600;

/**
 * `/market` (Adelaide Market — the Market Macro root).
 *
 * M2 (`MARKET_MACRO_PROGRAM_2026-08-12` plan v3): this page is a thin wrapper
 * around `MarketViewShell`, rendering the registry's single `live-at-root`
 * view (Bitcoin). When the second view goes live (M3), this route becomes the
 * umbrella and Bitcoin moves to `/market/bitcoin` — one atomic status flip in
 * the registry, no page fork.
 *
 * Page-level title stays BARE — the root layout's `metadata.title.template`
 * auto-appends `| diBoaS`. Indexability gated by `NEXT_PUBLIC_MARKET_INDEXABLE`.
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMarketViewMetadata(locale, rootView());
}

export default async function MarketPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return <MarketViewShell locale={locale} view={rootView()} />;
}
