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
  // pt-BR-only brazilNote is absent in en/es/de; guard on message presence (D8).
  const has = (id: string) => Boolean(intl.messages[`legal/cookies.${id}`]);
  const hasBrazilNote = has('sections.brazilNote.title');

  // Table of contents items
  const tocItems = [
    { id: 'what-are-cookies', title: t('sections.whatAreCookies.title') },
    { id: 'cookies-we-use', title: t('sections.cookiesWeUse.title') },
    { id: 'your-choices', title: t('sections.yourChoices.title') },
    { id: 'changes', title: t('sections.changes.title') },
    { id: 'contact-us', title: t('sections.contact.title') },
    ...(hasBrazilNote ? [{ id: 'brazil-note', title: t('sections.brazilNote.title') }] : []),
  ];

  // Build cookie tables from translations
  const essentialHeaders = [
    t('sections.cookiesWeUse.essential.table.headers.cookie'),
    t('sections.cookiesWeUse.essential.table.headers.purpose'),
    t('sections.cookiesWeUse.essential.table.headers.duration'),
  ];

  /* The names are the cookies the site REALLY sets (`apps/web/src/__tests__/cookiePolicyNames.test.ts`
     checks them against the code): NEXT_LOCALE (the language switcher), diboas-consent and its
     browser-readable copy diboas-consent_js (`lib/security/cookies.ts`). session_id was listed
     but never set (7th audit). */
  const essentialRows = [
    [
      'NEXT_LOCALE',
      t('sections.cookiesWeUse.essential.table.rows.0.purpose'),
      t('sections.cookiesWeUse.essential.table.rows.0.duration'),
    ],
    [
      'diboas-consent',
      t('sections.cookiesWeUse.essential.table.rows.1.purpose'),
      t('sections.cookiesWeUse.essential.table.rows.1.duration'),
    ],
    [
      'diboas-consent_js',
      t('sections.cookiesWeUse.essential.table.rows.2.purpose'),
      t('sections.cookiesWeUse.essential.table.rows.2.duration'),
    ],
  ];

  const analyticsHeaders = [
    t('sections.cookiesWeUse.analytics.table.headers.cookie'),
    t('sections.cookiesWeUse.analytics.table.headers.purpose'),
    t('sections.cookiesWeUse.analytics.table.headers.duration'),
  ];

  const analyticsRows = [
    [
      '_ga',
      t('sections.cookiesWeUse.analytics.table.rows.0.purpose'),
      t('sections.cookiesWeUse.analytics.table.rows.0.duration'),
    ],
    [
      '_gid',
      t('sections.cookiesWeUse.analytics.table.rows.1.purpose'),
      t('sections.cookiesWeUse.analytics.table.rows.1.duration'),
    ],
    // PostHog analytics cookie — present in all locales (GDPR completeness, D8).
    [
      'ph_*',
      t('sections.cookiesWeUse.analytics.table.rows.2.purpose'),
      t('sections.cookiesWeUse.analytics.table.rows.2.duration'),
    ],
    // W-D1: GA4's per-property cookie; rows are APPENDED, never inserted (they render by index).
    [
      '_ga_<ID>',
      t('sections.cookiesWeUse.analytics.table.rows.3.purpose'),
      t('sections.cookiesWeUse.analytics.table.rows.3.duration'),
    ],
  ];

  /* W-D1 (D1, D7): what the site and its analytics tools keep in the browser's storage, besides
     cookies. The names are hard-coded here (no catalogue `cookie` key) and checked against the
     code's storage writers by COOKIE-STORAGE-1 (`cookieStorageTable.test.ts`). */
  const STORAGE_NAMES = [
    'diboas-cookie-consent',
    'diboas_ref',
    'diboas-waitlist-stats, diboas-waitlist-stats-<form>',
    'diboas_waitlist_email',
    'diboas_logs',
    'ph_<project>_*',
    '__ph_opt_in_out_<project>',
  ];
  const storageHeaders = [
    t('sections.cookiesWeUse.storage.table.headers.name'),
    t('sections.cookiesWeUse.storage.table.headers.purpose'),
    t('sections.cookiesWeUse.storage.table.headers.when'),
    t('sections.cookiesWeUse.storage.table.headers.keptUntil'),
  ];
  const storageRows = STORAGE_NAMES.map((name, i) => [
    name,
    t(`sections.cookiesWeUse.storage.table.rows.${i}.purpose`),
    t(`sections.cookiesWeUse.storage.table.rows.${i}.when`),
    t(`sections.cookiesWeUse.storage.table.rows.${i}.keptUntil`),
  ]);

  const functionalHeaders = [
    t('sections.cookiesWeUse.functional.table.headers.cookie'),
    t('sections.cookiesWeUse.functional.table.headers.purpose'),
    t('sections.cookiesWeUse.functional.table.headers.duration'),
  ];

  const functionalRows = [
    [
      'theme',
      t('sections.cookiesWeUse.functional.table.rows.0.purpose'),
      t('sections.cookiesWeUse.functional.table.rows.0.duration'),
    ],
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
        backgroundColor="var(--section-bg-neutral)"
        as="article"
        ariaLabel="Cookie Policy content"
      >
        {/* W-D1 (G8): what changed, dated, at the top */}
        <LegalParagraph>{t('header.notice')}</LegalParagraph>

        <LegalTableOfContents items={tocItems} title={t('toc.title')} />

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
            <LegalParagraph>{t('sections.cookiesWeUse.signupRecords')}</LegalParagraph>
          </LegalSubsection>

          <LegalSubsection title={t('sections.cookiesWeUse.functional.title')}>
            <LegalParagraph>{t('sections.cookiesWeUse.functional.description')}</LegalParagraph>
            <LegalTable headers={functionalHeaders} rows={functionalRows} />
          </LegalSubsection>

          <LegalSubsection title={t('sections.cookiesWeUse.storage.title')}>
            <LegalParagraph>{t('sections.cookiesWeUse.storage.intro')}</LegalParagraph>
            <LegalTable headers={storageHeaders} rows={storageRows} />
            <LegalParagraph>{t('sections.cookiesWeUse.storage.prefixNote')}</LegalParagraph>
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
