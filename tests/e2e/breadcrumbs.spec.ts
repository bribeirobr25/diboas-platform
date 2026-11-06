/**
 * Register 5.766 · breadcrumb structured data names its crumbs from the catalogues in every
 * locale — /help, /security, /legal/* and /learn used English literals ("Home", "Help",
 * "Terms of Use") on every locale until 2026-11-06 (the service pages were fixed in 5.643).
 * Reads the SERVED JSON-LD: every crumb name equals its catalogue value.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const TRANSLATIONS = path.resolve(__dirname, '../../packages/i18n/translations');
const LOCALES = ['en', 'de', 'es', 'pt-BR'] as const;
const read = (locale: string, ns: string) =>
  JSON.parse(fs.readFileSync(path.join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));

/** route → the crumb names it must serve, from the catalogues. */
function expected(locale: string): Record<string, string[]> {
  const home = read(locale, 'landing-b2c').seo.jsonLd.breadcrumbHome as string;
  const learn = read(locale, 'learn').nav as { home: string; label: string };
  return {
    '/help': [home, read(locale, 'landing-help').seo.title],
    '/security': [home, read(locale, 'security').seo.title],
    '/legal/terms': [home, read(locale, 'legal/terms').seo.title],
    '/legal/privacy': [home, read(locale, 'legal/privacy').seo.title],
    '/legal/cookies': [home, read(locale, 'legal/cookies').seo.title],
    '/learn': [learn.home, learn.label],
  };
}

for (const locale of LOCALES) {
  for (const [route, names] of Object.entries(expected(locale))) {
    test(`should serve catalogue crumb names when /${locale}${route} is crawled`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${route}`);
      const objects = await page.evaluate(() =>
        [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
          const parsed = JSON.parse(s.textContent ?? 'null');
          return Array.isArray(parsed) ? parsed : [parsed];
        })
      );
      const crumbs = objects.find((o) => o?.['@type'] === 'BreadcrumbList');
      expect(crumbs, 'a BreadcrumbList is served').toBeTruthy();
      expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(names);
    });
  }
}
