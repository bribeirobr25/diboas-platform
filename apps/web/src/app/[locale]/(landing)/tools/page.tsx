import { notFound } from 'next/navigation';
import { isValidLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { StructuredData } from '@/components/SEO/StructuredData';
import { ToolsIndex } from '@/components/Sections/ToolsIndex';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import { seoService, socialCardMetadata } from '@/lib/seo';
import {
  buildToolsIndexStructuredData,
  SHIPPED_TOOLS,
  type ToolKey,
  type ToolSectionKey,
} from '@/lib/tools';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export const dynamic = 'force-dynamic';

interface ToolsPageProps extends LocalePageProps {
  searchParams?: Promise<{ for?: string }>;
}

const SECTIONS: ReadonlyArray<ToolSectionKey> = ['grow', 'protect', 'target', 'business'];

export async function generateMetadata({ params }: ToolsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (isValidLocale(locale) ? locale : 'en') as SupportedLocale;
  const messages = await loadPageNamespaces(validLocale, ['tools-shared']);
  const languages = SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, lang) => {
    acc[lang] = seoService.generateCanonicalUrl('/tools', lang);
    return acc;
  }, {});
  const title =
    messages['tools-shared.landing.seo.title'] ?? 'Money Tools — free financial calculators';
  const description =
    messages['tools-shared.landing.seo.description'] ??
    'Free money calculators to plan your retirement, emergency fund, and savings goals.';

  return {
    title,
    description,
    // SEO-6: emit the render-ready `tools` OG template as a social card.
    ...socialCardMetadata('tools', title, description, validLocale),
    alternates: {
      canonical: seoService.generateCanonicalUrl('/tools', validLocale),
      languages,
    },
  };
}

export default async function ToolsLandingPage({ params, searchParams }: ToolsPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  // C41 close (2026-05-25): explicit allowlist for ?for= audience filter. Pre-fix,
  // any value other than `business` silently fell through to `null` (show all),
  // so a typo'd marketing link `?for=biz` rendered the unfiltered page with no
  // signal. When a new audience is added (e.g. retail), extend VALID_AUDIENCES.
  const VALID_AUDIENCES = ['business'] as const;
  type AudienceFilter = (typeof VALID_AUDIENCES)[number];
  const audienceFilter: AudienceFilter | null =
    typeof sp.for === 'string' && (VALID_AUDIENCES as readonly string[]).includes(sp.for)
      ? (sp.for as AudienceFilter)
      : null;

  // Load every shipped tool's namespace so the cards on the landing render
  // their titles + taglines. Forgetting one here yields icon-only cards on
  // the landing — verified during 6D audit.
  const pageMessages = await loadPageNamespaces(locale, [
    'tools-shared',
    ...SHIPPED_TOOLS.map((toolKey) => `tools-${toolKey}`),
    'landing-b2c',
  ]);

  const get = (k: string, fallback = ''): string => pageMessages[k] ?? fallback;

  const sections = Object.fromEntries(
    SECTIONS.map((section) => [
      section,
      {
        title: get(`tools-shared.landing.sections.${section}.title`),
        question: get(`tools-shared.landing.sections.${section}.question`),
      },
    ])
  ) as Record<ToolSectionKey, { title: string; question: string }>;

  const cards = Object.fromEntries(
    SHIPPED_TOOLS.map((toolKey) => {
      const namespace = `tools-${toolKey}`;
      return [
        toolKey,
        {
          title: get(`${namespace}.landing.cardTitle`),
          tagline: get(`${namespace}.landing.cardTagline`),
        },
      ];
    })
  ) as Partial<Record<ToolKey, { title: string; tagline: string }>>;

  const indexStructuredData = buildToolsIndexStructuredData({
    locale,
    shippedTools: SHIPPED_TOOLS,
    toolNames: Object.fromEntries(
      SHIPPED_TOOLS.map((toolKey) => [toolKey, get(`tools-${toolKey}.landing.cardTitle`)])
    ) as Partial<Record<ToolKey, string>>,
  });

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      {indexStructuredData && <StructuredData data={[indexStructuredData]} />}
      <ToolsIndex
        locale={locale}
        shippedTools={SHIPPED_TOOLS}
        audienceFilter={audienceFilter}
        copy={{
          heroKicker: get('tools-shared.landing.hero.kicker'),
          heroHeadline: get('tools-shared.landing.hero.headline'),
          heroSubtitle: get('tools-shared.landing.hero.subtitle'),
          sections,
          cards,
          filterChip: {
            all: get('tools-shared.landing.filterChip.all'),
            business: get('tools-shared.landing.filterChip.business'),
          },
        }}
      />
      <MinimalFooter
        taglineKey="landing-b2c.footer.tagline"
        navLinks={B2C_FOOTER_NAV}
        disclosureKeys={B2C_FOOTER_DISCLOSURES}
      />
    </PageI18nProvider>
  );
}
