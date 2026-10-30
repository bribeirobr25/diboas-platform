/**
 * Learn copy integrity across all four locales (register `5.655`, `5.656`).
 *
 * The Phase 4 batch extraction (PR #432) took the first quoted string on each locale's
 * source line. For the pt-BR / es / de share lines that string was the warning in the
 * parenthesis ("never 'share to unlock'"), so the forbidden phrase itself went live as the
 * share line; on one es tagline a trailing editing note went live with it. Both shipped
 * because the existing guard only checked that the value is a string.
 *
 * - The share line is a result the reader may pass on, never "share to unlock".
 * - No value carries an internal editing note (native-pass tags, founder dates, italic
 *   change notes).
 * - A share line never promises a guarantee (founder 2026-10-30, Talk 6). Inside the talk a
 *   "guaranteed" return is explained as interest no longer paid; the share line travels
 *   without that context, so there it reads as a promise (Voice Q3).
 * - Nor any other promise of safety (`5.703`): "guarant" alone let a German "dein Vermögen
 *   ist sicher" and an English "risk-free, sure-thing return" through. The phrases are whole
 *   promises, never bare everyday words ("seguro", "sicher", "certo" also mean insurance,
 *   safe, right), so legitimate copy cannot trip them; both directions are self-tested below.
 * - Every talk has a share line in every locale (`5.703`): a deleted line used to be skipped.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const UNLOCK_PHRASE = /desbloquear|freischalten|unlock/i;
const EDITING_NOTE = /NATIVE PASS|\[NPR\]|founder 20\d\d|\*\(/;
const GUARANTEE = /guarant|garant/i;
/** Whole promises of safety, per locale (en · pt-BR · es · de). */
const SAFETY_PROMISE = new RegExp(
  [
    "\\b(?:risk[- ]?free(?! rate)|riskless|free of risk|zero[- ]risk|no risk|without (?:any )?risk|sure[- ](?:thing|bet)|can(?:no|'|’)t lose|can never lose|won(?:'|’)t lose|assured (?:return|income|profit)|safe (?:return|bet|investment)|(?:your|the) money is safe)\\b",
    '(?:sem risco|risco zero|zero risco|livre de risco|(?:retorno|lucro|ganho) certo|rendimento seguro|não tem como perder|(?:aposta|investimento) segur[oa]|(?:seu|o) dinheiro (?:está|fica) seguro)',
    '(?:sin riesgo|riesgo cero|cero riesgo|libre de riesgo|(?:rentabilidad|ganancia) segura|(?:beneficio|rendimiento) seguro|no puedes perder|(?:apuesta|inversión) segura|(?:tu|el) dinero (?:está|queda) seguro)',
    '(?:risikofrei|risikolos|null[- ]risiko|kein risiko|ohne risiko|sichere (?:rendite|geldanlage|anlage)|sicherer gewinn|kannst nicht verlieren|(?:dein|ihr|das) (?:geld|vermögen|erspartes) (?:(?:ist|bleibt) )?sicher)',
  ].join('|'),
  'gi'
);
/** A negation before the phrase, in the same sentence, makes it an honest warning. */
const NEGATION =
  /\b(?:no|not|never|nothing|none|isn(?:'|’)t|nenhum|nenhuma|nunca|não|ningún|ninguna|nada|kein|keine|keiner|nie|niemals|nicht)\b[^.!?]*$/i;

/** True when the text promises safety: a promise phrase not negated earlier in its sentence. */
function promisesSafety(text: string): boolean {
  return [...text.matchAll(SAFETY_PROMISE)].some(
    (m) => !NEGATION.test(text.slice(0, m.index).split(/[.!?]/).pop() ?? '')
  );
}
const MIN_SHARE_LINE_LENGTH = 40;

/** Walk up from this test to the repo root and locate the translations dir. */
function findTranslationsDir(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'packages/i18n/translations');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations');
}

const translationsDir = findTranslationsDir();

function learnFiles(locale: string): string[] {
  return readdirSync(join(translationsDir, locale)).filter(
    (name) => name.startsWith('learn-') && name.endsWith('.json')
  );
}

function readJson(locale: string, file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(translationsDir, locale, file), 'utf-8'));
}

function* stringValues(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === 'string') {
    yield [path, node];
  } else if (Array.isArray(node)) {
    for (const [i, item] of node.entries()) yield* stringValues(item, `${path}.${i}`);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) yield* stringValues(value, `${path}.${key}`);
  }
}

describe('learn copy integrity (5.655, 5.656, 5.703)', () => {
  it('should flag a promise of safety in each locale, and pass everyday words and honest warnings', () => {
    for (const promise of [
      'a risk-free, sure-thing return',
      'a zero-risk plan',
      'your money is safe here',
      'you can never lose',
      'um retorno sem risco',
      'seu dinheiro está seguro',
      'zero risco',
      'una rentabilidad segura',
      'cero riesgo',
      'tu dinero está seguro',
      'so ist dein Vermögen sicher und wächst',
      'eine sichere Rendite',
      'risikolos anlegen',
      'Null-Risiko',
      'Ihr Geld ist sicher',
    ])
      expect(promisesSafety(promise), promise).toBe(true);
    for (const honest of [
      'Your savings are safe from inflation? Not quite.',
      'o seguro do carro',
      'Es ist sicher, dass Zinsen wirken.',
      'tienes razón, es lo correcto',
      'No investment is risk-free.',
      'Investing is never without risk.',
      'Keine Geldanlage ist risikofrei.',
      'Nenhum investimento é sem risco.',
      'Ninguna inversión es libre de riesgo.',
      'No risky bets here.',
      'the risk-free rate of a treasury bill',
    ])
      expect(promisesSafety(honest), honest).toBe(false);
  });

  it('should cover the seven talks in every locale', () => {
    for (const locale of LOCALES) expect(learnFiles(locale), locale).toHaveLength(7);
  });

  it.each(LOCALES)(
    'should give every %s share line a real result, never "share to unlock", a guarantee or a promise of safety',
    (locale) => {
      for (const file of learnFiles(locale)) {
        const json = readJson(locale, file) as { quiz?: { share?: { line?: string } } };
        const line = json.quiz?.share?.line;
        expect(typeof line, `${locale}/${file}: the share line is missing`).toBe('string');
        if (typeof line !== 'string') continue;
        expect(line, `${locale}/${file}`).not.toMatch(UNLOCK_PHRASE);
        expect(line, `${locale}/${file}`).not.toMatch(GUARANTEE);
        expect(promisesSafety(line), `${locale}/${file}: ${line}`).toBe(false);
        expect(line.length, `${locale}/${file}: "${line}"`).toBeGreaterThanOrEqual(
          MIN_SHARE_LINE_LENGTH
        );
      }
    }
  );

  it.each(LOCALES)('should never ship an internal editing note in %s learn copy', (locale) => {
    for (const file of learnFiles(locale)) {
      for (const [path, value] of stringValues(readJson(locale, file), file)) {
        expect(value, `${locale}/${path}`).not.toMatch(EDITING_NOTE);
      }
    }
  });
});
