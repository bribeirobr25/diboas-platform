import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flattenMessages } from '@diboas/i18n/server';

/**
 * ⚙ `validate:translations` READS ARRAY ITEMS (register 5.733).
 *
 * The validator skipped array items: a placeholder missing from one locale's array string
 * passed (and would render literally), and an item-count mismatch passed key parity, since a
 * whole array was one key. It now descends into arrays by index, the same `.0`, `.1` … keys
 * the site reads. `packages/i18n` has no test script, so its CommonJS validator is tested here.
 */

function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, 'packages/i18n/scripts/validate-translations.js'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not locate the repository root');
}
const ROOT = repoRoot();
const require = createRequire(import.meta.url);

interface Comparison {
  missing: string[];
  orphaned: string[];
  slotMismatches: Array<{ key: string; missing: string[]; extra: string[] }>;
}
const validator = require(join(ROOT, 'packages/i18n/scripts/validate-translations.js')) as {
  extractKeys: (obj: object) => string[];
  extractStringLeaves: (obj: object) => Map<string, string>;
  compareFile: (file: string, locale: string, ref: object, target: object) => Comparison;
};

const TRANSLATIONS = join(ROOT, 'packages/i18n/translations');
function catalogueFiles(locale: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (e.endsWith('.json')) out.push(relative(join(TRANSLATIONS, locale), full));
    }
  };
  walk(join(TRANSLATIONS, locale));
  return out.sort();
}
const read = (locale: string, file: string) =>
  JSON.parse(readFileSync(join(TRANSLATIONS, locale, file), 'utf8')) as object;

describe('5.733 · the translation validator reads array items', () => {
  it('should FAIL a placeholder missing from one locale inside an array string', () => {
    const ref = { beat1: { body: ['Plain text.', 'You would have {amount}.'] } };
    const target = { beat1: { body: ['Texto.', 'Você teria 2.252.'] } };
    const result = validator.compareFile('learn-x.json', 'pt-BR', ref, target);
    expect(result.slotMismatches).toEqual([
      { key: 'beat1.body.1', missing: ['amount'], extra: [] },
    ]);
  });

  it('should FAIL an item-count mismatch in either direction', () => {
    const ref = { quiz: { options: ['a', 'b', 'c'] } };
    expect(
      validator.compareFile('learn-x.json', 'de', ref, { quiz: { options: ['a', 'b'] } }).missing
    ).toEqual(['quiz.options.2']);
    expect(
      validator.compareFile('learn-x.json', 'de', ref, { quiz: { options: ['a', 'b', 'c', 'd'] } })
        .orphaned
    ).toEqual(['quiz.options.3']);
  });

  it('should PASS the Legal-owned LGPD eighth row, and only that row', () => {
    const row = { right: 'r', description: 'd' };
    const ref = { sections: { yourRights: { table: { rows: Array(7).fill(row) } } } };
    const eight = { sections: { yourRights: { table: { rows: Array(8).fill(row) } } } };
    const nine = { sections: { yourRights: { table: { rows: Array(9).fill(row) } } } };
    expect(validator.compareFile('legal/privacy.json', 'pt-BR', ref, eight).orphaned).toEqual([]);
    expect(validator.compareFile('legal/privacy.json', 'pt-BR', ref, nine).orphaned).toEqual([
      'sections.yourRights.table.rows.8.description',
      'sections.yourRights.table.rows.8.right',
    ]);
    // …and the exclusion is pt-BR's alone.
    expect(validator.compareFile('legal/privacy.json', 'de', ref, eight).orphaned).toHaveLength(2);
  });

  it('should report a message the site cannot read as missing: an empty object, a number, null (8th audit)', () => {
    const ref = { a: 'text {x}', b: 'plain', c: 'plain' };
    const target = { a: {}, b: 5, c: null };
    expect(validator.compareFile('x.json', 'de', ref, target).missing).toEqual(['a', 'b', 'c']);
  });

  it('should flatten exactly as the site reads: the keys parity uses equal flattenMessages, every catalogue ×4', () => {
    for (const locale of ['en', 'pt-BR', 'es', 'de'])
      for (const file of catalogueFiles(locale)) {
        const content = read(locale, file);
        const site = Object.keys(flattenMessages(content as never)).sort();
        expect(validator.extractKeys(content), `${locale}/${file}`).toEqual(site);
      }
  });

  it('should exclude the LGPD right itself: pt-BR row 8 is "Revisão de Decisões Automatizadas", en has 7', () => {
    const rows = (f: object) =>
      (f as { sections: { yourRights: { table: { rows: Array<{ right: string }> } } } }).sections
        .yourRights.table.rows;
    expect(rows(read('en', 'legal/privacy.json'))).toHaveLength(7);
    expect(rows(read('pt-BR', 'legal/privacy.json'))[7].right).toMatch(
      /decis(õ|o)es automatizadas/i
    );
  });

  it('should find every real catalogue in parity, array items included', () => {
    const issues: string[] = [];
    for (const locale of ['pt-BR', 'es', 'de'])
      for (const file of catalogueFiles('en')) {
        const r = validator.compareFile(file, locale, read('en', file), read(locale, file));
        for (const k of [...r.missing, ...r.orphaned]) issues.push(`${locale}/${file}: ${k}`);
        for (const m of r.slotMismatches) issues.push(`${locale}/${file}: slots ${m.key}`);
      }
    // REFERENCE_ONLY / LOCALE_SPECIFIC exclusions apply inside compareFile, as in the CLI.
    expect(issues).toEqual([]);
  });
});
