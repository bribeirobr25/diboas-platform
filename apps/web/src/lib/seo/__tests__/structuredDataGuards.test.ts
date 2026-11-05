/**
 * Step 2 guards (registers 5.643, 5.748, 5.103; hardened after the fourth audit, 2026-11-05) —
 * what the website states in its structured data and about money to start.
 *
 * 1. Class: every service page's structured data is built by ONE builder from a page KEY, and
 *    the builder loads that page's own catalogue. The test runs that real path for every page
 *    and locale and asserts the WHOLE object; a source check pins each page to its own key and
 *    forbids altering the result.
 * 2. Fallback: every English fallback literal equals the en catalogue value it backs.
 * 3. Promise: no return-promise shape in any structured-data copy, catalogue or code.
 * 4. Figure: (a) the keys that used to state a start figure carry no currency figure, and the
 *    Add Money row claims no "no minimum"; (b) no start/minimum word or cap word stands within
 *    three words of a currency figure, in either order, in any catalogue or apps/web literal
 *    (stories included), except the examples named below BY KEY with their reason.
 * Requirement sources: FEES.md FE-1 (no caps), FE-1a (floors), FE-1b (a minimum add-money
 * amount exists); the founder's Q2 "remove the figure"; DR-2026-11-05-step2-wording-approval.
 * Served HTML is checked end to end by `tests/e2e/structuredData.spec.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEOMetadataFactory } from '../metadata-factory';
import {
  buildServiceStructuredData,
  SERVICE_PAGES,
  STRUCTURED_DATA_FALLBACKS,
  type ServicePage,
} from '../pageStructuredData';

const WEB_SRC = path.resolve(__dirname, '../../..');
const TRANSLATIONS = path.resolve(WEB_SRC, '../../../packages/i18n/translations');
const LOCALES = ['en', 'de', 'es', 'pt-BR'] as const;
type Locale = (typeof LOCALES)[number];

function catalogue(locale: Locale, ns: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(TRANSLATIONS, locale, `${ns}.json`), 'utf8'));
}
function at(obj: unknown, keyPath: string): unknown {
  return keyPath
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      obj
    );
}
function walk(o: unknown, p: string, fn: (leaf: string, keyPath: string) => void): void {
  if (typeof o === 'string') return fn(o, p);
  if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${p}.${i}`, fn));
  if (o && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k, fn);
}
function catalogueFiles(locale: Locale): string[] {
  return (fs.readdirSync(path.join(TRANSLATIONS, locale), { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.json'));
}
const LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
/** Every apps/web TS/TSX source file, stories included (Storybook is built in CI). */
function webSourceFiles(): string[] {
  return (fs.readdirSync(WEB_SRC, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.test\.)/.test(f));
}

/** Each service page's route file and the registry key it must use. */
const PAGE_FILES: Record<ServicePage, string> = {
  landing: 'app/[locale]/(landing)/page.tsx',
  about: 'app/[locale]/(landing)/about/page.tsx',
  business: 'app/[locale]/(landing)/business/page.tsx',
  protocols: 'app/[locale]/(landing)/protocols/page.tsx',
  strategies: 'app/[locale]/(landing)/strategies/page.tsx',
};
const PAGES = Object.keys(SERVICE_PAGES) as ServicePage[];
const DESCRIPTION_KEY = 'seo.jsonLd.serviceDescription';

