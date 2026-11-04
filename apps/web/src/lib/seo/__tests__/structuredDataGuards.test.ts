/**
 * Step 2 guards (registers 5.643, 5.748, 5.103) — what the website states in its structured
 * data and about money to start, read as RESOLVED values and as source.
 *
 * 1. Class: every page's Service description comes from its catalogue, through ONE builder;
 *    the resolved objects carry no `areaServed` and no `Offer` / `offers`.
 * 2. Fallback: every English fallback literal equals the en catalogue value it backs.
 * 3. Promise: no return-promise shape ("institutional-grade", "access to … returns") in any
 *    structured-data copy, catalogue or code.
 * 4. Figure: (a) the keys that used to state a start/minimum figure carry no currency figure
 *    and the Add Money row claims no "no minimum"; (b) no start/minimum verb or cap word
 *    stands next to a currency figure anywhere in the catalogues or the web code, except the
 *    examples named below BY KEY (never by pattern).
 * Requirement sources: FEES.md FE-1 (no caps), FE-1a (floors), FE-1b (a minimum add-money
 * amount exists — so "no minimum" is false); the founder's Q2 "remove the figure" and the
 * step-2 wording approval (DR-2026-11-05-step2-wording-approval).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEOMetadataFactory } from '../metadata-factory';
import { buildPageStructuredData, STRUCTURED_DATA_FALLBACKS } from '../pageStructuredData';

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
function webSourceFiles(): string[] {
  return (fs.readdirSync(WEB_SRC, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.test\.|\.stories\.)/.test(f));
}

/** The pages that describe the diBoaS service, and the catalogue key each one reads. */
const PAGES = [
  { file: 'app/[locale]/(landing)/page.tsx', ns: 'landing-b2c', crumb: undefined },
  { file: 'app/[locale]/(landing)/about/page.tsx', ns: 'landing-b2c', crumb: 'about' },
  { file: 'app/[locale]/(landing)/business/page.tsx', ns: 'landing-b2b', crumb: 'forBusiness' },
  { file: 'app/[locale]/(landing)/protocols/page.tsx', ns: 'protocols', crumb: 'protocols' },
  { file: 'app/[locale]/(landing)/strategies/page.tsx', ns: 'strategies', crumb: 'strategies' },
] as const;
const DESCRIPTION_KEY = 'seo.jsonLd.serviceDescription';

