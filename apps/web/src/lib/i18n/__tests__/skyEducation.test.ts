/**
 * SKY-EDU-1 · Sky's education texts are exactly the ones the founder approved, and the table never
 * shows the payment stablecoin beside a rate label (market clean-up W-D2 PR B, register `5.935`;
 * D3 under LC-RR-01-01, D10; spec v6 §1.4 as corrected by its five-agent audit).
 *
 * - Every shown leaf is pinned: Sky's card, Spark's card and the strategies row ×4 are each hashed
 *   whole (SHA-256 of the object with its keys sorted), so an edited, added or removed leaf fails
 *   until the founder approves the text and the pin changes. The one exception is `details.tvl`,
 *   which the TVL refresh rewrites: it may carry no earn word (the wall's own pattern).
 * - The asset cell is the rate token: with the exact token `sUSDS` removed it matches none of the
 *   wall's stablecoin forms (so USDS, USDC, DAI or USDT fail). The wall reads "sUSDS" as USDS,
 *   which is why this check, not the wall, holds the label-and-asset pair.
 * - No leaf of the three says "savings" in any language (the founder's 2026-11-11 rule; "Spark" is
 *   exempt, "Sparkonto" is not), after zero-width characters are removed.
 * - The card and the row each say you can lose some or all of what you put in (principal risk).
 * - Dropped from the spec, recorded: "no leaf except the summary names USDS" (the approved card
 *   names USDS on purpose: "the protocol behind DAI and USDS", "Holding USDS alone pays nothing").
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../../../../../..');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
type Locale = (typeof LOCALES)[number];
const read = (locale: Locale, ns: string) =>
  JSON.parse(readFileSync(join(ROOT, 'packages/i18n/translations', locale, `${ns}.json`), 'utf8'));
const PATTERNS = JSON.parse(
  readFileSync(join(ROOT, 'config/genius-wall-patterns.json'), 'utf8')
) as { earn: string; stable: string };
const STABLE = new RegExp(`(?:${PATTERNS.stable})`, 'i');
const EARN = new RegExp(`(?:${PATTERNS.earn})`, 'i');

/** The object with `details.tvl` removed and its keys sorted at every level, hashed. */
function pin(value: Record<string, unknown>): string {
  const sorted = (v: unknown): unknown =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .filter((k) => k !== 'tvl')
            .map((k) => [k, sorted((v as Record<string, unknown>)[k])])
        )
      : v;
  return createHash('sha256')
    .update(JSON.stringify(sorted(value)))
    .digest('hex')
    .slice(0, 16);
}

/** Every string leaf under a value, with its path. */
function leaves(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const texts = (locale: Locale) => {
  const cards = read(locale, 'protocols').cards;
  return {
    sky: cards.sky,
    spark: cards.sparkProtocol,
    row: read(locale, 'strategies').protocols.items.skySsr,
  };
};

const PINNED: Record<Locale, { sky: string; spark: string; row: string }> = {
  en: { sky: '3cc48a7d0da82b0e', spark: '2ee063169347438a', row: '3125a69f1e681b76' },
  'pt-BR': { sky: '750ab2141636f695', spark: '057a3220943b0736', row: '08389cec48151553' },
  es: { sky: '20cbfc5733479936', spark: 'c1a631bb1f58ad96', row: '9291ab35dbcb527e' },
  de: { sky: '1da15f780cf161ff', spark: 'd146131c80ace7e1', row: 'a524f88fcb660043' },
};
const PRINCIPAL: Record<Locale, RegExp> = {
  en: /lose some or all of what you put in/,
  'pt-BR': /perder parte ou todo o valor que aplicou/,
  es: /perder parte o la totalidad de lo que aportaste/,
  de: /einen Teil oder alles verlieren, was du eingezahlt hast/,
};
const SAVINGS =
  /savings?|poup[aeoá]|ahorr|economiz|(?:\b|ge|an|er)spar(?!k\b)|tagesgeld|festgeld|caderneta/i;
const ZERO_WIDTH = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g;

describe('SKY-EDU-1: Sky is described as approved', () => {
  it.each(LOCALES)('should ship exactly the approved card, Spark card and row (%s)', (locale) => {
    const { sky, spark, row } = texts(locale);
    expect({ sky: pin(sky), spark: pin(spark), row: pin(row) }).toEqual(PINNED[locale]);
  });

  it.each(LOCALES)('should carry no earn word in the refreshed TVL figures (%s)', (locale) => {
    const { sky, spark } = texts(locale);
    for (const tvl of [sky.details.tvl, spark.details.tvl] as string[])
      expect(tvl).not.toMatch(EARN);
  });

  it.each(LOCALES)('should never put a payment stablecoin in the asset cell (%s)', (locale) => {
    const asset = texts(locale).row.asset as string;
    expect(asset.replace(/\bsUSDS\b/g, '')).not.toMatch(STABLE);
  });

  it.each(LOCALES)('should say "savings" in no leaf, in any language (%s)', (locale) => {
    const { sky, spark, row } = texts(locale);
    for (const [path, text] of [
      ...leaves(sky, 'sky'),
      ...leaves(spark, 'spark'),
      ...leaves(row, 'skySsr'),
    ])
      expect(text.replace(ZERO_WIDTH, ''), path).not.toMatch(SAVINGS);
  });

  it.each(LOCALES)('should state the principal risk in the card and the row (%s)', (locale) => {
    const { sky, row } = texts(locale);
    expect(sky.description).toMatch(PRINCIPAL[locale]);
    expect(row.summary).toMatch(PRINCIPAL[locale]);
  });
});
