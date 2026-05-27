import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { CompoundInterestCalculator } from '@/components/Sections/CompoundInterestCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { COMPOUND_TOOL_DEFAULTS, buildToolStructuredData, toolMetadata } from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('compound-interest');

export default async function CompoundInterestToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-compound-interest',
    'tools-shared',
    // Calculator-internal copy (cadence labels, summary, scenario names, axis,
    // table headers) lives under `learn-compound-interest.calculator.*` because
    // that's where it originated. The standalone tool reuses it verbatim.
    'learn-compound-interest',
    'landing-b2c',
  ]);
  const defaults = COMPOUND_TOOL_DEFAULTS['compound-interest'];

  const structuredData = buildToolStructuredData({
    toolKey: 'compound-interest',
    locale,
    name: pageMessages['tools-compound-interest.seo.title'] ?? 'Compound Interest Calculator',
    description:
      pageMessages['tools-compound-interest.seo.description'] ??
      'Free compound interest calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="compound-interest" pageMessages={pageMessages}>
        <CompoundInterestCalculator
          engine="tool"
          recurringSliderMax={defaults.recurringSliderMax[locale]}
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
