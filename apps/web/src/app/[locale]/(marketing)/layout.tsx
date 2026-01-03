import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';
import { LocaleProvider, I18nProvider } from '@/components/Providers';
import { Navigation } from '@/components/Layout/Navigation';
import { SiteFooter } from '@/components/Layout/Footer';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { NavigationErrorBoundary } from '@/components/ErrorBoundary/NavigationErrorBoundary';
import { WaitingListProvider } from '@/components/WaitingList';
import { CookieConsent } from '@/components/CookieConsent';

interface RootLayoutProps {
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

// Use static generation for better performance
export const dynamic = 'auto';

export default async function LocaleLayout({ children, params }: RootLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load only common namespace (navigation, footer, buttons)
  // Page-specific namespaces are loaded at the page level for optimal performance
  // This converts nested JSON structure to flat keys that react-intl expects
  // Example: { navigation: { diboas: { label: "diBoaS" } } }
  // becomes: { "common.navigation.diboas.label": "diBoaS" }
  const commonMessages = await loadMessages(locale, 'common');
  const allMessages = flattenMessages(commonMessages, 'common');

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
              <NavigationErrorBoundary maxRetries={3}>
                <Navigation />
              </NavigationErrorBoundary>
              <main id="main-content" className="main-content flex-1">
                {children}
              </main>
              <SiteFooter />
              <CookieConsent />
            </div>
          </WaitingListProvider>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}