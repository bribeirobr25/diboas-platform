import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale, loadMessages } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { TermsOfUseContent } from '@/components/Legal';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Load translations for SEO metadata
  const messages = await loadMessages(locale as SupportedLocale, 'legal/terms');
  const seo = messages?.seo || {};

  const title = seo.title || 'Terms of Use | diBoaS';
  const description = seo.description || 'Terms of Use for the diBoaS pre-launch website. Clear rules, serious commitments.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/legal/terms`,
      languages: {
        'en': `${baseUrl}/en/legal/terms`,
        'de': `${baseUrl}/de/legal/terms`,
        'es': `${baseUrl}/es/legal/terms`,
        'pt-BR': `${baseUrl}/pt-BR/legal/terms`,
        'x-default': `${baseUrl}/en/legal/terms`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale,
      url: `${baseUrl}/${locale}/legal/terms`,
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

export default async function LegalTermsPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load legal/terms namespace
  const pageMessages = await loadPageNamespaces(locale, ['legal/terms']);

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Terms of Use', url: ROUTES.LEGAL.TERMS }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />
      <SectionErrorBoundary
        sectionId="terms-of-use-content"
        sectionType="LegalContent"
        enableReporting={true}
        context={{ page: 'legal/terms', locale }}
      >
        <TermsOfUseContent />
      </SectionErrorBoundary>
    </PageI18nProvider>
  );
}
