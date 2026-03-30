/**
 * Marketing Page Builder
 *
 * DRY Principle: Extracts the shared boilerplate from marketing pages.
 * Every marketing page follows the same pattern:
 *   1. Validate locale (notFound if invalid)
 *   2. Load page-specific + shared i18n namespaces
 *   3. Generate structured data (service + breadcrumbs)
 *   4. Generate metadata via generateStaticPageMetadata
 *
 * This helper centralises the non-JSX setup so each page.tsx only
 * defines its unique config and section composition.
 */

import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, SEOMetadataFactory } from '@/lib/seo';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

/** Breadcrumb entry for structured data generation */
export interface BreadcrumbEntry {
  name: string;
  url: string;
}

/** Service structured data configuration */
export interface ServiceDataConfig {
  name: string;
  description: string;
  category: string;
}

/** Full configuration for a marketing page */
export interface MarketingPageConfig {
  /** SEO page key passed to generateStaticPageMetadata (e.g., 'personal/banking') */
  seoPageKey: string;
  /** i18n namespaces to load — 'home' and 'faq' are always appended automatically */
  namespaces: string[];
  /** Service structured data for the page */
  service: ServiceDataConfig;
  /** Breadcrumb trail (Home is prepended automatically) */
  breadcrumbs: BreadcrumbEntry[];
}

/**
 * Generate Next.js Metadata for a marketing page.
 *
 * Usage in page.tsx:
 * ```ts
 * export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
 *   return buildMarketingMetadata(MY_CONFIG, params);
 * }
 * ```
 */
export async function buildMarketingMetadata(
  config: MarketingPageConfig,
  params: LocalePageProps['params']
): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata(
    config.seoPageKey as Parameters<typeof generateStaticPageMetadata>[0],
    locale as SupportedLocale
  );
}

/** The resolved data returned by prepareMarketingPage */
export interface MarketingPageData {
  locale: SupportedLocale;
  pageMessages: Record<string, string>;
  structuredData: object[];
}

/**
 * Prepare common marketing page data: validate locale, load i18n,
 * and generate structured data.
 *
 * Usage in page.tsx:
 * ```ts
 * export default async function MyPage({ params }: LocalePageProps) {
 *   const { locale, pageMessages, structuredData } = await prepareMarketingPage(MY_CONFIG, params);
 *   return (
 *     <PageI18nProvider pageMessages={pageMessages}>
 *       <>
 *         <StructuredData data={structuredData} />
 *         <main className="main-page-wrapper">...</main>
 *       </>
 *     </PageI18nProvider>
 *   );
 * }
 * ```
 */
export async function prepareMarketingPage(
  config: MarketingPageConfig,
  params: LocalePageProps['params']
): Promise<MarketingPageData> {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Always include 'home' and 'faq' for shared component namespaces (StickyFeaturesNav, FAQAccordion)
  const allNamespaces = [...new Set([...config.namespaces, 'home', 'faq'])];
  const pageMessages = await loadPageNamespaces(locale, allNamespaces);

  const serviceData = SEOMetadataFactory.generateServiceStructuredData(config.service);

  // Prepend Home breadcrumb if not already present
  const breadcrumbItems = config.breadcrumbs[0]?.url === '/'
    ? config.breadcrumbs
    : [{ name: 'Home', url: '/' }, ...config.breadcrumbs];

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(breadcrumbItems, locale);

  return {
    locale,
    pageMessages,
    structuredData: [serviceData, breadcrumbData],
  };
}
