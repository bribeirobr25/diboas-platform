'use client';

import { useTranslation } from '@diboas/i18n/client';
import Link from 'next/link';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

/**
 * About Page Content - Client Component
 * Personal founder story page with i18n support
 */
export function AboutPageContent() {
  const intl = useTranslation();

  // Helper function to get i18n key from about namespace
  const t = (key: string) => intl.formatMessage({ id: `about.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-about"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'about', variant: 'centered' }}
      >
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 2: The Story */}
      <SectionErrorBoundary
        sectionId="story-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                {t('story.header')}
              </h2>

              <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
                <p>{t('story.paragraph1')}</p>
                <p>{t('story.paragraph2')}</p>
                <p className="font-medium text-slate-800">{t('story.paragraph3')}</p>
                <p className="text-xl font-bold text-slate-900">{t('story.paragraph4')}</p>
                <p className="text-teal-700 font-medium text-xl">{t('story.soundsFamiliar')}</p>
                <p>{t('story.revelation')}</p>
                <div className="bg-slate-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
                  <p className="text-slate-800">{t('story.example')}</p>
                </div>
                <p>{t('story.universal')}</p>
                <p className="font-medium">{t('story.turning')}</p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 3: What diBoaS Does */}
      <SectionErrorBoundary
        sectionId="what-we-do-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                {t('whatWeDo.header')}
              </h2>
              <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
                <p>{t('whatWeDo.description')}</p>
                <p className="text-slate-800 font-medium">{t('whatWeDo.noMiddleman')}</p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 4: What We Believe */}
      <SectionErrorBoundary
        sectionId="beliefs-section-about"
        sectionType="FeatureSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
              {t('beliefs.header')}
            </h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Belief 1: Money */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('beliefs.money.title')}
                </h3>
                <p className="text-slate-600">
                  {t('beliefs.money.description')}
                </p>
              </div>

              {/* Belief 2: Honesty */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('beliefs.honesty.title')}
                </h3>
                <p className="text-slate-600">
                  {t('beliefs.honesty.description')}
                </p>
              </div>

              {/* Belief 3: Start Small */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {t('beliefs.startSmall.title')}
                </h3>
                <p className="text-slate-600">
                  {t('beliefs.startSmall.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 5: The Mission */}
      <SectionErrorBoundary
        sectionId="mission-section-about"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-teal-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
              {t('mission.header')}
            </h2>
            <p className="text-xl md:text-2xl text-slate-700 max-w-3xl mx-auto mb-6">
              {t('mission.statement')}
            </p>
            <p className="text-lg font-bold text-teal-700">
              {t('mission.tagline')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 6: For Businesses */}
      <SectionErrorBoundary
        sectionId="business-section-about"
        sectionType="CTASection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-slate-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('business.header')}
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-4">
              {t('business.description')}
            </p>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              {t('business.pitch')}
            </p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {t('business.cta')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 7: Contact */}
      <SectionErrorBoundary
        sectionId="contact-section-about"
        sectionType="ContactSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">
                {t('contact.header')}
              </h2>
              <div className="space-y-4 text-lg text-slate-700">
                <p>
                  <span className="font-medium">{t('contact.founder')}</span> {t('contact.founderName')}
                </p>
                <p>
                  <span className="font-medium">{t('contact.location')}</span> {t('contact.locationValue')}
                </p>
                <p>
                  <span className="font-medium">{t('contact.email')}</span>{' '}
                  <a href="mailto:hello@diboas.com" className="text-teal-600 hover:text-teal-700">
                    {t('contact.emailValue')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 8: Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-about"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'about' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>
    </main>
  );
}
