'use client';

/**
 * About Page Section Components
 *
 * Self-contained client components for the About page.
 * Each uses useConfigTranslation() to resolve i18n keys from config objects.
 *
 * Phase 3D migration: replaces inline sections from AboutPageContent orchestrator.
 */

import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { PageHeroSection, SectionContainer } from '@/components/Sections';
import { ContentCard, CTAButtonLink, ChevronRightIcon } from '@/components/UI';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import {
  ABOUT_HERO_CONFIG,
  ABOUT_STORY_CONFIG,
  ABOUT_WHAT_WE_DO_CONFIG,
  ABOUT_BELIEFS_CONFIG,
  ABOUT_MISSION_CONFIG,
  ABOUT_BUSINESS_CONFIG,
  ABOUT_CONTACT_CONFIG,
  ABOUT_TRANSITIONS,
} from '@/config/landing-about';
import styles from '../AboutPageContent.module.css';

// ─── Section 1: Hero ─────────────────────────────────────────

export function AboutHeroSection() {
  const t = useConfigTranslation(ABOUT_HERO_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="hero-section-about"
      sectionType="HeroSection"
      enableReporting
      context={{ page: 'about', variant: 'centered' }}
    >
      <PageHeroSection
        headline={t.title}
        subheadline={t.subtitle}
        align="center"
      />
    </SectionErrorBoundary>
  );
}

// ─── Section 2: The Story ────────────────────────────────────

export function AboutStorySection() {
  const t = useConfigTranslation(ABOUT_STORY_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="story-section-about"
      sectionType="ContentSection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="narrow"
        padding="standard"
        backgroundColor="var(--section-bg-neutral)"
      >
        <h2 className={styles.sectionTitleLeft}>{t.content.header}</h2>
        <div className={styles.storyContent}>
          <p>{t.content.paragraph1}</p>
          <p className={styles.storyMedium}>{t.content.paragraph2}</p>
          <p className={styles.storyBold}>{t.content.paragraph3}</p>
          <p>{t.content.gapExplanation}</p>
          <p>{t.content.accessLocked}</p>
          <p>{t.content.turning}</p>
          <p className={styles.namedAfterHer}>{t.content.namedAfterHer}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Section 3: What diBoaS Does ────────────────────────────

export function AboutWhatWeDoSection() {
  const t = useConfigTranslation(ABOUT_WHAT_WE_DO_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="what-we-do-section-about"
      sectionType="ContentSection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="narrow"
        padding="standard"
        backgroundColor="var(--section-bg-enterprise)"
      >
        <h2 className={styles.sectionTitleLeft}>{t.content.header}</h2>
        <div className={styles.storyContent}>
          <p>{t.content.transfers}</p>
          <p className={styles.microDisclaimer}>{t.content.transfersDisclaimer}</p>
          <p>{t.content.growth}</p>
          <p className={styles.storyMedium}>{t.content.adelaide}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Section 4: What We Believe ─────────────────────────────

export function AboutBeliefsSection() {
  const t = useConfigTranslation(ABOUT_BELIEFS_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="beliefs-section-about"
      sectionType="FeatureSection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="standard"
        padding="standard"
        backgroundColor="var(--section-bg-neutral)"
      >
        <h2 className={styles.sectionTitle}>{t.content.header}</h2>
        <div className={styles.beliefsGrid}>
          <ContentCard variant="muted" title={t.content.cards.money.title}>
            <p>{t.content.cards.money.description}</p>
          </ContentCard>
          <ContentCard variant="muted" title={t.content.cards.honesty.title}>
            <p>{t.content.cards.honesty.description}</p>
          </ContentCard>
          <ContentCard variant="muted" title={t.content.cards.startSmall.title}>
            <p>{t.content.cards.startSmall.description}</p>
          </ContentCard>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Section 5: The Mission ─────────────────────────────────

export function AboutMissionSection() {
  const t = useConfigTranslation(ABOUT_MISSION_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="mission-section-about"
      sectionType="ContentSection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="standard"
        padding="standard"
        backgroundColor="var(--section-bg-enterprise)"
        className={styles.missionSection}
      >
        <h2 className={styles.sectionTitle}>{t.content.header}</h2>
        <p className={styles.missionStatement}>{t.content.story}</p>
        <p className={styles.missionStatement}>
          <strong>{t.content.statement}</strong>
        </p>
        <p className={styles.missionPillars}>{t.content.pillars}</p>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Section 6: For Businesses ──────────────────────────────

export function AboutBusinessSection() {
  const t = useConfigTranslation(ABOUT_BUSINESS_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="business-section-about"
      sectionType="CTASection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="standard"
        padding="standard"
        backgroundColor="var(--color-slate-900)"
        className={styles.businessSection}
      >
        <h2 className={styles.businessTitle}>{t.content.header}</h2>
        <p className={styles.businessDescription}>{t.content.description}</p>
        <p className={styles.businessDescription}>{t.content.pitch}</p>
        <CTAButtonLink href={ABOUT_BUSINESS_CONFIG.ctaHref} variant="primary" size="lg">
          {t.content.cta}
          <ChevronRightIcon size="md" />
        </CTAButtonLink>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Section 7: Contact ─────────────────────────────────────

export function AboutContactSection() {
  const t = useConfigTranslation(ABOUT_CONTACT_CONFIG);

  return (
    <SectionErrorBoundary
      sectionId="contact-section-about"
      sectionType="ContactSection"
      enableReporting
      context={{ page: 'about' }}
    >
      <SectionContainer
        variant="narrow"
        padding="standard"
        backgroundColor="var(--section-bg-neutral)"
        className={styles.contactSection}
      >
        <h2 className={styles.contactTitle}>{t.content.header}</h2>
        <div className={styles.contactInfo}>
          <p>
            <span className={styles.contactLabel}>{t.content.founder}</span> {t.content.founderName}
          </p>
          <p>
            <span className={styles.contactLabel}>{t.content.location}</span> {t.content.locationValue}
          </p>
          <p>
            <span className={styles.contactLabel}>{t.content.email}</span>{' '}
            <a href={ABOUT_CONTACT_CONFIG.emailHref} className={styles.contactLink}>
              {t.content.emailValue}
            </a>
          </p>
          <p className={styles.personalEmail}>
            {t.content.personal}{' '}
            <a href={ABOUT_CONTACT_CONFIG.personalEmailHref} className={styles.contactLink}>
              {t.content.personalEmail}
            </a>
          </p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}

// ─── Transition Hooks ───────────────────────────────────────

export function AboutTransitionHook({ hookKey }: { hookKey: keyof typeof ABOUT_TRANSITIONS }) {
  const t = useConfigTranslation(ABOUT_TRANSITIONS);
  return <p className={styles.transitionHook}>{t[hookKey]}</p>;
}
