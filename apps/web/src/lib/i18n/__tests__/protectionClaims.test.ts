import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ NO ONE-SIDED PROTECTION CLAIM ABOUT A CURRENCY (register 5.799; Voice Q3 — never promising).
 *
 * The es and de FAQ answers said money in diBoaS is "protected against local currency
 * devaluation", with no other side; the en answer and the founder-approved pt-BR answer state
 * both. This fails any website catalogue string with a SENTENCE that holds both a protection word
 * and a currency or purchasing-power word, in any locale, unless that exact text is listed below
 * after a reviewer read it — with its reason, or the register id that still owes its fix.
 *
 * Eighth audit: the first version caught 4 of 43 realistic claims (verb forms, accents, German
 * compounds, synonyms such as "hedge", "a salvo", "abgesichert"), and a reviewed key could gain a
 * new claim unnoticed. Words are now matched on accent-free lower-case text, within a sentence,
 * and every reviewed entry is pinned to its text.
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

/** Matched against accent-free, lower-case text (see `normalize`), so stems need no accents. */
const PROTECTION = new RegExp(
  [
    'prote[cgj]', // protect·ed·ion, proteger, protegido, proteja, proteção, protección
    'safeguard',
    'shield',
    'shelter',
    'insulat',
    '\\bhedg',
    'safe haven',
    '\\bsafe from',
    '\\bguard(?:s|ed|ing)?\\b[^.]{0,40}\\bagainst',
    '\\bsecur(?:e|ed|es|ing)\\b(?![- ]?(?:wallet|login|connection|data|code|password))',
    '\\w-(?:proof|resistant)',
    '\\bimmun(?:e|ity)\\b',
    '\\bimunes?\\b',
    '\\binmunes?\\b',
    'preserv',
    'store of value',
    'keeps? (?:its|their|your) value',
    '\\bbeat(?:s|ing)? inflation',
    'resguard',
    'abrigo',
    'refugio',
    'a salvo',
    'porto seguro',
    'puerto seguro',
    'escudo',
    'blind[aeo]', // blindar, blinde, blindado, blindagem
    'reserva de valor',
    'n(?:ao|o) (?:perdem?|pierden?) valor',
    'mant[eé]n? (?:tu|seu|o|el) valor',
    'venc[ae]r? a inflac',
    'vença a inflac',
    'cubr[eai]',
    'cobertura',
    'seguro (?:contra|frente)',
    '(?<!daten)schutz', // Schutz, schützt, geschützt, Inflationsschutz — not Datenschutz
    '(?<!ver)sicher(?:e|t|n|en)?\\b(?!heit)', // sichere, sichert, absichern, inflationssicher
    'gesichert',
    'sicherer hafen',
    'gefeit',
    'werterhalt',
    'wertstabil',
    'bleibt erhalten',
    'trotz(?:en|t)',
    '\\bbewahr(?!ung)', // bewahren — not Aufbewahrung / Bewährung
  ].join('|'),
  'u'
);
const CURRENCY = new RegExp(
  [
    'devalu',
    'desvaloriz',
    'abwertung',
    '(?<!be)wahrung', // Währung — not Aufbewahrung
    'currenc',
    'moeda',
    'moneda',
    'wechselkurs',
    'inflat',
    'inflac',
    'teuerung',
    'geldentwertung',
    'wertverlust',
    'kaufkraft',
    'purchasing power',
    'poder de compra',
    'poder adquisitivo',
    '\\bcambio\\b',
    'cambial',
    'cambiari',
    'tipo de cambio',
    'dolar',
    'dollar',
    '\\beuros?\\b',
    '\\bpesos\\b',
    '\\bdel peso\\b',
    '\\breais\\b',
    '\\b(?:o|do|no|ao) real\\b',
    'r\\$',
    '€',
    '\\$',
  ].join('|'),
  'u'
);

