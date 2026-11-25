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
  // pt-BR-only keys (brazilNote, 8th LGPD right) are absent in en/es/de; guard
  // on runtime message presence so those locales render nothing (D8).
  const has = (id: string) => Boolean(intl.messages[`legal/privacy.${id}`]);
  const hasBrazilNote = has('sections.brazilNote.title');

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
    ...(hasBrazilNote ? [{ id: 'brazil-note', title: t('sections.brazilNote.title') }] : []),
  ];

  // Data usage table
  const dataUsageHeaders = [
    t('sections.howWeUseData.table.headers.purpose'),
    t('sections.howWeUseData.table.headers.legalBasis'),
  ];

  /* W-D1 (spec §6.3): every array entry is rendered, never a fixed count, so a row added to the
     policy in all four locales shows up (the counts per locale are checked against the JSON). */
  const indices = (path: string): number[] => {
    const out: number[] = [];
    while (
      has(`${path}.${out.length}`) ||
      has(`${path}.${out.length}.type`) ||
      has(`${path}.${out.length}.purpose`) ||
      has(`${path}.${out.length}.right`)
    )
      out.push(out.length);
    return out;
  };

  const dataUsageRows = indices('sections.howWeUseData.table.rows').map((i) => [
    t(`sections.howWeUseData.table.rows.${i}.purpose`),
    t(`sections.howWeUseData.table.rows.${i}.legalBasis`),
  ]);

  // Rights table
  const rightsHeaders = [
    t('sections.yourRights.table.headers.right'),
    t('sections.yourRights.table.headers.description'),
  ];

  // pt-BR carries an 8th (LGPD) right; every locale renders what it has.
  const rightsRows = indices('sections.yourRights.table.rows').map((i) => [
    t(`sections.yourRights.table.rows.${i}.right`),
    t(`sections.yourRights.table.rows.${i}.description`),
  ]);

  // Data lists
  const providedItems = indices('sections.whatDataWeCollect.provided.items').map((i) =>
    t(`sections.whatDataWeCollect.provided.items.${i}`)
  );

  const automaticItems = indices('sections.whatDataWeCollect.automatic.items').map((i) =>
    t(`sections.whatDataWeCollect.automatic.items.${i}`)
  );

  const securityMeasures = indices('sections.security.measures').map((i) =>
    t(`sections.security.measures.${i}`)
  );

  const retentionItems = indices('sections.dataRetention.items').map((i) => ({
    type: t(`sections.dataRetention.items.${i}.type`),
    duration: t(`sections.dataRetention.items.${i}.duration`),
  }));

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
        backgroundColor="var(--section-bg-neutral)"
        as="article"
        ariaLabel="Privacy Policy content"
      >
        {/* W-D1 (G8): what changed, dated, at the top */}
        <LegalParagraph>{t('header.notice')}</LegalParagraph>

        <LegalTableOfContents items={tocItems} title={t('toc.title')} />

        <LegalContentSection title={t('sections.whoWeAre.title')} id="who-we-are">
          <LegalParagraph>{t('sections.whoWeAre.content')}</LegalParagraph>
          <LegalContactInfo
            email={t('sections.whoWeAre.contact.email')}
            dpoEmail={t('sections.whoWeAre.contact.dpo')}
            emailLabel={t('sections.whoWeAre.contact.emailLabel')}
            dpoLabel={t('sections.whoWeAre.contact.dpoLabel')}
          />
        </LegalContentSection>

        <LegalContentSection
          title={t('sections.whatDataWeCollect.title')}
          id="what-data-we-collect"
        >
          <LegalSubsection title={t('sections.whatDataWeCollect.provided.title')}>
            <LegalList items={providedItems} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.whatDataWeCollect.automatic.title')}>
            <LegalList items={automaticItems} />
            <LegalParagraph>{t('sections.whatDataWeCollect.signupRecords')}</LegalParagraph>
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

        <LegalContentSection
          title={t('sections.internationalTransfers.title')}
          id="international-transfers"
        >
          <LegalParagraph>{t('sections.internationalTransfers.content')}</LegalParagraph>
        </LegalContentSection>

        <LegalContentSection title={t('sections.dataRetention.title')} id="data-retention">
          <LegalRetentionList items={retentionItems} />
        </LegalContentSection>

        <LegalContentSection title={t('sections.yourRights.title')} id="your-rights">
          <LegalParagraph>{t('sections.yourRights.intro')}</LegalParagraph>
          <LegalTable headers={rightsHeaders} rows={rightsRows} />
          <LegalParagraph>
            {t('sections.yourRights.exerciseRights').replace(
              '{email}',
              t('sections.contact.email')
            )}
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

        {hasBrazilNote ? (
          <LegalContentSection title={t('sections.brazilNote.title')} id="brazil-note">
            <LegalParagraph>{t('sections.brazilNote.content')}</LegalParagraph>
          </LegalContentSection>
        ) : null}

        <LegalBackToTop label={t('backToTop')} />
      </SectionContainer>
    </main>
  );
}
