import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DENIAL_EXCEPTIONS, excepted, staleExceptions } from '@/test/denialExceptions';
import { DENIAL_HINT, readsAsDenial } from '@/test/negation';

/**
 * ⚙ `CI-N4` · A BLOCKED MATERIAL CLAIM NEVER SHIPS IN ANY LOCALE.
 *
 * **Requirement:** traced to `LC-RR-01-10`, `LC-RR-01-11` and `Q-LEG-12` (the
 * authority texts live in the private canon). The engineering rule enforced:
 *
 *   1. An expectation-of-return phrase (e.g. "lower expected growth") ships
 *      only when it is modelled / assumption-qualified in the same clause.
 *   2. A guaranteed or promised return is never asserted with a figure.
 *
 * So the blocked thing is an **unqualified expectation of return**, not a word,
 * and qualified phrasing is compliant copy this gate must not fire on.
 *
 * ⚑ A NAIVE BANNED-WORD GREP IS INVALID HERE. Measured before this rule was
 * chosen: a bare guarantee/promise token matches **12 sandbox strings**, and
 * every one of them is a NEGATIVE statement the product deliberately carries —
 * `"returns aren't guaranteed"`, `"No promises live here"`, `"An assumption you
 * can check, not a promise."` A detector that cannot tell an assertion from its
 * denial would have made the compliant catalogue red, and the gate would have
 * been deleted rather than obeyed. (Since 2026-10-16 the detector no longer
 * classifies denials at all — an exact reviewed exception does,
 * `@/test/denialExceptions` — and this measurement is why rule 2 keeps its figure.)
 *
 * ⚑ SCOPE LIMIT (stated): rule 2 requires a FIGURE. A guarantee with no figure
 * ("Guaranteed growth for your goal.") is not detected here — that is the shape
 * the rule defines, not an oversight; widening it needs its own authority.
 *
 * ⚑ SCOPE LIMIT, STATED (the `SHELL-1` precedent): this lane owns the webapp.
 * The gate SCANS BOTH catalogues because the canonical invariant is repository-
 * wide, but only a webapp finding BLOCKS. A website finding is reported and
 * handed off — never suppressed, and never silently fixed from this lane.
 * **A repository-wide clean state is NOT claimed by this gate.**
 */

/* ── scope ────────────────────────────────────────────────────────────────── */

const SANDBOX_DIR = join(__dirname, '..', 'messages');
const WEBSITE_DIR = join(__dirname, '../../../../../packages/i18n/translations');

/**
 * ⚑ REACHABILITY IS A DEPENDENCY FACT HERE, NOT A PATH CONVENTION.
 * `apps/sandbox` declares `@diboas/banking|defi|investing` and imports
 * `@diboas/i18n` ZERO times — it carries its own catalogue. So
 * `packages/i18n/translations/**` is structurally unreachable from the Product
 * surface, which is what makes this boundary mechanical rather than a habit.
 */
const OWNER = { WEBAPP: 'WEBAPP', WEBSITE: 'WEBSITE' } as const;
type Owner = (typeof OWNER)[keyof typeof OWNER];

/* ── the rule ─────────────────────────────────────────────────────────────── */

/**
 * ⛑ A TOKEN STARTS A WORD (R4-11, independent review 2026-10-16). `promis\w*`
 * matched inside "compromisso" / "compromiso" and `ertrag` inside "Vertrag", so
 * "Sem compromisso, rendimento garantido de 8%." matched in the wrong place.
 * Tokens now require that no letter precedes them (Latin-1 letters included, so
 * accented words count as letters).
 */
const WORD_START = '(?<![A-Za-zÀ-ÖØ-öø-ÿ])';

/** Return/growth nouns across the four supported locales. */
const RETURN_TOKEN =
  WORD_START +
  '(?:growth|returns?|yield|gains?|rendite|ertrag|wachstum|gewinn|retorno|rendimento|crescimento|ganho|rendimiento|crecimiento|ganancia|rentabilidade?s?|rentabilidad(?:es)?|interest|juros|zinsen|intereses|apy|apr|earnings|profits?|lucros?)';

