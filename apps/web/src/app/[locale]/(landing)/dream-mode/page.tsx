import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/PageI18nProvider';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { DreamModePageContent } from './DreamModePageContent';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface DreamModePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the Dream Mode page
 */
export async function generateMetadata({ params }: DreamModePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Dream Mode - diBoaS',
    description: 'Visualize your financial future. See what different strategies could do for your money over time.',
    robots: {
      index: false, // Don't index this page
      follow: false,
    },
    openGraph: {
      title: 'Dream Mode - diBoaS',
      description: 'Visualize your financial future with our interactive simulation.',
      type: 'website',
    },
  };
}

/**
 * Dream Mode Page
 *
 * Entry point EP4: Direct URL access to Dream Mode
 * Requires waitlist membership for access (enforced client-side)
 */
export default async function DreamModePage({ params }: DreamModePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces
  const pageMessages = await loadPageNamespaces(locale, ['dreamMode', 'waitlist', 'share', 'landing-b2c']);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <DreamModePageContent locale={locale} />
    </PageI18nProvider>
  );
}
