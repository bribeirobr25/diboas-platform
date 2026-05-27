import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { DemoPageContent } from './DemoPageContent';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

/**
 * Generate metadata for the Demo page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale: _locale } = await params;
  return {
    title: 'Interactive Demo - diBoaS',
    description:
      'Try the diBoaS interactive demo. Experience deposits, transfers, investments, and financial projections.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Interactive Demo - diBoaS',
      description: 'Experience the diBoaS platform with our interactive demo.',
      type: 'website',
    },
  };
}

/**
 * Demo Page
 *
 * Entry point for the interactive PreDemo experience
 * Accessible to all visitors via "Try Demo" CTA
 */
export default async function DemoPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // common already provided by landing layout
  const pageMessages = await loadPageNamespaces(locale, ['preDemo', 'preDream', 'share']);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <DemoPageContent locale={locale} />
    </PageI18nProvider>
  );
}
