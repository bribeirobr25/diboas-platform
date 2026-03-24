import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  HeroSection,
  ProseSection,
  FounderSection,
} from '@/components/Sections';
import { BenefitsCardsSection } from '@/components/Sections/BenefitsCards';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import {
  ABOUT_HERO_CONFIG,
  ABOUT_STORY_CONFIG,
  ABOUT_WHAT_WE_DO_CONFIG,
  ABOUT_BELIEFS_CONFIG,
  ABOUT_MISSION_CONFIG,
  ABOUT_BUSINESS_CONFIG,
  ABOUT_FOUNDER_CONFIG,
  ABOUT_WAITLIST_CONFIG,
  ABOUT_FOOTER_DISCLOSURES,
} from '@/config/landing-about';
import { B2C_FOOTER_NAV } from '@/config/landing-b2c';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the About page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  const messages = await loadMessages(validLocale, 'about');
  const seo = messages?.seo || {};

  const title = seo.title || 'About diBoaS | Built for the People Banks Forgot';
  const description = seo.description || 'diBoaS was built because one grandmother deserved better. Now everyone does.';

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
 * Reusable section composition pattern:
 * 1. Hero — HeroSection fullBackground
 * 2. Story — ProseSection (Adelaide narrative)
 * 3. What We Do — ProseSection (product capabilities)
 * 4. What We Believe — BenefitsCardsSection (3 cards)
 * 5. Mission — ProseSection (mission statement)
 * 6. Business CTA — ProseSection (B2B pitch)
 * 7. Founder / Contact — FounderSection
 * 8. Waitlist — WaitlistSection
 * 9. Footer — MinimalFooter
 */
export default async function AboutPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // common + waitlist already provided by landing layout
  const pageMessages = await loadPageNamespaces(locale, ['about', 'landing-b2c']);

  const serviceData = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: 'Platform giving regular people access to institutional-grade financial returns',
    category: 'Financial Technology'
  });

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'About', url: ROUTES.ABOUT }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[serviceData, breadcrumbData]} />
      <ScrollToHash />

      <div className="main-page-wrapper">
        {/* Section 1: Hero */}
        <SectionErrorBoundary
          sectionId="hero-section-about"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'about', variant: 'fullBackground' }}
        >
          <div data-section-id="hero-section-about">
            <HeroSection
              variant="fullBackground"
              config={ABOUT_HERO_CONFIG}
              enableAnalytics={true}
              priority={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 2: The Story — "Her name was Adelaide." */}
        <SectionErrorBoundary
          sectionId="story-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="story" data-section-id="story-section-about">
            <ProseSection
              config={ABOUT_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: What diBoaS Does */}
        <SectionErrorBoundary
          sectionId="what-we-do-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="what-we-do" data-section-id="what-we-do-section-about">
            <ProseSection
              config={ABOUT_WHAT_WE_DO_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: What We Believe */}
        <SectionErrorBoundary
          sectionId="beliefs-section-about"
          sectionType="BenefitsCards"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="beliefs" data-section-id="beliefs-section-about">
            <BenefitsCardsSection
              config={ABOUT_BELIEFS_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: The Mission */}
        <SectionErrorBoundary
          sectionId="mission-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="mission" data-section-id="mission-section-about">
            <ProseSection
              config={ABOUT_MISSION_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: For Businesses */}
        <SectionErrorBoundary
          sectionId="business-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="business" data-section-id="business-section-about">
            <ProseSection
              config={ABOUT_BUSINESS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 7: Founder / Contact */}
        <SectionErrorBoundary
          sectionId="founder-section-about"
          sectionType="FounderSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="contact" data-section-id="founder-section-about">
            <FounderSection
              config={ABOUT_FOUNDER_CONFIG}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 8: Waitlist */}
        <SectionErrorBoundary
          sectionId="waitlist-section-about"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-about">
            <WaitlistSection
              enableAnalytics={true}
              config={{
                sectionId: ABOUT_WAITLIST_CONFIG.sectionId,
                backgroundColor: ABOUT_WAITLIST_CONFIG.backgroundColor,
                hideBenefits: ABOUT_WAITLIST_CONFIG.hideBenefits,
                hideNoSpam: ABOUT_WAITLIST_CONFIG.hideNoSpam,
                source: ABOUT_WAITLIST_CONFIG.source,
              }}
            />
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Footer */}
      <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={ABOUT_FOOTER_DISCLOSURES} />
    </PageI18nProvider>
  );
}
