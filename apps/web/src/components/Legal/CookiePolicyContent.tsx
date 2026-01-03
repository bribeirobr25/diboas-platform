'use client';

/**
 * Cookie Policy Content Component
 *
 * Renders the Cookie Policy legal document using translation keys.
 * Follows GDPR requirements for cookie disclosure.
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
} from './LegalDocument';

export function CookiePolicyContent() {
  const intl = useIntl();

  const t = (id: string) => intl.formatMessage({ id: `legal/cookies.${id}` });

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
    <LegalDocument>
      <LegalHeader
        title={t('header.title')}
        lastUpdated={t('header.lastUpdated')}
      />

      <LegalSection title={t('sections.whatAreCookies.title')}>
        <LegalParagraph>{t('sections.whatAreCookies.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.cookiesWeUse.title')}>
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
      </LegalSection>

      <LegalSection title={t('sections.yourChoices.title')}>
        <LegalParagraph>{t('sections.yourChoices.content')}</LegalParagraph>
        <LegalList items={choicesOptions} />
        <LegalParagraph>{t('sections.yourChoices.deleteNote')}</LegalParagraph>
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
