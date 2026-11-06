import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createIntl } from 'react-intl';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ A YEAR COUNT THAT CAN BE 1 IS AN ICU PLURAL (register 5.793; 7th audit).
 *
 * #826 gave the share texts a singular, but the same result screens still rendered "In 1 Jahren",
 * "En 1 años", "Em 1 anos", "In 1 years" — the currency and idle-cash tools both allow one year.
 * This fails any catalogue message, in any locale, that puts a bare `{years}` before a year noun,
 * except the keys listed below with their reason.
 */

function translationsRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    const candidate = join(dir, 'packages/i18n/translations');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations');
}
const ROOT = translationsRoot();
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/** Keys whose count is never a whole 1, with why — a bare count is then correct. */
const ALLOWED: Record<string, string> = {
  'tools-emergency-fund:output.yearsLabel':
    'a one-decimal string (≥ "1.0"); "1.0 years" is correct',
  'tools-time-to-target:output.yearsLabel': 'a one-decimal string; "1.0 years" is correct',
  'tools-shared:calculatorMode.retrospectiveHint':
    'a fixed maximum (MAX_RETROSPECTIVE_YEARS), never 1',
  'tools-money-jobs:costLine.personal': 'a fixed constant (MONEY_JOBS_COST_LINE_YEARS), never 1',
  'tools-money-jobs:costLine.business': 'a fixed constant (MONEY_JOBS_COST_LINE_YEARS), never 1',
};

const BARE_YEARS = /\{years\}\s+(?:years?|anos?|años?|Jahre[n]?)\b/;

function flatten(node: unknown, prefix = '', out: Record<string, string> = {}) {
  if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else if (typeof node === 'string') out[prefix] = node;
  return out;
}

function catalogues(locale: string) {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (e.endsWith('.json')) files.push(full);
    }
  };
  walk(join(ROOT, locale));
  return files.map((f) => ({
    ns: relative(join(ROOT, locale), f).replace(/\.json$/, ''),
    messages: flatten(JSON.parse(readFileSync(f, 'utf8'))),
  }));
}

describe('5.793 · a year count that can be 1 is a plural', () => {
  it.each(LOCALES)('should put no bare {years} before a year noun (%s)', (locale) => {
    const offenders: string[] = [];
    for (const { ns, messages } of catalogues(locale))
      for (const [key, value] of Object.entries(messages))
        if (BARE_YEARS.test(value) && !(`${ns}:${key}` in ALLOWED))
          offenders.push(`${ns}:${key} = ${value.slice(0, 80)}`);
    expect(offenders).toEqual([]);
  });

  it('should keep every allowed key real (a stale exception hides the next defect)', () => {
    for (const id of Object.keys(ALLOWED)) {
      const [ns, key] = id.split(':');
      const en = catalogues('en').find((c) => c.ns === ns)?.messages[key];
      expect(en, id).toBeDefined();
      expect(BARE_YEARS.test(en as string), id).toBe(true);
    }
  });

  it.each(LOCALES)('should read as singular at one year and plural at three (%s)', (locale) => {
    const singular: Record<string, RegExp> = {
      en: /\b1 year\b/,
      'pt-BR': /\b1 ano\b/,
      es: /\b1 año\b/,
      de: /\b1 Jahr\b/,
    };
    const all = Object.fromEntries(
      catalogues(locale).flatMap(({ ns, messages }) =>
        Object.entries(messages).map(([k, v]) => [`${ns}.${k}`, v])
      )
    );
    const intl = createIntl({ locale, messages: all, onError: () => {} });
    const ids = [
      'tools-shared.resultMoment.chartEnd',
      'tools-idle-cash.output.bankNote',
      'tools-currency-depreciation.resultMoment.chartAria',
      'learn-compound-interest.calculator.tableHeaderTotal',
      'tools-idle-cash.resultMoment.chartAria',
    ];
    const values = {
      years: 1,
      rate: '4.00',
      currency: 'BRL',
      amount: 'X',
      cash: 'X',
      difference: 'Y',
    };
    for (const id of ids) {
      const one = intl.formatMessage({ id }, values);
      expect(one, `${locale} ${id}: ${one}`).toMatch(singular[locale]);
      const three = intl.formatMessage({ id }, { ...values, years: 3 });
      expect(three, `${locale} ${id}: ${three}`).not.toMatch(singular[locale]);
    }
  });
});