describe('step 2 · 1 — structured data comes from the catalogue, through one builder', () => {
  it('should build every Service in the page locale with the catalogue description, category and crumbs when a page renders', async () => {
    for (const locale of LOCALES) {
      const common = catalogue(locale, 'common');
      for (const page of PAGES) {
        const description = at(catalogue(locale, page.ns), DESCRIPTION_KEY) as string;
        expect(description, `${locale}/${page.ns}: ${DESCRIPTION_KEY}`).toBeTruthy();
        const { service, breadcrumbs } = await buildPageStructuredData(locale, {
          description,
          descriptionFallback: 'unused',
          crumb: page.crumb ? { key: page.crumb, url: '/x' } : undefined,
        });
        expect(service.description).toBe(description);
        expect(service.category).toBe(at(common, 'seo.serviceCategory'));
        expect(service.name).toBe('diBoaS');
        const names = breadcrumbs.itemListElement.map((i) => i.name);
        expect(names[0]).toBe(at(catalogue(locale, 'landing-b2c'), 'seo.jsonLd.breadcrumbHome'));
        if (page.crumb) expect(names[1]).toBe(at(common, `navigation.landing.${page.crumb}`));
      }
    }
  });

  it('should make every service page read its description from the catalogue when building structured data', () => {
    for (const page of PAGES) {
      const src = fs.readFileSync(path.join(WEB_SRC, page.file), 'utf8');
      expect(src, `${page.file} builds its Service directly`).not.toMatch(
        /generateServiceStructuredData\s*\(/
      );
      const call = src.slice(src.indexOf('buildPageStructuredData('));
      expect(call, `${page.file} does not use the builder`).not.toBe('');
      expect(call.slice(0, 400), `${page.file}: description not from the catalogue`).toMatch(
        /description:\s*\w*(?:Messages\?\.seo\?\.jsonLd\?\.|jsonLd\.)serviceDescription/
      );
    }
  });

  it('should emit no areaServed and no Offer when a Service object is built', () => {
    const service = SEOMetadataFactory.generateServiceStructuredData({
      name: 'diBoaS',
      description: 'x',
      category: 'y',
    });
    const json = JSON.stringify(service);
    expect(json).not.toMatch(/areaServed|"Offer"|OfferCatalog|offers/);
  });

  /** The free calculators' SoftwareApplication offer (price 0) is true: the tools ARE free. */
  const OFFER_ALLOWED = new Set(['lib/tools/structuredData.ts']);

  it('should leave no areaServed, Offer or offers in the structured data of the service pages and the app', () => {
    const found: string[] = [];
    for (const f of webSourceFiles()) {
      if (OFFER_ALLOWED.has(f)) continue;
      const src = fs
        .readFileSync(path.join(WEB_SRC, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      if (!/schema\.org/.test(src)) continue;
      if (/areaServed\s*:|'@type':\s*'Offer'|\boffers\s*:/.test(src)) found.push(f);
    }
    expect(found).toEqual([]);
  });
});

describe('step 2 · 2 — every English fallback equals the en value it backs', () => {
  it('should keep each page fallback equal to its en catalogue value when the key is present', () => {
    for (const page of PAGES) {
      const src = fs.readFileSync(path.join(WEB_SRC, page.file), 'utf8');
      const m = /descriptionFallback:\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/.exec(src);
      expect(m, `${page.file}: no descriptionFallback literal`).not.toBeNull();
      const literal = (m![2] as string).replace(/\\'/g, "'");
      expect(literal, page.file).toBe(at(catalogue('en', page.ns), DESCRIPTION_KEY));
    }
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
    const src = fs.readFileSync(path.join(WEB_SRC, 'app/[locale]/(landing)/page.tsx'), 'utf8');
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
const NO_FIGURE_KEYS: ReadonlyArray<readonly [string, string, ReadonlyArray<Locale>]> = [
  ['faq', 'items.minimum.answer', LOCALES],
  ['faq', 'items.understanding.answer', LOCALES],
  ['landing-help', 'topics.gettingStarted.lead', LOCALES],
  ['about', 'seo.description', LOCALES],
  ['about', 'seo.ogDescription', LOCALES],
  ['about', 'beliefs.startSmall.title', LOCALES],
  ['landing-b2c', 'seo.description', LOCALES],
  ['landing-b2c', 'seo.jsonLd.appDescription', LOCALES],
];

/** (b) A start/minimum verb, or a cap word, right next to a currency figure. */
const START: Record<Locale, string> = {
  en: String.raw`\b(?:start(?:ing)?(?:\s+(?:at|with|from))?|begin(?:ning)?\s+with|from\s+(?:as\s+little\s+as\s+)?|as\s+little\s+as|minimum(?:\s+of)?)\s+`,
  es: String.raw`\b(?:empie(?:za|zas|ce)\s+con|empezar\s+con|desde|m[ií]nimo\s+de)\s+`,
  'pt-BR': String.raw`\b(?:come(?:ce|çar|ça)\s+com|a\s+partir\s+de|m[ií]nimo\s+de)\s+`,
  de: String.raw`\b(?:start(?:e|en)?\s+mit|beginn\w*\s+mit|ab|mindestens|Mindestbetrag\s+(?:von\s+)?)\s+`,
};
const CAP = new RegExp(
  String.raw`\b(?:capped|cap\s+of|tope|gedeckelt|teto)\b[^.]{0,30}(?:${CURRENCY})`,
  'i'
);
function statesStartFigure(locale: Locale, text: string): boolean {
  if (CAP.test(text)) return true;
  if (new RegExp(`${START[locale]}(?:${CURRENCY})`, 'i').test(text)) return true;
  return (
    locale === 'de' &&
    new RegExp(`(?:${CURRENCY})\\s+(?:beginnst|startest|anfängst)`, 'i').test(text)
  );
}
/** Figures that are examples or rules, not a start claim — named BY KEY with their reason. */
const FIGURE_ALLOW: ReadonlySet<string> = new Set([
  'en::landing-b2b::fees.rows.invest.example', // fee example: what investing $10,000 costs ($0)
  'de::faq::items.catch.answer', // fee examples ("mit 10.000 € startest … 0 €")
  'en::strategies::strategies.fullThrottle.accessRequirements', // a strategy's access rule
  'es::strategies::strategies.fullThrottle.accessRequirements', // a strategy's access rule
  'pt-BR::strategies::strategies.fullThrottle.accessRequirements', // a strategy's access rule
]);

describe('step 2 · 4 — no start/minimum figure, no cap (5.748, 5.103)', () => {
  it('should state no currency figure in the keys that used to state the start amount', () => {
    const found: string[] = [];
    for (const [ns, key, locales] of NO_FIGURE_KEYS)
      for (const locale of locales) {
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
      expect(value, locale).not.toMatch(/minimum|mínimo|Mindest/i);
    }
  });

  it('should put no start/minimum verb or cap word next to a figure outside the named examples', () => {
    const found: string[] = [];
    for (const locale of LOCALES)
      for (const f of catalogueFiles(locale)) {
        const ns = f.replace(/\.json$/, '');
        walk(catalogue(locale, ns), '', (leaf, key) => {
          const id = `${locale}::${ns}::${key}`;
          if (statesStartFigure(locale, leaf) && !FIGURE_ALLOW.has(id))
            found.push(`${id} — ${leaf.slice(0, 120)}`);
        });
      }
    for (const f of webSourceFiles())
      for (const m of fs.readFileSync(path.join(WEB_SRC, f), 'utf8').matchAll(LITERAL))
        if (statesStartFigure('en', m[0])) found.push(`${f} — ${m[0].slice(0, 120)}`);
    expect(found).toEqual([]);
  });

  it('should keep every named example a real example (no stale allow entry)', () => {
    for (const id of FIGURE_ALLOW) {
      const [locale, ns, key] = id.split('::') as [Locale, string, string];
      expect(statesStartFigure(locale, at(catalogue(locale, ns), key) as string), id).toBe(true);
    }
  });
});
