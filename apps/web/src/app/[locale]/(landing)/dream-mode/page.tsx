import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { DreamModePageContent } from './DreamModePageContent';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';
import { pageTitle } from '@/lib/seo/pageTitle';

export const dynamic = 'auto';

/**
 * Generate metadata for the Dream Mode page
 */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  // The feature's name and line in the visitor's language — "Modo Sonho", "Modo Sueño" — from the
  // page's own catalogue (5.793, 7th audit); the layout adds "| diBoaS".
  const messages = await loadMessages(validLocale, 'preDream');
  const name: string = messages?.welcome?.title || 'Dream Mode';
  const line: string = messages?.welcome?.subtitle || '';
  return {
    title: pageTitle(name),
    description: line,
    robots: {
      index: false, // Don't index this page
      follow: false,
    },
    openGraph: {
      title: `${name} | diBoaS`,
      description: line,
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
export default async function DreamModePage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load page-specific namespaces (common + waitlist already provided by landing layout)
  const pageMessages = await loadPageNamespaces(locale, [
    'dreamMode',
    'share',
    'landing-b2c',
    'preDream',
  ]);

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <DreamModePageContent locale={locale} />
    </PageI18nProvider>
  );
}
