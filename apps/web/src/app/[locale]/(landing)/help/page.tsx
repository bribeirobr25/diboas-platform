import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { HeroSection, FAQAccordion } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import {
  HELP_HERO_CONFIG,
  HELP_TOPIC_IDS,
  HELP_TOPIC_CONFIGS,
} from '@/config/landing-help';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the Help page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  const messages = await loadMessages(validLocale, 'landing-help');
  const seo = messages?.seo || {};

  const title = seo.title || 'Help Center | diBoaS';
  const description =
    seo.description ||
    'Find answers to common questions about diBoaS.';

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${validLocale}/help`,
      languages: {
        en: `${siteUrl}/en/help`,
        de: `${siteUrl}/de/help`,
        es: `${siteUrl}/es/help`,
        'pt-br': `${siteUrl}/pt-BR/help`,
        'x-default': `${siteUrl}/en/help`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: `${siteUrl}/api/og/help`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@diboasfi',
      creator: '@bribeiro_br',
      title,
      description,
      images: [`${siteUrl}/api/og/help`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Help Page
 *
 * 3-section layout:
 * 1. Hero — title + subtitle
 * 2. FAQ Topics — collapsible accordion sections grouped by topic
 * 3. Footer — MinimalFooter with B2C disclosures
 */
export default async function HelpPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // common + waitlist already provided by landing layout
  const pageMessages = await loadPageNamespaces(locale, [
    'landing-help',
    'landing-b2c',
    'faq',
  ]);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Help', url: '/help' },
    ],
    locale,
  );

  const helpMessages = pageMessages['landing-help'] as unknown as Record<string, unknown> | undefined;
  const topics = (helpMessages?.topics ?? {}) as Record<string, { questions?: Record<string, { question?: string; answer?: string }> }>;

  const getFAQEntry = (topicId: string, qKey: string) => {
    const q = topics[topicId]?.questions?.[qKey];
    if (!q?.question || !q?.answer) return null;
    return {
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    };
  };

  const faqEntries = [
    getFAQEntry('gettingStarted', 'q1'),
    getFAQEntry('gettingStarted', 'q3'),
    getFAQEntry('moneySafety', 'q1'),
    getFAQEntry('moneySafety', 'q2'),
    getFAQEntry('moneySafety', 'q3'),
    getFAQEntry('feesCosts', 'q1'),
    getFAQEntry('feesCosts', 'q2'),
    getFAQEntry('investingStrategies', 'q1'),
  ].filter(Boolean);

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries,
  };

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData, faqStructuredData]} />

      <div className="main-page-wrapper">
        {/* Section 1: Hero */}
        <SectionErrorBoundary
          sectionId="hero-section-help"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'help', variant: 'fullBackground' }}
        >
          <div data-section-id="hero-section-help">
            <HeroSection
              variant="fullBackground"
              config={HELP_HERO_CONFIG}
              enableAnalytics={true}
              priority={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 2: FAQ Topics */}
        {HELP_TOPIC_IDS.map((topicId) => (
          <SectionErrorBoundary
            key={topicId}
            sectionId={`faq-${topicId}-section-help`}
            sectionType="FAQAccordion"
            enableReporting={true}
            context={{ page: 'help', topic: topicId }}
          >
            <div
              id={topicId.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}
              data-section-id={`faq-${topicId}-section-help`}
            >
              <FAQAccordion config={HELP_TOPIC_CONFIGS[topicId]} />
            </div>
          </SectionErrorBoundary>
        ))}

      </div>

      {/* Section 4: Footer */}
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
