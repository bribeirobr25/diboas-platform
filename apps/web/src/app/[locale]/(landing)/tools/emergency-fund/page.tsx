import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { EmergencyFundCalculator } from '@/components/Sections/EmergencyFundCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { buildToolStructuredData, toolMetadata } from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('emergency-fund');

export default async function EmergencyFundToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-emergency-fund',
    'tools-shared',
    'landing-b2c',
  ]);

  const structuredData = buildToolStructuredData({
    toolKey: 'emergency-fund',
    locale,
    name: pageMessages['tools-emergency-fund.seo.title'] ?? 'Emergency Fund Calculator',
    description:
      pageMessages['tools-emergency-fund.seo.description'] ??
      'Free emergency fund calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="emergency-fund" pageMessages={pageMessages}>
        <EmergencyFundCalculator />
      </ToolPage>
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
