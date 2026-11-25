/**
 * TOOLS-PAYLOAD-1 (C2-S G4, finding 13) · a tools page's HTML carries no monthly series.
 *
 * The tools layout used to serialize the whole snapshot, monthly price, FX and inflation rows
 * included, into every tools page: about 400 KB of HTML (80 KB gzipped) per page, measured
 * 2026-11-25. The browser computes every offered figure from the calibrated constants, and
 * asset history loads the series through its own lazy chunk. Reads the SERVED HTML, where the
 * defect showed, on every tools route in four locales.
 */
import { test, expect } from '@playwright/test';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const TOOLS = [
  '',
  '/compound-interest',
  '/retirement',
  '/goal-savings',
  '/emergency-fund',
  '/time-to-target',
  '/asset-history',
  '/inflation-impact',
  '/currency-depreciation',
  '/card-fees',
  '/idle-cash',
  '/money-jobs',
] as const;

/** The series as a JSON key (escaped inside the RSC payload); a prose mention is not it. */
const SERIES_KEY = /\\?"monthlySeries\\?"\s*:/;
/** After the fix the largest page measured 153 KB; with the series back, every page exceeds 395 KB. */
const HTML_BUDGET_BYTES = 200_000;

for (const locale of LOCALES) {
  test(`should serve /${locale} tools pages without the monthly series`, async ({ request }) => {
    for (const tool of TOOLS) {
      const url = `/${locale}/tools${tool}`;
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      const html = await res.text();
      expect(SERIES_KEY.test(html), `${url} carries the monthly series`).toBe(false);
      expect(Buffer.byteLength(html), `${url} HTML bytes`).toBeLessThan(HTML_BUDGET_BYTES);
    }
  });
}
