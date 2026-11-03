import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findPercentFormatViolations } from '@diboas/format';
import { SUPPORTED_LOCALES } from '@diboas/i18n/config';

/**
 * `5.729` · EVERY PERCENTAGE IS WRITTEN "7%".
 *
 * **Requirement:** founder ruling 2026-10-31 (decision record
 * `DR-2026-10-31-practice-projection-live-rates-and-percent-format`, P8): the % sign
 * comes right after the number, with no space, in every locale; a digit is never
 * followed by the spelled-out word. The rule lives once, in `@diboas/format`; the
 * Practice app's catalogues are held to the same function.
 *
 * Covers every translation file (subfolders such as `legal/` included) and the
 * /market editorial templates, which render user-facing sentences. Arrays are walked:
 * the translation validator does not descend into them (`5.733`).
 */

const REPO = resolve(__dirname, '../../../../../..');
const TRANSLATIONS = join(REPO, 'packages/i18n/translations');
const MARKET_TEMPLATES = join(REPO, 'apps/web/scripts/market-refresh/templates');

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

function* strings(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === 'string') yield [path, node];
  else if (Array.isArray(node)) {
    for (const [i, child] of node.entries()) yield* strings(child, `${path}[${i}]`);
  } else if (node && typeof node === 'object') {
    for (const [key, child] of Object.entries(node))
      yield* strings(child, path ? `${path}.${key}` : key);
  }
}

function violationsIn(files: string[]): string[] {
  return files.flatMap((file) =>
    [...strings(JSON.parse(readFileSync(file, 'utf8')) as unknown, '')].flatMap(([key, text]) =>
      findPercentFormatViolations(text).map(
        (v) => `${relative(REPO, file)} ${key}: ${v.kind} "${v.match}"`
      )
    )
  );
}

describe('5.729 · no website string writes a percentage any other way than "7%"', () => {
  it.each(SUPPORTED_LOCALES)(
    'should find no space before the sign and no spelled-out word after a digit in %s',
    (locale) => {
      expect(violationsIn(jsonFiles(join(TRANSLATIONS, locale)))).toEqual([]);
    }
  );

  it('should find none in the /market editorial templates', () => {
    expect(violationsIn(jsonFiles(MARKET_TEMPLATES))).toEqual([]);
  });

  it('should have read the catalogues, so a green result is not an empty one', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const files = jsonFiles(join(TRANSLATIONS, locale));
      expect(files.length, locale).toBeGreaterThan(30);
      expect(
        files.some((f) => f.includes('/legal/')),
        `${locale} legal/ subfolder`
      ).toBe(true);
    }
    expect(jsonFiles(MARKET_TEMPLATES).length).toBeGreaterThan(0);
  });
});