/**
 * Guarantee/promise stems across the four supported locales. `garant\w*` (not
 * `garanti[az]`) so Portuguese "garantimos" and German "garantiert" are both
 * seen (P0 review: "Garantimos" slipped through).
 */
const GUARANTEE_TOKEN =
  WORD_START + '(?:guarantee\\w*|promis\\w*|garant\\w*|promet\\w*|versprech\\w*|zugesicher\\w*)';

/**
 * An expectation of return — the authority's named phrase and its equivalents,
 * in BOTH word orders and the impersonal es/pt forms (P0 review: "growth
 * expected" and "Se espera un crecimiento" slipped through).
 */
const EXPECTATION = new RegExp(
  [
    `expected\\s+${RETURN_TOKEN}`,
    `${RETURN_TOKEN}s?\\s+(?:is\\s+|are\\s+)?expected`,
    `${RETURN_TOKEN}s?\\s+esperad[oa]s?`,
    `se\\s+espera\\w*\\s+(?:un\\s+|una\\s+)?${RETURN_TOKEN}`,
    `espera-se\\s+(?:um\\s+|uma\\s+)?${RETURN_TOKEN}`,
    `erwartete[srnm]?\\s+${RETURN_TOKEN}`,
  ].join('|'),
  'i'
);

/**
 * ⛑ A FIGURE WRITTEN AS WORDS IS A FIGURE (R4-11). "Garantierte Rendite von acht
 * Prozent." passed because only digits counted. Number words 0–100 in the four
 * locales, alone or combined ("twenty-five", "fünfundzwanzig", "vinte e cinco"),
 * followed by a percent word, now count.
 * SCOPE LIMIT (stated): other number forms — "doubles your money", fractions,
 * "half" — are not figures here.
 */
const NUMBER_WORDS = [
  /* en */ 'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred',
  /* de */ 'null|eins|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert',
  /* es */ 'cero|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte|veinti[a-zé]+|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento',
  /* pt */ 'um|uma|dois|duas|três|quatro|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|oitenta|cem',
]
  .join('|')
  .split('|')
  .sort((a, b) => b.length - a.length)
  .join('|');
const FIGURE_WORDS = new RegExp(
  `${WORD_START}(?:${NUMBER_WORDS})(?:(?:[\\s-]+(?:y|e|und|and)[\\s-]+|[\\s-]+|und)(?:${NUMBER_WORDS}))*\\s*(?:%|percent|per\\s?cent|prozent|por\\s+ciento|por\\s+cento)`,
  'i'
);
/** A percentage, in digits or in words — the figure a direct guarantee attaches to. */
const PERCENT_FIGURE = `\\d+(?:[.,]\\d+)?\\s?%|${FIGURE_WORDS.source}`;
const FIGURE = new RegExp(`${PERCENT_FIGURE}|\\d`, 'i');

/** A guaranteed/promised return asserted with a figure attached. */
const GUARANTEED_RETURN = new RegExp(
  [
    `${GUARANTEE_TOKEN}[^.!?]{0,60}?${RETURN_TOKEN}`,
    `${RETURN_TOKEN}[^.!?]{0,60}?${GUARANTEE_TOKEN}`,
    /* ⛑ "We guarantee 8% a year." — a guarantee word directly before a percentage, no return noun
       (R4 correction) — in digits OR in words: "We guarantee eight percent a year." passed while the
       digit form was caught (R4-11, third review). One percentage definition, shared with FIGURE. */
    `${GUARANTEE_TOKEN}[^.!?]{0,30}?(?:${PERCENT_FIGURE})`,
  ].join('|'),
  'i'
);

/**
 * Modelled / assumption-qualified language — the compliant form of rule 1
 * (requirement ids `LC-RR-01-11`, `Q-LEG-12`).
 *
 * ⛑ WHOLE WORDS (R4-11). `proje[cç]` / `projekt` matched "project" / "Projekt" /
 * "projeto" — all meaning PROJECT — so "Expected returns of 9% on this project."
 * read as qualified. Only projection words count now.
 * SCOPE LIMIT (stated): this checks that a qualifier WORD is present. Whether the
 * qualified statement is acceptable in its context stays a manual review.
 */
