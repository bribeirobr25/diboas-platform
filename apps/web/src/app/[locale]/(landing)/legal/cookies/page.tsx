import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { CookiePolicyContent } from '@/components/Legal';

export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  // Return localized metadata
  const titles: Record<string, string> = {
    en: 'Cookie Policy | diBoaS',
    de: 'Cookie-Richtlinie | diBoaS',
    'pt-BR': 'Política de Cookies | diBoaS',
    es: 'Política de Cookies | diBoaS',
  };

  const descriptions: Record<string, string> = {
    en: 'Learn how diBoaS uses cookies to improve your experience and analyze site traffic.',
    de: 'Erfahren Sie, wie diBoaS Cookies verwendet, um Ihre Erfahrung zu verbessern und den Website-Traffic zu analysieren.',
    'pt-BR': 'Saiba como o diBoaS usa cookies para melhorar sua experiência e analisar o tráfego do site.',
    es: 'Conoce cómo diBoaS usa cookies para mejorar tu experiencia y analizar el tráfico del sitio.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

export default async function LegalCookiesPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load legal/cookies namespace
  const pageMessages = await loadPageNamespaces(locale, ['legal/cookies']);

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Cookie Policy', url: ROUTES.LEGAL.COOKIES }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />
      <CookiePolicyContent />
    </PageI18nProvider>
  );
}
