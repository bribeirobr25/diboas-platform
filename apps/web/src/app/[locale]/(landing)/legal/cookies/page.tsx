import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { CookiePolicyContent } from '@/components/Legal';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Load translations for SEO metadata
  const messages = await loadMessages(locale as SupportedLocale, 'legal/cookies');
  const seo = messages?.seo || {};

  const title = seo.title || 'Cookie Policy | diBoaS';
  const description = seo.description || 'Learn how diBoaS uses cookies to improve your experience and analyze site traffic.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/cookies`,
      languages: {
        'en': `${baseUrl}/en/legal/cookies`,
        'de': `${baseUrl}/de/legal/cookies`,
        'es': `${baseUrl}/es/legal/cookies`,
        'pt-BR': `${baseUrl}/pt-BR/legal/cookies`,
        'x-default': `${baseUrl}/en/legal/cookies`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale,
      url: `${baseUrl}/${locale}/legal/cookies`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/legal`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/api/og/legal`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LegalCookiesPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load legal/cookies namespace
  const pageMessages = await loadPageNamespaces(locale, ['legal/cookies', 'landing-b2c']);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Cookie Policy', url: ROUTES.LEGAL.COOKIES }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />
      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="cookie-policy-content"
          sectionType="LegalContent"
          enableReporting={true}
          context={{ page: 'legal/cookies', locale }}
        >
          <CookiePolicyContent />
        </SectionErrorBoundary>
        <MinimalFooter
          taglineKey="landing-b2c.footer.tagline"
          navLinks={B2C_FOOTER_NAV}
          disclosureKeys={B2C_FOOTER_DISCLOSURES}
        />
      </main>
    </PageI18nProvider>
  );
}