const QUALIFIED = new RegExp(
  `${WORD_START}(?:illustrat|model+ed|modell|assum|hypothetic|simulat|not a forecast|annahme|veranschaulich|ilustrat|suposi|simulad|hipot|projection|projected|projeç|projetad|proyecci|proyectad|projektion|projiziert)`,
  'i'
);

type Rule = 'UNQUALIFIED_EXPECTATION' | 'GUARANTEED_RETURN';

/**
 * ⛑ CLAUSE-SCOPED (PB-3). A qualifier ANYWHERE in the string used to qualify
 * every claim in it ("Expected returns of 9% a year. Illustrative." passed). Each
 * clause is judged on its own.
 *
 * ⛑ SEPARATORS (R4-11). A clause also ends at `…`, at a dash with or without
 * spaces, and at a full stop followed directly by a capital ("No fees.Guaranteed …").
 */
/**
 * ⛑ RULE 2 IS JUDGED PER SENTENCE, RULE 1 PER CLAUSE (R4 correction, independent
 * review 2026-10-16). Splitting every rule at `—`, `…` and `:` cut
 * "Guaranteed return—8% a year." into two halves, neither holding both the
 * guarantee and the figure, so the claim passed; `:`, a decimal point and
 * "ca." / "p.a." did the same before R4. A sentence ends only at `.` `!` `?`
 * followed by a space, a capital or the end — never at a decimal point or a
 * known abbreviation. Clauses (`;` `:` `…` dashes) bound only the QUALIFIER's
 * reach for rule 1, so a qualifier in one clause does not qualify another.
 */
const ABBREVIATION =
  /\b(?:ca|approx|aprox|bzw|etc|vs)\.|\bp\.\s?a\.|\bz\.\s?B\.|\be\.g\.|\bi\.e\./gi;
function sentencesOf(text: string): string[] {
  const t = text.replace(/(\d)\.(\d)/g, '$1,$2').replace(ABBREVIATION, (m) => m.replace(/\./g, ''));
  return t.split(/[.!?](?=\s|[A-ZÀ-Þ]|$)/);
}
/* \`/\` bounds a qualifier's reach like a dash (R4-11, third review): "Expected returns of 8% /
   Simulated examples below." used to read as qualified. Rule 2 is judged per SENTENCE and is never
   split here, so a guaranteed return keeps its figure across a slash. */
const CLAUSE_BREAK = /[;:](?=\s|$)|…|\s*[—–/]\s*/;

/**
 * ⛑ NO INFERRED DENIAL DECIDES ANYTHING (PB-3 exact-text denial exceptions,
 * founder decision 2026-10-16). A negation "attached" to the claim used to
 * excuse it — "There is no guaranteed return of 8%." — and the same inference
 * excused real claims ("No return under 8%, guaranteed."). A detected claim now
 * FAILS unless an exact, reviewed exception covers it; `readsAsDenial` only adds
 * a hint to the failure message.
 *
 * ⛑ NO QUESTION-MARK EXEMPTION (R4-12, approved 2026-10-16). Any clause ending in
 * `?` used to be exempt from rule 2, so "Why settle for less than guaranteed
 * returns of 8%?" passed while the same sentence with a full stop was caught.
 * Punctuation alone never excuses a detected claim. A legitimate question that
 * is flagged goes to review, and — if cleared — to an exact-text exception. The
 * detector's result is never a Legal determination.
 */
/** The whole decision, in one place, so both catalogues are judged identically. */
function blockedClaimIn(text: string): Rule | null {
  for (const raw of sentencesOf(text)) {
    const sentence = raw.trim();
    if (!sentence) continue;
    for (const clause of sentence.split(CLAUSE_BREAK).map((c) => c.trim())) {
      if (clause && !QUALIFIED.test(clause) && EXPECTATION.test(clause))
        return 'UNQUALIFIED_EXPECTATION';
    }
    if (FIGURE.test(sentence) && GUARANTEED_RETURN.test(sentence)) return 'GUARANTEED_RETURN';
  }
  return null;
}

