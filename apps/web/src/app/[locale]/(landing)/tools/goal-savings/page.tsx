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
export const generateMetadata = toolMetadata('goal-savings');

export default async function GoalSavingsToolPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;
  if (!isValidLocale(locale)) notFound();

  const pageMessages = await loadPageNamespaces(locale, [
    'tools-goal-savings',
    'tools-shared',
    // Calculator-internal copy lives under `learn-compound-interest.calculator.*`.
    'learn-compound-interest',
    'landing-b2c',
  ]);
  const defaults = COMPOUND_TOOL_DEFAULTS['goal-savings'];

  const structuredData = buildToolStructuredData({
    toolKey: 'goal-savings',
    locale,
    name: pageMessages['tools-goal-savings.seo.title'] ?? 'Goal-Based Savings Calculator',
    description:
      pageMessages['tools-goal-savings.seo.description'] ??
      'Free goal-based savings calculator from diBoaS.',
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[structuredData]} />
      <ToolPage toolKey="goal-savings" pageMessages={pageMessages}>
        <CompoundInterestCalculator
          engine="tool"
          // C8 close (TOOLS_41_DEFECTS_FIX_PLAN.md §5.9, 2026-05-26):
          // hide the Forward/Retrospective toggle for USD locale. The
          // path-dependent engine silently delegates to the forward engine
          // for `currency === 'USD'`, so the toggle was a dead control
          // showing identical numbers in both positions. Hiding it for `en`
          // removes the confusion; non-USD locales keep the toggle.
          enablePathDependent={locale !== 'en'}
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
