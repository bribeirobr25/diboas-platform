import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { CardFeesCalculator } from '@/components/Sections/CardFeesCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { buildToolStructuredData, toolMetadata } from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('card-fees');

export default async function CardFeesToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-card-fees',
    'tools-shared',
    'landing-b2c',
  ]);

  const structuredData = buildToolStructuredData({
    toolKey: 'card-fees',
    locale,
    name: pageMessages['tools-card-fees.seo.title'] ?? 'Card Fee Savings Calculator',
    description:
      pageMessages['tools-card-fees.seo.description'] ??
      'Free B2B card fee savings calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="card-fees" pageMessages={pageMessages}>
        <CardFeesCalculator />
      </ToolPage>
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
