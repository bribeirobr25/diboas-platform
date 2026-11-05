/**
 * Registers 5.643 / 5.748 (fourth audit, 2026-11-05) · the structured data each service page
 * SERVES, read from the production HTML: the Service description is the page's own catalogue
 * value in the page's locale, and no Service or app object carries `areaServed`, `Offer` or
 * `offers`, a return promise, or a start figure. A unit test cannot see a page that alters the
 * built object after the builder; this reads what a search engine reads.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const TRANSLATIONS = path.resolve(__dirname, '../../packages/i18n/translations');
const LOCALES = ['en', 'de', 'es', 'pt-BR'] as const;
const PAGES: ReadonlyArray<readonly [string, string]> = [
  ['', 'landing-b2c'],
  ['/about', 'landing-b2c'],
  ['/business', 'landing-b2b'],
  ['/protocols', 'protocols'],
  ['/strategies', 'strategies'],
];

function serviceDescription(locale: string, ns: string): string {
  const json = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));
  return json.seo.jsonLd.serviceDescription;
}

for (const locale of LOCALES) {
  for (const [route, ns] of PAGES) {
    test(`should serve its own catalogue description and no offer when /${locale}${route} is crawled`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${route}`);
      const objects = await page.evaluate(() =>
        [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
          const parsed = JSON.parse(s.textContent ?? 'null');
          return Array.isArray(parsed) ? parsed : [parsed];
        })
      );
      const service = objects.find((o) => o?.['@type'] === 'Service');
      expect(service, 'a Service object is served').toBeTruthy();
      expect(service.description).toBe(serviceDescription(locale, ns));
      const served = JSON.stringify(objects.filter((o) => o?.['@type'] !== 'FAQPage'));
      expect(served).not.toMatch(/areaServed|"Offer"|OfferCatalog|"offers"/);
      expect(served).not.toMatch(/institutional|\$5\b|\b5 €|R\$10\b/i);
    });
  }
}
