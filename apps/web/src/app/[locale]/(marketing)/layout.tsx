import { notFound } from 'next/navigation';
import { isValidLocale, loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';
import { LocaleProvider } from '@/components/LocaleProvider';
import { I18nProvider } from '@/components/I18nProvider';
import { Navigation } from '@/components/Layout/Navigation';
import { SiteFooter } from '@/components/Layout/Footer';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { NavigationErrorBoundary } from '@/components/ErrorBoundary/NavigationErrorBoundary';

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

  // Load and flatten translation messages on the server
  // This converts nested JSON structure to flat keys that react-intl expects
  // Example: { navigation: { diboas: { label: "diBoaS" } } }
  // becomes: { "common.navigation.diboas.label": "diBoaS" }
  const namespaces = ['common', 'marketing'] as const;
  const allMessages: Record<string, string> = {};

  for (const namespace of namespaces) {
    const namespaceMessages = await loadMessages(locale, namespace);
    const flattened = flattenMessages(namespaceMessages, namespace);
    Object.assign(allMessages, flattened);
  }

  return (
    <LocaleProvider initialLocale={locale}>
      <I18nProvider locale={locale} messages={allMessages}>
        <PageErrorBoundary>
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
          </div>
        </PageErrorBoundary>
      </I18nProvider>
    </LocaleProvider>
  );
}