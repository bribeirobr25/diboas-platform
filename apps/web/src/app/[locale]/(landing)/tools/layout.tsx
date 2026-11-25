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
import { marketDataService, toClientSnapshot } from '@/lib/market-data';
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

  // A8 fix (2026-05-23): pre-fetch the snapshot server-side so every tool page renders with
  // the server's data on first paint. C2-S G4: the provider receives it WITHOUT the monthly
  // series (see below); the browser computes every tool figure from the calibrated constants.
  const [messages, snapshot] = await Promise.all([
    loadPageNamespaces(locale, ['tools-shared']),
    marketDataService.get(),
  ]);
  const adelaide = messages['tools-shared.footer.adelaideAttribution'] ?? 'Money tools by Adelaide';

  return (
    // C2-S G4 (finding 13): the monthly series stay on the server; the browser computes the
    // tools' figures from the calibrated constants and asset history loads its own chunk.
    <MarketDataContextProvider initialSnapshot={toClientSnapshot(snapshot)}>
      <div className={styles.attributionStrip} role="region" aria-label={adelaide}>
        <span className={styles.attributionText}>{adelaide}</span>
      </div>
      {children}
    </MarketDataContextProvider>
  );
}
