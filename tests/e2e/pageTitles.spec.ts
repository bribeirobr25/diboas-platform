/**
 * Register 5.787 · a page's <title> names the brand exactly once. The root layout's template
 * appends "| diBoaS" to every page title; a title that already names the brand is passed as
 * absolute by `lib/seo/pageTitle.ts`. Before the fix, catalogue titles ending in "| diBoaS",
 * titles leading with the brand (home, business), "About diBoaS | …", "Interactive Demo -
 * diBoaS" and the share titles all rendered the brand twice (found 2026-11-05; the sixth
 * audit showed the first version of this guard, two fixed shapes, missed most of them).
 * Reads the SERVED title — where the defect shows — on every landing route × locale.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'de', 'es', 'pt-BR'] as const;
const ROUTES = [
  '',
  '/about',
  '/business',
  '/protocols',
  '/strategies',
  '/security',
  '/help',
  '/learn',
  '/learn/compound-interest',
  '/tools',
  '/tools/money-jobs',
  '/tools/idle-cash',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
  '/email-preferences',
  '/demo',
  '/dream-mode',
  '/delete-confirm',
  '/market',
  '/share',
  '/share?type=waitlist&position=5',
  '/share?type=tool-result&tool=money-jobs&value=1200',
] as const;

for (const locale of LOCALES) {
  test(`should name the brand exactly once in every page title when /${locale} pages are served`, async ({
    request,
  }) => {
    for (const route of ROUTES) {
      const url = `/${locale}${route}`;
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      const title = (await res.text()).match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      expect(title.match(/diBoaS/g)?.length ?? 0, `${url}: "${title}"`).toBe(1);
    }
  });
}

/**
 * Register 5.793 · the utility pages' titles are in the visitor's language: demo, email
 * preferences and delete-confirm were English in every locale until 2026-11-06.
 */
const TRANSLATIONS = path.resolve(__dirname, '../../packages/i18n/translations');
const read = (locale: string, ns: string) =>
  JSON.parse(fs.readFileSync(path.join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));

for (const locale of LOCALES) {
  test(`should title the utility pages from the catalogue when /${locale} is served`, async ({
    request,
  }) => {
    const expected: Record<string, string> = {
      '/demo': read(locale, 'preDemo').meta.title,
      '/email-preferences': `${read(locale, 'common').emailPreferences.heading} | diBoaS`,
      '/delete-confirm': `${read(locale, 'waitlist').deletion.confirmTitle} | diBoaS`,
      '/dream-mode': 'Dream Mode | diBoaS',
    };
    for (const [route, title] of Object.entries(expected)) {
      const html = await (await request.get(`/${locale}${route}`)).text();
      const served = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      expect(served.replace(/&amp;/g, '&'), `/${locale}${route}`).toBe(title);
    }
  });
}
