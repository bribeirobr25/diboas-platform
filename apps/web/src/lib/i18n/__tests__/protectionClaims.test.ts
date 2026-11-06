import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ NO ONE-SIDED PROTECTION CLAIM ABOUT A CURRENCY (register 5.799; Voice Q3 — never promising).
 *
 * The es and de FAQ answers said money in diBoaS is "protected against local currency
 * devaluation", with no other side; the en answer and the founder-approved pt-BR answer state
 * both. This fails any website catalogue string that puts a protection word within 80 characters
 * of a currency or devaluation word, in any locale, unless the sentence is listed below after a
 * reviewer read it — with its reason, or the register id that still owes its fix.
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

const PROTECTION =
  /\b(?:protect\w*|protegid\w*|proteg\w*|protecci[oó]n|prote[cç][aã]o|geschützt|schütz\w*|Schutz\w*|absicher\w*|blindad\w*|blindag\w*)/giu;
const CURRENCY =
  /(?:devalu\w*|desvaloriz\w*|devaluaci\w*|Abwertung\w*|Währung\w*|currenc\w*|moeda\w*|moneda\w*|inflat\w*|infla[cç]\w*|d[oó]lar\w*|dollar\w*|c[aâ]mbio|Wechselkurs\w*)/iu;

/** Reviewed sentences: `locale:namespace:key` → why it may stand (or the register id that owes its fix). */
const REVIEWED: Record<string, string> = {
  'pt-BR:faq:items.risk.answer': 'a risk statement — the dollar may NOT protect the cash',
  'pt-BR:protocols:cards.ethena.description':
    'technical: "posições protegidas" are hedged positions',
  'pt-BR:faq:items.protocolProblems.answer':
    'register 5.807 — a security track-record claim, owed to Legal/Brand',
  'pt-BR:landing-b2c:ptbr.hero.subtitle':
    'register 5.806 — approved Brand hero copy, owed to the founder',
};

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

/** True when a protection word sits within 80 characters of a currency word. */
export function protectsACurrency(text: string): boolean {
  for (const m of text.matchAll(PROTECTION)) {
    const start = m.index ?? 0;
    const window = text.slice(Math.max(0, start - 80), start + m[0].length + 80);
    if (CURRENCY.test(window)) return true;
  }
  return false;
}

describe('5.799 · no one-sided protection claim about a currency', () => {
  it.each(LOCALES)(
    'should pair no protection word with a currency word, unreviewed (%s)',
    (locale) => {
      const found: string[] = [];
      for (const { ns, messages } of catalogues(locale))
        for (const [key, value] of Object.entries(messages))
          if (protectsACurrency(value) && !(`${locale}:${ns}:${key}` in REVIEWED))
            found.push(`${locale}:${ns}:${key} = ${value.slice(0, 90)}`);
      expect(found).toEqual([]);
    }
  );

  it('should keep every reviewed entry real (a stale exception hides the next defect)', () => {
    for (const id of Object.keys(REVIEWED)) {
      const [locale, ns, key] = id.split(':');
      const value = catalogues(locale).find((c) => c.ns === ns)?.messages[key];
      expect(value, id).toBeDefined();
      expect(protectsACurrency(value as string), id).toBe(true);
    }
  });

  it('should catch the shipped defect in each language and pass a two-sided answer (non-vacuity)', () => {
    expect(protectsACurrency('protegido contra la devaluación de la moneda local')).toBe(true);
    expect(protectsACurrency('geschützt vor lokaler Währungsabwertung')).toBe(true);
    expect(protectsACurrency('protected against local currency devaluation')).toBe(true);
    expect(
      protectsACurrency(
        'If the dollar strengthens, the exchange rate works in your favor. If it moves the other way, it works against you.'
      )
    ).toBe(false);
  });
});