describe('step 2 · 1 — structured data comes from the page catalogue, through one builder', () => {
  it.each(PAGES)(
    'should serve the %s page its own catalogue description, category and crumbs in every locale',
    async (page) => {
      const spec = SERVICE_PAGES[page];
      for (const locale of LOCALES) {
        const common = catalogue(locale, 'common');
        const { service, breadcrumbs } = await buildServiceStructuredData(page, locale);
        expect(service.description, `${locale}/${page}`).toBe(
          at(catalogue(locale, spec.namespace), DESCRIPTION_KEY)
        );
        expect(service.category).toBe(at(common, 'seo.serviceCategory'));
        expect(service.name).toBe('diBoaS');
        const names = breadcrumbs.itemListElement.map((i: { name: string }) => i.name);
        expect(names[0]).toBe(at(catalogue(locale, 'landing-b2c'), 'seo.jsonLd.breadcrumbHome'));
        if (spec.crumb) expect(names[1]).toBe(at(common, `navigation.landing.${spec.crumb.key}`));
        else expect(names).toHaveLength(1);
        expect(JSON.stringify({ service, breadcrumbs })).not.toMatch(
          /areaServed|"Offer"|OfferCatalog|offers/
        );
      }
    }
  );

  it.each(PAGES)(
    'should build the %s page structured data from its own key and leave it unaltered',
    (page) => {
      const src = fs.readFileSync(path.join(WEB_SRC, PAGE_FILES[page]), 'utf8');
      const calls = [...src.matchAll(/buildServiceStructuredData\(\s*'([^']+)'/g)].map((m) => m[1]);
      expect(calls, PAGE_FILES[page]).toEqual([page]);
      expect(src).not.toMatch(/generateServiceStructuredData\s*\(|areaServed|\boffers\s*:|'Offer'/);
      // the built objects reach <StructuredData> as built: no spread, no property write
      expect(src).not.toMatch(/\.\.\.\s*(?:organizationData|serviceData|structured)\b/);
      expect(src).not.toMatch(/\b(?:organizationData|serviceData|structured)\.\w+\s*=[^=]/);
    }
  );

  it('should emit no areaServed and no Offer when the factory builds a Service object', () => {
    const service = SEOMetadataFactory.generateServiceStructuredData({
      name: 'diBoaS',
      description: 'x',
      category: 'y',
    });
    expect(JSON.stringify(service)).not.toMatch(/areaServed|"Offer"|OfferCatalog|offers/);
  });

  /** The free calculators' SoftwareApplication offer (price 0) is true: the tools ARE free. */
  const OFFER_ALLOWED = new Set(['lib/tools/structuredData.ts']);

  it('should leave no areaServed, Offer or offers in any other structured-data code', () => {
    const found: string[] = [];
    for (const f of webSourceFiles()) {
      if (OFFER_ALLOWED.has(f)) continue;
      const src = fs
        .readFileSync(path.join(WEB_SRC, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      if (/areaServed\s*:|'@type':\s*'Offer'|\boffers\s*:/.test(src)) found.push(f);
    }
    expect(found).toEqual([]);
  });
});

describe('step 2 · 2 — every English fallback equals the en value it backs', () => {
  it.each(PAGES)('should keep the %s fallback equal to its en catalogue value', (page) => {
    const spec = SERVICE_PAGES[page];
    expect(spec.fallback).toBe(at(catalogue('en', spec.namespace), DESCRIPTION_KEY));
  });

  it('should keep the shared fallbacks equal to their en catalogue values', () => {
    const common = catalogue('en', 'common');
    expect(STRUCTURED_DATA_FALLBACKS.category).toBe(at(common, 'seo.serviceCategory'));
    expect(STRUCTURED_DATA_FALLBACKS.home).toBe(
      at(catalogue('en', 'landing-b2c'), 'seo.jsonLd.breadcrumbHome')
    );
    for (const [key, value] of Object.entries(STRUCTURED_DATA_FALLBACKS.crumbs)) {
      expect(value, key).toBe(at(common, `navigation.landing.${key}`));
    }
  });

  it('should keep the landing app-description fallback equal to its en value', () => {
    const src = fs.readFileSync(path.join(WEB_SRC, PAGE_FILES.landing), 'utf8');
    const m = /jsonLd\.appDescription\s*\|\|\s*'([^']*)'/.exec(src);
    expect(m).not.toBeNull();
    expect(m![1]).toBe(at(catalogue('en', 'landing-b2c'), 'seo.jsonLd.appDescription'));
  });
});

/** Return-promise shapes the structured data must never carry (Voice Q3; 5.643's class). */
const PROMISE =
  /institutional[- ]grade|institutionell|nivel institucional|n[ií]vel institucional|access to [^.]{0,60}\breturns?\b|guaranteed returns?|risk[- ]free|garantierte rendite|rentabilidad garantizada|retorno garantido/i;

describe('step 2 · 3 — no return promise in structured-data copy', () => {
  it('should carry no return-promise shape in any seo.jsonLd string when the catalogues are read', () => {
    const found: string[] = [];
    for (const locale of LOCALES)
      for (const f of catalogueFiles(locale))
        walk(
          at(catalogue(locale, f.replace(/\.json$/, '')), 'seo.jsonLd'),
          'seo.jsonLd',
          (leaf, k) => {
            if (PROMISE.test(leaf)) found.push(`${locale}::${f}::${k} — ${leaf}`);
          }
        );
    expect(found).toEqual([]);
  });

  it('should carry no return-promise shape in a code literal of a structured-data file', () => {
    const found: string[] = [];
    for (const f of webSourceFiles()) {
      const src = fs.readFileSync(path.join(WEB_SRC, f), 'utf8');
      if (!/StructuredData|schema\.org/.test(src)) continue;
      for (const m of src.matchAll(LITERAL)) if (PROMISE.test(m[0])) found.push(`${f} — ${m[0]}`);
    }
    expect(found).toEqual([]);
  });
});

const CURRENCY = String.raw`(?:US\$|R\$|\$|€)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|EUR|USD|BRL)`;

/** (a) Keys that used to state the start figure, and must state none (5.748). */
const NO_FIGURE_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['faq', 'items.minimum.answer'],
  ['faq', 'items.understanding.answer'],
  ['landing-help', 'topics.gettingStarted.lead'],
  ['about', 'seo.description'],
  ['about', 'seo.ogDescription'],
  ['about', 'beliefs.startSmall.title'],
  ['landing-b2c', 'seo.description'],
  ['landing-b2c', 'seo.jsonLd.appDescription'],
];

/**
 * (b) A start/minimum word or a cap word within three words of a currency figure, in either
 * order. Measured 2026-11-05: catches every miss the fourth audit planted ("Start with just
 * $5", "For $5 you can begin", "Comece com apenas R$10", "The minimum is $10",
 * "Mindesteinzahlung 10 €", "max $25", "up to $25", "Obergrenze 25 €", "límite de 25 €", …).
 */
/** Word characters are Unicode letters (`u` flag): JavaScript's `\w` is ASCII-only, so "estratégia" would end a match early. */
const GAP = String.raw`(?:[\s,:]+[\p{L}\p{N}_\-]+){0,3}?[\s,:]+`;
const START = String.raw`(?:get\s+started|start[\p{L}\p{N}_]*|begin[\p{L}\p{N}_]*|from\s+as\s+little\s+as|as\s+little\s+as|minimum(?:\s+(?:is|of))?|min\.?|empie[\p{L}\p{N}_]*|empez[\p{L}\p{N}_]*|comienz[\p{L}\p{N}_]*|desde|m[ií]nimo|come[cç][\p{L}\p{N}_]*|a\s+partir\s+de|beginn[\p{L}\p{N}_]*|anf[aä]ng[\p{L}\p{N}_]*|ab|mindest[\p{L}\p{N}_]*)`;
const START_AFTER = String.raw`(?:begin[\p{L}\p{N}_]*|start[\p{L}\p{N}_]*|beginn[\p{L}\p{N}_]*|anf[aä]ng[\p{L}\p{N}_]*|empie[\p{L}\p{N}_]*|empez[\p{L}\p{N}_]*|come[cç][\p{L}\p{N}_]*)`;
const CAP_WORD = String.raw`(?:capped|cap(?:\s+of)?|max(?:imum)?\.?|up\s+to|tope|l[ií]mite|hasta|teto|at[eé]|gedeckelt|obergrenze|maximal|bis\s+zu|h[oö]chstens)`;
const FIGURE_CLAIM = [
  new RegExp(String.raw`\b${START}${GAP}(?:${CURRENCY})`, 'iu'),
  new RegExp(String.raw`(?:${CURRENCY})${GAP}(?:you\s+can\s+|du\s+)?${START_AFTER}\b`, 'iu'),
  new RegExp(String.raw`\b${CAP_WORD}${GAP}(?:${CURRENCY})`, 'iu'),
];
const statesFigureClaim = (text: string) => FIGURE_CLAIM.some((r) => r.test(text));

/** Figures that are examples, rules or limits of other products — named BY KEY with a reason. */
const FIGURE_ALLOW: ReadonlySet<string> = new Set([
  // fee examples ("start a strategy with $10,000 … we keep $0")
  'en::faq::items.catch.answer',
  'de::faq::items.catch.answer',
  'es::faq::items.catch.answer',
  'pt-BR::faq::items.catch.answer',
  'en::landing-b2b::fees.rows.invest.example',
  'de::landing-b2b::fees.rows.invest.example',
  'en::landing-b2c::fees.rows.strategies.example',
  'de::landing-b2c::fees.rows.strategies.example',
  'pt-BR::landing-b2c::fees.rows.strategies.example',
  // a fee comparison ("save up to $2.52 per $100")
  'en::landing-b2c::fees.rows.cashout.difference',
  'de::landing-b2c::fees.rows.cashout.difference',
  'es::landing-b2c::fees.rows.cashout.difference',
  'pt-BR::landing-b2c::fees.rows.cashout.difference',
  // another product's limit (deposit insurance "up to 100,000 EUR")
  'de::faq::items.vsBankSavings.answer',
  'es::faq::items.vsBankSavings.answer',
  'pt-BR::faq::items.vsBankSavings.answer',
  // a strategy's access rule ("Minimum $1,000 balance")
  'en::strategies::strategies.fullThrottle.accessRequirements',
  'de::strategies::strategies.fullThrottle.accessRequirements',
  'es::strategies::strategies.fullThrottle.accessRequirements',
  'pt-BR::strategies::strategies.fullThrottle.accessRequirements',
  // an illustration ("starting was never the $300")
  'en::learn-ten-percent::beat3.intro.1',
  'es::learn-ten-percent::beat3.intro.1',
  'pt-BR::learn-ten-percent::beat3.intro.1',
]);

describe('step 2 · 4 — no start/minimum figure, no cap (5.748, 5.103)', () => {
  it('should state no currency figure in the keys that used to state the start amount', () => {
    const found: string[] = [];
    for (const [ns, key] of NO_FIGURE_KEYS)
      for (const locale of LOCALES) {
        const value = at(catalogue(locale, ns), key);
        expect(value, `${locale}::${ns}::${key} missing`).toEqual(expect.any(String));
        if (new RegExp(CURRENCY).test(value as string))
          found.push(`${locale}::${ns}::${key} — ${value}`);
      }
    expect(found).toEqual([]);
  });

  it('should not claim "no minimum" on the Add Money row, which has one (FE-1b)', () => {
    for (const locale of LOCALES) {
      const value = at(catalogue(locale, 'landing-b2c'), 'fees.rows.adding.diboas') as string;
      expect(value, locale).not.toMatch(
        /\bmin\b|min\.|minimum|m[ií]nimo|mindest|any amount|qualquer valor|cualquier importe|beliebig/i
      );
    }
  });

  it('should put no start/minimum or cap word next to a figure outside the named examples', () => {
    const found: string[] = [];
    for (const locale of LOCALES)
      for (const f of catalogueFiles(locale)) {
        const ns = f.replace(/\.json$/, '');
        walk(catalogue(locale, ns), '', (leaf, key) => {
          const id = `${locale}::${ns}::${key}`;
          if (statesFigureClaim(leaf) && !FIGURE_ALLOW.has(id))
            found.push(`${id} — ${leaf.slice(0, 120)}`);
        });
      }
    for (const f of webSourceFiles())
      for (const m of fs.readFileSync(path.join(WEB_SRC, f), 'utf8').matchAll(LITERAL))
        if (statesFigureClaim(m[0])) found.push(`${f} — ${m[0].slice(0, 120)}`);
    expect(found).toEqual([]);
  });

  it('should keep every named example a real example (no stale allow entry)', () => {
    for (const id of FIGURE_ALLOW) {
      const [locale, ns, key] = id.split('::') as [Locale, string, string];
      expect(statesFigureClaim(at(catalogue(locale, ns), key) as string), id).toBe(true);
    }
  });

  it.each([
    'Get started with $5.',
    'Start with just $5.',
    'For $5 you can begin.',
    'Starte mit nur 5 €.',
    'Empieza con solo 5 €.',
    'Comece com apenas R$10.',
    'Começando com R$10.',
    'The minimum is $10',
    'Mindesteinzahlung 10 €',
    '0.39%, max $25',
    '0.39%, up to $25',
    '0,39%, Obergrenze 25 €',
    '0,39%, límite de 25 €',
    '0,39%, limite de R$25',
    /* Unicode words in the gap (fifth audit): an ASCII `\w` gap stops at the accent */
    'Começa já com só 10 €.',
    'Empieza ya, sólo con 5 €.',
  ])('should flag "%s" as a start figure or a cap (positive control)', (sample) => {
    expect(statesFigureClaim(sample)).toBe(true);
  });
});