/** Accent-free and lower-case: "Protégete" → "protegete", "geschützt" → "geschutzt". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Sentences: split at . ! ? ; or a line break followed by space or the end (so a thousands separator never splits). */
function sentences(text: string): string[] {
  // An abbreviation's dot does not end a sentence (9th audit: "z.B.", "e.g.", "U.S." split claims).
  const kept = text.replace(/\b(?:z\.b|e\.g|i\.e|u\.s|d\.h|u\.a|p\.ex|etc|bzw|vs)\./gu, (m) =>
    m.replace(/\./g, '\u0000')
  );
  return kept.split(/[.!?;](?=\s|$)|\n/u);
}

const sha = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/**
 * Reviewed texts: `locale:namespace:key` → why it may stand (or the register id that owes its fix),
 * pinned to the exact text (`sha`, first 16 hex of SHA-256). Any edit to a reviewed text fails
 * until it is read again — a new claim cannot hide inside a reviewed key (8th audit).
 */
const REVIEWED: Record<string, { why: string; sha: string }> = {
  'pt-BR:faq:items.risk.answer': {
    why: 'a risk statement: the dollar may NOT protect the cash',
    sha: '7a73d8835420cbd1',
  },
  'pt-BR:faq:items.vsBankSavings.answer': {
    why: "a fact about the bank: the savings account's FGC deposit guarantee",
    sha: '1fb8a8cab49d6df9',
  },
  'en:protocols:cards.ethena.description': {
    why: 'technical: hedged positions (how USDe is built)',
    sha: '17a1f1ca91f5f7b3',
  },
  'pt-BR:protocols:cards.ethena.description': {
    why: 'technical: "posições protegidas" are hedged positions',
    sha: 'b0fd067eb42d3628',
  },
  'de:protocols:cards.ethena.description': {
    why: 'technical: "abgesicherte Positionen" are hedged positions',
    sha: 'e4fec3878bf12207',
  },
  'en:faq:items.protocolProblems.answer': {
    why: 'register 5.807: a track-record claim ("secured billions"), owed to the founder (Legal/Brand)',
    sha: '7d4e280b0b25047a',
  },
  'pt-BR:faq:items.protocolProblems.answer': {
    why: 'register 5.807: "protegeram bilhões de dólares", owed to the founder (Legal/Brand)',
    sha: '9f4601f37e4cbbea',
  },
  'es:faq:items.protocolProblems.answer': {
    why: 'register 5.807: "han protegido miles de millones de euros", owed to the founder',
    sha: '4315f5359df8e72d',
  },
  'de:faq:items.protocolProblems.answer': {
    why: 'register 5.807: "Milliarden von Euro gesichert", owed to the founder',
    sha: '297a3c8330bf12a8',
  },
  'pt-BR:landing-b2c:ptbr.hero.subtitle': {
    why: 'register 5.806: approved Brand hero copy ("Uma proteção" … "dólar digital"), owed to the founder',
    sha: 'a36f6956b3bb6d62',
  },
};

/** A short text (a hero, a tagline) is read whole: its fragments carry one meaning together. */
const SHORT_TEXT = 240;

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

