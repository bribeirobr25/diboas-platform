import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';
import { LocaleProvider } from '@/components/LocaleProvider';
import { I18nProvider } from '@/components/I18nProvider';
import { MinimalNavigation } from '@/components/Layout/Navigation';
import { MinimalFooter } from '@/components/Layout/Footer';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { WaitingListProvider } from '@/components/WaitingList';
import { CookieConsent } from '@/components/CookieConsent';

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
 * Uses minimal navigation (logo + language switcher only) and minimal footer.
 * Used for B2C and B2B landing pages where full navigation is not needed.
 */
export default async function LandingLayout({ children, params }: LandingLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load common namespace for navigation and footer
  const commonMessages = await loadMessages(locale, 'common');
  const allMessages = flattenMessages(commonMessages, 'common');

  // Load landing-b2c namespace for footer disclaimer
  const landingMessages = await loadMessages(locale, 'landing-b2c');
  const landingFlattened = flattenMessages(landingMessages, 'landing-b2c');
  Object.assign(allMessages, landingFlattened);

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nProvider locale={locale} messages={allMessages}>
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
              <MinimalFooter disclaimerKey="landing-b2c.disclaimer.text" />
              <CookieConsent />
            </div>
          </WaitingListProvider>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}
