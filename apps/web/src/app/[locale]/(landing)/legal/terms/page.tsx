import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { TermsOfUseContent } from '@/components/Legal';

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
    en: 'Terms of Use | diBoaS',
    de: 'Nutzungsbedingungen | diBoaS',
    'pt-BR': 'Termos de Uso | diBoaS',
    es: 'Términos de Uso | diBoaS',
  };

  const descriptions: Record<string, string> = {
    en: 'Terms of Use for the diBoaS pre-launch website. Clear rules, serious commitments.',
    de: 'Nutzungsbedingungen für die diBoaS Vorstart-Website. Klare Regeln, ernsthafte Verpflichtungen.',
    'pt-BR': 'Termos de Uso do site de pré-lançamento do diBoaS. Regras claras, compromissos sérios.',
    es: 'Términos de Uso del sitio de pre-lanzamiento de diBoaS. Reglas claras, compromisos serios.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

export default async function LegalTermsPage({ params }: PageProps) {
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
      <TermsOfUseContent />
    </PageI18nProvider>
  );
}
