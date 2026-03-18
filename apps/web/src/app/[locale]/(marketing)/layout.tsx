import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';
import { LocaleProvider, I18nProvider, SetHtmlLang } from '@/components/Providers';
import { Navigation } from '@/components/Layout/Navigation';
import { SiteFooter } from '@/components/Layout/Footer';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { NavigationErrorBoundary } from '@/components/ErrorBoundary/NavigationErrorBoundary';
import { WaitingListProvider, ReferralCapture } from '@/components/WaitingList';
import { CookieConsent } from '@/components/CookieConsent';
import { ScrollDepthTracker } from '@/components/Layout/ScrollDepthTracker';
import { UtmCapture } from '@/components/Layout/UtmCapture';

// CEO Decision Q5: Marketing pages removed for V1. Noindexed until post-launch.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // Keep in sync with packages/i18n/translations/{locale}/common.json → accessibility.skipToMain
  const skipLabels: Record<string, string> = { en: 'Skip to main content', de: 'Zum Hauptinhalt springen', es: 'Saltar al contenido principal', 'pt-BR': 'Pular para o conteúdo principal' };
  const skipText = skipLabels[locale] ?? skipLabels.en;

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nProvider locale={locale} messages={allMessages}>
        <SetHtmlLang locale={locale} />
        <PageErrorBoundary>
          <WaitingListProvider>
            <ReferralCapture />
            <div className="min-h-screen flex flex-col">
              {/* Skip Navigation Link for Accessibility */}
              <a href="#main-content" className="skip-link">
                {skipText}
              </a>
              <NavigationErrorBoundary maxRetries={3}>
                <Navigation />
              </NavigationErrorBoundary>
              <main id="main-content" className="main-content flex-1">
                {children}
              </main>
              <SiteFooter />
              <ScrollDepthTracker />
              <UtmCapture />
              <CookieConsent />
            </div>
          </WaitingListProvider>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}