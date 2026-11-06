import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ NO PUNCTUATION DASH IN WEBSITE COPY (register 5.803; anti-slop checklist: dashes are
 * "replaced on sight").
 *
 * The Practice app has had this guard (`apps/sandbox/src/i18n/__tests__/messages.test.ts`); the
 * website had none, so 66 em dashes and spaced en dashes sat in its catalogues. This fails any
 * em dash, or en dash used as punctuation (spaced), in any website catalogue string, except exact
 * texts whose owner approved them word for word — listed with the reason.
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

/** Exact approved texts (every locale): `namespace:key` → why the punctuation stays as approved. */
const EXACT: Record<string, string> = {
  'about:story.namedAfterHer': "the founder's own story line, kept word for word (Brand)",
  'protocols:why.text2':
    'founder-approved exact text (5.792, decisions/DR-2026-11-05-audit6-answers.md)',
};
/** Legal-owned pages: their wording is Legal's, never reworded for house style. */
const LEGAL_NAMESPACE = /^legal\//;

const DASH = /—|\s–\s/;

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

describe('5.803 · no punctuation dash in website copy', () => {
  it.each(LOCALES)(
    'should carry no em dash or spaced en dash outside exact approved texts (%s)',
    (locale) => {
      const found: string[] = [];
      for (const { ns, messages } of catalogues(locale)) {
        if (LEGAL_NAMESPACE.test(ns)) continue;
        for (const [key, value] of Object.entries(messages))
          if (DASH.test(value) && !(`${ns}:${key}` in EXACT))
            found.push(`${ns}:${key} = ${value.slice(0, 80)}`);
      }
      expect(found).toEqual([]);
    }
  );

  it('should keep every exact-text exception real in at least one locale (a stale one hides the next)', () => {
    for (const id of Object.keys(EXACT)) {
      const [ns, key] = id.split(':');
      const hit = LOCALES.some((l) =>
        DASH.test(catalogues(l).find((c) => c.ns === ns)?.messages[key] ?? '')
      );
      expect(hit, id).toBe(true);
    }
  });

  it('should tell a punctuation dash from a hyphen or a range (non-vacuity)', () => {
    expect(DASH.test('The rest — most of it — waits.')).toBe(true);
    expect(DASH.test('nur in Brasilien – dort')).toBe(true);
    expect(DASH.test('Cashflow-Investieren')).toBe(false);
    expect(DASH.test('2010–2016')).toBe(false);
  });
});
