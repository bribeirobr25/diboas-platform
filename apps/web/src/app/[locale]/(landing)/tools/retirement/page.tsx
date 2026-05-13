import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { CompoundInterestCalculator } from '@/components/Sections/CompoundInterestCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import {
  COMPOUND_TOOL_DEFAULTS,
  buildToolStructuredData,
  toolMetadata,
} from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('retirement');

export default async function RetirementToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-retirement',
    'tools-shared',
    // Calculator-internal copy lives under `learn-compound-interest.calculator.*`.
    'learn-compound-interest',
    'landing-b2c',
  ]);
  const defaults = COMPOUND_TOOL_DEFAULTS.retirement;

  const structuredData = buildToolStructuredData({
    toolKey: 'retirement',
    locale,
    name: pageMessages['tools-retirement.seo.title'] ?? 'Retirement Calculator',
    description:
      pageMessages['tools-retirement.seo.description'] ??
      'Free retirement calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="retirement" pageMessages={pageMessages}>
        <CompoundInterestCalculator
          engine="tool"
          initialInput={{
            amount: defaults.amount[locale],
            cadence: defaults.cadence,
            years: defaults.years,
            locale,
          }}
        />
      </ToolPage>
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
