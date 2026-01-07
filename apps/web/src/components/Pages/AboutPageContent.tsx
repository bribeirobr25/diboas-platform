'use client';

import { useTranslation } from '@diboas/i18n/client';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { PageHeroSection, SectionContainer } from '@/components/Sections';
import { ContentCard, CTAButtonLink, ChevronRightIcon } from '@/components/UI';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './AboutPageContent.module.css';

/**
 * About Page Content - Client Component
 * Personal founder story page with i18n support
 */
export function AboutPageContent() {
  const intl = useTranslation();

  // Helper function to get i18n key from about namespace
  const t = (key: string) => intl.formatMessage({ id: `about.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-about"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'about', variant: 'centered' }}
      >
        <PageHeroSection
          headline={t('hero.title')}
          subheadline={t('hero.subtitle')}
          align="center"
        />
      </SectionErrorBoundary>

      {/* Section 2: The Story */}
      <SectionErrorBoundary
        sectionId="story-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="narrow"
          padding="standard"
          backgroundColor="var(--color-white)"
        >
          <h2 className={styles.sectionTitleLeft}>
            {t('story.header')}
          </h2>

          <div className={styles.storyContent}>
            <p>{t('story.paragraph1')}</p>
            <p>{t('story.paragraph2')}</p>
            <p className={styles.storyMedium}>{t('story.paragraph3')}</p>
            <p className={styles.storyBold}>{t('story.paragraph4')}</p>
            <p className={styles.storyHighlight}>{t('story.soundsFamiliar')}</p>
            <p>{t('story.revelation')}</p>
            <ContentCard variant="accent">
              <p className={styles.storyExample}>{t('story.example')}</p>
            </ContentCard>
            <p>{t('story.universal')}</p>
            <p className={styles.storyMedium}>{t('story.turning')}</p>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 3: What diBoaS Does */}
      <SectionErrorBoundary
        sectionId="what-we-do-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="narrow"
          padding="standard"
          backgroundColor="var(--color-slate-50)"
        >
          <h2 className={styles.sectionTitleLeft}>
            {t('whatWeDo.header')}
          </h2>
          <div className={styles.storyContent}>
            <p>{t('whatWeDo.description')}</p>
            <p className={styles.storyMedium}>{t('whatWeDo.noMiddleman')}</p>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 4: What We Believe */}
      <SectionErrorBoundary
        sectionId="beliefs-section-about"
        sectionType="FeatureSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-white)"
        >
          <h2 className={styles.sectionTitle}>
            {t('beliefs.header')}
          </h2>

          <div className={styles.beliefsGrid}>
            <ContentCard variant="muted" title={t('beliefs.money.title')}>
              <p>{t('beliefs.money.description')}</p>
            </ContentCard>

            <ContentCard variant="muted" title={t('beliefs.honesty.title')}>
              <p>{t('beliefs.honesty.description')}</p>
            </ContentCard>

            <ContentCard variant="muted" title={t('beliefs.startSmall.title')}>
              <p>{t('beliefs.startSmall.description')}</p>
            </ContentCard>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 5: The Mission */}
      <SectionErrorBoundary
        sectionId="mission-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-teal-50)"
          className={styles.missionSection}
        >
          <h2 className={styles.sectionTitle}>
            {t('mission.header')}
          </h2>
          <p className={styles.missionStatement}>
            {t('mission.statement')}
          </p>
          <p className={styles.missionTagline}>
            {t('mission.tagline')}
          </p>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 6: For Businesses */}
      <SectionErrorBoundary
        sectionId="business-section-about"
        sectionType="CTASection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="standard"
          padding="standard"
          backgroundColor="var(--color-slate-900)"
          className={styles.businessSection}
        >
          <h2 className={styles.businessTitle}>
            {t('business.header')}
          </h2>
          <p className={styles.businessDescription}>
            {t('business.description')}
          </p>
          <p className={styles.businessDescription}>
            {t('business.pitch')}
          </p>
          <CTAButtonLink href="/business" variant="primary" size="lg">
            {t('business.cta')}
            <ChevronRightIcon size="md" />
          </CTAButtonLink>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 7: Contact */}
      <SectionErrorBoundary
        sectionId="contact-section-about"
        sectionType="ContactSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <SectionContainer
          variant="narrow"
          padding="standard"
          backgroundColor="var(--color-white)"
          className={styles.contactSection}
        >
          <h2 className={styles.contactTitle}>
            {t('contact.header')}
          </h2>
          <div className={styles.contactInfo}>
            <p>
              <span className={styles.contactLabel}>{t('contact.founder')}</span> {t('contact.founderName')}
            </p>
            <p>
              <span className={styles.contactLabel}>{t('contact.location')}</span> {t('contact.locationValue')}
            </p>
            <p>
              <span className={styles.contactLabel}>{t('contact.email')}</span>{' '}
              <a href="mailto:hello@diboas.com" className={styles.contactLink}>
                {t('contact.emailValue')}
              </a>
            </p>
          </div>
        </SectionContainer>
      </SectionErrorBoundary>

      {/* Section 8: Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-about"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>
    </main>
  );
}
