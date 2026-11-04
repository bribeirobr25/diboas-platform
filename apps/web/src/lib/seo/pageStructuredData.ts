/**
 * Service + breadcrumb structured data for a landing page, served in the page's locale
 * (register 5.643, step 2).
 *
 * One builder for every page that describes the diBoaS service, so the rules live once:
 * - the description comes from the page's own catalogue (`seo.jsonLd.serviceDescription`);
 * - the category, the "Home" crumb and the page crumb are existing catalogue strings
 *   (`common.seo.serviceCategory`, `landing-b2c.seo.jsonLd.breadcrumbHome`,
 *   `common.navigation.landing.*`);
 * - every English literal here is only a fallback for a missing key, and equals the en
 *   catalogue value it backs (`structuredDataGuards.test.ts`).
 */
import { loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from './metadata-factory';

/** English fallbacks; each equals its en catalogue value (guarded). */
export const STRUCTURED_DATA_FALLBACKS = {
  category: 'Financial technology',
  home: 'Home',
  crumbs: {
    about: 'About',
    forBusiness: 'For Business',
    protocols: 'Protocols',
    strategies: 'Strategies',
  },
} as const;

export type PageCrumb = keyof typeof STRUCTURED_DATA_FALLBACKS.crumbs;

export interface PageStructuredDataInput {
  /** The page's own `seo.jsonLd.serviceDescription`, as loaded (may be missing). */
  description: string | undefined;
  /** The en catalogue value of that key, used only when the key is missing. */
  descriptionFallback: string;
  /** The page's breadcrumb after Home; omitted on the landing page itself. */
  crumb?: { key: PageCrumb; url: string };
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export async function buildPageStructuredData(
  locale: SupportedLocale,
  input: PageStructuredDataInput
) {
  const [common, landing] = await Promise.all([
    loadMessages(locale, 'common'),
    loadMessages(locale, 'landing-b2c'),
  ]);

  const service = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: text(input.description) ?? input.descriptionFallback,
    category: text(common?.seo?.serviceCategory) ?? STRUCTURED_DATA_FALLBACKS.category,
  });

  const items: Array<{ name: string; url: string }> = [
    {
      name: text(landing?.seo?.jsonLd?.breadcrumbHome) ?? STRUCTURED_DATA_FALLBACKS.home,
      url: '/',
    },
  ];
  if (input.crumb) {
    items.push({
      name:
        text(common?.navigation?.landing?.[input.crumb.key]) ??
        STRUCTURED_DATA_FALLBACKS.crumbs[input.crumb.key],
      url: input.crumb.url,
    });
  }

  return { service, breadcrumbs: SEOMetadataFactory.generateBreadcrumbs(items, locale) };
}
