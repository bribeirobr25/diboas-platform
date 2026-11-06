import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createIntl } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { flattenMessages } from '@diboas/i18n/server';
import { formatPercent } from '@diboas/format';
import { calculateLumpSum, calculateMonthlyContributions } from '@/lib/market-data/formulas/core';
import {
  SCENARIO_COPY_EXAMPLES,
  SCENARIO_COPY_SLOTS,
  fillScenarioCopy,
  scenarioCopyValues,
} from '../scenarioCopy';
import { SCENARIO_RATES } from '../scenarios';

/**
 * ⚙ THE COPY FOLLOWS THE ONE CONSTANT (register 5.730).
 *
 * Until now ~14 keys ×4 typed the scenario figures while the calculators read `SCENARIO_RATES`, so a
 * rate change would leave the copy stating the old figures. The catalogues now hold
 * `{scenario…}` slots, filled from the constant by the page loader. These tests vary the constant
 * (6/9/13) and assert the RENDERED text follows — values, not flags.
 */

function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, 'packages/i18n/translations'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not locate the repository root');
}
const ROOT = repoRoot();
const T = join(ROOT, 'packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

function catalogue(locale: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const f = join(dir, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (e.endsWith('.json'))
        Object.assign(
          out,
          flattenMessages(
            JSON.parse(readFileSync(f, 'utf8')),
            relative(join(T, locale), f).replace(/\.json$/, '')
          )
        );
    }
  };
  walk(join(T, locale));
  return out;
}

/** Every key that states a scenario rate or a figure derived from one (design review §4). */
const AFFECTED = [
  'learn-compound-interest.beat1.body.2',
  'learn-compound-interest.beat2.vignettesIntro',
  'learn-compound-interest.beat2.vignettesDisclaimer',
  'learn-compound-interest.calculator.calibrationNote',
  'learn-compound-interest.calculator.outputConservative',
  'learn-compound-interest.calculator.outputHistorical',
  'learn-compound-interest.calculator.outputOptimistic',
  'learn-compound-interest.quiz.q2.question',
  'learn-compound-interest.quiz.q2.options.0',
  'learn-ten-percent.beat3.intro.1',
  'tools-shared.scenarios.conservative',
  'tools-shared.scenarios.historical',
  'tools-shared.scenarios.optimistic',
  'tools-currency-depreciation.seo.description',
];

const OTHER = { conservative: 6, historical: 9, optimistic: 13 } as const;

