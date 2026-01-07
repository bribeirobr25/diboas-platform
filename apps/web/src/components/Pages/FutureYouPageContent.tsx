'use client';

import { useTranslation } from '@diboas/i18n/client';
import { CalculatorSection } from '@/components/Sections/CalculatorSection';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { PageHeroSection, SectionContainer } from '@/components/Sections';
import { ContentCard, CTAButtonLink, ChevronRightIcon } from '@/components/UI';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './FutureYouPageContent.module.css';

/**
 * i18n namespace prefix for future-you page
 */
const I18N_PREFIX = 'marketing.pages.futureYou';

/**
 * Future You Page Content - Client Component
 * Uses i18n for all text content
 */
export function FutureYouPageContent() {
  const intl = useTranslation();

  // Helper function to get prefixed i18n key
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-future-you"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'future-you', variant: 'centered' }}
      >
        <PageHeroSection
          headline={t('hero.headline')}
          subheadline={t('hero.subheadline')}
          subheadline2={t('hero.subheadline2')}
          align="center"
        />
      </SectionErrorBoundary>

      {/* Section 2: Calculator */}
      <SectionErrorBoundary
        sectionId="calculator-section-future-you"
        sectionType="CalculatorSection"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <div id="calculator">
          <CalculatorSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Section 3: The Math Explained */}
      <SectionErrorBoundary
        sectionId="math-explained-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-slate-50)"
        >
          <h2 className={styles.sectionTitle}>
            {t('mathExplained.header')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('mathExplained.intro')}
          </p>

          <div className={styles.cardsGrid}>
            <ContentCard title={t('mathExplained.bankGap.headline')}>
              <p>{t('mathExplained.bankGap.body2')}</p>
            </ContentCard>

            <ContentCard title={t('mathExplained.compound.headline')}>
              <p>{t('mathExplained.compound.body')}</p>
            </ContentCard>

            <ContentCard title={t('mathExplained.time.headline')}>
              <p>{t('mathExplained.time.takeaway')}</p>
            </ContentCard>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 4: Strategy Connection */}
      <SectionErrorBoundary
        sectionId="strategy-connection-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-white)"
          className={styles.ctaSection}
        >
          <h2 className={styles.sectionTitle}>
            {t('strategyConnection.header')}
          </h2>
          <p className={styles.ctaDescription}>
            {t('strategyConnection.body')}
          </p>
          <CTAButtonLink href="/strategies" variant="primary" size="lg">
            {t('strategyConnection.cta')}
            <ChevronRightIcon size="md" />
          </CTAButtonLink>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 5: Final CTA / Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-future-you"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'future-you' }}
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
