/**
 * Sitemap Generation
 * SEO Optimization: Dynamic sitemap for all pages
 * Performance: Cached and optimized for search engines
 */

import { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@diboas/i18n/server';
import { navigationConfig } from '@/config/navigation';
import { SEO_DEFAULTS, PAGE_SEO_CONFIG } from '@/lib/seo/constants';

// Extract all unique URLs from navigation config and static pages
function getAllUrls(): string[] {
  const urls = new Set<string>(['/']); // Home page

  // Add all navigation menu items
  navigationConfig.mainMenu.forEach(menu => {
    menu.subItems?.forEach(item => {
      if (item.href) {
        try {
          // Extract path from full URL
          const url = new URL(item.href);
          const path = url.pathname;
          if (path && path !== '/') {
            urls.add(path);
          }
        } catch {
          // Skip invalid URLs
        }
      }
    });
  });

  // Add mobile highlights
  navigationConfig.mobileHighlights.forEach(item => {
    if (item.href) {
      try {
        const url = new URL(item.href);
        const path = url.pathname;
        if (path && path !== '/') {
          urls.add(path);
        }
      } catch {
        // Skip invalid URLs
      }
    }
  });

  // Add all static pages from SEO config
  Object.keys(PAGE_SEO_CONFIG).forEach(pageKey => {
    if (pageKey !== 'home') {
      urls.add(`/${pageKey}`);
    }
  });

  return Array.from(urls);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SEO_DEFAULTS.siteUrl;
  const urls = getAllUrls();
  const currentDate = new Date();

  // Generate sitemap entries for each URL and locale
  const sitemapEntries: MetadataRoute.Sitemap = [];

  urls.forEach(url => {
    // For each URL, create entries for all locales
    SUPPORTED_LOCALES.forEach(locale => {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      const fullUrl = `${baseUrl}${localePath}${url}`.replace(/\/+/g, '/').replace(/\/$/, '');

      sitemapEntries.push({
        url: fullUrl,
        lastModified: currentDate,
        changeFrequency: url === '/' ? 'daily' : 'weekly',
        priority: url === '/' ? 1.0 : 0.8,
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