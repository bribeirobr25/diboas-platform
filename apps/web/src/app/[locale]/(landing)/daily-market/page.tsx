import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { ROUTES } from '@/config/routes';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'auto';

const PLACEHOLDER_TRANSLATIONS: Record<string, { title: string; comingSoon: string; backHome: string; metaDescription: string }> = {
  en: { title: 'Adelaide Daily', comingSoon: 'Coming soon.', backHome: 'Back to Home', metaDescription: 'Daily market insights and analysis — coming soon.' },
  'pt-BR': { title: 'Adelaide Daily', comingSoon: 'Em breve.', backHome: 'Voltar ao Início', metaDescription: 'Insights e análises diárias do mercado — em breve.' },
  es: { title: 'Adelaide Daily', comingSoon: 'Próximamente.', backHome: 'Volver al Inicio', metaDescription: 'Análisis e insights diarios del mercado — próximamente.' },
  de: { title: 'Adelaide Daily', comingSoon: 'Demnächst verfügbar.', backHome: 'Zurück zur Startseite', metaDescription: 'Tägliche Marktanalysen und Einblicke — demnächst verfügbar.' },
};

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';
  const t = PLACEHOLDER_TRANSLATIONS[validLocale] || PLACEHOLDER_TRANSLATIONS.en;

  return {
    title: `${t.title} | diBoaS`,
    description: t.metaDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/daily-market`,
    },
  };
}

export default async function DailyMarketPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const pageMessages = await loadPageNamespaces(locale, ['common', 'landing-b2c']);

  const breadcrumbData = MetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: 'Adelaide Daily', url: ROUTES.DAILY_MARKET },
    ],
    locale,
  );

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />

      <main className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="daily-market-placeholder"
          sectionType="placeholder"
          enableReporting
          context={{ page: 'daily-market' }}
        >
          <section
            style={{
              maxWidth: 680,
              margin: '0 auto',
              padding: '120px 24px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {(PLACEHOLDER_TRANSLATIONS[locale] || PLACEHOLDER_TRANSLATIONS.en).title}
            </h1>
            <p style={{ fontSize: 18, color: '#64748b', marginBottom: 32 }}>
              {(PLACEHOLDER_TRANSLATIONS[locale] || PLACEHOLDER_TRANSLATIONS.en).comingSoon}
            </p>
            <a
              href={`/${locale}`}
              style={{
                color: '#0d9488',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {(PLACEHOLDER_TRANSLATIONS[locale] || PLACEHOLDER_TRANSLATIONS.en).backHome}
            </a>
          </section>
        </SectionErrorBoundary>

        <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={B2C_FOOTER_DISCLOSURES} />
      </main>
    </PageI18nProvider>
  );
}
