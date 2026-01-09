'use client';

/**
 * Protocols Page Content
 *
 * Shows all 26 DeFi protocols with full transparency
 * Refactored to use extracted sections and data for maintainability
 *
 * Domain-Driven Design: Orchestration layer for protocol sections
 * Code Reusability: Sections extracted for independent use
 */

import { useTranslation } from '@diboas/i18n/client';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import {
  ProtocolsHeroSection,
  ProtocolsIntroSection,
  ProtocolsGridSection,
  ProtocolsSelectionSection,
  ProtocolsTvlSection,
  ProtocolsFaqSection,
} from './sections';

export function ProtocolsPageContent() {
  const intl = useTranslation();

  // Helper function to get i18n key from protocols namespace
  const t = (key: string) => intl.formatMessage({ id: `protocols.${key}` });

  // Get protocol labels for card rendering
  const protocolLabels = {
    founded: t('protocolLabels.founded'),
    tvl: t('protocolLabels.tvl'),
    blockchains: t('protocolLabels.blockchains'),
    audits: t('protocolLabels.audits'),
    regulatory: t('protocolLabels.regulatory'),
  };

  // Category translation helpers
  const getCategoryTitle = (categoryId: string) => t(`categories.${categoryId}.title`);
  const getCategoryDescription = (categoryId: string) => t(`categories.${categoryId}.description`);

  // FAQ items
  const faqItems = [
    { question: t('faq.q1.question'), answer: t('faq.q1.answer') },
    { question: t('faq.q2.question'), answer: t('faq.q2.answer') },
    { question: t('faq.q3.question'), answer: t('faq.q3.answer') },
  ];

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <ProtocolsHeroSection
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Section 2: Why This Page Exists */}
      <ProtocolsIntroSection
        header={t('intro.header')}
        paragraph1={t('intro.paragraph1')}
        paragraph2={t('intro.paragraph2')}
        important={t('intro.important')}
        disclaimer={t('intro.disclaimer')}
      />

      {/* Section 3: Protocol Categories */}
      <ProtocolsGridSection
        labels={protocolLabels}
        getCategoryTitle={getCategoryTitle}
        getCategoryDescription={getCategoryDescription}
      />

      {/* Section 4: Selection Process */}
      <ProtocolsSelectionSection
        header={t('selectionProcess.header')}
        intro={t('selectionProcess.intro')}
        criteria={{
          operation: t('selectionProcess.criteria.operation'),
          audits: t('selectionProcess.criteria.audits'),
          exploits: t('selectionProcess.criteria.exploits'),
          transparent: t('selectionProcess.criteria.transparent'),
          usage: t('selectionProcess.criteria.usage'),
        }}
        note={t('selectionProcess.note')}
      />

      {/* Section 5: Total TVL */}
      <ProtocolsTvlSection
        header={t('totalTvl.header')}
        paragraph1={t('totalTvl.paragraph1')}
        amount={t('totalTvl.amount')}
        paragraph2={t('totalTvl.paragraph2')}
        note={t('totalTvl.note')}
      />

      {/* Section 6: FAQ */}
      <ProtocolsFaqSection
        header={t('faq.header')}
        questions={faqItems}
      />

      {/* Section 7: Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-protocols"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Footer */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-xs text-slate-500 text-center">
            {t('footer.lastUpdated')}
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            {t('footer.sources')}
          </p>
        </div>
      </section>
    </main>
  );
}
