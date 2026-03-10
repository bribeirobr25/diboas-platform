import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import {
  AboutHeroSection,
  AboutStorySection,
  AboutWhatWeDoSection,
  AboutBeliefsSection,
  AboutMissionSection,
  AboutBusinessSection,
  AboutContactSection,
  AboutTransitionHook,
} from '@/components/Pages/About';
import { ABOUT_FOOTER_DISCLOSURES } from '@/config/landing-about';
import { B2C_FOOTER_NAV } from '@/config/landing-b2c';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the About page
 * Uses i18n translations for locale-aware SEO
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  // Load translations for metadata
  const messages = await loadMessages(validLocale, 'about');
  const seo = messages?.seo || {};

  const title = seo.title || 'About diBoaS | Built for the People Banks Forgot';
  const description = seo.description || 'diBoaS was built because one grandmother deserved better. Now everyone does. Free transfers, real growth options, starting at $5.';

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      type: 'website',
      locale: validLocale,
      images: [
        {
          url: `${siteUrl}/api/og/about`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: [`${siteUrl}/api/og/about`],
    },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/about`,
      languages: {
        'en': `${siteUrl}/en/about`,
        'de': `${siteUrl}/de/about`,
        'es': `${siteUrl}/es/about`,
        'pt-BR': `${siteUrl}/pt-BR/about`,
        'x-default': `${siteUrl}/en/about`,
      },
    },
  };
}

/**
 * About Page
 *
 * Config-driven composition pattern (Phase 3E migration).
 * Each section is a self-contained client component with SectionErrorBoundary.
 *
 * - Section 1: Hero with headline
 * - t1: Transition hook
 * - Section 2: The Story (grandmother narrative)
 * - t2: Transition hook
 * - Section 3: What diBoaS Does
 * - Section 4: What We Believe (3 pillars)
 * - Section 5: The Mission
 * - t3: Transition hook
 * - Section 6: For Businesses CTA
 * - t4: Transition hook
 * - Section 7: Contact
 * - Section 8: Waitlist
 * - Footer with locale-conditional disclaimers
 */
export default async function AboutPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['about', 'common', 'waitlist', 'landing-b2c']);

  // Generate structured data
  const serviceData = MetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: 'Platform giving regular people access to institutional-grade financial returns',
    category: 'Financial Technology'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'About', url: ROUTES.ABOUT }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[serviceData, breadcrumbData]} />

      <main className="main-page-wrapper">
        {/* Section 1: Hero */}
        <AboutHeroSection />

        {/* Transition t1 */}
        <AboutTransitionHook hookKey="t1" />

        {/* Section 2: The Story */}
        <AboutStorySection />

        {/* Transition t2 */}
        <AboutTransitionHook hookKey="t2" />

        {/* Section 3: What diBoaS Does */}
        <AboutWhatWeDoSection />

        {/* Section 4: What We Believe */}
        <AboutBeliefsSection />

        {/* Section 5: The Mission */}
        <AboutMissionSection />

        {/* Transition t3 */}
        <AboutTransitionHook hookKey="t3" />

        {/* Section 6: For Businesses */}
        <AboutBusinessSection />

        {/* Transition t4 */}
        <AboutTransitionHook hookKey="t4" />

        {/* Section 7: Contact */}
        <AboutContactSection />

        {/* Section 8: Waitlist */}
        <SectionErrorBoundary
          sectionId="waitlist-section-about"
          sectionType="WaitlistSection"
          enableReporting
          context={{ page: 'about' }}
        >
          <div id="waitlist">
            <WaitlistSection enableAnalytics />
          </div>
        </SectionErrorBoundary>

        {/* Footer with locale-conditional disclaimers */}
        <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={ABOUT_FOOTER_DISCLOSURES} />
      </main>
    </PageI18nProvider>
  );
}
