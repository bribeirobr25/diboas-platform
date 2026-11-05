/**
 * Register 5.775 (founder approval 2026-11-05, audit/WORDING_PACKAGE_5775_2026-11-05.md in the
 * private docs): three texts said more than the site can back up.
 *   (a) the business page's "No minimum balances" beside Full Throttle's minimum — on inspection a
 *       catalogue key no code reads, so it is deleted; an unqualified "no minimum" must not return;
 *   (b) the protocols page's search/share descriptions ("diBoaS connects you to…", "…which DeFi
 *       protocols diBoaS uses") — the page lists what diBoaS RESEARCHED and what the strategies use;
 *   (c) the strategies page's search title named "Investment" strategies — a regulated service the
 *       site does not offer (the structured data dropped the word in step 2).
 * (e), the es/de Safe Harbor text, is held by the GENIUS wall itself (its two exceptions are gone).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const ROOT = join(__dirname, '../../../../../..');
const catalogue = (locale: string, ns: string) =>
  JSON.parse(readFileSync(join(ROOT, 'packages/i18n/translations', locale, `${ns}.json`), 'utf8'));
const source = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const INVESTMENT = /invest|anlage|inversi/i;

describe('5.775 — search and share texts say only what the site backs up', () => {
  // (a) The only "no minimum" text was a key no code reads (`fees.expandableToggle`): deleted
  // rather than reworded. The rule stays: an unqualified "no minimum" never comes back.
  const NO_MINIMUM =
    /\b(no minimum|sem saldo m[ií]nimo|sin saldo m[ií]nimo|kein mindestguthaben)\b[^.]*/i;
  const namesAccount = (sentence: string) => /account|conta|cuenta|konto/i.test(sentence);
  const strings = (o: unknown): string[] =>
    typeof o === 'string'
      ? [o]
      : o && typeof o === 'object'
        ? Object.values(o).flatMap(strings)
        : [];

  it('should flag an unqualified "no minimum" (positive control)', () => {
    const hit = 'No hidden fees. No minimum balances.'.match(NO_MINIMUM)?.[0] ?? '';
    expect(hit && !namesAccount(hit)).toBe(true);
  });

  it.each(LOCALES)(
    'should name the ACCOUNT wherever the %s business page says "no minimum"',
    (l) => {
      for (const text of strings(catalogue(l, 'landing-b2b'))) {
        const hit = text.match(NO_MINIMUM)?.[0];
        if (hit) expect(namesAccount(hit), hit).toBe(true);
      }
    }
  );

  it.each(LOCALES)(
    'should describe the %s protocols page as researched, never as connecting money',
    (l) => {
      const { description, ogDescription } = catalogue(l, 'protocols').seo;
      for (const text of [description, ogDescription] as string[]) {
        expect(text).toMatch(/research|pesquis|investigad|recherch/i);
        expect(text).not.toMatch(/\bconnects?\b|\bconecta\b|\bverbindet\b|dein Geld berührt/i);
      }
    }
  );

  it.each(LOCALES)('should keep "investment" out of the %s strategies search title', (l) => {
    expect(catalogue(l, 'strategies').seo.title).not.toMatch(INVESTMENT);
  });

  it('should keep "investment" out of the strategies title fallbacks in code', () => {
    const page = source('apps/web/src/app/[locale]/(landing)/strategies/page.tsx');
    expect(page.match(/seo\.title \|\| '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
    const seo = source('apps/web/src/lib/seo/constants.ts');
    expect(seo.match(/strategies: \{\s*title: '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
    const og = source('apps/web/src/lib/og/templates.tsx');
    expect(og.match(/strategies: \{\s*title: '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
  });
});
