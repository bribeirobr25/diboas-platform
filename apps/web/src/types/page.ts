/**
 * Shared page props types for Next.js App Router pages.
 * DRY: Single source of truth for locale page params.
 */

/**
 * Standard props for pages under the [locale] dynamic route.
 * Use this instead of defining a per-page interface with `params: Promise<{ locale: string }>`.
 */
export interface LocalePageProps {
  params: Promise<{ locale: string }>;
}