describe('5.730 · the scenario copy follows the one constant', () => {
  it('should state today exactly what the catalogues stated before (copy identity)', () => {
    expect(scenarioCopyValues('en')).toEqual({
      scenarioConservative: '7%',
      scenarioHistorical: '10%',
      scenarioOptimistic: '14%',
      scenarioLumpSumResult: '$2,252',
      scenarioMonthlyResult: '$66,000',
    });
    expect(scenarioCopyValues('pt-BR').scenarioLumpSumResult).toBe('R$ 2.252');
    expect(scenarioCopyValues('pt-BR').scenarioMonthlyResult).toBe('R$ 66.000');
    for (const l of ['es', 'de']) {
      expect(scenarioCopyValues(l).scenarioLumpSumResult).toBe('2.252 €');
      expect(scenarioCopyValues(l).scenarioMonthlyResult).toBe('66.000 €');
    }
  });

  it('should compute the derived figures with the calculators’ formulas at any rate', () => {
    const r = OTHER.conservative / 100;
    const { lumpSum, monthly } = SCENARIO_COPY_EXAMPLES;
    const lump = Math.round(calculateLumpSum(lumpSum.principal, r, 0, lumpSum.years).nominalFV);
    const paid = calculateMonthlyContributions(monthly.payment, r, 0, monthly.months).nominalFV;
    const v = scenarioCopyValues('en', OTHER);
    expect(v.scenarioConservative).toBe(formatPercent(0.06, 'en'));
    expect(v.scenarioLumpSumResult).toBe(`$${lump.toLocaleString('en')}`);
    expect(v.scenarioMonthlyResult).toBe(
      `$${(Math.round(paid / 1000) * 1000).toLocaleString('en')}`
    );
    expect(v.scenarioLumpSumResult).not.toBe('$2,252');
  });

  it.each(LOCALES)(
    'should render every affected key with the constant’s figures when it changes (%s)',
    (locale) => {
      const raw = catalogue(locale);
      const filled = fillScenarioCopy(raw, locale, OTHER);
      const values = scenarioCopyValues(locale, OTHER);
      const intl = createIntl({ locale, messages: filled, onError: () => {} });
      for (const id of AFFECTED) {
        const slots = raw[id].match(/\{scenario\w+\}/g) ?? [];
        expect(slots.length, `${locale} ${id} holds no scenario slot`).toBeGreaterThan(0);
        const text = intl.formatMessage({ id });
        expect(text, `${locale} ${id}`).not.toContain('{');
        for (const s of slots) {
          const slot = s.slice(1, -1) as keyof typeof values;
          expect(text, `${locale} ${id} → ${slot}`).toContain(values[slot]);
        }
      }
    }
  );

  it.each(LOCALES)('should hold scenario slots in the affected keys only (%s)', (locale) => {
    const raw = catalogue(locale);
    const holders = Object.keys(raw).filter((id) => /\{scenario/.test(raw[id]));
    expect(holders.sort()).toEqual([...AFFECTED].sort());
    // Every slot is one the loader fills, as a plain `{name}` (a `{name, number}` would leak).
    for (const id of holders)
      for (const m of raw[id].matchAll(/\{(scenario[^}]*)\}/g))
        expect(SCENARIO_COPY_SLOTS as readonly string[], `${locale} ${id}`).toContain(m[1]);
  });

  it('should fill values that are plain text for ICU (no braces, apostrophes or #)', () => {
    for (const l of LOCALES)
      for (const v of Object.values(scenarioCopyValues(l))) expect(v).toMatch(/^[^{}'#]+$/);
  });

  /** Scenario words per locale, as the copy names the three scenarios and the careful rate. */
  const SCENARIO_WORD =
    /\b(conservative|historical|optimistic|careful|conservador\w*|hist[oó]ric\w*|otimista\w*|optimista\w*|cauteloso|prudente|konservativ\w*|historisch\w*|optimistisch\w*|vorsichtig\w*)\b/iu;
  const FIGURE = new RegExp(
    `(?<![\\d.,])(${Object.values(SCENARIO_RATES).join('|')})\\s?%|2[.,]252|66[.,]000`,
    'u'
  );

  it.each(LOCALES)(
    'should type no scenario figure beside a scenario word in any catalogue (%s)',
    (locale) => {
      const found: string[] = [];
      for (const [id, text] of Object.entries(catalogue(locale))) {
        for (const m of text.matchAll(new RegExp(FIGURE.source, 'gu'))) {
          const around = text.slice(Math.max(0, (m.index ?? 0) - 30), (m.index ?? 0) + 30);
          if (SCENARIO_WORD.test(around)) found.push(`${id}: …${around}…`);
        }
      }
      expect(found).toEqual([]);
    }
  );

  it('should keep the scripts’ copies of the scenario rates equal to the constant', () => {
    for (const script of ['tools-simulator.mjs', 'tools-stress-test.mjs']) {
      const text = readFileSync(join(ROOT, 'apps/web/scripts', script), 'utf8');
      const m = text.match(
        /scenarioRates:\s*\{\s*conservative:\s*(\d+),\s*historical:\s*(\d+),\s*optimistic:\s*(\d+)\s*\}/
      );
      expect(m, script).not.toBeNull();
      expect({ conservative: +m![1], historical: +m![2], optimistic: +m![3] }, script).toEqual(
        SCENARIO_RATES
      );
    }
  });
});
