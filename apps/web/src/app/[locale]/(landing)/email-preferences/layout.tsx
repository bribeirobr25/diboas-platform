import type { Metadata } from 'next';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { pageTitle } from '@/lib/seo/pageTitle';
import type { LocalePageProps } from '@/types/page';

/** The page's own heading as its title, in the visitor's language (5.793). */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const common = await loadMessages(validLocale, 'common');
  return {
    title: pageTitle(common?.emailPreferences?.heading || 'Your email settings'),
    robots: { index: false, follow: false },
  };
}

export default function EmailPreferencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
