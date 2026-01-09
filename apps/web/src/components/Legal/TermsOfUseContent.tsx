'use client';

/**
 * Terms of Use Content Component
 *
 * Renders the Terms of Use using the platform's reusable components
 * and specialized legal components for document structure.
 *
 * Structure:
 * - PageHeroSection: Page header with title
 * - SectionContainer: Main content wrapper (narrow variant)
 * - LegalTableOfContents: Navigation
 * - LegalContentSection: Each terms section
 * - ContentCard: Highlight boxes (important notices)
 */

import { useTranslation } from '@diboas/i18n/client';
import { PageHeroSection } from '@/components/Sections/PageHeroSection';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { ContentCard } from '@/components/UI/ContentCard';
import {
  LegalTableOfContents,
  LegalContentSection,
  LegalSubsection,
  LegalParagraph,
  LegalList,
  LegalBackToTop,
} from './LegalDocument';

export function TermsOfUseContent() {
  const intl = useTranslation();

  const t = (id: string) => intl.formatMessage({ id: `legal/terms.${id}` });

  // Table of contents items
  const tocItems = [
    { id: 'about-diboas', title: t('sections.aboutDiboas.title') },
    { id: 'acceptance-of-terms', title: t('sections.acceptance.title') },
    { id: 'pre-launch-limitations', title: t('sections.preLaunchLimitations.title') },
    { id: 'geographic-restrictions', title: t('sections.geographicRestrictions.title') },
    { id: 'intellectual-property', title: t('sections.intellectualProperty.title') },
    { id: 'user-conduct', title: t('sections.userConduct.title') },
    { id: 'disclaimer', title: t('sections.disclaimer.title') },
    { id: 'limitation-of-liability', title: t('sections.limitation.title') },
    { id: 'changes-to-terms', title: t('sections.changes.title') },
    { id: 'governing-law', title: t('sections.governingLaw.title') },
    { id: 'contact-us', title: t('sections.contact.title') },
  ];

  // Build lists from translations
  const aboutItems = [
    t('sections.aboutDiboas.items.0'),
    t('sections.aboutDiboas.items.1'),
    t('sections.aboutDiboas.items.2'),
    t('sections.aboutDiboas.items.3'),
  ];

  const acceptanceItems = [
    t('sections.acceptance.items.0'),
    t('sections.acceptance.items.1'),
    t('sections.acceptance.items.2'),
  ];

  const simulationToolsItems = [
    t('sections.preLaunchLimitations.simulationTools.items.0'),
    t('sections.preLaunchLimitations.simulationTools.items.1'),
    t('sections.preLaunchLimitations.simulationTools.items.2'),
    t('sections.preLaunchLimitations.simulationTools.items.3'),
  ];

  const noFinancialAdviceItems = [
    t('sections.preLaunchLimitations.noFinancialAdvice.items.0'),
    t('sections.preLaunchLimitations.noFinancialAdvice.items.1'),
  ];

  const restrictedCountries = [
    t('sections.geographicRestrictions.restrictedCountries.0'),
    t('sections.geographicRestrictions.restrictedCountries.1'),
  ];

  const ipItems = [
    t('sections.intellectualProperty.items.0'),
    t('sections.intellectualProperty.items.1'),
    t('sections.intellectualProperty.items.2'),
  ];

  const conductItems = [
    t('sections.userConduct.items.0'),
    t('sections.userConduct.items.1'),
    t('sections.userConduct.items.2'),
    t('sections.userConduct.items.3'),
  ];

  const disclaimerItems = [
    t('sections.disclaimer.items.0'),
    t('sections.disclaimer.items.1'),
    t('sections.disclaimer.items.2'),
  ];

  const limitationItems = [
    t('sections.limitation.items.0'),
    t('sections.limitation.items.1'),
    t('sections.limitation.items.2'),
  ];

  return (
    <main id="top">
      {/* Page Header */}
      <PageHeroSection
        headline={t('header.title')}
        subheadline={t('header.lastUpdated')}
        subheadline2={t('header.intro')}
        align="center"
      />

      {/* Main Content */}
      <SectionContainer
        variant="narrow"
        padding="standard"
        as="article"
        ariaLabel="Terms of Use content"
      >
        <LegalTableOfContents
          items={tocItems}
          title={t('toc.title')}
        />

        <LegalContentSection title={t('sections.aboutDiboas.title')} id="about-diboas">
          <LegalParagraph>{t('sections.aboutDiboas.content')}</LegalParagraph>
          <LegalList items={aboutItems} />
          <ContentCard variant="highlight">
            {t('sections.aboutDiboas.important')}
          </ContentCard>
        </LegalContentSection>

        <LegalContentSection title={t('sections.acceptance.title')} id="acceptance-of-terms">
          <LegalParagraph>{t('sections.acceptance.intro')}</LegalParagraph>
          <LegalList items={acceptanceItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.preLaunchLimitations.title')} id="pre-launch-limitations">
          <LegalSubsection title={t('sections.preLaunchLimitations.simulationTools.title')}>
            <LegalList items={simulationToolsItems} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.preLaunchLimitations.noFinancialAdvice.title')}>
            <LegalList items={noFinancialAdviceItems} />
          </LegalSubsection>
        </LegalContentSection>

        <LegalContentSection title={t('sections.geographicRestrictions.title')} id="geographic-restrictions">
          <LegalParagraph>{t('sections.geographicRestrictions.intro')}</LegalParagraph>
          <LegalList items={restrictedCountries} />
          <LegalParagraph>{t('sections.geographicRestrictions.note')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.intellectualProperty.title')} id="intellectual-property">
          <LegalParagraph>{t('sections.intellectualProperty.intro')}</LegalParagraph>
          <LegalList items={ipItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.userConduct.title')} id="user-conduct">
          <LegalParagraph>{t('sections.userConduct.intro')}</LegalParagraph>
          <LegalList items={conductItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.disclaimer.title')} id="disclaimer">
          <LegalParagraph>{t('sections.disclaimer.content')}</LegalParagraph>
          <LegalList items={disclaimerItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.limitation.title')} id="limitation-of-liability">
          <LegalParagraph>{t('sections.limitation.content')}</LegalParagraph>
          <LegalList items={limitationItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.changes.title')} id="changes-to-terms">
          <LegalParagraph>{t('sections.changes.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.governingLaw.title')} id="governing-law">
          <LegalParagraph>{t('sections.governingLaw.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.contact.title')} id="contact-us">
          <LegalParagraph>
            {t('sections.contact.content').replace('{email}', t('sections.contact.email'))}
          </LegalParagraph>
        </LegalContentSection>

        <LegalBackToTop label={t('backToTop')} />
      </SectionContainer>
    </main>
  );
}
