import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolPage } from '@/components/Sections/ToolPage';
import { MoneyJobsCalculator } from '@/components/Sections/MoneyJobsCalculator';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { buildToolStructuredData, toolMetadata } from '@/lib/tools';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';
export const generateMetadata = toolMetadata('money-jobs');

interface MoneyJobsPageProps extends LocalePageProps {
  searchParams?: Promise<{ for?: string }>;
}

export default async function MoneyJobsToolPage({ params, searchParams }: MoneyJobsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  // Decision 6 (NEW_TOOL_PROPOSAL.md §5): `?for=business` arrivals (B2B landing,
  // campaign links) open in business mode; anything else is the B2C default.
  const sp = (await searchParams) ?? {};
  const initialMode = sp.for === 'business' ? 'business' : 'personal';

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-money-jobs',
    'tools-shared',
    'landing-b2c',
  ]);

  const structuredData = buildToolStructuredData({
    toolKey: 'money-jobs',
    locale,
    name: pageMessages['tools-money-jobs.seo.title'] ?? 'Money Jobs Calculator',
    description:
      pageMessages['tools-money-jobs.seo.description'] ?? 'Free money jobs calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="money-jobs" pageMessages={pageMessages}>
        <MoneyJobsCalculator initialMode={initialMode} />
      </ToolPage>
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
