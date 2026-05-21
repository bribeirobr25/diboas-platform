import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { Container } from '@/components/UI/Container';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import nextDynamic from 'next/dynamic';
import {
  RegimeScore,
  RegimeLabel,
  ConfidenceBadge,
  CalmSummary,
  SignalCardsGrid,
  DataFreshnessBadge,
  MethodologyLink,
  ProductDisclaimer,
  PoweredByAttribution,
} from '@/components/Analytics';
// HistoricalRegimeChart is below-fold (renders after CalmSummary + SignalCardsGrid);
// lazy-load its JS chunk to free main-thread time for above-fold hydration.
// SSR stays on (no `ssr: false`) so the chart's SVG still ships in initial HTML
// for no-JS users and search engines.
const HistoricalRegimeChart = nextDynamic(
  () => import('@/components/Analytics').then((m) => ({ default: m.HistoricalRegimeChart })),
);
import { HostRegulatoryDisclaimer } from '@/components/Legal';
import { AnalyticsProvider } from '@/lib/analytics-sdk/mock-client';
import { fetchInitialAnalyticsData } from '@/lib/analytics-sdk/mock-client.server';
import { marketArticleSchema } from '@/lib/market/structuredData';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';
import styles from './page.module.css';

export const dynamic = 'auto';
export const revalidate = 3600;

/**
 * `/market` (Adelaide Daily)
 *
 * Iteration 2 of `docs/audit/MARKET_INTEGRATION_PLAN_2026-05-13.md` — replaces
 * the iteration-1 coming-soon placeholder with the full BTC Macro Regime
 * Dashboard view composed from typed SDK components fed by fixture JSON via
 * `<AnalyticsProvider initialData={…}>` (NF5 pattern).
 *
 * Iteration 5 swap: the `analytics-sdk` imports below switch to
 * `@analytics-platform/client`; this file is otherwise unchanged.
 *
 * Page-level title stays BARE — the root layout's `metadata.title.template`
 * auto-appends `| diBoaS`. Indexability gated by `NEXT_PUBLIC_MARKET_INDEXABLE`.
 */
const MARKET_INDEXABLE = process.env.NEXT_PUBLIC_MARKET_INDEXABLE === 'true';
const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? '/_mock';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  const messages = await loadPageNamespaces(validLocale, ['market']);
  const title = messages['market.seo.title'] ?? 'Adelaide Daily';
  const description =
    messages['market.seo.description'] ??
    'Calm macro intelligence for Bitcoin. Understand the environment, not the next candle.';
  const ogTitle = messages['market.seo.ogTitle'] ?? title;
  const ogDescription = messages['market.seo.ogDescription'] ?? description;

  return {
    title,
    description,
    openGraph: { title: ogTitle, description: ogDescription },
    robots: MARKET_INDEXABLE
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical: `${siteUrl}/${validLocale}/market` },
  };
}