/** True when one sentence — or a whole short text — holds a protection word and a currency word. */
export function protectsACurrency(text: string): boolean {
  const t = normalize(text);
  const both = (x: string) => PROTECTION.test(x) && CURRENCY.test(x);
  return sentences(t).some(both) || (text.length <= SHORT_TEXT && both(t));
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
      expect(sha(value as string), `${id}: the reviewed text changed — read it again`).toBe(
        REVIEWED[id].sha
      );
    }
  });

  it('should catch the shipped defect in each language and pass a two-sided answer (non-vacuity)', () => {
    expect(protectsACurrency('protegido contra la devaluación de la moneda local')).toBe(true);
    expect(protectsACurrency('geschützt vor lokaler Währungsabwertung')).toBe(true);
    expect(protectsACurrency('protected against local currency devaluation')).toBe(true);
    // 8th audit: verb forms, accents, compounds and synonyms (one per language at least).
    for (const claim of [
      'Proteja seu patrimônio da queda do real.',
      'Tus ahorros, a salvo de la inflación.',
      'Protégete de la devaluación del peso.',
      'A hedge against inflation.',
      'Your savings, inflation-proof.',
      'Dein Geld ist gegen Inflation abgesichert.',
      'Inflationsschutz für deine Ersparnisse in Euro.',
      'Ein sicherer Hafen für deine Kaufkraft.',
    ])
      expect(protectsACurrency(claim), claim).toBe(true);
    // 9th audit: 28 more claim forms (conjugations, idioms, compounds, abbreviations) — all caught.
    for (const claim of [
      'Your savings are safe from devaluation.',
      'Shelter your savings from currency swings.',
      'Immune to peso devaluation.',
      'Guard your savings against inflation.',
      'Secure your savings from inflation.',
      'Inflation-resistant savings in dollars.',
      'A store of value in digital dollars.',
      'Your dollars keep their value.',
      'Beat inflation with digital dollars.',
      'Seguro contra a inflação, em dólar.',
      'Blinde seu patrimônio contra o câmbio.',
      'Uma reserva de valor em dólar.',
      'Seu dinheiro em dólar não perde valor.',
      'Vença a inflação com dólares digitais.',
      'Cúbrete de la devaluación.',
      'Un seguro frente a la inflación.',
      'Mantén tu valor en dólares.',
      'Tus dólares no pierden valor.',
      'Sichere dein Geld vor Inflation.',
      'Inflationssicher sparen in Dollar.',
      'Gefeit gegen Inflation.',
      'Werterhalt in Dollar.',
      'Wertstabil in Dollar.',
      'Deine Kaufkraft bleibt erhalten.',
      'Der Inflation trotzen, mit Dollar.',
      'Schützt z.B. vor Inflation und Abwertung.',
      'We protect e.g. against inflation.',
      'Protection against a weak U.S. dollar.',
    ])
      expect(protectsACurrency(claim), claim).toBe(true);
    // An abbreviation's dot inside a LONG text (over the short-text length) must not split a claim.
    const padding =
      ' The rest of this answer talks about something else entirely, at length, so that the text is' +
      ' well over the short-text limit and only the sentence rule can find the pairing in it at all.';
    for (const claim of [
      'Schützt z.B. vor Inflation und Abwertung.',
      'We protect e.g. against inflation.',
      'Protection against a weak U.S. dollar.',
    ]) {
      const long = claim + padding + padding;
      expect(long.length).toBeGreaterThan(240);
      expect(protectsACurrency(long), long.slice(0, 40)).toBe(true);
    }
    // …and the 9th audit's false positives: one word, two lists, or an everyday homonym.
    for (const safe of [
      'Eine Versicherung kostet 10 Euro.',
      'Datenschutz kostet dich keinen Euro.',
      'Puedes cambiar el idioma para proteger tu cuenta.',
      'o peso da página e o dólar não mudam nada.',
      'Die Aufbewahrung erfolgt in einer Wallet, in Dollar.',
      'Der Sitz der Bewährung, 5 Euro.',
      'A bug bounty program on Immunefi, paid in dollars',
    ])
      expect(protectsACurrency(safe), safe).toBe(false);
    // …and a protection word in a neighbouring sentence of a long text is not a pairing.
    expect(
      protectsACurrency(
        'We protect your data with encryption and never sell it to anyone, for any reason, ever. ' +
          'Separately, and on a different subject entirely, the amounts in the tools are shown in the ' +
          'currency of your country so they are easier to read, compare and act on with confidence.'
      )
    ).toBe(false);
    expect(
      protectsACurrency(
        'If the dollar strengthens, the exchange rate works in your favor. If it moves the other way, it works against you.'
      )
    ).toBe(false);
  });
});
