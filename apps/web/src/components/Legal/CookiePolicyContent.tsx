'use client';

/**
 * Cookie Policy Content Component
 *
 * Renders the Cookie Policy using the platform's reusable components
 * and specialized legal components for document structure.
 * Follows GDPR requirements for cookie disclosure.
 *
 * Structure:
 * - PageHeroSection: Page header with title
 * - SectionContainer: Main content wrapper (narrow variant)
 * - LegalTableOfContents: Navigation
 * - LegalContentSection: Each policy section
 * - LegalTable: Cookie disclosure tables
 */

import { useTranslation } from '@diboas/i18n/client';
import { PageHeroSection } from '@/components/Sections/PageHeroSection';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import {
  LegalTableOfContents,
  LegalContentSection,
  LegalSubsection,
  LegalParagraph,
  LegalTable,
  LegalList,
  LegalBackToTop,
} from './LegalDocument';

export function CookiePolicyContent() {
  const intl = useTranslation();

  const t = (id: string) => intl.formatMessage({ id: `legal/cookies.${id}` });

  // Table of contents items
  const tocItems = [
    { id: 'what-are-cookies', title: t('sections.whatAreCookies.title') },
    { id: 'cookies-we-use', title: t('sections.cookiesWeUse.title') },
    { id: 'your-choices', title: t('sections.yourChoices.title') },
    { id: 'changes', title: t('sections.changes.title') },
    { id: 'contact-us', title: t('sections.contact.title') },
  ];

  // Build cookie tables from translations
  const essentialHeaders = [
    t('sections.cookiesWeUse.essential.table.headers.cookie'),
    t('sections.cookiesWeUse.essential.table.headers.purpose'),
    t('sections.cookiesWeUse.essential.table.headers.duration'),
  ];

  const essentialRows = [
    ['session_id', t('sections.cookiesWeUse.essential.table.rows.0.purpose'), t('sections.cookiesWeUse.essential.table.rows.0.duration')],
    ['locale', t('sections.cookiesWeUse.essential.table.rows.1.purpose'), t('sections.cookiesWeUse.essential.table.rows.1.duration')],
    ['cookie_consent', t('sections.cookiesWeUse.essential.table.rows.2.purpose'), t('sections.cookiesWeUse.essential.table.rows.2.duration')],
  ];

  const analyticsHeaders = [
    t('sections.cookiesWeUse.analytics.table.headers.cookie'),
    t('sections.cookiesWeUse.analytics.table.headers.purpose'),
    t('sections.cookiesWeUse.analytics.table.headers.duration'),
  ];

  const analyticsRows = [
    ['_ga', t('sections.cookiesWeUse.analytics.table.rows.0.purpose'), t('sections.cookiesWeUse.analytics.table.rows.0.duration')],
    ['_gid', t('sections.cookiesWeUse.analytics.table.rows.1.purpose'), t('sections.cookiesWeUse.analytics.table.rows.1.duration')],
  ];

  const functionalHeaders = [
    t('sections.cookiesWeUse.functional.table.headers.cookie'),
    t('sections.cookiesWeUse.functional.table.headers.purpose'),
    t('sections.cookiesWeUse.functional.table.headers.duration'),
  ];

  const functionalRows = [
    ['theme', t('sections.cookiesWeUse.functional.table.rows.0.purpose'), t('sections.cookiesWeUse.functional.table.rows.0.duration')],
    ['dream_mode_data', t('sections.cookiesWeUse.functional.table.rows.1.purpose'), t('sections.cookiesWeUse.functional.table.rows.1.duration')],
  ];

  const choicesOptions = [
    t('sections.yourChoices.options.0'),
    t('sections.yourChoices.options.1'),
    t('sections.yourChoices.options.2'),
  ];

  return (
    <main id="top">
      {/* Page Header */}
      <PageHeroSection
        headline={t('header.title')}
        subheadline={t('header.lastUpdated')}
        align="center"
      />

      {/* Main Content */}
      <SectionContainer
        variant="narrow"
        padding="standard"
        as="article"
        ariaLabel="Cookie Policy content"
      >
        <LegalTableOfContents
          items={tocItems}
          title={t('toc.title')}
        />

        <LegalContentSection title={t('sections.whatAreCookies.title')} id="what-are-cookies">
          <LegalParagraph>{t('sections.whatAreCookies.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.cookiesWeUse.title')} id="cookies-we-use">
          <LegalSubsection title={t('sections.cookiesWeUse.essential.title')}>
            <LegalParagraph>{t('sections.cookiesWeUse.essential.description')}</LegalParagraph>
            <LegalTable headers={essentialHeaders} rows={essentialRows} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.cookiesWeUse.analytics.title')}>
            <LegalParagraph>{t('sections.cookiesWeUse.analytics.description')}</LegalParagraph>
            <LegalTable headers={analyticsHeaders} rows={analyticsRows} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.cookiesWeUse.functional.title')}>
            <LegalParagraph>{t('sections.cookiesWeUse.functional.description')}</LegalParagraph>
            <LegalTable headers={functionalHeaders} rows={functionalRows} />
          </LegalSubsection>
        </LegalContentSection>

        <LegalContentSection title={t('sections.yourChoices.title')} id="your-choices">
          <LegalParagraph>{t('sections.yourChoices.content')}</LegalParagraph>
          <LegalList items={choicesOptions} />
          <LegalParagraph>{t('sections.yourChoices.deleteNote')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.changes.title')} id="changes">
          <LegalParagraph>{t('sections.changes.content')}</LegalParagraph>
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
