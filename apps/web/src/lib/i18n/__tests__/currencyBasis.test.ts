/**
 * CURRENCY-BASIS-1 · the currency tool names the basis of its 10% scenario, and never calls it the
 * strategy's history (market clean-up W-D2, register `5.931`; D8; spec v6 §1.1, §1.3).
 *
 * - The card's note ×4 says the figure is a scenario based on the long-run S&P 500 total return
 *   (1928-2024); the search descriptions ×4 name the S&P 500.
 * - No note, description or chart sentence ×4 says "the strategy's historical return" (in any
 *   locale's form) or names a stablecoin (the GENIUS wall's own pattern).
 * - The sentence is true only of 10: the scenario constant is pinned.
 * - The constants file's header comment names the same basis (read raw: `stripComments` would
 *   delete what is checked).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT } from '@/lib/currency-depreciation/calculator';

const ROOT = join(__dirname, '../../../../../..');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const STABLE = new RegExp(
  `(?:${(JSON.parse(readFileSync(join(ROOT, 'config/genius-wall-patterns.json'), 'utf8')) as { stable: string }).stable})`,
  'i'
);
/** The wall's normaliser: look-alike spaces and dashes (the en-dash in 1928–2024 becomes "-"). */
const normalise = (s: string): string =>
  s
    .normalize('NFC')
    .replace(/[\u00A0\u202F\u2007]/g, ' ')
    .replace(/[\u2010\u2011\u2012\u2013]/g, '-');

const catalogue = (locale: string) =>
  JSON.parse(
    readFileSync(
      join(ROOT, 'packages/i18n/translations', locale, 'tools-currency-depreciation.json'),
      'utf8'
    )
  ) as {
    output: { diboasNote: string };
    seo: { description: string };
    resultMoment: { chartAria: string; chartAriaUsd: string };
  };

/** "the strategy's historical return" in each locale's form (the text before W-D2). */
const OLD_BASIS =
  /strategy's historical return|retorno histórico|rentabilidad histórica|historische Rendite/i;
const SCENARIO = { en: /scenario/i, 'pt-BR': /cenário/i, es: /escenario/i, de: /Szenario/i };

describe('CURRENCY-BASIS-1: the 10% scenario names its basis', () => {
  it.each(LOCALES)(
    'should call the note a scenario based on the S&P 500 1928-2024 (%s)',
    (locale) => {
      const note = normalise(catalogue(locale).output.diboasNote);
      expect(note).toMatch(/S&P 500/);
      expect(note).toMatch(/1928-2024/);
      expect(note).toMatch(SCENARIO[locale]);
    }
  );

  it.each(LOCALES)('should name the S&P 500 in the search description (%s)', (locale) => {
    expect(catalogue(locale).seo.description).toMatch(/S&P 500/);
  });

  it.each(LOCALES)(
    "should never call it the strategy's history, nor name a stablecoin (%s)",
    (locale) => {
      const c = catalogue(locale);
      for (const text of [
        c.output.diboasNote,
        c.seo.description,
        c.resultMoment.chartAria,
        c.resultMoment.chartAriaUsd,
      ]) {
        expect(normalise(text), text).not.toMatch(OLD_BASIS);
        expect(normalise(text), text).not.toMatch(STABLE);
      }
    }
  );

  it('should hold the scenario at 10, the figure the sentence is true of', () => {
    expect(CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT).toBe(10);
  });

  it("should name the same basis in the constants file's header comment", () => {
    const src = readFileSync(join(ROOT, 'apps/web/src/lib/market-data/constants.ts'), 'utf8');
    const header = src.slice(0, src.search(/^import\b/m));
    expect(header).toMatch(/S&P 500/);
    expect(header).toMatch(/1928/);
  });
});