export default async function MarketPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const pageMessages = await loadPageNamespaces(locale, ['market', 'landing-b2c']);

  const initialData = await fetchInitialAnalyticsData(locale);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: pageMessages['market.hero.title'] ?? 'Adelaide Daily', url: '/market' },
    ],
    locale,
  );

  // Article JSON-LD (iter-4 §3.4). Sourced from the editorial regime data via
  // `marketArticleSchema()` — datePublished = regime.last_updated_at. Helper
  // returns null when regime is missing or last_updated_at is not ISO-8601;
  // `<StructuredData data={[...].filter(Boolean)} />` filters it out so the
  // page still emits breadcrumbs even when Article cannot.
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';
  const articleDescription =
    pageMessages['market.seo.description'] ??
    'Calm macro intelligence for Bitcoin. Understand the environment, not the next candle.';
  const articleHeadline = pageMessages['market.hero.title'] ?? 'Adelaide Daily';
  const articleData = marketArticleSchema({
    data: initialData,
    locale,
    siteUrl,
    description: articleDescription,
    headline: articleHeadline,
  });

  // i18n keys read directly from the namespace dictionary so server components
  // can pass strings down to the SDK primitives without going through the
  // client-only `useTranslation` hook.
  const t = (key: string, fallback: string) => pageMessages[`market.${key}`] ?? fallback;

  const heroKicker = t('hero.kicker', 'Macro environment score');
  const heroTitle = t('hero.title', 'Adelaide Daily');
  const heroSubtitle = t('hero.subtitle', 'Calm macro intelligence for Bitcoin.');

  const confidenceLabels = {
    HIGH: t('dashboard.confidence.HIGH', 'High confidence'),
    MODERATE: t('dashboard.confidence.MODERATE', 'Moderate confidence'),
    LOW: t('dashboard.confidence.LOW', 'Low confidence'),
  } as const;

  const regimeLabels = {
    VERY_FAVORABLE: t('dashboard.regimeLabels.VERY_FAVORABLE', 'Very Favorable'),
    CONSTRUCTIVE: t('dashboard.regimeLabels.CONSTRUCTIVE', 'Constructive'),
    NEUTRAL_MIXED: t('dashboard.regimeLabels.NEUTRAL_MIXED', 'Neutral / Mixed'),
    DEFENSIVE: t('dashboard.regimeLabels.DEFENSIVE', 'Defensive'),
    HOSTILE: t('dashboard.regimeLabels.HOSTILE', 'Hostile'),
  } as const;

  const freshnessLabels = {
    FRESH: t('dashboard.freshness.FRESH', 'Fresh'),
    DELAYED: t('dashboard.freshness.DELAYED', 'Delayed'),
    STALE: t('dashboard.freshness.STALE', 'Stale'),
    UNAVAILABLE: t('dashboard.freshness.UNAVAILABLE', 'Unavailable'),
  } as const;

  const fallbackMessages = {
    outageTitle: t('fallback.outageTitle', 'Live data is temporarily unavailable'),
    outageBody: t('fallback.outageBody', 'We are restoring the connection.'),
    partialOutageTitle: t('fallback.partialOutageTitle', 'Some data sources are delayed'),
    partialOutageBody: t('fallback.partialOutageBody', 'Most signals are current.'),
  };

  const regime = initialData.regime;
  const historical = initialData.historical;
  const signals = initialData.signals;
  const dataStatus = initialData.dataStatus;
  const methodology = initialData.methodology;
  const productDisclaimer = initialData.productDisclaimer;

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData, articleData].filter(Boolean) as Record<string, unknown>[]} />

      <AnalyticsProvider
        apiBaseUrl={ANALYTICS_API_URL}
        locale={locale}
        initialData={initialData}
        fallbackMessages={fallbackMessages}
      >
        <div className="main-page-wrapper">
          <Container size="md">
            <header className={styles.hero}>
              <p className={styles.heroKicker}>{heroKicker}</p>
              <h1 className={styles.heroTitle}>{heroTitle}</h1>
              <p className={styles.heroSubtitle}>{heroSubtitle}</p>
            </header>

            {regime && (
              <SectionErrorBoundary
                sectionId="market-regime-band"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'regime' }}
              >
                <section className={styles.regimeBand}>
                  <RegimeScore
                    data={regime}
                    ariaLabel={t('dashboard.scoreAriaLabel', 'Current macro environment score')}
                  />
                  <div className={styles.regimeBandMeta}>
                    <div className={styles.regimeBandBadges}>
                      <RegimeLabel data={regime} labels={regimeLabels} />
                      <ConfidenceBadge
                        level={regime.summary.confidence_level}
                        labels={confidenceLabels}
                      />
                    </div>
                    <CalmSummary data={regime.summary} length="detailed" />
                  </div>
                </section>
              </SectionErrorBoundary>
            )}

            {signals && signals.signal_groups.length > 0 && (
              <SectionErrorBoundary
                sectionId="market-signals"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'signals' }}
              >
                <section className={styles.section}>
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionTitle}>
                      {t('dashboard.signalsSectionTitle', 'Signal groups')}
                    </h2>
                    <p className={styles.sectionLead}>
                      {t('dashboard.signalsSectionLead', 'Four groups make up the 14-point score.')}
                    </p>
                  </div>
                  <SignalCardsGrid
                    groups={signals.signal_groups}
                    expandLabel={t('dashboard.signalsExpand', 'Show signals')}
                    collapseLabel={t('dashboard.signalsCollapse', 'Hide signals')}
                    pointsLabel={t('dashboard.signalsPoints', 'pts')}
                    columns={2}
                  />
                </section>
              </SectionErrorBoundary>
            )}

            {historical && historical.snapshots.length > 0 && (
              <SectionErrorBoundary
                sectionId="market-historical"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'historical' }}
              >
                <section className={styles.section}>
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionTitle}>
                      {t('dashboard.historicalTitle', 'Score over time')}
                    </h2>
                    <p className={styles.sectionLead}>
                      {t('dashboard.historicalLead', 'Where the environment has been over the last year.')}
                    </p>
                  </div>
                  <HistoricalRegimeChart
                    data={historical}
                    range="1Y"
                    ariaLabel={t('dashboard.historicalAriaLabel', 'Macro environment score over the last 12 months')}
                    tableLabels={{
                      date: t('dashboard.historicalTableDate', 'Date'),
                      score: t('dashboard.historicalTableScore', 'Score'),
                      regime: t('dashboard.historicalTableRegime', 'Regime'),
                    }}
                  />
                </section>
              </SectionErrorBoundary>
            )}

            {dataStatus && dataStatus.sources.length > 0 && (
              <SectionErrorBoundary
                sectionId="market-data-status"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'data-status' }}
              >
                <section className={styles.section}>
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionTitle}>
                      {t('dashboard.dataStatusTitle', 'Data sources')}
                    </h2>
                    <p className={styles.sectionLead}>
                      {t('dashboard.dataStatusLead', 'Live confidence per upstream feed.')}
                    </p>
                  </div>
                  <ul className={styles.dataStatusList}>
                    {dataStatus.sources.map((src) => (
                      <li key={src.source}>
                        <DataFreshnessBadge
                          source={src.source}
                          status={src.status}
                          labels={freshnessLabels}
                          message={src.message}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              </SectionErrorBoundary>
            )}

            <section className={styles.footerSection}>
              {methodology && (
                <div className={styles.sectionHeading}>
                  <h2 className={styles.sectionTitle}>
                    {t('dashboard.methodologyTitle', 'How this is calculated')}
                  </h2>
                  <p className={styles.sectionLead}>
                    {t('dashboard.methodologyLead', 'Every signal, threshold, and weight is documented on diBoaS Analytics.')}
                  </p>
                  <MethodologyLink href={methodology.methodology_url}>
                    {t('dashboard.methodologyLinkLabel', 'Read the methodology')}
                  </MethodologyLink>
                </div>
              )}

              {productDisclaimer && (
                <ProductDisclaimer text={productDisclaimer.text[locale] ?? productDisclaimer.text.en} />
              )}

              <HostRegulatoryDisclaimer
                text={t(
                  'disclaimer.host.regulatory',
                  'diBoaS does not provide investment advice. This page is educational only.',
                )}
              />

              <PoweredByAttribution
                href="https://diboas-analytics.com"
                label={t('dashboard.poweredByLabel', 'Powered by')}
                productName={t('dashboard.poweredByProduct', 'diBoaS Analytics')}
              />
            </section>
          </Container>

          <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={B2C_FOOTER_DISCLOSURES} />
        </div>
      </AnalyticsProvider>
    </PageI18nProvider>
  );
}
