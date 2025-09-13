import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { LocaleProvider } from '@/components/LocaleProvider';
import { Navigation } from '@/components/Navigation';
import '../globals.css';

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

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LocaleProvider initialLocale={locale}>
          <Navigation />
          <main className="pt-20">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}