/** The failure-message hint: does a negation word come before the claim? Never a pass. */
function denialHint(text: string, locale?: string): string {
  const at = Math.min(
    ...[EXPECTATION, GUARANTEED_RETURN].map((rx) => {
      const m = rx.exec(text);
      return m
        ? m.index + m[0].length
        : Infinity; /* up to the END of the claim — "Returns are never guaranteed" */
    })
  );
  return Number.isFinite(at) && readsAsDenial(text, at, locale) ? ` — ${DENIAL_HINT}` : '';
}

/* ── corpus ───────────────────────────────────────────────────────────────── */

interface Finding {
  owner: Owner;
  ref: string;
  rule: Rule;
  text: string;
}

function leaves(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      leaves(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

function scan(
  dir: string,
  owner: Owner
): { findings: Finding[]; strings: number; unreadable: string[]; files: string[] } {
  const findings: Finding[] = [];
  const unreadable: string[] = [];
  let strings = 0;
  const files: Array<{ path: string; ref: string; locale: string }> = [];

  if (owner === OWNER.WEBAPP) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      files.push({
        path: join(dir, f),
        ref: f.replace(/\.json$/, ''),
        locale: f.replace(/\.json$/, ''),
      });
    }
  } else {
    /* `TRANSLATORS.md` sits beside the locale directories — entries, not names. A locale's
       subfolders (`legal/`) are part of its catalogue: they were skipped until 2026-10-31,
       the same gap the GENIUS wall had (`5.725`). */
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const localeDir = join(dir, entry.name);
      const jsons = (readdirSync(localeDir, { recursive: true }) as string[])
        .map((f) => f.replace(/\\/g, '/'))
        .filter((f) => f.endsWith('.json'))
        .sort();
      for (const f of jsons) {
        files.push({
          path: join(localeDir, f),
          ref: `${entry.name}/${f.replace(/\.json$/, '')}`,
          locale: entry.name,
        });
      }
    }
  }

  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file.path, 'utf8'));
    } catch {
      /* A catalogue the gate cannot read is a catalogue it did not check —
         recorded, never skipped silently (PB-3). */
      unreadable.push(file.ref);
      continue;
    }
    for (const [key, text] of leaves(parsed)) {
      strings += 1;
      const rule = blockedClaimIn(text);
      if (rule && !excepted('CI-N4', rule, file.locale, key, text))
        findings.push({
          owner,
          ref: `${file.ref}::${key}`,
          rule,
          text: text + denialHint(text, file.locale),
        });
    }
  }
  return { findings, strings, unreadable, files: files.map((f) => f.ref) };
}

const webapp = scan(SANDBOX_DIR, OWNER.WEBAPP);
const website = scan(WEBSITE_DIR, OWNER.WEBSITE);

/* ── the gate ─────────────────────────────────────────────────────────────── */

