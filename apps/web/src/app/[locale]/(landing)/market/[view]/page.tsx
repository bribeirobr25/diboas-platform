import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { getRoutableView } from '@/lib/market/viewRegistry';
import { MarketViewShell } from '../MarketViewShell';
import { buildMarketViewMetadata } from '../viewMetadata';
import type { Metadata } from 'next';

// Request-dynamic, deliberately (found in the M2 parity pass): this route has
// TWO dynamic segments and only [view] is enumerable — [locale] cannot be
// while the root layout reads x-locale from headers() (the locked V3
// pattern). An SSG/ISR classification (which `dynamic:'auto'` +
// generateStaticParams produced) 500s with DYNAMIC_SERVER_USAGE when an
// unknown slug triggers on-demand static rendering of the headers()-bound
// layout chain. force-dynamic matches the site's actual rendering reality;
// notFound() for non-live slugs then renders the not-found boundary as a
// SOFT 404 (correct content, HTTP 200) — the SAME accepted limitation as
// /learn/[lesson] under V3 (PENDING_ALL 5.67 retires both with static
// locale rendering; these URLs are never linked while non-live).
// generateStaticParams intentionally ABSENT until 5.67 makes SSG real — the
// registry's routableViewSlugs() is the single source a future
// implementation maps over, drift-asserted in viewRegistry.test.ts.
export const dynamic = 'force-dynamic';

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
