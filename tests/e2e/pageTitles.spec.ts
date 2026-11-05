/**
 * Register 5.787 · a page's <title> names the brand once. The root layout's template appends
 * "| diBoaS" to every page title; catalogue titles that ended in "| diBoaS" (strategies,
 * protocols, security, help) rendered "… | diBoaS | diBoaS", and the home page, whose title
 * leads with the brand, rendered "diBoaS | … | diBoaS" (found 2026-11-05 while applying 5.775).
 * Reads the SERVED title, the place the defect shows, for every landing route × locale.
 */
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
  '/tools',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
  '/email-preferences',
] as const;

for (const locale of LOCALES) {
  test(`should name the brand once in every page title when /${locale} pages are served`, async ({
    request,
  }) => {
    // The defect: the brand twice in a row at the end, or at both ends (the template adds the last).
    for (const route of ROUTES) {
      const res = await request.get(`/${locale}${route}`);
      expect(res.status(), `/${locale}${route}`).toBe(200);
      const title = (await res.text()).match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      expect(title, `/${locale}${route}`).not.toBe('');
      expect(title, `/${locale}${route}`).not.toMatch(/diBoaS\s*\|\s*diBoaS\s*$/);
      expect(title, `/${locale}${route}`).not.toMatch(/^diBoaS\s*\|.*\|\s*diBoaS$/);
    }
  });
}
