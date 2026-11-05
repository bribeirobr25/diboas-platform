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
 * Sixth audit (2026-11-05): plurals/inflections of "no minimum" in EVERY catalogue, a wider list
 * of overstating verbs, and the strategies share titles too.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const ROOT = join(__dirname, '../../../../../..');
const TRANSLATIONS = join(ROOT, 'packages/i18n/translations');
const catalogue = (locale: string, ns: string) =>
  JSON.parse(readFileSync(join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));
const source = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const strings = (o: unknown): string[] =>
  typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : [];

const INVESTMENT = /invest|anlage|inversi/i;
/**
 * Verbs that say diBoaS connects people's money to the protocols (wider than "connects"). A
 * protocol connecting ITS lenders and borrowers (Morpho: "Conecta credores…") is not the claim.
 */
const OVERSTATES =
  /\bconnects? you\b|\blinks? you\b|\bgives? you access\b|\bconecta (?:você|voce)\b|\bte conecta\b|\bdiBoaS conecta\b|\bliga você\b|\bverbindet dich\b|\bdiBoaS verbindet\b|\bbringt dein Geld\b|dein Geld berührt|\byour money (goes|touches|may touch)\b|\bseu dinheiro (vai|pode tocar)\b|\btu dinero (va|puede tocar)\b|\bdein Geld (geht|berühren kann)\b/i;
/** "No minimum" in any number or inflection; "en cuenta" ("keep in mind") is not the account. */
const NO_MINIMUM =
  /\b(no minimums?|zero minimums?|sem saldos? m[ií]nimos?|sin saldos? m[ií]nimos?|kein(?:e|en)? mindest\w*)\b[^.]*/i;
const namesAccount = (sentence: string) =>
  /\baccount\b|\b(?:na|da) conta\b|\bconta\b|\b(?:en|de) la cuenta\b|\bkonto\b/i.test(sentence);

describe('5.775 — search and share texts say only what the site backs up', () => {
  it.each([
    'No hidden fees. No minimum balances.',
    'No minimums.',
    'Sin saldos mínimos.',
    'Keine Mindestguthaben.',
    'Sin saldo mínimo, tenlo en cuenta.',
  ])('should flag an unqualified "no minimum" in "%s" (positive control)', (text) => {
    const hit = text.match(NO_MINIMUM)?.[0] ?? '';
    expect(hit !== '' && !namesAccount(hit)).toBe(true);
  });

  it.each(LOCALES)('should name the ACCOUNT wherever a %s catalogue says "no minimum"', (l) => {
    const dir = join(TRANSLATIONS, l);
    const files = readdirSync(dir, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(30);
    for (const file of files) {
      for (const text of strings(JSON.parse(readFileSync(join(dir, file), 'utf8')))) {
        const hit = text.match(NO_MINIMUM)?.[0];
        if (hit) expect(namesAccount(hit), `${l}/${file}: ${hit}`).toBe(true);
      }
    }
  });

  it.each(LOCALES)(
    'should describe the %s protocols page as researched, never as connecting money',
    (l) => {
      const { description, ogDescription } = catalogue(l, 'protocols').seo;
      for (const text of [description, ogDescription] as string[]) {
        expect(text).toMatch(/research|pesquis|investigad|recherch/i);
        expect(text).not.toMatch(OVERSTATES);
      }
    }
  );

  it('should flag each overstating verb (positive control)', () => {
    for (const text of [
      'diBoaS connects you to protocols',
      'and links you to them',
      'gives you access to DeFi',
      'Veja pra onde seu dinheiro vai',
      'bringt dein Geld dorthin',
      'O diBoaS conecta você a protocolos',
      'diBoaS te conecta con protocolos',
      'diBoaS verbindet dich mit Protokollen',
    ]) {
      expect(text, text).toMatch(OVERSTATES);
    }
  });

  it.each(LOCALES)(
    'should keep "investment" out of the %s strategies search and share titles',
    (l) => {
      const { title, ogTitle } = catalogue(l, 'strategies').seo;
      expect(title).not.toMatch(INVESTMENT);
      if (ogTitle) expect(ogTitle).not.toMatch(INVESTMENT);
    }
  );

  it('should keep "investment" out of the strategies title fallbacks in code', () => {
    const page = source('apps/web/src/app/[locale]/(landing)/strategies/page.tsx');
    expect(page.match(/seo\.title \|\| '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
    const ogFallbacks = [...page.matchAll(/seo\.ogTitle \|\| '([^']*)'/g)].map((m) => m[1]);
    expect(ogFallbacks.length).toBeGreaterThan(0);
    for (const t of ogFallbacks) expect(t).not.toMatch(INVESTMENT);
    const seo = source('apps/web/src/lib/seo/constants.ts');
    expect(seo.match(/strategies: \{\s*title: '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
    const og = source('apps/web/src/lib/og/templates.tsx');
    expect(og.match(/strategies: \{\s*title: '([^']*)'/)?.[1]).not.toMatch(INVESTMENT);
  });

  // 5.792 (founder approval 2026-11-05, audit/WORDING_PACKAGE_5792_PUBLIC_CLAIMS_2026-11-05.md):
  // the protocols page and the strategies table heading said "your money may touch" / "where your
  // money goes"; the whole protocols catalogue and that heading are now held to the same verbs.
  it.each(LOCALES)(
    'should keep every %s protocols text and the strategies table heading free of money-connecting verbs',
    (l) => {
      for (const text of strings(catalogue(l, 'protocols')))
        expect(text, text.slice(0, 80)).not.toMatch(OVERSTATES);
      expect(catalogue(l, 'strategies').protocols.header).not.toMatch(OVERSTATES);
    }
  );

  // llms.txt is read by AI crawlers: it says only what is live (5.792).
  const LLMS_OVERCLAIMS =
    /free and instant|investment strateg|AI-powered|buy and hold|send, save, invest|send and receive money/i;

  it('should keep llms.txt to what is live today', () => {
    const llms = source('apps/web/public/llms.txt');
    expect(llms).toContain('No real-money features are live.');
    expect(llms).not.toMatch(LLMS_OVERCLAIMS);
  });

  it('should flag each llms.txt overclaim (positive control)', () => {
    for (const t of [
      'Send and receive money globally, free and instant',
      'Goal-driven investment strategies',
      'AI-powered financial guidance',
      'Buy and hold digital assets',
    ]) {
      expect(t, t).toMatch(LLMS_OVERCLAIMS);
    }
  });
});
