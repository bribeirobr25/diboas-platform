/**
 * /tools shared layout — Phase 6C.1.
 *
 * Wraps all tools routes (landing + 4 sub-routes) with a slim
 * Adelaide-attributed header strip above the page content. The (landing)
 * parent layout still provides the main MinimalNavigation, cookie consent,
 * waitlist context, etc.
 */

import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { MarketDataContextProvider } from '@/components/Providers';
import { marketDataService } from '@/lib/market-data';
import styles from './ToolsLayout.module.css';

interface ToolsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ToolsLayout({ children, params }: ToolsLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) {
    notFound();
  }

  // A8 fix (2026-05-23): pre-fetch the full snapshot (incl. monthly FX series)
  // server-side so every tool page renders with live data on first paint —
  // not the static fallback that would otherwise be used because calculators
  // read `marketDataService.getSync()` synchronously with no client-side
  // trigger to populate the cache. `MarketDataContextProvider` primes the client
  // singleton during hydration so child calculators get the live snapshot
  // on their very first render. See TOOLS_IMPROVEMENT.md A8.
  const [messages, snapshot] = await Promise.all([
    loadPageNamespaces(locale, ['tools-shared']),
    marketDataService.get(),
  ]);
  const adelaide = messages['tools-shared.footer.adelaideAttribution'] ?? 'Money tools by Adelaide';

  return (
    <MarketDataContextProvider initialSnapshot={snapshot}>
      <div className={styles.attributionStrip} role="region" aria-label={adelaide}>
        <span className={styles.attributionText}>{adelaide}</span>
      </div>
      {children}
    </MarketDataContextProvider>
  );
}
