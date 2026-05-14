import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { SEOMetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { PageI18nProvider } from '@/components/Providers';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { MinimalFooter } from '@/components/Layout/Footer/MinimalFooter';
import { Container } from '@/components/UI/Container';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { ROUTES } from '@/config/routes';
import { B2C_FOOTER_NAV, B2C_FOOTER_DISCLOSURES } from '@/config/landing-b2c';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';
import styles from './page.module.css';

export const dynamic = 'auto';

/**
 * `/market` (Adelaide Daily)
 *
 * Iteration 1 of `docs/audit/MARKET_INTEGRATION_PLAN_2026-05-13.md` — renames
 * the prior `/daily-market` placeholder, swaps inline styles for a CSS
 * Module + design tokens, replaces the raw `<a>` with `<LocaleLink>`, removes
 * the nested `<main>` (the `(landing)` layout already provides one), and
 * threads translation copy through the new `market` i18n namespace.
 *
 * Page-level title is intentionally BARE (no `| diBoaS` suffix). The root
 * `app/layout.tsx` exports `metadata.title.template = '%s | diBoaS'` which
 * auto-appends the brand. Including the suffix here would produce
 * `Adelaide Daily | diBoaS | diBoaS` in the rendered `<title>` (V4 audit
 * 2026-05-08 + NF1 rev-3 of the market integration plan).
 *
 * Indexability is gated by `NEXT_PUBLIC_MARKET_INDEXABLE` (defaults to
 * `false` during iterations 1-3 while content is placeholder / manually
 * curated; flipped to `true` in iteration 4 after calm-audit signoff).
 */
const MARKET_INDEXABLE = process.env.NEXT_PUBLIC_MARKET_INDEXABLE === 'true';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = isValidLocale(locale) ? (locale as SupportedLocale) : 'en';
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // Read the localized SEO copy from the `market` namespace. Server-side load
  // sidesteps the client-only `useTranslation` hook in this server component.
  const messages = await loadPageNamespaces(validLocale, ['market']);
  const title = messages['market.seo.title'] ?? 'Adelaide Daily';
  const description =
    messages['market.seo.description'] ??
    'Calm macro intelligence for Bitcoin. Understand the environment, not the next candle.';
  const ogTitle = messages['market.seo.ogTitle'] ?? title;
  const ogDescription = messages['market.seo.ogDescription'] ?? description;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
    },
    robots: MARKET_INDEXABLE
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: {
      canonical: `${siteUrl}/${validLocale}/market`,
    },
  };
}

export default async function MarketPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // `common` is loaded by the (landing) layout; `landing-b2c` is needed for
  // the footer's `landing-b2c.footer.*` keys; `market` is this page's own
  // namespace.
  const pageMessages = await loadPageNamespaces(locale, ['market', 'landing-b2c']);

  const breadcrumbData = SEOMetadataFactory.generateBreadcrumbs(
    [
      { name: 'Home', url: '/' },
      { name: pageMessages['market.hero.title'] ?? 'Adelaide Daily', url: ROUTES.MARKET },
    ],
    locale,
  );

  // Resolve translated copy directly from the namespace dictionary. Iteration
  // 2 will introduce client SDK components that consume the same namespace via
  // `useTranslation`; the `<PageI18nProvider>` below is in place so those work
  // when they ship.
  const comingSoonTitle = pageMessages['market.comingSoon.title'] ?? 'Coming soon.';
  const comingSoonBody =
    pageMessages['market.comingSoon.body'] ??
    'Adelaide Daily is being built. It will help you understand the Bitcoin macro environment without the noise.';
  const backHomeLabel = pageMessages['market.comingSoon.backHome'] ?? 'Back to Home';

  return (
    <PageI18nProvider pageMessages={pageMessages}>
      <StructuredData data={[breadcrumbData]} />

      <div className="main-page-wrapper">
        <SectionErrorBoundary
          sectionId="market-coming-soon"
          sectionType="placeholder"
          enableReporting
          context={{ page: 'market' }}
        >
          <Container size="sm">
            <section className={styles.comingSoonSection}>
              <h1 className={styles.comingSoonTitle}>{comingSoonTitle}</h1>
              <p className={styles.comingSoonBody}>{comingSoonBody}</p>
              <LocaleLink
                href={ROUTES.HOME}
                prefetch={false}
                className={styles.backHomeLink}
              >
                {backHomeLabel}
              </LocaleLink>
            </section>
          </Container>
        </SectionErrorBoundary>

        <MinimalFooter navLinks={B2C_FOOTER_NAV} disclosureKeys={B2C_FOOTER_DISCLOSURES} />
      </div>
    </PageI18nProvider>
  );
}
