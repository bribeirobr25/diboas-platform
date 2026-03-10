import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { PrivacyPolicyContent } from '@/components/Legal';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Load translations for SEO metadata
  const messages = await loadMessages(locale as SupportedLocale, 'legal/privacy');
  const seo = messages?.seo || {};

  const title = seo.title || 'Privacy Policy | diBoaS';
  const description = seo.description || 'Learn how diBoaS collects, uses, and protects your personal data. GDPR compliant.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/privacy`,
      languages: {
        'en': `${baseUrl}/en/legal/privacy`,
        'de': `${baseUrl}/de/legal/privacy`,
        'es': `${baseUrl}/es/legal/privacy`,
        'pt-BR': `${baseUrl}/pt-BR/legal/privacy`,
        'x-default': `${baseUrl}/en/legal/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale,
      url: `${baseUrl}/${locale}/legal/privacy`,
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

export default async function LegalPrivacyPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load legal/privacy namespace
  const pageMessages = await loadPageNamespaces(locale, ['legal/privacy', 'landing-b2c']);

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: ROUTES.LEGAL.PRIVACY }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />
      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="privacy-policy-content"
          sectionType="LegalContent"
          enableReporting={true}
          context={{ page: 'legal/privacy', locale }}
        >
          <PrivacyPolicyContent />
        </SectionErrorBoundary>
        <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={B2C_FOOTER_DISCLOSURES} />
      </main>
    </PageI18nProvider>
  );
}
