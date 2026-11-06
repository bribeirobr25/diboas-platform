import type { Metadata } from 'next';
import { isValidLocale, loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { pageTitle } from '@/lib/seo/pageTitle';
import type { LocalePageProps } from '@/types/page';

/** The page's own heading as its title, in the visitor's language (5.793). */
export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const waitlist = await loadMessages(validLocale, 'waitlist');
  return {
    title: pageTitle(waitlist?.deletion?.confirmTitle || 'Confirm data deletion'),
    robots: { index: false, follow: false },
  };
}

export default function DeleteConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
