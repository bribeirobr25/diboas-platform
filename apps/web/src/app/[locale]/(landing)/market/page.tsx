import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { resolveRootRendering } from '@/lib/market/viewRegistry';
import { MarketViewShell } from './MarketViewShell';
import { UmbrellaView } from './UmbrellaView';
import { buildMarketViewMetadata } from './viewMetadata';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
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
  const root = resolveRootRendering();
  if (root.mode === 'view') {
    return buildMarketViewMetadata(locale, root.view);
  }
  // Umbrella metadata (M3c state): the shared market namespace's seo keys —
  // the M1 identity copy is already umbrella-shaped.
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const messages = await loadPageNamespaces(validLocale, ['market']);
  return {
    title: messages['market.seo.title'] ?? 'Adelaide Market',
    description:
      messages['market.seo.description'] ??
      'A calm read on the financial markets. Understand the environment, not the next price move.',
  };
}

export default async function MarketPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // M3 registry-v2 root rendering (plan D-M3-1): one live-at-root view →
  // that view (today: Bitcoin); zero roots + live views → the umbrella
  // (the M3c activation state).
  const root = resolveRootRendering();
  return root.mode === 'view' ? (
    <MarketViewShell locale={locale} view={root.view} />
  ) : (
    <UmbrellaView locale={locale} />
  );
}
