/**
 * The scenario rates and the figures derived from them, as the copy states them (register 5.730).
 *
 * The catalogues no longer type a scenario rate or a figure derived from one: they hold `{scenarioConservative}`,
 * `{scenarioLumpSumResult}` … and the page loader fills them from the ONE constant
 * (`SCENARIO_RATES`), so changing a rate changes every sentence that states it. The worked
 * examples' inputs (a one-time 1,000 for 12 years; 300 a month for twelve years) stay in the copy
 * as written; only the results are computed here, by the calculators' own formulas.
 */
import { formatPercent } from '@diboas/format';
import { calculateLumpSum, calculateMonthlyContributions } from '@/lib/market-data/formulas/core';
import { SCENARIO_RATES, type ScenarioKey } from './scenarios';

/** The worked examples the Learn talks state (inputs as written in the copy). */
export const SCENARIO_COPY_EXAMPLES = {
  /** Talk 1: a one-time 1,000 left for 12 years at the conservative rate, exact to the unit. */
  lumpSum: { principal: 1000, years: 12 },
  /** Talk 4: 300 a month paid first for twelve years at the conservative rate, to the thousand. */
  monthly: { payment: 300, months: 144, roundTo: 1000 },
} as const;

/** The currency each locale's illustrations are written in (the catalogue's own). */
const COPY_CURRENCY: Readonly<Record<string, 'USD' | 'BRL' | 'EUR'>> = {
  en: 'USD',
  'pt-BR': 'BRL',
  es: 'EUR',
  de: 'EUR',
};

/** The placeholders the loader fills — the only ones; each is a plain `{name}` slot. */
export const SCENARIO_COPY_SLOTS = [
  'scenarioConservative',
  'scenarioHistorical',
  'scenarioOptimistic',
  'scenarioLumpSumResult',
  'scenarioMonthlyResult',
] as const;
export type ScenarioCopySlot = (typeof SCENARIO_COPY_SLOTS)[number];

/**
 * A whole amount in the catalogue's style: grouped even for four digits (es "2.252 €"), with the
 * catalogue's ordinary space where `Intl` puts a no-break space, so the text renders unchanged.
 */
export function copyMoney(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: COPY_CURRENCY[locale] ?? 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: 'always',
  })
    .format(amount)
    .replace(/[\u00a0\u202f]/g, ' ');
}

/** The filled values for `locale`; `rates` defaults to the one constant (tests vary it). */
export function scenarioCopyValues(
  locale: string,
  rates: Readonly<Record<ScenarioKey, number>> = SCENARIO_RATES
): Record<ScenarioCopySlot, string> {
  const conservative = rates.conservative / 100;
  const { lumpSum, monthly } = SCENARIO_COPY_EXAMPLES;
  const lump = calculateLumpSum(lumpSum.principal, conservative, 0, lumpSum.years).nominalFV;
  const paid = calculateMonthlyContributions(monthly.payment, conservative, 0, monthly.months);
  const pct = (n: number) => formatPercent(n / 100, locale);
  return {
    scenarioConservative: pct(rates.conservative),
    scenarioHistorical: pct(rates.historical),
    scenarioOptimistic: pct(rates.optimistic),
    scenarioLumpSumResult: copyMoney(Math.round(lump), locale),
    scenarioMonthlyResult: copyMoney(
      Math.round(paid.nominalFV / monthly.roundTo) * monthly.roundTo,
      locale
    ),
  };
}

const SLOT = new RegExp(`\\{(${SCENARIO_COPY_SLOTS.join('|')})\\}`, 'g');

/** Fill the scenario slots in a flattened catalogue (other ICU arguments are left to react-intl). */
export function fillScenarioCopy(
  messages: Record<string, string>,
  locale: string,
  rates?: Readonly<Record<ScenarioKey, number>>
): Record<string, string> {
  const values = scenarioCopyValues(locale, rates);
  const out: Record<string, string> = {};
  for (const [id, text] of Object.entries(messages))
    out[id] = text.includes('{scenario')
      ? text.replace(SLOT, (_m, slot: ScenarioCopySlot) => values[slot])
      : text;
  return out;
}
