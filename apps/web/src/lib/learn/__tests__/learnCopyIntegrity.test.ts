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
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const UNLOCK_PHRASE = /desbloquear|freischalten|unlock/i;
const EDITING_NOTE = /NATIVE PASS|\[NPR\]|founder 20\d\d|\*\(/;
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

describe('learn copy integrity (5.655, 5.656)', () => {
  it('should cover the seven talks in every locale', () => {
    for (const locale of LOCALES) expect(learnFiles(locale), locale).toHaveLength(7);
  });

  it.each(LOCALES)(
    'should give every %s share line a real result, never "share to unlock"',
    (locale) => {
      for (const file of learnFiles(locale)) {
        const json = readJson(locale, file) as { quiz?: { share?: { line?: string } } };
        const line = json.quiz?.share?.line;
        if (line === undefined) continue;
        expect(line, `${locale}/${file}`).not.toMatch(UNLOCK_PHRASE);
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
