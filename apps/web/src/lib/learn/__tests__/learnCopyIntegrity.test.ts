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
    "risk[- ]?free|no risk|zero risk|without (?:any )?risk|sure[- ]thing|can(?:no|'|’)t lose|assured (?:return|income|profit)|safe (?:return|bet|investment)",
    'sem risco|risco zero|(?:retorno|lucro|ganho) certo|não tem como perder|(?:aposta|investimento) seguro',
    'sin riesgo|riesgo cero|(?:rentabilidad|ganancia) segura|beneficio seguro|no puedes perder|(?:apuesta|inversión) segura',
    'risikofrei|ohne risiko|null risiko|sichere (?:rendite|geldanlage)|sicherer gewinn|kannst nicht verlieren|dein (?:geld|vermögen|erspartes) (?:ist )?sicher',
  ].join('|'),
  'i'
);
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
  it('should flag a promise of safety in each locale, and pass the everyday words', () => {
    for (const promise of [
      'a risk-free, sure-thing return',
      'um retorno sem risco',
      'una rentabilidad segura',
      'so ist dein Vermögen sicher und wächst',
      'eine sichere Rendite',
    ])
      expect(promise).toMatch(SAFETY_PROMISE);
    for (const everyday of [
      'Your savings are safe from inflation? Not quite.',
      'o seguro do carro',
      'Es ist sicher, dass Zinsen wirken.',
      'tienes razón, es lo correcto',
    ])
      expect(everyday).not.toMatch(SAFETY_PROMISE);
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
        expect(line, `${locale}/${file}`).not.toMatch(SAFETY_PROMISE);
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
