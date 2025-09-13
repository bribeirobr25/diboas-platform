import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { LocaleProvider } from '@/components/LocaleProvider';
import { Navigation } from '@/components/Navigation';

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    title: {
      template: '%s | diBoaS',
      default: 'diBoaS - Financial Freedom Made Simple'
    },
    description: 'Manage your banking, investing, and DeFi assets all in one secure platform.',
  };
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
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </LocaleProvider>
  );
}