import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { TimeToTargetCalculator } from '@/components/Sections/TimeToTargetCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { buildToolStructuredData, toolMetadata } from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('time-to-target');

export default async function TimeToTargetToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-time-to-target',
    'tools-shared',
    // Calculator-internal cadence labels live under `learn-compound-interest.calculator.*`.
    'learn-compound-interest',
    'landing-b2c',
  ]);

  const structuredData = buildToolStructuredData({
    toolKey: 'time-to-target',
    locale,
    name: pageMessages['tools-time-to-target.seo.title'] ?? 'Time-to-Target Calculator',
    description:
      pageMessages['tools-time-to-target.seo.description'] ??
      'Free time-to-target calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="time-to-target" pageMessages={pageMessages}>
        <TimeToTargetCalculator />
      </ToolPage>
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