describe('CI-N4 · the detector itself, before any zero it reports is believed', () => {
  it('should FAIL on a blocked claim, and leave a figure-less guarantee outside rule 2 (the two required controls)', () => {
    expect(blockedClaimIn('Guaranteed return of 8%')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Returns are not guaranteed.')).toBeNull();
  });

  it('should block a claim whatever negation word stands near it (closure review)', () => {
    expect(blockedClaimIn('Guaranteed return of 8%, no fees.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Expected returns of 9%, no fees.')).toBe('UNQUALIFIED_EXPECTATION');
    expect(blockedClaimIn('No fees and a guaranteed return of 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Returns of 9%, no fees, guaranteed.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('No fees and guaranteed returns of 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Sem taxas e retorno garantido de 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('No fees, guaranteed return of 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Returns without fees are guaranteed at 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Not only guaranteed returns of 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('No fees on deposits or guaranteed returns of 8%.')).toBe(
      'GUARANTEED_RETURN'
    );
    expect(blockedClaimIn('No fees for a deposit or a guaranteed return of 8%.')).toBe(
      'GUARANTEED_RETURN'
    );
    expect(blockedClaimIn('Rendimento sem taxas garantido de 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('Eine Rendite ohne Gebühren von 8 % ist garantiert.')).toBe(
      'GUARANTEED_RETURN'
    );
    expect(blockedClaimIn('No ano, rendimento garantido de 8%.')).toBe('GUARANTEED_RETURN');
    expect(blockedClaimIn('No ano rendimento esperado de 8%.')).toBe('UNQUALIFIED_EXPECTATION');
  });

  /**
   * ⛑ INVERTED (R4-10). These denials used to be EXCUSED by the negation rule. A
   * denial that carries a detected claim shape now passes only as an exact,
   * reviewed exception — so each is BLOCKED here, and its message says it reads
   * like a denial so a reviewer knows what to check.
   */
  it('should BLOCK an unreviewed denial that carries a claim shape, with the denial hint', () => {
    for (const [text, locale, rule] of [
      ['There is no guaranteed return of 8%.', 'en', 'GUARANTEED_RETURN'],
      ['This is not a guaranteed 8% return.', 'en', 'GUARANTEED_RETURN'],
      ['Returns are never guaranteed, even at 8%.', 'en', 'GUARANTEED_RETURN'],
      ['Renditen sind nicht garantiert, auch nicht 8 %.', 'de', 'GUARANTEED_RETURN'],
      ['Keine garantierte Rendite von 8 %.', 'de', 'GUARANTEED_RETURN'],
      ['La rentabilidad no está garantizada, ni siquiera un 8 %.', 'es', 'GUARANTEED_RETURN'],
      ['O retorno não é garantido, nem mesmo 8%.', 'pt-BR', 'GUARANTEED_RETURN'],
      ['Returns are neither promised nor guaranteed, even at 8%.', 'en', 'GUARANTEED_RETURN'],
      ['No hay rendimiento garantizado del 8 %.', 'es', 'GUARANTEED_RETURN'],
      ['No hay rendimiento esperado garantizado.', 'es', 'UNQUALIFIED_EXPECTATION'],
    ] as const) {
      expect(blockedClaimIn(text), text).toBe(rule);
      expect(denialHint(text, locale), text).toContain(DENIAL_HINT);
    }
    /* A guarantee word WITHOUT a figure is outside rule 2 by its stated scope — not a pass by inference. */
    expect(blockedClaimIn('Returns are not guaranteed.')).toBeNull();
  });

  it('should not read the Portuguese contraction "no" ("in the") as a denial, even in the hint', () => {
    expect(blockedClaimIn('Rendimento esperado de 8% no ano.')).toBe('UNQUALIFIED_EXPECTATION');
    expect(denialHint('No ano, rendimento esperado de 8%.', 'pt-BR')).toBe('');
    expect(denialHint('No hay rendimiento esperado.', 'es')).toContain(DENIAL_HINT);
  });

  /** R4-10 / R4-11 / R4-12 — the claim shapes the independent review found excused. */
  it('should BLOCK the natural claim shapes the inferred excuses used to pass', () => {
    for (const text of [
      'No compromises, guaranteed returns of 8%.',
      'Sem compromisso, rendimento garantido de 8%.',
      'Sin compromiso, rendimiento garantizado del 8 %.',
      'Ohne Vertrag, garantierte Rendite von 8 %.',
      'No fees (guaranteed return of 8%).',
      'Guaranteed (not promised) returns of 8%.',
      'Guaranteed, not promised, returns of 8% a year.',
      'No return under 8%, guaranteed.',
      'No guaranteed return below 8%.',
      'No expected growth below 9% a year.',
      'Fees? No… guaranteed return of 8%.',
      'No fees.Guaranteed return of 8%.',
      'No fees—guaranteed returns of 8%.',
      'Why settle for less than guaranteed returns of 8%?',
      "Isn't expected growth of 9% great?",
      'Expected returns of 9% on this project.',
      'Rendimento esperado de 9% no seu projeto.',
      'Garantierte Rendite von acht Prozent.',
      'Guaranteed returns of twenty-five percent.',
      'Rendimento garantido de vinte e cinco por cento.',
      'Rendimiento garantizado del ocho por ciento.',
      'Garantierte Rendite von fünfundzwanzig Prozent.',
      /* R4 correction · a sentence-internal break must not split the claim from its figure */
      'Guaranteed return—8% a year.',
      'Guaranteed returns… 8% a year.',
      'Guaranteed return: 8%.',
      'Rendimento garantido: 8% ao ano.',
      'Guaranteed return – 8%',
      'Guaranteed return of approx. 8% a year.',
      'Garantierte Rendite von ca. 8 %.',
      'Guaranteed 8% p.a. return.',
      'Guaranteed 8.5% returns.',
      'We guarantee 8% a year.',
      /* R4-11 · third review: a guarantee directly before a percentage WRITTEN AS WORDS */
      'We guarantee eight percent a year.',
      'Garantimos oito por cento ao ano.',
      'Wir garantieren acht Prozent im Jahr.',
      'Garantizamos un ocho por ciento al año.',
      /* R4-11 · third review: "/" bounds a qualifier's reach like a dash does */
      'Expected returns of 8% / Simulated examples below.',
      'Expected returns of 8%/simulated examples below.',
      /* …and never splits a guaranteed return from its figure (rule 2 stays per sentence) */
      'Guaranteed returns / 8% a year.',
      /* R4 correction · return words the second review found missing */
      'Guaranteed interest of 5% a year.',
      'Juros garantidos de 8%.',
      'Garantierte Zinsen von 4 %.',
      'Intereses garantizados del 6 %.',
      'Guaranteed 5% APY.',
      'Guaranteed earnings of 7%.',
      'Lucro garantido de 10%.',
      /* R4-11 · "rentabilidad" / "rentabilidade" was not a return word at all */
      'Rentabilidad garantizada del 8 %.',
      'Rentabilidade garantida de 8%.',
      /* the shapes only the return word catches: figure before the guarantee, and rule 1 */
      'Una rentabilidad del 8 % garantizada.',
      'Rentabilidad esperada del 8 % al año.',
      'Rentabilidade esperada de 8% ao ano.',
    ]) {
      expect(blockedClaimIn(text), text).not.toBeNull();
    }
  });

  it('should judge a question exactly like the statement (R4-12)', () => {
    expect(blockedClaimIn('Why settle for less than guaranteed returns of 8%?')).toBe(
      blockedClaimIn('Why settle for less than guaranteed returns of 8%.')
    );
    expect(blockedClaimIn('Why settle for less than guaranteed returns of 8%?')).toBe(
      'GUARANTEED_RETURN'
    );
  });

  it('should NOT match a token inside another word (R4-11)', () => {
    /* No claim shape at all once "compromisso" / "Vertrag" stop matching. */
    /* "compromisso" carries "promis"; with a return word and a figure in the clause, only the
       word-start rule keeps it from reading as a promised return. */
    expect(blockedClaimIn('Sem compromisso, o rendimento histórico foi de 8%.')).toBeNull();
    expect(blockedClaimIn('Ohne Vertrag und ohne Gebühr von 8 %.')).toBeNull();
    /* A real projection word still qualifies; "project" does not. */
    expect(blockedClaimIn('An illustrative projection of expected growth.')).toBeNull();
    /* A qualifier in the SAME clause as the expectation still qualifies it, slash or not (R4-11). */
    expect(blockedClaimIn('An illustrative / simulated projection of expected growth.')).toBeNull();
  });

  it('should hold NO stale CI-N4 exception (inventory 2026-10-16: none needed)', () => {
    const lookupWebapp = (locale: string, key: string): string | undefined => {
      try {
        const parsed = JSON.parse(readFileSync(join(SANDBOX_DIR, `${locale}.json`), 'utf8'));
        return leaves(parsed).find(([k]) => k === key)?.[1];
      } catch {
        return undefined;
      }
    };
    expect(
      staleExceptions('CI-N4', lookupWebapp, (rule, text) => blockedClaimIn(text) === rule)
    ).toEqual([]);
    expect(DENIAL_EXCEPTIONS.filter((e) => e.guard === 'CI-N4')).toHaveLength(0);
  });

  it('should accept modelled / assumption-qualified phrasing and block the unqualified one', () => {
    /* Rule 1: blocked UNQUALIFIED, compliant qualified. */
    expect(blockedClaimIn('The steadier path, with lower expected growth.')).toBe(
      'UNQUALIFIED_EXPECTATION'
    );
    expect(
      blockedClaimIn('An illustrative projection of lower expected growth — not a forecast.')
    ).toBeNull();
  });

  it('should judge each clause on its own (PB-3 planted probes)', () => {
    for (const [text, rule] of [
      ['No fees. Expected returns of 9% a year.', 'UNQUALIFIED_EXPECTATION'],
      ['Simulated plan: expected growth of 9% a year.', 'UNQUALIFIED_EXPECTATION'],
      ['Steady growth expected for your goal.', 'UNQUALIFIED_EXPECTATION'],
      ['Se espera un crecimiento constante.', 'UNQUALIFIED_EXPECTATION'],
      ['Espera-se um crescimento de 8% ao ano.', 'UNQUALIFIED_EXPECTATION'],
      ['Garantimos um rendimento de 8% ao ano.', 'GUARANTEED_RETURN'],
      ['Rendite von 7 % garantiert.', 'GUARANTEED_RETURN'],
    ] as const) {
      expect(blockedClaimIn(text), text).toBe(rule);
    }
  });

  it('should not fire on the compliant NEGATIVE statements the catalogue carries', () => {
    for (const kept of [
      "That's normal, and returns aren't guaranteed.",
      'No promises live here. The numbers are history and current rates, not the future.',
      'An assumption you can check, not a promise.',
      'Renditen sind nicht garantiert.',
    ]) {
      expect(blockedClaimIn(kept), kept).toBeNull();
    }
  });

  it('should have actually read both catalogues — an empty scan proves nothing', () => {
    expect(webapp.strings, 'the sandbox catalogue scan was empty').toBeGreaterThan(1_000);
    expect(website.strings, 'the website catalogue scan was empty').toBeGreaterThan(10_000);
  });

  it('should read every website file, the legal pages in their subfolder included', () => {
    for (const locale of ['en', 'pt-BR', 'es', 'de'])
      expect(website.files, locale).toContain(`${locale}/legal/privacy`);
  });

  it('should fail on a webapp catalogue it cannot parse, never skip it (PB-3)', () => {
    expect(webapp.unreadable, 'unreadable webapp catalogue(s)').toEqual([]);
  });
});

describe('CI-N4 · WEBAPP scope — findings here BLOCK', () => {
  /**
   * ⚑ WHAT A GREEN RUN HERE DOES AND DOES NOT MEAN.
   *
   * It means no string in the sandbox catalogue matches either DETECTED CLASS
   * — an unqualified expectation of return, or a guaranteed/promised return
   * asserted with a figure (rules 1 and 2 above).
   *
   * It does NOT mean the catalogue is clear of every conceivable misleading
   * claim. Suitability, advice and legal eligibility are not decided by CI —
   * they remain manual gates. A newly blocked SHAPE needs a new rule here,
   * added with its own measured baseline and its own planted positive.
   */
  it('should ship no claim of either DETECTED class in any sandbox locale', () => {
    const listed = webapp.findings.map((f) => `${f.rule}  ${f.ref}\n      ${f.text}`).join('\n');
    expect(webapp.findings.length, `blocked claim(s) in the webapp catalogue:\n${listed}`).toBe(0);
  });
});

describe('CI-N4 · WEBSITE scope — findings REPORT and hand off, and never block', () => {
  /**
   * ⛑ NON-VACUITY NO LONGER DEPENDS ON WEBSITE COPY (PB-3). This block used to
   * assert that a known website phrase was STILL present — which meant the
   * Website lane fixing that copy (register 5.451) would turn this WEBAPP gate
   * red. Non-vacuity now comes from the in-test planted probes above, and the
   * website half is purely a report: it never asserts that a defect persists.
   * Website content is not edited from this lane.
   */
  it('should report every website finding visibly, as a handoff', () => {
    if (website.findings.length > 0) {
      const lines = website.findings
        .map((f) => `  [${f.rule}] ${f.ref}\n      ${f.text}`)
        .join('\n');
      console.warn(
        `\nCI-N4 · WEBSITE FINDINGS (${website.findings.length}) — REPORT ONLY, NOT A PRE-I2 BLOCKER\n` +
          `Owner: Website / Growth. Related register rows: 5.451, 5.112.\n${lines}\n`
      );
    }
    if (website.unreadable.length > 0) {
      console.warn(`CI-N4 · WEBSITE catalogues not readable: ${website.unreadable.join(', ')}`);
    }
    /* Reported, never asserted to zero and never asserted to persist. */
    expect(Array.isArray(website.findings)).toBe(true);
  });
});
