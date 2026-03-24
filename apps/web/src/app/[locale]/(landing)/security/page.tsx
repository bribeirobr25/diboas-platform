import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import {
  HeroSection,
  ProseSection,
} from '@/components/Sections';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import {
  SECURITY_HERO_CONFIG,
  SECURITY_WALLET_CONFIG,
  SECURITY_PROTECTION_CONFIG,
  SECURITY_TECHNOLOGY_CONFIG,
  SECURITY_WHAT_WE_DONT_DO_CONFIG,
  SECURITY_TRANSPARENCY_CONFIG,
  SECURITY_WAITLIST_CONFIG,
  SECURITY_FOOTER_DISCLOSURES,
} from '@/config/landing-security';
import { B2C_FOOTER_NAV } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the Security page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? locale as SupportedLocale : 'en';

  const messages = await loadMessages(validLocale, 'security');
  const seo = messages?.seo || {};

  const title = seo.title || 'Security | diBoaS';
  const description = seo.description || 'How diBoaS protects your money. Your wallet, your keys. Non-custodial architecture. 24/7 monitoring.';

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      type: 'website',
      locale: validLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
    },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/security`,
      languages: {
        'en': `${siteUrl}/en/security`,
        'de': `${siteUrl}/de/security`,
        'es': `${siteUrl}/es/security`,
        'pt-BR': `${siteUrl}/pt-BR/security`,
        'x-default': `${siteUrl}/en/security`,
      },
    },
  };
}

/**
 * Security Page
 *
 * Reusable section composition pattern:
 * 1. Hero — HeroSection fullBackground
 * 2. Your Wallet, Your Keys — ProseSection
 * 3. How We Protect Your Funds — ProseSection
 * 4. The Technology — ProseSection
 * 5. What We Don't Do — ProseSection
 * 6. Transparency — ProseSection
 * 7. Waitlist — WaitlistSection
 * 8. Footer — MinimalFooter
 */
export default async function SecurityPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // common + waitlist already provided by landing layout
  const pageMessages = await loadPageNamespaces(locale, ['security', 'landing-b2c']);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Security', url: '/security' },
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />

      <div className="main-page-wrapper">
        {/* Section 1: Hero */}
        <SectionErrorBoundary
          sectionId="hero-section-security"
          sectionType="HeroSection"
          enableReporting={true}
          context={{ page: 'security', variant: 'fullBackground' }}
        >
          <div data-section-id="hero-section-security">
            <HeroSection
              variant="fullBackground"
              config={SECURITY_HERO_CONFIG}
              enableAnalytics={true}
              priority={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 2: Your Wallet, Your Keys */}
        <SectionErrorBoundary
          sectionId="wallet-section-security"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="wallet" data-section-id="wallet-section-security">
            <ProseSection
              config={SECURITY_WALLET_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 3: How We Protect Your Funds */}
        <SectionErrorBoundary
          sectionId="protection-section-security"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="protection" data-section-id="protection-section-security">
            <ProseSection
              config={SECURITY_PROTECTION_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 4: The Technology */}
        <SectionErrorBoundary
          sectionId="technology-section-security"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="technology" data-section-id="technology-section-security">
            <ProseSection
              config={SECURITY_TECHNOLOGY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 5: What We Don't Do */}
        <SectionErrorBoundary
          sectionId="what-we-dont-do-section-security"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="what-we-dont-do" data-section-id="what-we-dont-do-section-security">
            <ProseSection
              config={SECURITY_WHAT_WE_DONT_DO_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 6: Transparency */}
        <SectionErrorBoundary
          sectionId="transparency-section-security"
          sectionType="ProseSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="transparency" data-section-id="transparency-section-security">
            <ProseSection
              config={SECURITY_TRANSPARENCY_CONFIG}
              enableAnalytics={true}
            />
          </div>
        </SectionErrorBoundary>

        {/* Section 7: Waitlist */}
        <SectionErrorBoundary
          sectionId="waitlist-section-security"
          sectionType="WaitlistSection"
          enableReporting={true}
          context={{ page: 'security' }}
        >
          <div id="waitlist" data-section-id="waitlist-section-security">
            <WaitlistSection
              enableAnalytics={true}
              config={{
                sectionId: SECURITY_WAITLIST_CONFIG.sectionId,
                backgroundColor: SECURITY_WAITLIST_CONFIG.backgroundColor,
                hideBenefits: SECURITY_WAITLIST_CONFIG.hideBenefits,
                hideNoSpam: SECURITY_WAITLIST_CONFIG.hideNoSpam,
                source: SECURITY_WAITLIST_CONFIG.source,
              }}
            />
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Footer */}
      <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={SECURITY_FOOTER_DISCLOSURES} />
    </PageI18nProvider>
  );
}
