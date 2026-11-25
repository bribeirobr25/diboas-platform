/**
 * SKY-EDU-1 · Sky's education texts are exactly the ones the founder approved, and the table never
 * shows the payment stablecoin beside a rate label (market clean-up W-D2 PR B, register `5.935`;
 * D3 under LC-RR-01-01, D10; spec v6 §1.4).
 *
 * - The card, its "since" detail, the Spark card and its "built on" detail, and the strategies row (summary, type, asset,
 *   year) ×4 are pinned whole (SHA-256), whether or not the GENIUS wall flags them; a new wording
 *   needs the founder's approval and a new pin here.
 * - The asset cell is the rate token: with the exact token `sUSDS` removed it matches none of the
 *   wall's stablecoin forms (so USDS, USDC, DAI or USDT fail). The wall's pattern reads "sUSDS" as
 *   USDS, which is why this check, not the wall, holds the label-and-asset pair.
 * - No Sky or Spark leaf says "savings" in any language (the founder's 2026-11-11 rule; "Spark"
 *   is not "Spar-"), and none dates the protocol to 2014 or 2022 except `details.founded`.
 * - The card and the row each say you can get back less than you put in (principal risk,
 *   LC-RR-01-01).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../../../../../..');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
type Locale = (typeof LOCALES)[number];
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const read = (locale: Locale, ns: string) =>
  JSON.parse(readFileSync(join(ROOT, 'packages/i18n/translations', locale, `${ns}.json`), 'utf8'));
const STABLE = new RegExp(
  `(?:${(JSON.parse(readFileSync(join(ROOT, 'config/genius-wall-patterns.json'), 'utf8')) as { stable: string }).stable})`,
  'i'
);

const PINNED: Record<Locale, Record<string, string>> = {
  en: {
    card: '9e2836232e503aa2',
    regulatory: 'e5c616f8120a1ae9',
    spark: 'c264b25e53f68930',
    summary: 'c621c58210e38668',
    type: 'a08e93c5413ebc92',
    asset: '811e14962f60d0aa',
    operatingSince: 'acb5356c30b75931',
    sparkRegulatory: '0459ce54284d4905',
  },
  'pt-BR': {
    card: '43d682fd37356bb9',
    regulatory: 'bf99d4cdcd15ad1a',
    spark: 'd8df8ceb1714987f',
    summary: '83579442b0af9149',
    type: '3a0d41955ec125c2',
    asset: '811e14962f60d0aa',
    operatingSince: 'acb5356c30b75931',
    sparkRegulatory: '04573f3b165b6863',
  },
  es: {
    card: '2ec318119562c69e',
    regulatory: '77f15eccb02f9bb6',
    spark: 'a5a772c12bfdf96f',
    summary: '58ea6d8655362f39',
    type: '166ef9baab501d0d',
    asset: '811e14962f60d0aa',
    operatingSince: 'acb5356c30b75931',
    sparkRegulatory: '3d2529194698b8bb',
  },
  de: {
    card: 'a4cd4783e974e626',
    regulatory: 'a2da10b961b7507c',
    spark: 'aa54615ad3d95128',
    summary: '827788e69d7ba7c0',
    type: 'a558d3f8e091ddeb',
    asset: '811e14962f60d0aa',
    operatingSince: 'acb5356c30b75931',
    sparkRegulatory: '5cfc28a742fe11d6',
  },
};
const PRINCIPAL: Record<Locale, RegExp> = {
  en: /get back less than you put in/,
  'pt-BR': /receber de volta menos do que aplicou/,
  es: /recuperar menos de lo que aportaste/,
  de: /weniger zurückbekommen, als du eingezahlt hast/,
};
const SAVINGS = /savings?|poupan|poupar|ahorr|\bspar(?!k)|erspar|tagesgeld|festgeld|caderneta/i;

/** Every string leaf under a value, with its path. */
function leaves(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const texts = (locale: Locale) => {
  const cards = read(locale, 'protocols').cards;
  const row = read(locale, 'strategies').protocols.items.skySsr;
  return { cards, row };
};

describe('SKY-EDU-1: Sky is described as approved', () => {
  it.each(LOCALES)('should ship exactly the approved texts (%s)', (locale) => {
    const { cards, row } = texts(locale);
    expect({
      card: sha(cards.sky.description),
      regulatory: sha(cards.sky.details.regulatory),
      spark: sha(cards.sparkProtocol.description),
      sparkRegulatory: sha(cards.sparkProtocol.details.regulatory),
      summary: sha(row.summary),
      type: sha(row.type),
      asset: sha(row.asset),
      operatingSince: sha(row.operatingSince),
    }).toEqual(PINNED[locale]);
  });

  it.each(LOCALES)('should never put a payment stablecoin in the asset cell (%s)', (locale) => {
    const asset = texts(locale).row.asset as string;
    expect(asset.replace(/\bsUSDS\b/g, '')).not.toMatch(STABLE);
  });

  it.each(LOCALES)(
    'should say "savings" nowhere and date the protocol only once to 2014 (%s)',
    (locale) => {
      const { cards, row } = texts(locale);
      const all = [
        ...leaves(cards.sky, 'sky'),
        ...leaves(cards.sparkProtocol.description, 'spark.description'),
        ...leaves(cards.sparkProtocol.details.regulatory, 'spark.details.regulatory'),
        ...leaves(row, 'skySsr'),
      ];
      for (const [path, text] of all) {
        expect(text, path).not.toMatch(SAVINGS);
        if (path !== 'sky.details.founded') expect(text, path).not.toMatch(/\b(?:2014|2022)\b/);
      }
    }
  );

  it.each(LOCALES)('should state the principal risk in the card and the row (%s)', (locale) => {
    const { cards, row } = texts(locale);
    expect(cards.sky.description).toMatch(PRINCIPAL[locale]);
    expect(row.summary).toMatch(PRINCIPAL[locale]);
  });
});
