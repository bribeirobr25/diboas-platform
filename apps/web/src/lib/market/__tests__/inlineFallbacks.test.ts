/**
 * The /market views carry an English fallback beside every message key
 * (`t('key', 'fallback')`). It renders only when the key is missing, which is
 * exactly when nothing else is checking the copy. By 2026-10-18 fourteen had
 * drifted from the approved `en` text, including the methodology claim the
 * 2026-10-19 package corrected ("documented on diBoaS Analytics") and a
 * truncated regulatory disclaimer. Every fallback must equal its `en` string.
 *
 * Reads source text on purpose: the fallback is a literal in the component.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../../../../../..');
const VIEWS = join(ROOT, 'apps/web/src/app/[locale]/(landing)/market');
const I18N = join(ROOT, 'packages/i18n/translations/en');

type Tree = { [k: string]: string | Tree };
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    if (typeof v === 'string') acc[prefix + k] = v;
    else Object.assign(acc, flatten(v, `${prefix}${k}.`));
    return acc;
  }, {});
}
const en = (ns: string) => flatten(JSON.parse(readFileSync(join(I18N, `${ns}.json`), 'utf8')));

/** Every `t('key', 'literal')` call in a file (whitespace and line breaks tolerated). */
export function inlineFallbacks(source: string): Array<{ key: string; fallback: string }> {
  const flat = source.replace(/\s+/g, ' ');
  const re = /\bt\(\s*(['`])([a-zA-Z0-9_.]+)\1\s*,\s*'((?:[^'\\]|\\.)*)'/g;
  const found: Array<{ key: string; fallback: string }> = [];
  for (let m = re.exec(flat); m; m = re.exec(flat)) {
    found.push({ key: m[2], fallback: m[3].replace(/\\'/g, "'") });
  }
  return found;
}

/**
 * Each file's lookup chain, first match wins, mirroring the component: the
 * shell (and `StateViewSections`, which receives the shell's `t`) tries the
 * view's namespace before the shared `market` one.
 */
const FILES: Array<[file: string, chain: string[], minCalls: number]> = [
  ['MarketViewShell.tsx', ['market'], 40],
  ['UmbrellaView.tsx', ['market'], 20],
  ['StateViewSections.tsx', ['market-backdrop', 'market'], 4],
];

describe('/market inline fallbacks equal the approved en copy', () => {
  it.each(FILES)('%s', (file, chain, minCalls) => {
    const calls = inlineFallbacks(readFileSync(join(VIEWS, file), 'utf8'));
    // A floor, so a broken extractor cannot pass by finding nothing.
    expect(calls.length).toBeGreaterThanOrEqual(minCalls);
    const namespaces = chain.map(en);
    for (const { key, fallback } of calls) {
      const message = namespaces.map((m) => m[key]).find((v) => v !== undefined);
      expect(message, `${file}: ${key} has no en string`).toBeDefined();
      expect(fallback, `${file}: ${key}`).toBe(message);
    }
  });

  it('should extract a call split across lines', () => {
    const src = "t(\n  'a.b',\n  'It\\'s here'\n)";
    expect(inlineFallbacks(src)).toEqual([{ key: 'a.b', fallback: "It's here" }]);
  });
});

describe('/market metadata fallbacks equal the approved en copy', () => {
  // viewMetadata.ts serves one title/description fallback for every view when
  // a seo key is missing; it is the umbrella's approved copy, not a third text.
  const src = readFileSync(join(VIEWS, 'viewMetadata.ts'), 'utf8');
  const market = en('market');

  it('should use the umbrella seo.title as the title fallback', () => {
    const m = src.match(/seo\.title`\]\s*\?\?\s*'([^']+)'/);
    expect(m, 'title fallback not found').not.toBeNull();
    expect(m![1]).toBe(market['seo.title']);
  });

  it('should use the umbrella seo.description as the description fallback', () => {
    const m = src.match(/seo\.description`\]\s*\?\?\s*(?:\/\/[^\n]*\n\s*)?'([^']+)'/);
    expect(m, 'description fallback not found').not.toBeNull();
    expect(m![1]).toBe(market['seo.description']);
  });
});
