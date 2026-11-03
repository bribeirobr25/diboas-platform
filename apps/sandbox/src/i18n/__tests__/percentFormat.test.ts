import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findPercentFormatViolations } from '@diboas/format';
import { SANDBOX_LOCALES } from '@/i18n/config';

/**
 * `5.729` · EVERY PERCENTAGE IS WRITTEN "7%".
 *
 * **Requirement:** founder ruling 2026-10-31 (decision record
 * `DR-2026-10-31-practice-projection-live-rates-and-percent-format`, P8): the % sign
 * comes right after the number, with no space, in every locale; a digit is never
 * followed by the spelled-out word. The rule itself lives once, in `@diboas/format`
 * (`findPercentFormatViolations`); the website's catalogues are held to the same
 * function (`apps/web/src/lib/i18n/__tests__/percentFormat.test.ts`).
 *
 * The raw JSON is walked, arrays included, so no string can sit outside the scan.
 */

const MESSAGES_DIR = join(__dirname, '..', 'messages');

function* strings(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === 'string') yield [path, node];
  else if (Array.isArray(node)) {
    for (const [i, child] of node.entries()) yield* strings(child, `${path}[${i}]`);
  } else if (node && typeof node === 'object') {
    for (const [key, child] of Object.entries(node))
      yield* strings(child, path ? `${path}.${key}` : key);
  }
}

const catalogue = (locale: string) =>
  JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')) as unknown;

describe('5.729 · no catalogue string writes a percentage any other way than "7%"', () => {
  it.each(SANDBOX_LOCALES)(
    'should find no space before the sign and no spelled-out word after a digit in %s',
    (locale) => {
      const found = [...strings(catalogue(locale), '')].flatMap(([key, text]) =>
        findPercentFormatViolations(text).map((v) => `${key}: ${v.kind} "${v.match}"`)
      );
      expect(found).toEqual([]);
    }
  );

  it('should have read every catalogue, so a green result is not an empty one', () => {
    for (const locale of SANDBOX_LOCALES) {
      const all = [...strings(catalogue(locale), '')];
      expect(all.length, locale).toBeGreaterThan(500);
      /* The fee lines carry a percentage in every locale: the scan saw them. */
      expect(
        all.some(([, text]) => /\d%/u.test(text)),
        locale
      ).toBe(true);
    }
  });
});
