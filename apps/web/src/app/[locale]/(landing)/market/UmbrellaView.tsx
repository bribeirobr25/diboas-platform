/**
 * The /market umbrella (M3 — plan v3 D-M3-3). Renders when the registry has
 * zero 'live-at-root' views and ≥1 'live' view (resolveRootRendering mode
 * 'umbrella' — the M3c activation state). UNREACHABLE until then: built
 * inert in M3a per the plan.
 *
 * One card per switcher destination in SPINE order (R-4: no sorting exists
 * here to get wrong). Band WORDS + direction only — no numbers (MM-2).
 * Cards degrade INDEPENDENTLY (CTO R-1′): a null feed renders that card's
 * label + a calm unavailable line, never blank, never dropped; all-degraded
 * → the umbrella-level outage banner (the shell's honesty pattern).
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
import { LocaleLink } from '@/components/UI/LocaleLink';
import {
  B2C_FOOTER_NAV,
  B2C_FOOTER_DISCLOSURES,
  MARKET_FOOTER_EXTRA_DISCLOSURES,
} from '@/config/landing-b2c';
import { MethodologyLink, ProductDisclaimer, PoweredByAttribution } from '@/components/Analytics';
import { HostRegulatoryDisclaimer } from '@/components/Legal';
import { fetchInitialAnalyticsData } from '@/lib/analytics-sdk/mock-client.server';
import { marketCollectionSchema } from '@/lib/market/structuredData';
import { umbrellaCardModel, type UmbrellaCardModel } from '@/lib/market/umbrellaModel';
import { switcherDestinations, viewPath } from '@/lib/market/viewRegistry';
import { ANALYTICS_SITE_LIVE } from '@/lib/market/constants';
import styles from './page.module.css';

const CONDITION_LABEL_KEYS: Record<string, string> = {
  'MAC-01': 'dollar',
  'MAC-02': 'rates',
  'MAC-03': 'liquidity',
};

interface UmbrellaViewProps {
  locale: SupportedLocale;
}

export async function UmbrellaView({ locale }: UmbrellaViewProps) {
  const pageMessages = await loadPageNamespaces(locale, ['market', 'landing-b2c']);
  const t = (key: string, fallback: string) => pageMessages[`market.${key}`] ?? fallback;

  const destinations = switcherDestinations();
  const perDestination = await Promise.all(
    destinations.map(async (view) => ({
      view,
      data: await fetchInitialAnalyticsData(locale, view.slug),
    }))
  );
  const cards: { model: UmbrellaCardModel; label: string }[] = perDestination.map(
    ({ view, data }) => ({
      model: umbrellaCardModel(view, data),
      label: pageMessages[`market.views.${view.slug}`] ?? view.slug,
    })
  );
  const allDegraded = cards.length > 0 && cards.every((c) => !c.model.available);

  // Shared-run vintage for the schema + hero date: the first available
  // scored destination's regime (all destinations ride the same weekly run).
  const sharedRegime = perDestination.find((d) => d.data.regime)?.data.regime ?? null;
  const productDisclaimer =
    perDestination.find((d) => d.data.productDisclaimer)?.data.productDisclaimer ?? null;
  const methodology = perDestination.find((d) => d.data.methodology)?.data.methodology ?? null;

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';
  const heroTitle = t('hero.title', 'Adelaide Market');
  const heroSubtitle = t(
    'hero.subtitle',
    'A calm read on the financial markets, without the noise.'
  );

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: heroTitle, url: '/market' },
    ],
    locale
  );
  const collectionData = marketCollectionSchema({
    locale,
    siteUrl,
    name: heroTitle,
    description: t(
      'seo.description',
      'A calm read on the financial markets, starting with Bitcoin. Understand the environment, not the next price move.'
    ),
    lastUpdatedAt: sharedRegime?.last_updated_at,
    itemPaths: destinations.map((v) => viewPath(v)),
  });

  const regimeLabels: Record<string, string> = {
    VERY_FAVORABLE: t('dashboard.regimeLabels.VERY_FAVORABLE', 'Very Favorable'),
    CONSTRUCTIVE: t('dashboard.regimeLabels.CONSTRUCTIVE', 'Constructive'),
    NEUTRAL_MIXED: t('dashboard.regimeLabels.NEUTRAL_MIXED', 'Neutral / Mixed'),
    DEFENSIVE: t('dashboard.regimeLabels.DEFENSIVE', 'Defensive'),
    HOSTILE: t('dashboard.regimeLabels.HOSTILE', 'Hostile'),
  };
  const directionLabel = (d: 'up' | 'down' | 'held') =>
    d === 'up'
      ? t('umbrella.direction.up', 'improved this week')
      : d === 'down'
        ? t('umbrella.direction.down', 'eased this week')
        : t('umbrella.direction.held', 'held this week');

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData
        data={[breadcrumbData, collectionData].filter(Boolean) as Record<string, unknown>[]}
      />

      <div className={`main-page-wrapper ${styles.editorial}`}>
        <section className={styles.hero} id="market-top">
          <MarketHeroCanvas />
          <div className={styles.grain} aria-hidden="true" />
          <Container size="md">
            <div className={styles.heroInner}>
              <div className={styles.masthead}>
                <span className={styles.eyebrow}>{t('umbrella.kicker', 'Weekly macro reads')}</span>
                {(() => {
                  const d = sharedRegime?.last_updated_at
                    ? new Date(sharedRegime.last_updated_at)
                    : null;
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

        {allDegraded ? (
          <Container size="md">
            <div className={styles.outageBanner} role="status">
              <strong>{t('fallback.outageTitle', 'Live data is temporarily unavailable')}</strong>
              <span>{t('fallback.outageBody', 'We are restoring the connection.')}</span>
            </div>
          </Container>
        ) : null}

        <Container size="md">
          <SectionErrorBoundary
            sectionId="market-umbrella-cards"
            sectionType="dashboard"
            enableReporting
            context={{ page: 'market', section: 'umbrella' }}
          >
            <section className={styles.section}>
              <ul className={styles.umbrellaGrid}>
                {cards.map(({ model, label }) => (
                  <li key={model.slug} className={styles.umbrellaCard}>
                    <LocaleLink
                      href={model.path}
                      prefetch={false}
                      className={styles.umbrellaCardLink}
                    >
                      <h2 className={styles.umbrellaCardTitle}>{label}</h2>
                      {!model.available ? (
                        <p className={styles.umbrellaCardRead}>
                          {t('umbrella.cardUnavailable', 'This read is temporarily unavailable.')}
                        </p>
                      ) : model.grammar === 'scored' && model.bandCode ? (
                        <p className={styles.umbrellaCardRead}>
                          <strong>{regimeLabels[model.bandCode] ?? model.bandCode}</strong>
                          {model.direction ? <> · {directionLabel(model.direction)}</> : null}
                        </p>
                      ) : model.conditions ? (
                        <p className={styles.umbrellaCardRead}>
                          {model.conditions
                            .map((c) => {
                              const key = CONDITION_LABEL_KEYS[c.id];
                              return c.active
                                ? t(`umbrella.conditions.${key}.active`, key)
                                : t(`umbrella.conditions.${key}.inactive`, key);
                            })
                            .join(' · ')}
                        </p>
                      ) : null}
                      <span className={styles.umbrellaCardCta}>
                        {t('umbrella.cardCta', 'Read the full view')}
                      </span>
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </section>
          </SectionErrorBoundary>
        </Container>

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
          shareUrl={`${siteUrl}/${locale}/market`}
          shareText={t(
            'cta.shareText',
            'Adelaide Market: calm macro intelligence for the financial markets.'
          )}
          shareTitle={heroTitle}
        />

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
    </PageI18nProvider>
  );
}
