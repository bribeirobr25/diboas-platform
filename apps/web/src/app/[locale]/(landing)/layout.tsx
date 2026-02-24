import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';
import { LocaleProvider, I18nProvider, SetHtmlLang } from '@/components/Providers';
import { MinimalNavigation } from '@/components/Layout/Navigation';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { WaitingListProvider } from '@/components/WaitingList';
import { CookieConsent } from '@/components/CookieConsent';
import { ScrollDepthTracker } from '@/components/Layout/ScrollDepthTracker';

interface LandingLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'pt-BR' },
    { locale: 'es' },
    { locale: 'de' }
  ];
}

export const dynamic = 'auto';

/**
 * Landing Pages Layout
 *
 * Uses minimal navigation (logo + language switcher only).
 * Individual pages provide their own footer. Used for B2C and B2B landing pages.
 */
export default async function LandingLayout({ children, params }: LandingLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load common namespace for navigation
  const commonMessages = await loadMessages(locale, 'common');
  const allMessages = flattenMessages(commonMessages, 'common');

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nProvider locale={locale} messages={allMessages}>
        <SetHtmlLang locale={locale} />
        <PageErrorBoundary>
          <WaitingListProvider>
            <div className="min-h-screen flex flex-col">
              {/* Skip Navigation Link for Accessibility */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <MinimalNavigation />
              <main id="main-content" className="main-content flex-1">
                {children}
              </main>
              <CookieConsent />
              <ScrollDepthTracker />
            </div>
          </WaitingListProvider>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}
