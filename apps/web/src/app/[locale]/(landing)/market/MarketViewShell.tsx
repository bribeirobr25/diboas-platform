/**
 * Market view shell (M2 — plan v3 D-M2-2/D-M2-5). THE single composition for
 * every market view: `/market` (the root view) and `/market/[view]` (live
 * views) both render this — one shell, no per-view page forks (principles
 * #4/#6). Extracted verbatim from the pre-M2 `page.tsx` with the eight
 * single-market couplings parameterized through the view registry:
 * namespace, data loader, source-label map, canonical/share path, breadcrumb,
 * article schema inputs, metadata (in `viewMetadata.ts`), and the hero copy
 * prefix. Rendering is byte-equivalent for the Bitcoin root view — proven by
 * the M2 parity pass.
 *
 * Grammar seam (D-M2-5): only the 'scored' composition exists. The 'state'
 * branch ships with M3 (macro backdrop) — a state-grammar view reaching this
 * shell before then fails loudly via `notFound()` rather than rendering the
 * wrong UI.
 */

import type { SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { MarketHeroCanvas, MarketCtaBand } from '@/components/Market';
import { Container } from '@/components/UI/Container';
import {
  B2C_FOOTER_NAV,
  B2C_FOOTER_DISCLOSURES,
  MARKET_FOOTER_EXTRA_DISCLOSURES,
} from '@/config/landing-b2c';
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
const HistoricalRegimeChart = nextDynamic(() =>
  import('@/components/Analytics').then((m) => ({ default: m.HistoricalRegimeChart }))
);
import { HostRegulatoryDisclaimer } from '@/components/Legal';
import { AnalyticsProvider } from '@/lib/analytics-sdk/mock-client';
import { fetchInitialAnalyticsData } from '@/lib/analytics-sdk/mock-client.server';
import { marketArticleSchema } from '@/lib/market/structuredData';
import { viewPath, type MarketViewDef } from '@/lib/market/viewRegistry';
import { MarketViewSwitcher } from './MarketViewSwitcher';
import { StateViewSections } from './StateViewSections';
import styles from './page.module.css';

import { ANALYTICS_SITE_LIVE } from '@/lib/market/constants';

const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? '/_mock';

interface MarketViewShellProps {
  locale: SupportedLocale;
  view: MarketViewDef;
}

export async function MarketViewShell({ locale, view }: MarketViewShellProps) {
  // Grammar branch (M3a): 'scored' renders the gauge/signals/history
  // composition; 'state' renders the condition composition
  // (StateViewSections) — shared chrome (hero/outage/data-status/CTA/
  // methodology/footer) is common to both.

  // The shared 'market' namespace always loads (page chrome + the switcher's
  // per-view labels at market.views.<slug> — a view's OWN namespace is only
  // loaded for the view being rendered, so cross-view labels live in the
  // shared namespace). Deduped for the root view where both are 'market'.
  const namespaces = Array.from(new Set(['market', view.namespace, 'landing-b2c']));
  const pageMessages = await loadPageNamespaces(locale, namespaces);

  const initialData = await fetchInitialAnalyticsData(locale, view.slug);

  const path = viewPath(view);

  // i18n keys read directly from the namespace dictionary so server components
  // can pass strings down to the SDK primitives without going through the
  // client-only `useTranslation` hook.
  // M3a FALLBACK CHAIN (plan v3 D-M3-4, the critical audit finding): view
  // namespace → shared 'market' namespace → literal. Without the middle step,
  // a view whose namespace ≠ 'market' would silently resolve all 47 shared
  // keys to EN literals in de/es/pt-BR. For the root view (namespace =
  // 'market') the chain is behavior-identical to the old single prefix.
  // NOTE: the switcher's cross-view labels (market.views.<slug>) bypass t()
  // by design — shared-namespace-direct; the chain governs view-prefixed keys.
  const t = (key: string, fallback: string) =>
    pageMessages[`${view.namespace}.${key}`] ?? pageMessages[`market.${key}`] ?? fallback;

  // 3-level breadcrumbs for subpath views (M3b): Home → Adelaide Market →
  // the view; the root view keeps the 2-level trail.
  const marketPageName = pageMessages['market.hero.title'] ?? 'Adelaide Market';
  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    view.status === 'live-at-root'
      ? [
          { name: 'Home', url: '/' },
          { name: marketPageName, url: path },
        ]
      : [
          { name: 'Home', url: '/' },
          { name: marketPageName, url: '/market' },
          {
            name: pageMessages[`market.views.${view.slug}`] ?? t('hero.title', 'Adelaide Market'),
            url: path,
          },
        ],
    locale
  );

  // Article JSON-LD (iter-4 §3.4). Sourced from the editorial regime data via
  // `marketArticleSchema()` — datePublished = regime.last_updated_at. Helper
  // returns null when regime is missing or last_updated_at is not ISO-8601;
  // `<StructuredData data={[...].filter(Boolean)} />` filters it out so the
  // page still emits breadcrumbs even when Article cannot.
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';
  const articleDescription = t(
    'seo.description',
    'Calm macro intelligence for the financial markets, starting with Bitcoin. Understand the environment, not the next candle.'
  );
  const articleHeadline = t('hero.title', 'Adelaide Market');
  const articleData = marketArticleSchema({
    data: initialData,
    locale,
    siteUrl,
    description: articleDescription,
    headline: articleHeadline,
  });

  const heroKicker = t('hero.kicker', 'Macro environment score');
  const heroTitle = t('hero.title', 'Adelaide Market');
  const heroSubtitle = t('hero.subtitle', 'Calm macro intelligence for the financial markets.');

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
      <StructuredData
        data={[breadcrumbData, articleData].filter(Boolean) as Record<string, unknown>[]}
      />

      <AnalyticsProvider
        apiBaseUrl={ANALYTICS_API_URL}
        locale={locale}
        initialData={initialData}
        fallbackMessages={fallbackMessages}
      >
        <div className={`main-page-wrapper ${styles.editorial}`}>
          {/* Editorial masthead hero (replicates 02-editorial-motion). A
              decorative teal particle canvas + grain sit behind the real,
              SSR-rendered masthead / h1 / standfirst (LCP + SEO unaffected). */}
          <section className={styles.hero} id="market-top">
            <MarketHeroCanvas />
            <div className={styles.grain} aria-hidden="true" />
            <Container size="md">
              <div className={styles.heroInner}>
                <div className={styles.masthead}>
                  <span className={styles.eyebrow}>{heroKicker}</span>
                  {(() => {
                    const d = regime?.last_updated_at ? new Date(regime.last_updated_at) : null;
                    return d && !Number.isNaN(d.getTime()) ? (
                      <span className={styles.heroDate}>
                        {d.toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ) : null;
                  })()}
                </div>
                <h1 className={styles.heroTitle} id="hero-market-title">
                  {heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
                  <em className={styles.heroTitleAccent}>{heroTitle.split(' ').slice(-1)}</em>
                </h1>
                <p className={styles.standfirst}>{heroSubtitle}</p>
              </div>
            </Container>
          </section>

          {/* View switcher (D-M2-6): renders null until the registry exposes a
              second destination — invisible in M2 by design. */}
          <MarketViewSwitcher
            activeSlug={view.slug}
            labelFor={(v) => pageMessages[`market.views.${v.slug}`] ?? v.slug}
            navLabel={pageMessages['market.umbrella.switcherAriaLabel'] ?? 'Market views'}
          />

          {/* Outage banner (B-2, robustness / Principle-7 fix): when the core
              reading is null the page body silently collapsed; now it says so
              honestly instead. Fires only on a genuine null feed — the normal
              per-source DELAYED/UNAVAILABLE states stay handled by the freshness
              badges, so this never noises on ordinary lag. */}
          {!regime ? (
            <Container size="md">
              <div className={styles.outageBanner} role="status">
                <strong>{fallbackMessages.outageTitle}</strong>
                <span>{fallbackMessages.outageBody}</span>
              </div>
            </Container>
          ) : !signals ? (
            <Container size="md">
              <div className={styles.outageBanner} role="status">
                <strong>{fallbackMessages.partialOutageTitle}</strong>
                <span>{fallbackMessages.partialOutageBody}</span>
              </div>
            </Container>
          ) : null}

          <Container size="md">
            {view.grammar === 'scored' && regime && (
              <SectionErrorBoundary
                sectionId="market-regime-band"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'regime', view: view.slug }}
              >
                <section className={styles.scoreSec}>
                  <div className={styles.scoreGrid}>
                    <div className={styles.gaugeWrap}>
                      <RegimeScore
                        data={regime}
                        ariaLabel={t('dashboard.scoreAriaLabel', 'Current macro environment score')}
                      />
                      <div className={styles.pills}>
                        <RegimeLabel data={regime} labels={regimeLabels} />
                        <ConfidenceBadge
                          level={regime.summary.confidence_level}
                          labels={confidenceLabels}
                        />
                      </div>
                    </div>
                    <div className={styles.scoreCopy}>
                      {regime.summary.plain && <CalmSummary data={regime.summary} length="plain" />}
                    </div>
                  </div>
                  {/* View-voice wave (2026-08-14, founder feedback): the plain
                      grandmother lead above stays the visible voice; the full
                      analyst memo collapses behind a native <details> (server-
                      rendered, keyboard/screen-reader native, no JS needed).
                      The memo text itself is UNCHANGED — progressive disclosure,
                      not deletion. */}
                  <details className={styles.scoreDetail}>
                    <summary className={styles.memoToggle}>
                      {t('dashboard.memoToggle', 'Read the full weekly memo')}
                    </summary>
                    <CalmSummary
                      data={regime.summary}
                      length="detailed"
                      className={styles.scoreDetailBody}
                    />
                  </details>
                </section>
              </SectionErrorBoundary>
            )}

            {view.grammar === 'state' && signals && (
              <StateViewSections viewSlug={view.slug} signalGroups={signals.signal_groups} t={t} />
            )}

            {view.grammar === 'scored' && signals && signals.signal_groups.length > 0 && (
              <SectionErrorBoundary
                sectionId="market-signals"
                sectionType="dashboard"
                enableReporting
                context={{ page: 'market', section: 'signals', view: view.slug }}
              >
                <section className={styles.section}>
                  {/* The editorial table is flat (no per-card expand), so we show
                      the section title as the heading rather than the lead, whose
                      copy references "expand a card". */}
                  <div className={styles.secHead}>
                    <h2 className={styles.h2}>
                      {t('dashboard.signalsSectionTitle', 'Signal groups')}
                    </h2>
                  </div>
                  {/* Cleanup 2026-08-18: the expand/collapse/points label props
                      died with the M3.5 native-details conversion — the grid
                      component still ACCEPTS them (doc-09 SDK API compat) but
                      renders its own disclosure semantics; passing dead t()
                      lookups here kept 3 zombie i18n keys alive ×4 locales. */}
                  <SignalCardsGrid groups={signals.signal_groups} />
                </section>
              </SectionErrorBoundary>
            )}

            {view.grammar === 'scored' &&
              historical &&
              historical.snapshots.length > 0 &&
              !historical.synthetic_seed && (
                <SectionErrorBoundary
                  sectionId="market-historical"
                  sectionType="dashboard"
                  enableReporting
                  context={{ page: 'market', section: 'historical', view: view.slug }}
                >
                  <section className={styles.section}>
                    <div className={styles.secHead}>
                      <span className={styles.eyebrow}>
                        {t('dashboard.historicalTitle', 'Score over time')}
                      </span>
                      <h2 className={styles.h2}>
                        {t(
                          'dashboard.historicalLead',
                          'Where the environment has been, week by week since the framework went live.'
                        )}
                      </h2>
                    </div>
                    <HistoricalRegimeChart
                      data={historical}
                      range="1Y"
                      ariaLabel={t(
                        'dashboard.historicalAriaLabel',
                        'Macro environment score for each week since the framework went live'
                      )}
                      tableLabels={{
                        date: t('dashboard.historicalTableDate', 'Date'),
                        score: t('dashboard.historicalTableScore', 'Score'),
                        regime: t('dashboard.historicalTableRegime', 'Regime'),
                      }}
                    />
                  </section>
                </SectionErrorBoundary>
              )}

            {dataStatus &&
              (view.grammar === 'state'
                ? dataStatus.sources.some((src) => view.sourceLabelKeys[src.source])
                : dataStatus.sources.length > 0) && (
                <SectionErrorBoundary
                  sectionId="market-data-status"
                  sectionType="dashboard"
                  enableReporting
                  context={{ page: 'market', section: 'data-status', view: view.slug }}
                >
                  <section className={styles.section}>
                    <div className={styles.secHead}>
                      <span className={styles.eyebrow}>
                        {t('dashboard.dataStatusTitle', 'Data sources')}
                      </span>
                      <h2 className={styles.h2}>
                        {t('dashboard.dataStatusLead', 'Live confidence per upstream feed.')}
                      </h2>
                    </div>
                    <ul className={styles.srcPills}>
                      {(view.grammar === 'state'
                        ? dataStatus.sources.filter((src) => view.sourceLabelKeys[src.source])
                        : dataStatus.sources
                      ).map((src) => (
                        <li key={src.source}>
                          <DataFreshnessBadge
                            source={src.source}
                            label={
                              view.sourceLabelKeys[src.source]
                                ? t(view.sourceLabelKeys[src.source], src.source)
                                : src.source
                            }
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
          </Container>

          {/* Closing band — weekly cadence + subscribe-to-waitlist + share (Phase 5). */}
          <MarketCtaBand
            locale={locale}
            cadence={t('cta.cadence', 'Updated weekly')}
            headline={t('cta.headline', 'Calm intelligence, every week.')}
            body={t(
              'cta.body',
              'Adelaide Market is free and refreshed every week. Join the waitlist to be first when diBoaS opens.'
            )}
            waitlistLabel={t('cta.waitlist', 'Join the waitlist')}
            shareLabel={t('cta.share', 'Share')}
            shareCopied={t('cta.shareCopied', 'Link copied')}
            shareUrl={`${siteUrl}/${locale}${path}`}
            shareText={t(
              'cta.shareText',
              'Adelaide Market: calm macro intelligence for the financial markets.'
            )}
            shareTitle={t('hero.title', 'Adelaide Market')}
          />

          {/* Methodology — dark editorial block (full-bleed). */}
          <section className={styles.method}>
            <Container size="md">
              {methodology && (
                <div className={styles.methodHead}>
                  <span className={styles.eyebrowDark}>
                    {t('dashboard.methodologyTitle', 'How this is calculated')}
                  </span>
                  <h2 className={styles.h2Dark}>
                    {t(
                      'dashboard.methodologyLead',
                      'Every signal, threshold, and weight is documented on diBoaS Analytics.'
                    )}
                  </h2>
                  <MethodologyLink
                    href={methodology.methodology_url}
                    comingSoon={!ANALYTICS_SITE_LIVE}
                  >
                    {ANALYTICS_SITE_LIVE
                      ? t('dashboard.methodologyLinkLabel', 'Read the methodology')
                      : t('dashboard.methodologyComingSoon', 'Full methodology coming soon')}
                  </MethodologyLink>
                </div>
              )}

              {productDisclaimer && (
                <ProductDisclaimer
                  text={productDisclaimer.text[locale] ?? productDisclaimer.text.en}
                />
              )}

              <HostRegulatoryDisclaimer
                text={t(
                  'disclaimer.host.regulatory',
                  'diBoaS does not provide investment advice. This page is educational only.'
                )}
              />

              <PoweredByAttribution
                href="https://diboas-analytics.com"
                label={t('dashboard.poweredByLabel', 'Powered by')}
                productName={t('dashboard.poweredByProduct', 'diBoaS Analytics')}
                comingSoon={!ANALYTICS_SITE_LIVE}
                comingSoonLabel={t('dashboard.comingSoon', 'coming soon')}
              />
            </Container>
          </section>

          <MinimalFooter
            navLinks={B2C_FOOTER_NAV}
            disclosureKeys={B2C_FOOTER_DISCLOSURES}
            extraDisclosureKeys={MARKET_FOOTER_EXTRA_DISCLOSURES}
          />
        </div>
      </AnalyticsProvider>
    </PageI18nProvider>
  );
}
