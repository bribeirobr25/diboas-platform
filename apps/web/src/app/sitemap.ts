/**
 * Sitemap Generation
 * SEO Optimization: Dynamic sitemap for all pages
 * Performance: Cached and optimized for search engines
 *
 * Marketing pages removed 2026-04-04. URLs now derived from PAGE_SEO_CONFIG
 * (which tracks only pages that actually exist in the (landing) route group).
 */

import { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@diboas/i18n/server';
import { SEO_DEFAULTS, PAGE_SEO_CONFIG } from '@/lib/seo/constants';

const NOINDEX_PAGES = new Set(['demo', 'dream-mode', 'daily-market', 'share']);

const PAGE_PRIORITIES: Record<string, number> = {
  '/': 1.0,
  '/business': 0.9,
  '/strategies': 0.9,
  '/about': 0.8,
  '/protocols': 0.8,
  '/help': 0.7,
  '/security': 0.7,
  '/legal/terms': 0.3,
  '/legal/privacy': 0.3,
  '/legal/cookies': 0.3,
};

function getAllUrls(): string[] {
  const urls: string[] = ['/'];

  Object.keys(PAGE_SEO_CONFIG).forEach(pageKey => {
    if (pageKey !== 'home' && !NOINDEX_PAGES.has(pageKey)) {
      urls.push(`/${pageKey}`);
    }
  });

  return urls;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO_DEFAULTS.siteUrl;
  const urls = getAllUrls();
  const currentDate = new Date();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  urls.forEach(url => {
    SUPPORTED_LOCALES.forEach(locale => {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      const fullUrl = `${baseUrl}${localePath}${url}`.replace(/\/+/g, '/').replace(/\/$/, '');

      sitemapEntries.push({
        url: fullUrl,
        lastModified: currentDate,
        changeFrequency: url === '/' ? 'daily' : 'weekly',
        priority: PAGE_PRIORITIES[url] ?? 0.5,
        alternates: {
          languages: SUPPORTED_LOCALES.reduce((acc, lang) => {
            const langPath = lang === 'en' ? '' : `/${lang}`;
            acc[lang] = `${baseUrl}${langPath}${url}`.replace(/\/+/g, '/').replace(/\/$/, '');
            return acc;
          }, {} as Record<string, string>)
        }
      });
    });
  });

  return sitemapEntries;
}
