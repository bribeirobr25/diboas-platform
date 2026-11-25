/**
 * DISCLAIMER-BASIS-1 · the tools disclaimer and the "Since 2010" hint say what the mode really
 * uses: hand-typed average exchange rates per period, ending at the research date (market
 * clean-up W-D2, register `5.934`; spec v6 §1.2).
 *
 * - The hedge sentence (the disclaimer's last) ×4 names 2010, the month of `LAST_RESEARCH_UPDATE`
 *   (read from the code, formatted per locale), the mode's own label and the tool's own title.
 * - The hint ×4 names the same month and never says the path is the "actual" one.
 * - Every other disclaimer sentence is byte-identical to `main` `7d4259b2` (SHA-256 pins), and the
 *   sentence counts are pinned, so a deleted or edited sentence fails.
 * - When MP-8 (`5.789`) replaces the averages and moves the date, this fails until both texts
 *   change with it.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAST_RESEARCH_UPDATE } from '@/lib/market-data/historical';

const TRANSLATIONS = join(__dirname, '../../../../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
type Locale = (typeof LOCALES)[number];

const read = (locale: Locale, ns: string) =>
  JSON.parse(readFileSync(join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));
const sentences = (text: string): string[] => text.split(/(?<=[.!?]) /);
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/** The sentences before the hedge sentence, as on `main` `7d4259b2` (W-D2 changed only the last). */
const KEPT: Record<Locale, string[]> = {
  en: [
    'e438c9b0abeb2a29',
    '4bb6aa6ddc4e3eb8',
    '666e0e422de4c972',
    'c30c8b46e06b03ac',
    '6434ebcd3fc8f2de',
    '0acd974031fe3542',
  ],
  'pt-BR': [
    'f2d8190e2254b5bc',
    '2f73426204891f85',
    'd0b99368c6663662',
    'f7ad33c327074d5a',
    '4520424c1146fa64',
  ],
  es: [
    'a718bf5f5f0924f2',
    'f08917b1f0d8ae35',
    '0596a764fc07cca0',
    '0ae3baea0f6d0ac7',
    '224b952ad544831f',
  ],
  de: [
    '88f11c0343a7a927',
    '925b861bf472c9c1',
    'b40cc3618090b840',
    'ecbdaf4c3c729c5e',
    '191f277e52fcc6c8',
  ],
};

/** The research month as each locale writes it ("May 2026", "maio de 2026", "Mai 2026"). */
const researchMonth = (locale: Locale) =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${LAST_RESEARCH_UPDATE}T00:00:00Z`)
  );
const toolTitle = (locale: Locale) =>
  (read(locale, 'tools-goal-savings').seo.title as string).split(':')[0];
const ACTUAL = /\b(?:actual|real|reales|reais|tatsächlich\w*)\b/i;

describe('DISCLAIMER-BASIS-1: the "Since 2010" mode is described as it is', () => {
  it.each(LOCALES)('should keep every sentence but the hedge byte-identical (%s)', (locale) => {
    const parts = sentences(read(locale, 'tools-shared').disclaimer as string);
    expect(parts).toHaveLength(KEPT[locale].length + 1);
    expect(parts.slice(0, -1).map(sha)).toEqual(KEPT[locale]);
  });

  it.each(LOCALES)(
    'should name 2010, the research month, the mode and the tool in the hedge (%s)',
    (locale) => {
      const shared = read(locale, 'tools-shared');
      const hedge = sentences(shared.disclaimer as string).at(-1)!;
      expect(hedge).toContain('2010');
      expect(hedge).toContain(researchMonth(locale));
      expect(hedge).toContain(shared.calculatorMode.retrospective as string);
      expect(hedge).toContain(toolTitle(locale));
    }
  );

  it.each(LOCALES)(
    'should name the research month in the hint, never an "actual" path (%s)',
    (locale) => {
      const hint = read(locale, 'tools-shared').calculatorMode.retrospectiveHint as string;
      expect(hint).toContain(researchMonth(locale));
      expect(hint).not.toMatch(ACTUAL);
    }
  );
});
