import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { PrivacyPolicyContent } from '@/components/Legal';

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
    en: 'Privacy Policy | diBoaS',
    de: 'Datenschutzerklärung | diBoaS',
    'pt-BR': 'Política de Privacidade | diBoaS',
    es: 'Política de Privacidad | diBoaS',
  };

  const descriptions: Record<string, string> = {
    en: 'Learn how diBoaS collects, uses, and protects your personal data. GDPR compliant.',
    de: 'Erfahren Sie, wie diBoaS Ihre personenbezogenen Daten erhebt, verwendet und schützt. DSGVO-konform.',
    'pt-BR': 'Saiba como o diBoaS coleta, usa e protege seus dados pessoais. Conformidade com LGPD e GDPR.',
    es: 'Conoce cómo diBoaS recopila, usa y protege tus datos personales. Cumple con RGPD.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
  };
}

export default async function LegalPrivacyPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load legal/privacy namespace
  const pageMessages = await loadPageNamespaces(locale, ['legal/privacy']);

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: ROUTES.LEGAL.PRIVACY }
  ], locale);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <>
        <StructuredData data={[breadcrumbData]} />
        <main className="main-page-wrapper">
          <PrivacyPolicyContent />
        </main>
      </>
    </PageI18nProvider>
  );
}
