'use client';

import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import { CalculatorSection } from '@/components/Sections/CalculatorSection';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

/**
 * i18n namespace prefix for future-you page
 */
const I18N_PREFIX = 'marketing.pages.futureYou';

/**
 * Future You Page Content - Client Component
 * Uses i18n for all text content
 */
export function FutureYouPageContent() {
  const intl = useTranslation();

  // Helper function to get prefixed i18n key
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-future-you"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'future-you', variant: 'centered' }}
      >
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('hero.headline')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              {t('hero.subheadline')}
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t('hero.subheadline2')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 2: Calculator */}
      <SectionErrorBoundary
        sectionId="calculator-section-future-you"
        sectionType="CalculatorSection"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <div id="calculator">
          <CalculatorSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Section 3: The Math Explained */}
      <SectionErrorBoundary
        sectionId="math-explained-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-6">
              {t('mathExplained.header')}
            </h2>
            <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
              {t('mathExplained.intro')}
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Bank Gap */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('mathExplained.bankGap.headline')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('mathExplained.bankGap.body2')}
                </p>
              </div>

              {/* Compound */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('mathExplained.compound.headline')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('mathExplained.compound.body')}
                </p>
              </div>

              {/* Time */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('mathExplained.time.headline')}
                </h3>
                <p className="text-slate-600 text-sm">
                  {t('mathExplained.time.takeaway')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 4: Strategy Connection */}
      <SectionErrorBoundary
        sectionId="strategy-connection-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              {t('strategyConnection.header')}
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              {t('strategyConnection.body')}
            </p>
            <Link
              href="/strategies"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {t('strategyConnection.cta')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 5: Final CTA / Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-future-you"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'future-you' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Footer Disclaimer */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-xs text-slate-500 text-center max-w-4xl mx-auto">
            {t('footer.disclaimer')}
          </p>
        </div>
      </section>
    </main>
  );
}
