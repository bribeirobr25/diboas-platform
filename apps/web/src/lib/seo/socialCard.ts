/**
 * Social-card (OpenGraph + Twitter) metadata helper.
 *
 * SEO-6: the OG art templates in `lib/og/templates` are render-ready and already
 * referenced by the sitemap's `images:` field, but several routes (every
 * `/tools/*`, the `/tools` landing, `/market`) never emitted them as page
 * `<head>` meta — so social crawlers (LinkedIn / X / WhatsApp / Facebook) got
 * cardless shares. This helper emits `openGraph.images` (1200×630) + a Twitter
 * `summary_large_image` card pointing at `/api/og/<ogKey>`, in one place.
 */

import type { Metadata } from 'next';
import type { OGPageType } from '@/lib/og';
import { SEO_DEFAULTS } from './constants';
import { getTwitterMeta } from './twitter';

export function socialCardMetadata(
  ogKey: OGPageType,
  title: string,
  description: string,
  locale: string
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = `${SEO_DEFAULTS.siteUrl}/api/og/${ogKey}`;
  return {
    openGraph: {
      title,
      description,
      type: 'website',
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: getTwitterMeta(title, description, image),
  };
}
