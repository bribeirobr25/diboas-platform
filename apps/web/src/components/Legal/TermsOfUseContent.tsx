'use client';

/**
 * Terms of Use Content Component
 *
 * Renders the Terms of Use legal document using translation keys.
 */

import { useIntl } from 'react-intl';
import {
  LegalDocument,
  LegalHeader,
  LegalSection,
  LegalSubsection,
  LegalParagraph,
  LegalList,
  LegalHighlight,
} from './LegalDocument';

export function TermsOfUseContent() {
  const intl = useIntl();

  const t = (id: string) => intl.formatMessage({ id: `legal/terms.${id}` });

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
    <LegalDocument>
      <LegalHeader
        title={t('header.title')}
        lastUpdated={t('header.lastUpdated')}
        intro={t('header.intro')}
      />

      <LegalSection title={t('sections.aboutDiboas.title')}>
        <LegalParagraph>{t('sections.aboutDiboas.content')}</LegalParagraph>
        <LegalList items={aboutItems} />
        <LegalHighlight variant="important">
          {t('sections.aboutDiboas.important')}
        </LegalHighlight>
      </LegalSection>

      <LegalSection title={t('sections.acceptance.title')}>
        <LegalParagraph>{t('sections.acceptance.intro')}</LegalParagraph>
        <LegalList items={acceptanceItems} />
      </LegalSection>

      <LegalSection title={t('sections.preLaunchLimitations.title')}>
        <LegalSubsection title={t('sections.preLaunchLimitations.simulationTools.title')}>
          <LegalList items={simulationToolsItems} />
        </LegalSubsection>

        <LegalSubsection title={t('sections.preLaunchLimitations.noFinancialAdvice.title')}>
          <LegalList items={noFinancialAdviceItems} />
        </LegalSubsection>
      </LegalSection>

      <LegalSection title={t('sections.geographicRestrictions.title')}>
        <LegalParagraph>{t('sections.geographicRestrictions.intro')}</LegalParagraph>
        <LegalList items={restrictedCountries} />
        <LegalParagraph>{t('sections.geographicRestrictions.note')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.intellectualProperty.title')}>
        <LegalParagraph>{t('sections.intellectualProperty.intro')}</LegalParagraph>
        <LegalList items={ipItems} />
      </LegalSection>

      <LegalSection title={t('sections.userConduct.title')}>
        <LegalParagraph>{t('sections.userConduct.intro')}</LegalParagraph>
        <LegalList items={conductItems} />
      </LegalSection>

      <LegalSection title={t('sections.disclaimer.title')}>
        <LegalParagraph>{t('sections.disclaimer.content')}</LegalParagraph>
        <LegalList items={disclaimerItems} />
      </LegalSection>

      <LegalSection title={t('sections.limitation.title')}>
        <LegalParagraph>{t('sections.limitation.content')}</LegalParagraph>
        <LegalList items={limitationItems} />
      </LegalSection>

      <LegalSection title={t('sections.changes.title')}>
        <LegalParagraph>{t('sections.changes.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.governingLaw.title')}>
        <LegalParagraph>{t('sections.governingLaw.content')}</LegalParagraph>
      </LegalSection>

      <LegalSection title={t('sections.contact.title')}>
        <LegalParagraph>
          {t('sections.contact.content').replace('{email}', t('sections.contact.email'))}
        </LegalParagraph>
      </LegalSection>
    </LegalDocument>
  );
}
