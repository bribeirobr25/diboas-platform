'use client';

/**
 * Privacy Policy Content Component
 *
 * Renders the Privacy Policy legal document using translation keys.
 * Follows GDPR requirements for privacy disclosure.
 */

import { useIntl } from 'react-intl';
import {
  LegalDocument,
  LegalHeader,
  LegalSection,
  LegalSubsection,
  LegalParagraph,
  LegalTable,
  LegalList,
  LegalContactInfo,
  LegalRetentionList,
} from './LegalDocument';

export function PrivacyPolicyContent() {
  const intl = useIntl();

  const t = (id: string) => intl.formatMessage({ id: `legal/privacy.${id}` });

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
    <LegalDocument>
      <LegalHeader
        title={t('header.title')}
        lastUpdated={t('header.lastUpdated')}
        intro={t('header.intro')}
      />

      <LegalSection title={t('sections.whoWeAre.title')}>
        <LegalParagraph>{t('sections.whoWeAre.content')}</LegalParagraph>
        <LegalContactInfo
          email={t('sections.whoWeAre.contact.email')}
          dpoEmail={t('sections.whoWeAre.contact.dpo')}
          emailLabel={t('sections.whoWeAre.contact.emailLabel')}
          dpoLabel={t('sections.whoWeAre.contact.dpoLabel')}
        />
      </LegalSection>

      <LegalSection title={t('sections.whatDataWeCollect.title')}>
        <LegalSubsection title={t('sections.whatDataWeCollect.provided.title')}>
          <LegalList items={providedItems} />
        </LegalSubsection>

        <LegalSubsection title={t('sections.whatDataWeCollect.automatic.title')}>
          <LegalList items={automaticItems} />
        </LegalSubsection>

        <LegalSubsection title={t('sections.whatDataWeCollect.dreamMode.title')}>
          <LegalList items={dreamModeItems} />
        </LegalSubsection>
      </LegalSection>

      <LegalSection title={t('sections.howWeUseData.title')}>
        <LegalTable headers={dataUsageHeaders} rows={dataUsageRows} />
      </LegalSection>

      <LegalSection title={t('sections.whoWeShareWith.title')}>
        <LegalParagraph>{t('sections.whoWeShareWith.intro')}</LegalParagraph>
        <LegalSubsection title={t('sections.whoWeShareWith.serviceProviders.title')}>
          <LegalParagraph>{t('sections.whoWeShareWith.serviceProviders.content')}</LegalParagraph>
        </LegalSubsection>
        <LegalSubsection title={t('sections.whoWeShareWith.legal.title')}>
          <LegalParagraph>{t('sections.whoWeShareWith.legal.content')}</LegalParagraph>
        </LegalSubsection>
        <LegalParagraph>{t('sections.whoWeShareWith.note')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.internationalTransfers.title')}>
        <LegalParagraph>{t('sections.internationalTransfers.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.dataRetention.title')}>
        <LegalRetentionList items={retentionItems} />
      </LegalSection>

      <LegalSection title={t('sections.yourRights.title')}>
        <LegalParagraph>{t('sections.yourRights.intro')}</LegalParagraph>
        <LegalTable headers={rightsHeaders} rows={rightsRows} />
        <LegalParagraph>
          {t('sections.yourRights.exerciseRights').replace('{email}', t('sections.contact.email'))}
        </LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.complaints.title')}>
        <LegalParagraph>{t('sections.complaints.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.security.title')}>
        <LegalParagraph>{t('sections.security.intro')}</LegalParagraph>
        <LegalList items={securityMeasures} />
      </LegalSection>

      <LegalSection title={t('sections.childrenPrivacy.title')}>
        <LegalParagraph>{t('sections.childrenPrivacy.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.changes.title')}>
        <LegalParagraph>{t('sections.changes.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.contact.title')}>
        <LegalParagraph>
          {t('sections.contact.content').replace('{email}', t('sections.contact.email'))}
        </LegalParagraph>
      </LegalSection>
    </LegalDocument>
  );
}
