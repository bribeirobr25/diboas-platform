import { createHash } from 'node:crypto';
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

/**
 * Exact approved texts: `namespace:key` → why the punctuation stays, and each locale's text pinned
 * (first 16 hex of SHA-256). An edit to an approved text fails until it is approved again
 * (8th audit: a key-level exception let new dashes into the approved text unseen).
 */
const EXACT: Record<string, { why: string; texts: Record<string, string> }> = {
  'about:story.namedAfterHer': {
    why: "the founder's own story line, kept word for word (Brand)",
    texts: {
      en: 'fc646dd606ecff83',
      'pt-BR': '598193948d56b65d',
      es: '86274a93357a69c8',
      de: 'ad8e01efa9e22780',
    },
  },
  'protocols:why.text2': {
    why: 'founder-approved exact text (5.792, decisions/DR-2026-11-05-audit6-answers.md)',
    texts: {
      en: '52373f6256aad29f',
      'pt-BR': 'c7ed968771a6aff5',
      es: '3866f8f3b7c0936c',
      de: 'fcf64d8eabec96bf',
    },
  },
};
/** Legal-owned pages: their wording is Legal's, never reworded for house style. */
const LEGAL_NAMESPACE = /^legal\//;

/**
 * A punctuation dash in any of its forms: em dash, horizontal bar, figure dash, two- and three-em
 * dashes, a double hyphen, an `&mdash;` entity, an en dash, minus sign or hyphen standing between
 * spaces, or an en dash joining two letters ("Brasil–dort"). An en dash between digits is a range
 * and a hyphen inside a word is a hyphen: both pass (8th audit widened the forms).
 */
const DASH = /—|―|‒|⸺|⸻|--|&mdash;|&#8212;|\s[–−-]\s|\p{L}–\p{L}/u;
const sha = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);

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
          if (DASH.test(value) && EXACT[`${ns}:${key}`]?.texts[locale] !== sha(value))
            found.push(`${ns}:${key} = ${value.slice(0, 80)}`);
      }
      expect(found).toEqual([]);
    }
  );

  it('should keep every exact-text exception real and unchanged: each pinned text still matches, and holds a dash', () => {
    for (const [id, { texts }] of Object.entries(EXACT)) {
      const [ns, key] = id.split(':');
      for (const [locale, pinned] of Object.entries(texts)) {
        const value = catalogues(locale).find((c) => c.ns === ns)?.messages[key] ?? '';
        expect(sha(value), `${locale}:${id} changed — approve it again`).toBe(pinned);
        expect(DASH.test(value), `${locale}:${id} holds no dash — drop the exception`).toBe(true);
      }
    }
  });

  it('should tell a punctuation dash from a hyphen or a range (non-vacuity)', () => {
    expect(DASH.test('The rest — most of it — waits.')).toBe(true);
    expect(DASH.test('nur in Brasilien – dort')).toBe(true);
    expect(DASH.test('Cashflow-Investieren')).toBe(false);
    expect(DASH.test('2010–2016')).toBe(false);
    // 8th audit: the forms that slipped through the first version.
    for (const form of [
      'Brasil–dort',
      'a ― b',
      'a ‒ b',
      'a ⸺ b',
      'a -- b',
      'a &mdash; b',
      'a − b',
      'Demo - diBoaS',
    ])
      expect(DASH.test(form), form).toBe(true);
    expect(DASH.test('−3')).toBe(false); // a minus sign on a number
    expect(DASH.test('S&P 500')).toBe(false);
  });
});
