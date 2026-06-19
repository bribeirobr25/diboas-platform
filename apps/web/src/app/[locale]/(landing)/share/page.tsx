/**
 * Share Redirect Page
 *
 * This page serves as a landing page for shared content with dynamic OG images.
 * When social platforms crawl the shared URL, they get personalized OG metadata.
 * Users who click through are redirected to the main landing page.
 *
 * Usage:
 * - Waitlist: /share?type=waitlist&position=247&name=John
 * - Calculator: /share?type=calculator&amount=125000&years=10&strategy=balanced
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSafeLocale, loadMessages } from '@diboas/i18n/server';

interface SharePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    position?: string;
    name?: string;
    amount?: string;
    years?: string;
    strategy?: string;
    initial?: string;
    tool?: string;
    value?: string;
    currency?: string;
  }>;
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
  calculator: OgStrings;
  toolResult: ToolResultOg;
  default: OgStrings;
}

/**
 * Format a tool-result value for the social-preview title in the holder's
 * locale currency (compact). Mirrors the OG image formatter so the card and the
 * link preview agree. Falls back to a plain integer on an unexpected currency.
 */
function formatToolResultValue(value: number, currency: string, locale: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) return value.toLocaleString();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
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
  const search = await searchParams;
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
      title,
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

  if (type === 'calculator') {
    const amount = parseInt(search.amount || '0', 10);
    const years = search.years || '10';
    const strategy = search.strategy;
    const initial = search.initial;

    ogParams.set('amount', amount.toString());
    ogParams.set('years', years);
    ogParams.set('locale', locale);
    if (strategy) {
      ogParams.set('strategy', strategy);
    }
    if (initial) {
      ogParams.set('initial', initial);
    }

    const formattedAmount =
      amount >= 1000000
        ? `$${(amount / 1000000).toFixed(1)}M`
        : amount >= 1000
          ? `$${(amount / 1000).toFixed(0)}K`
          : `$${amount.toLocaleString()}`;

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    const title = fillSlot(og.calculator.title, '{formattedAmount}', formattedAmount);
    const description = fillSlot(og.calculator.description, '{years}', years);

    return {
      title,
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

  if (type === 'tool-result') {
    const tool = search.tool || '';
    const value = parseInt(search.value || '0', 10);
    const currency = (search.currency || 'USD').toUpperCase();
    const years = search.years;

    ogParams.set('tool', tool);
    ogParams.set('value', String(Number.isFinite(value) ? value : 0));
    ogParams.set('currency', currency);
    ogParams.set('locale', locale);
    if (years) {
      ogParams.set('years', years);
    }

    const formattedValue = formatToolResultValue(
      Number.isFinite(value) ? value : 0,
      currency,
      locale
    );

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    // Per-tool title override keeps each tool honest (e.g. asset-history is
    // historical, not a diBoaS yield claim); yield tools fall back to default.
    const titleTemplate = og.toolResult.titleByTool?.[tool] ?? og.toolResult.title;
    const title = fillSlot(titleTemplate, '{value}', formattedValue);
    const description = og.toolResult.description;

    return {
      title,
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
    title,
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
