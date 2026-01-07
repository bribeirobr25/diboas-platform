'use client';

import { useTranslation } from '@diboas/i18n/client';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { PageHeroSection, SectionContainer } from '@/components/Sections';
import { ContentCard, StrategyCard, CTAButtonLink, ChevronRightIcon } from '@/components/UI';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './StrategiesPageContent.module.css';

/**
 * i18n namespace prefix for strategies page
 */
const I18N_PREFIX = 'marketing.pages.strategies';

/**
 * Strategy IDs matching the i18n keys in strategies.json
 */
const STRATEGY_IDS = [
  'safeHarbor',
  'stableGrowth',
  'goalKeeper',
  'steadyProgress',
  'patientBuilder',
  'balancedBuilder',
  'steadyCompounder',
  'wealthAccelerator',
  'yieldMaximizer',
  'fullThrottle',
] as const;

/**
 * Growth exposure percentages for each strategy (for visual styling)
 */
const GROWTH_EXPOSURE: Record<string, number> = {
  safeHarbor: 0,
  stableGrowth: 30,
  goalKeeper: 0,
  steadyProgress: 35,
  patientBuilder: 0,
  balancedBuilder: 40,
  steadyCompounder: 0,
  wealthAccelerator: 70,
  yieldMaximizer: 0,
  fullThrottle: 85,
};

/**
 * Matrix row configuration
 */
const MATRIX_ROWS = [
  { id: 'emergency', stableStrategy: 'safeHarbor', growthStrategy: 'stableGrowth' },
  { id: 'shortTerm', stableStrategy: 'goalKeeper', growthStrategy: 'steadyProgress' },
  { id: 'mediumTerm', stableStrategy: 'patientBuilder', growthStrategy: 'balancedBuilder' },
  { id: 'longTerm', stableStrategy: 'steadyCompounder', growthStrategy: 'wealthAccelerator' },
  { id: 'wealthBuilding', stableStrategy: 'yieldMaximizer', growthStrategy: 'fullThrottle' },
] as const;

/**
 * Strategies Page Content - Client Component
 * Uses i18n for all text content
 */
export function StrategiesPageContent() {
  const intl = useTranslation();

  // Helper function to get prefixed i18n key
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-strategies"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'strategies', variant: 'centered' }}
      >
        <PageHeroSection
          headline={t('hero.headline')}
          subheadline={t('hero.subheadline')}
          subheadline2={t('hero.subheadline2')}
          align="center"
        />
      </SectionErrorBoundary>

      {/* Section 2: Strategy Matrix */}
      <SectionErrorBoundary
        sectionId="matrix-section-strategies"
        sectionType="StrategyMatrix"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-white)"
        >
          <h2 className={styles.sectionTitle}>
            {t('matrix.header')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('matrix.instructions')}
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.strategyTable}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderGoal}>
                    {t('matrix.columns.goal')}
                  </th>
                  <th className={styles.tableHeaderStable}>
                    {t('matrix.columns.stable')}
                  </th>
                  <th className={styles.tableHeaderGrowth}>
                    {t('matrix.columns.growth')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index < MATRIX_ROWS.length - 1 ? styles.tableRow : styles.tableRowLast}
                  >
                    <td className={styles.tableCellGoal}>
                      {t(`matrix.rows.${row.id}.goal`)}
                    </td>
                    <td className={styles.tableCellStable}>
                      {t(`matrix.rows.${row.id}.stable`)}
                    </td>
                    <td className={styles.tableCellGrowth}>
                      {t(`matrix.rows.${row.id}.growth`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tableNote}>
            {t('matrix.note')}
          </p>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 3: Strategy Cards */}
      <SectionErrorBoundary
        sectionId="cards-section-strategies"
        sectionType="StrategyCards"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-slate-50)"
        >
          <h2 className={styles.sectionTitle}>
            {t('allStrategiesHeader')}
          </h2>

          <div className={styles.cardsGrid}>
            {STRATEGY_IDS.map((strategyId) => (
              <StrategyCard
                key={strategyId}
                name={t(`strategies.${strategyId}.name`)}
                badge={t(`strategies.${strategyId}.badge`)}
                tagline={t(`strategies.${strategyId}.tagline`)}
                growthExposure={GROWTH_EXPOSURE[strategyId]}
                growthBadgeLabel={t('growthBadge')}
                stats={[
                  { label: t('statsLabels.lossChance'), value: t(`strategies.${strategyId}.stats.lossChance`) },
                  { label: t('statsLabels.typicalReturn'), value: t(`strategies.${strategyId}.stats.typicalReturn`) },
                  { label: t('statsLabels.bumpiness'), value: t(`strategies.${strategyId}.stats.bumpiness`) },
                  { label: t('statsLabels.riskLevel'), value: t(`strategies.${strategyId}.riskLevel`) },
                ]}
              />
            ))}
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 4: How to Choose */}
      <SectionErrorBoundary
        sectionId="how-to-choose-section"
        sectionType="HowToChoose"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <SectionContainer
          variant="narrow"
          padding="standard"
          backgroundColor="var(--color-white)"
        >
          <h2 className={styles.sectionTitle}>
            {t('howToChoose.header')}
          </h2>

          <div className={styles.questionsList}>
            <ContentCard variant="muted" title={t('howToChoose.question1.title')}>
              <ul className={styles.optionsList}>
                <li>{t('howToChoose.question1.options.emergency')}</li>
                <li>{t('howToChoose.question1.options.shortTerm')}</li>
                <li>{t('howToChoose.question1.options.mediumTerm')}</li>
                <li>{t('howToChoose.question1.options.longTerm')}</li>
              </ul>
            </ContentCard>

            <ContentCard variant="muted" title={t('howToChoose.question2.title')}>
              <ul className={styles.optionsList}>
                <li>{t('howToChoose.question2.options.none')}</li>
                <li>{t('howToChoose.question2.options.understand')}</li>
                <li>{t('howToChoose.question2.options.unsure')}</li>
              </ul>
            </ContentCard>

            <ContentCard variant="highlight">
              <p className={styles.goldenRule}>
                {t('howToChoose.goldenRule')}
              </p>
            </ContentCard>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 5: Future You Connection */}
      <SectionErrorBoundary
        sectionId="future-you-connection-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-white)"
          className={styles.ctaSection}
        >
          <h2 className={styles.sectionTitle}>
            {t('futureYouConnection.header')}
          </h2>
          <p className={styles.ctaDescription}>
            {t('futureYouConnection.body')}
          </p>
          <CTAButtonLink href="/future-you" variant="primary" size="lg">
            {t('futureYouConnection.cta')}
            <ChevronRightIcon size="md" />
          </CTAButtonLink>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 6: Final CTA / Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-strategies"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Footer Disclaimer */}
      <SectionContainer
        variant="standard"
        padding="none"
        backgroundColor="var(--color-slate-100)"
        className={styles.disclaimer}
      >
        <p className={styles.disclaimerText}>
          {t('footer.disclaimer')}
        </p>
      </SectionContainer>
    </main>
  );
}
