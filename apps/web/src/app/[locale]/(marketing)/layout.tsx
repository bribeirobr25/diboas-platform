import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { LocaleProvider } from '@/components/LocaleProvider';
import { Navigation } from '@/components/Layout/Navigation';
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

  return (
    <LocaleProvider initialLocale={locale}>
      <PageErrorBoundary>
        {/* Skip Navigation Link for Accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <NavigationErrorBoundary maxRetries={3}>
          <Navigation />
        </NavigationErrorBoundary>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </PageErrorBoundary>
    </LocaleProvider>
  );
}