'use client';

/**
 * Privacy Policy Content Component
 *
 * Renders the Privacy Policy using the platform's reusable components
 * and specialized legal components for document structure.
 *
 * Structure:
 * - PageHeroSection: Page header with title
 * - SectionContainer: Main content wrapper (narrow variant)
 * - LegalTableOfContents: Navigation
 * - LegalContentSection: Each policy section
 * - ContentCard: Highlight boxes
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
  LegalContactInfo,
  LegalRetentionList,
  LegalBackToTop,
} from './LegalDocument';

export function PrivacyPolicyContent() {
  const intl = useTranslation();

  const t = (id: string) => intl.formatMessage({ id: `legal/privacy.${id}` });

  // Table of contents items
  const tocItems = [
    { id: 'who-we-are', title: t('sections.whoWeAre.title') },
    { id: 'what-data-we-collect', title: t('sections.whatDataWeCollect.title') },
    { id: 'how-we-use-your-data', title: t('sections.howWeUseData.title') },
    { id: 'who-we-share-data-with', title: t('sections.whoWeShareWith.title') },
    { id: 'international-transfers', title: t('sections.internationalTransfers.title') },
    { id: 'data-retention', title: t('sections.dataRetention.title') },
    { id: 'your-rights', title: t('sections.yourRights.title') },
    { id: 'complaints', title: t('sections.complaints.title') },
    { id: 'security', title: t('sections.security.title') },
    { id: 'childrens-privacy', title: t('sections.childrenPrivacy.title') },
    { id: 'changes-to-this-policy', title: t('sections.changes.title') },
    { id: 'contact-us', title: t('sections.contact.title') },
  ];

  // Data usage table
  const dataUsageHeaders = [
    t('sections.howWeUseData.table.headers.purpose'),
    t('sections.howWeUseData.table.headers.legalBasis'),
  ];

  const dataUsageRows = [
    [t('sections.howWeUseData.table.rows.0.purpose'), t('sections.howWeUseData.table.rows.0.legalBasis')],
    [t('sections.howWeUseData.table.rows.1.purpose'), t('sections.howWeUseData.table.rows.1.legalBasis')],
    [t('sections.howWeUseData.table.rows.2.purpose'), t('sections.howWeUseData.table.rows.2.legalBasis')],
    [t('sections.howWeUseData.table.rows.3.purpose'), t('sections.howWeUseData.table.rows.3.legalBasis')],
    [t('sections.howWeUseData.table.rows.4.purpose'), t('sections.howWeUseData.table.rows.4.legalBasis')],
  ];

  // Rights table
  const rightsHeaders = [
    t('sections.yourRights.table.headers.right'),
    t('sections.yourRights.table.headers.description'),
  ];

  const rightsRows = [
    [t('sections.yourRights.table.rows.0.right'), t('sections.yourRights.table.rows.0.description')],
    [t('sections.yourRights.table.rows.1.right'), t('sections.yourRights.table.rows.1.description')],
    [t('sections.yourRights.table.rows.2.right'), t('sections.yourRights.table.rows.2.description')],
    [t('sections.yourRights.table.rows.3.right'), t('sections.yourRights.table.rows.3.description')],
    [t('sections.yourRights.table.rows.4.right'), t('sections.yourRights.table.rows.4.description')],
    [t('sections.yourRights.table.rows.5.right'), t('sections.yourRights.table.rows.5.description')],
    [t('sections.yourRights.table.rows.6.right'), t('sections.yourRights.table.rows.6.description')],
  ];

  // Data lists
  const providedItems = [
    t('sections.whatDataWeCollect.provided.items.0'),
    t('sections.whatDataWeCollect.provided.items.1'),
    t('sections.whatDataWeCollect.provided.items.2'),
    t('sections.whatDataWeCollect.provided.items.3'),
  ];

  const automaticItems = [
    t('sections.whatDataWeCollect.automatic.items.0'),
    t('sections.whatDataWeCollect.automatic.items.1'),
    t('sections.whatDataWeCollect.automatic.items.2'),
    t('sections.whatDataWeCollect.automatic.items.3'),
    t('sections.whatDataWeCollect.automatic.items.4'),
  ];

  const dreamModeItems = [
    t('sections.whatDataWeCollect.dreamMode.items.0'),
    t('sections.whatDataWeCollect.dreamMode.items.1'),
  ];

  const securityMeasures = [
    t('sections.security.measures.0'),
    t('sections.security.measures.1'),
    t('sections.security.measures.2'),
  ];

  const retentionItems = [
    { type: t('sections.dataRetention.items.0.type'), duration: t('sections.dataRetention.items.0.duration') },
    { type: t('sections.dataRetention.items.1.type'), duration: t('sections.dataRetention.items.1.duration') },
    { type: t('sections.dataRetention.items.2.type'), duration: t('sections.dataRetention.items.2.duration') },
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
        ariaLabel="Privacy Policy content"
      >
        <LegalTableOfContents
          items={tocItems}
          title={t('toc.title')}
        />

        <LegalContentSection title={t('sections.whoWeAre.title')} id="who-we-are">
          <LegalParagraph>{t('sections.whoWeAre.content')}</LegalParagraph>
          <LegalContactInfo
            email={t('sections.whoWeAre.contact.email')}
            dpoEmail={t('sections.whoWeAre.contact.dpo')}
            emailLabel={t('sections.whoWeAre.contact.emailLabel')}
            dpoLabel={t('sections.whoWeAre.contact.dpoLabel')}
          />
        </LegalContentSection>

        <LegalContentSection title={t('sections.whatDataWeCollect.title')} id="what-data-we-collect">
          <LegalSubsection title={t('sections.whatDataWeCollect.provided.title')}>
            <LegalList items={providedItems} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.whatDataWeCollect.automatic.title')}>
            <LegalList items={automaticItems} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.whatDataWeCollect.dreamMode.title')}>
            <LegalList items={dreamModeItems} />
          </LegalSubsection>
        </LegalContentSection>

        <LegalContentSection title={t('sections.howWeUseData.title')} id="how-we-use-your-data">
          <LegalTable headers={dataUsageHeaders} rows={dataUsageRows} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.whoWeShareWith.title')} id="who-we-share-data-with">
          <LegalParagraph>{t('sections.whoWeShareWith.intro')}</LegalParagraph>
          <LegalSubsection title={t('sections.whoWeShareWith.serviceProviders.title')}>
            <LegalParagraph>{t('sections.whoWeShareWith.serviceProviders.content')}</LegalParagraph>
          </LegalSubsection>
          <LegalSubsection title={t('sections.whoWeShareWith.legal.title')}>
            <LegalParagraph>{t('sections.whoWeShareWith.legal.content')}</LegalParagraph>
          </LegalSubsection>
          <LegalParagraph>{t('sections.whoWeShareWith.note')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.internationalTransfers.title')} id="international-transfers">
          <LegalParagraph>{t('sections.internationalTransfers.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.dataRetention.title')} id="data-retention">
          <LegalRetentionList items={retentionItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.yourRights.title')} id="your-rights">
          <LegalParagraph>{t('sections.yourRights.intro')}</LegalParagraph>
          <LegalTable headers={rightsHeaders} rows={rightsRows} />
          <LegalParagraph>
            {t('sections.yourRights.exerciseRights').replace('{email}', t('sections.contact.email'))}
          </LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.complaints.title')} id="complaints">
          <LegalParagraph>{t('sections.complaints.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.security.title')} id="security">
          <LegalParagraph>{t('sections.security.intro')}</LegalParagraph>
          <LegalList items={securityMeasures} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.childrenPrivacy.title')} id="childrens-privacy">
          <LegalParagraph>{t('sections.childrenPrivacy.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.changes.title')} id="changes-to-this-policy">
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
