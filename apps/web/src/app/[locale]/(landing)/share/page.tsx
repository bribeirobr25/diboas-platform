/**
 * Share Redirect Page
 *
 * This page serves as a landing page for shared content with dynamic OG images.
 * When social platforms crawl the shared URL, they get personalized OG metadata.
 * Users who click through are redirected to the main landing page.
 *
 * Usage:
 * - Waitlist: /share?type=waitlist&position=247&name=John
 * - Money Tools result: /share?type=tool-result&tool=…&value=…&currency=…
 * The Dream Mode calculator card was retired with Dream Mode (plan P13 PR-2): a
 * `type=calculator` link gets the default metadata, as the OG route gives it the default card.
 */

import { redirect } from 'next/navigation';
import { formatResultCurrency, isValidToolResultValue } from '@/app/api/og/share/ogUtils';
import { SHAREABLE_TOOL_KEYS } from '@/app/api/og/share/ogTypes';
import type { Metadata } from 'next';
import { getSafeLocale, loadMessages } from '@diboas/i18n/server';
import { pageTitle } from '@/lib/seo/pageTitle';

type ShareParam = 'type' | 'position' | 'name' | 'years' | 'tool' | 'value' | 'currency' | 'tone';

interface SharePageProps {
  params: Promise<{ locale: string }>;
  /** A parameter given twice arrives as an array (`?currency=usd&currency=eur`). */
  searchParams: Promise<Partial<Record<ShareParam, string | string[]>>>;
}

/**
 * Each parameter's first value, as the image route reads them (`searchParams.get`). Reading an
 * array as a string threw in the metadata step and the link lost its preview (register `5.1025`).
 */
function firstValues(
  raw: Partial<Record<ShareParam, string | string[]>>
): Partial<Record<ShareParam, string>> {
  const out: Partial<Record<ShareParam, string>> = {};
  for (const [k, v] of Object.entries(raw) as Array<[ShareParam, string | string[] | undefined]>) {
    const first = Array.isArray(v) ? v[0] : v;
    if (typeof first === 'string') out[k] = first;
  }
  return out;
}

interface OgStrings {
  title: string;
  description: string;
}

interface ToolResultOg extends OgStrings {
  /** Per-tool title overrides (yield tools use the default `title`). */
  titleByTool?: Record<string, string>;
}

interface ShareOg {
  waitlist: OgStrings;
  toolResult: ToolResultOg;
  default: OgStrings;
}

/**
 * Substitute a single `{slot}` token. Uses a replacer FUNCTION so a `$` in the
 * value (e.g. a `$1.2M` formatted amount, or a user-supplied query param) is
 * never interpreted as a regex replacement pattern.
 */
function fillSlot(template: string, slot: string, value: string): string {
  return template.replace(slot, () => value);
}

/**
 * Generate dynamic metadata based on share type
 */
export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const { locale } = await params;
  const search = firstValues(await searchParams);
  const type = search.type || 'default';

  // SEO-2: the OG image (`/api/og/*`) and `og:url` resolve on the MARKETING
  // host — `/api/og/*` are marketing-site routes and `share` redirects to the
  // marketing root. Using the app host would 404 the share cards for crawlers.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com';

  // I-2: OG copy is externalised to `share.json` (all 4 locales, incl. the
  // previously English-only default). generateMetadata is server-side, so we
  // load the namespace via the RSC loader and fill ICU slots by hand.
  const og = ((await loadMessages(getSafeLocale(locale), 'share')).og ?? {}) as ShareOg;

  // Build OG image URL
  const ogParams = new URLSearchParams();
  ogParams.set('type', type);

  if (type === 'waitlist') {
    const rawPosition = parseInt(search.position || '1', 10);
    const position = String(Number.isFinite(rawPosition) && rawPosition > 0 ? rawPosition : 1);
    const name = search.name;

    ogParams.set('position', position);
    ogParams.set('locale', locale);
    if (name) {
      ogParams.set('name', name);
    }

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    const title = fillSlot(og.waitlist.title, '{position}', position);
    const description = og.waitlist.description;

    return {
      title: pageTitle(title),
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/${locale}/share?${ogParams.toString()}`,
        siteName: 'diBoaS',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }

  const tool = search.tool || '';
  const rawValue = parseInt(search.value || '0', 10);
  // The image route's own guards (allowlisted tool, value in range): a link that fails them gets
  // the default metadata, as the route draws the default card. Before P13 PR-2 an invalid value
  // was clamped to 0 here and the preview title stated a zero amount above a default card
  // (register `5.1024`).
  if (
    type === 'tool-result' &&
    (SHAREABLE_TOOL_KEYS as readonly string[]).includes(tool) &&
    isValidToolResultValue(rawValue)
  ) {
    const value = rawValue;
    const currency = (search.currency || 'USD').toUpperCase();
    const years = search.years;
    const tone = search.tone === 'negative' || search.tone === 'neutral' ? search.tone : undefined;

    ogParams.set('tool', tool);
    ogParams.set('value', String(value));
    ogParams.set('currency', currency);
    ogParams.set('locale', locale);
    if (years) {
      ogParams.set('years', years);
    }
    if (tone) {
      ogParams.set('tone', tone);
    }

    const formattedValue = formatResultCurrency(value, currency, locale);

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    // Per-tool title override keeps each tool honest (e.g. asset-history is
    // historical, not a diBoaS yield claim); yield tools fall back to default.
    // Null-safe: if the `share` namespace fails to load / omits `toolResult`,
    // fall back to the default OG instead of throwing inside generateMetadata
    // (an uncaught throw here surfaces as a 500 to the crawler).
    const titleTemplate =
      og.toolResult?.titleByTool?.[tool] ?? og.toolResult?.title ?? og.default?.title ?? 'diBoaS';
    const title = fillSlot(titleTemplate, '{value}', formattedValue);
    const description = og.toolResult?.description ?? og.default?.description ?? '';

    return {
      title: pageTitle(title),
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/${locale}/share?${ogParams.toString()}`,
        siteName: 'diBoaS',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }

  // Default metadata (I-2: was English-only for every locale; now localised)
  const title = og.default.title;
  const description = og.default.description;
  return {
    title: pageTitle(title),
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/${locale}`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/default`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

/**
 * Share page component
 * Redirects to the main landing page after metadata is served
 */
export default async function SharePage({ params }: SharePageProps) {
  const { locale } = await params;

  // Redirect to main landing page
  // Note: The redirect happens after metadata generation,
  // so social crawlers will still get the OG metadata
  redirect(`/${locale}`);
}
