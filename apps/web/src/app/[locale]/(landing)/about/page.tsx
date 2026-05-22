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
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ScrollToHash } from '@/components/Layout/ScrollToHash';
import {
  ABOUT_HERO_CONFIG,
  ABOUT_STORY_CONFIG,
  ABOUT_BELIEFS_CONFIG,
  ABOUT_MISSION_CONFIG,
  ABOUT_BUSINESS_CONFIG,
  ABOUT_FOUNDER_CONFIG,
} from '@/config/landing-about';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
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
      site: '@diboasfi',
      creator: '@bribeiro_br',
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
        'pt-br': `${siteUrl}/pt-BR/about`,
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
 * 3. Mission — ProseSection (mission statement)
 * 4. What We Believe — BenefitsCardsSection (3 cards)
 * 5. Business CTA — ProseSection (B2B pitch)
 * 6. Founder / Contact — FounderSection (dark background)
 * 7. Footer — MinimalFooter
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

        {/* Sections 2-6 below: each wrapper carries `content-visibility: auto`
            + `contain-intrinsic-size` (Perf F.1.d, 2026-05-22). Off-screen
            sections skip layout/paint until scrolled into view. Hero (Section
            1) above stays default-render. The 700px intrinsic height covers
            the typical ProseSection / BenefitsCards / FounderSection layouts
            on mobile; in-page anchor scrolling preserved via `scroll-margin-
            top` already set in each component's CSS module. */}

        {/* Section 2: The Story — "Her name was Adelaide." */}
        <SectionErrorBoundary
          sectionId="story-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div
            id="story"
            data-section-id="story-section-about"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
          >
            <ProseSection
              config={ABOUT_STORY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: The Mission */}
        <SectionErrorBoundary
          sectionId="mission-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div
            id="mission"
            data-section-id="mission-section-about"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
          >
            <ProseSection
              config={ABOUT_MISSION_CONFIG}
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
          <div
            id="beliefs"
            data-section-id="beliefs-section-about"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
          >
            <BenefitsCardsSection
              config={ABOUT_BELIEFS_CONFIG}
              variant="default"
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: For Businesses */}
        <SectionErrorBoundary
          sectionId="business-section-about"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div
            id="business"
            data-section-id="business-section-about"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
          >
            <ProseSection
              config={ABOUT_BUSINESS_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Founder / Contact */}
        <SectionErrorBoundary
          sectionId="founder-section-about"
          sectionType="FounderSection"
          enableReporting={true}
          context={{ page: 'about' }}
        >
          <div
            id="contact"
            data-section-id="founder-section-about"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
          >
            <FounderSection
              config={ABOUT_FOUNDER_CONFIG}
            />
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Footer */}
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
