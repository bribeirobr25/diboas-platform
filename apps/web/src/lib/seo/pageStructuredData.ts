/**
 * Service + breadcrumb structured data for the pages that describe the diBoaS service, served
 * in the page's locale (registers 5.643 and its audit follow-up).
 *
 * The page is named by KEY, and the builder loads that page's own catalogue itself, so a page
 * cannot pass the wrong description: the registry below is the only place that says which
 * namespace describes which page. Every string comes from a catalogue:
 * - description: `<namespace>.seo.jsonLd.serviceDescription`;
 * - category: `common.seo.serviceCategory`;
 * - crumbs: `landing-b2c.seo.jsonLd.breadcrumbHome` and `common.navigation.landing.<crumb>`.
 * English literals are only fallbacks for a missing key and equal their en values
 * (`structuredDataGuards.test.ts`). No `areaServed`, no `Offer`: the factory emits neither.
 */
import { loadMessages, type SupportedLocale } from '@diboas/i18n/server';
import { ROUTES } from '@/config/routes';
import { SEOMetadataFactory } from './metadata-factory';

type CrumbKey = 'about' | 'forBusiness' | 'protocols' | 'strategies';

/** Which catalogue describes each service page, its crumb, and the en fallback (= en value). */
export const SERVICE_PAGES = {
  landing: {
    namespace: 'landing-b2c',
    crumb: null,
    fallback:
      'Goal-driven wealth building powered by the digital dollar. Your money, your wallet, your control.',
  },
  about: {
    namespace: 'landing-b2c',
    crumb: { key: 'about', url: ROUTES.ABOUT },
    fallback:
      'Goal-driven wealth building powered by the digital dollar. Your money, your wallet, your control.',
  },
  business: {
    namespace: 'landing-b2b',
    crumb: { key: 'forBusiness', url: '/business' },
    fallback:
      'Separate business cash by purpose, see digital-dollar paths, and understand cost and risk before funds move.',
  },
  protocols: {
    namespace: 'protocols',
    crumb: { key: 'protocols', url: '/protocols' },
    fallback:
      "The decentralized finance protocols diBoaS has researched, with each one's audits and track record, and the ones its strategies use today.",
  },
  strategies: {
    namespace: 'strategies',
    crumb: { key: 'strategies', url: '/strategies' },
    fallback:
      '10 strategies, from conservative to growth-focused, for different goals and timelines.',
  },
} as const satisfies Record<
  string,
  { namespace: string; crumb: { key: CrumbKey; url: string } | null; fallback: string }
>;

export type ServicePage = keyof typeof SERVICE_PAGES;

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
} as const satisfies { category: string; home: string; crumbs: Record<CrumbKey, string> };

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export async function buildServiceStructuredData(page: ServicePage, locale: SupportedLocale) {
  const spec = SERVICE_PAGES[page];
  const [own, common, landing] = await Promise.all([
    loadMessages(locale, spec.namespace),
    loadMessages(locale, 'common'),
    loadMessages(locale, 'landing-b2c'),
  ]);

  const service = SEOMetadataFactory.generateServiceStructuredData({
    name: 'diBoaS',
    description: text(own?.seo?.jsonLd?.serviceDescription) ?? spec.fallback,
    category: text(common?.seo?.serviceCategory) ?? STRUCTURED_DATA_FALLBACKS.category,
  });

  const items: Array<{ name: string; url: string }> = [
    {
      name: text(landing?.seo?.jsonLd?.breadcrumbHome) ?? STRUCTURED_DATA_FALLBACKS.home,
      url: '/',
    },
  ];
  if (spec.crumb) {
    items.push({
      name:
        text(common?.navigation?.landing?.[spec.crumb.key]) ??
        STRUCTURED_DATA_FALLBACKS.crumbs[spec.crumb.key],
      url: spec.crumb.url,
    });
  }

  return { service, breadcrumbs: SEOMetadataFactory.generateBreadcrumbs(items, locale) };
}
