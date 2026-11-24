/**
 * ⛑ LEDGER-CHAR-1 · the controls on the harness itself (plan P12 §4.1, §4.2, D11).
 *
 * 1. No write: nothing in the harness or the comparison writes a file; only the update setup
 *    (`scripts/characterization/updateSetup.ts`), loaded by its own config, may (sabotage (v)).
 * 2. Positive controls: every kind of observation appears in at least one golden, so a
 *    recorder that silently stopped recording one would fail here, not pass everywhere.
 * 3. The update setup refuses a Node major other than CI's (unless `CHAR_ALLOW_NODE` names the
 *    running one) and never writes the frozen PR-1 hashes.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const HERE = __dirname;
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === 'goldens'
        ? []
        : files(join(dir, e.name))
      : /\.ts$/.test(e.name)
        ? [join(dir, e.name)]
        : []
  );
const WRITES =
  /\b(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream|mkdirSync|rmSync|unlinkSync|renameSync|copyFileSync)\b|(?:from\s*|import\(\s*)['"](?:node:)?fs(?:\/promises)?['"]/;

describe('LEDGER-CHAR-1 · harness controls', () => {
  it('should find no file write in the harness or the comparison when the source is read', () => {
    const scanned = files(HERE).filter((f) => !f.endsWith('controls.test.ts'));
    expect(scanned.length).toBeGreaterThan(8);
    const writers = scanned.filter((f) => WRITES.test(stripComments(readFileSync(f, 'utf8'), f)));
    expect(writers).toEqual([]);
  });

  it('should recognise a write when one is planted, and pass a read (detector self-test)', () => {
    expect(WRITES.test("import { writeFileSync } from 'node:fs';")).toBe(true);
    expect(WRITES.test("await import('fs/promises')")).toBe(true);
    expect(WRITES.test("await import('node:fs')")).toBe(true);
    expect(WRITES.test("import { readFileSync } from 'fs';")).toBe(true);
    expect(WRITES.test('const x = writeFileSync;')).toBe(true);
    expect(WRITES.test("const golden = './goldens/x.json';")).toBe(false);
  });

  it('should still characterize every family recorded at PR-1 when the test files are read', () => {
    const frozen = JSON.parse(readFileSync(join(HERE, 'frozen.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const runners = readdirSync(HERE)
      .filter((f) => f.endsWith('.test.ts') && f !== 'controls.test.ts')
      .map((f) => stripComments(readFileSync(join(HERE, f), 'utf8'), f))
      .join('\n');
    const missing = Object.keys(frozen).filter(
      (family) => !runners.includes(`characterize('${family}'`)
    );
    expect(missing).toEqual([]);
  });

  it('should find every kind of observation in at least one golden when the goldens are read (positive controls)', () => {
    const goldens = readdirSync(join(HERE, 'goldens'))
      .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
      .map((f) => readFileSync(join(HERE, 'goldens', f), 'utf8'))
      .join('\n');
    for (const kind of [
      'id',
      'clock',
      'append',
      'project',
      'notify',
      'storage.set',
      'console',
      'feeFor',
      'count',
      'digest',
    ])
      expect(goldens, `a golden recording "${kind}"`).toContain(`"${kind}"`);
    // a refusal that logs, a side-store write, a throw, a mutation-free state: each seen at least once
    expect(goldens).toContain('ledger refused an event');
    expect(goldens).toContain('diboas.sandbox');
    expect(goldens).toContain('"throw"');
  });

  it('should refuse other Node majors and never write the frozen hashes when the update setup is read', () => {
    const file = join(HERE, '../../../../../../scripts/characterization/updateSetup.ts');
    const setup = stripComments(readFileSync(file, 'utf8'), file);
    expect(setup).toMatch(/REQUIRED_NODE_MAJOR = 24;/);
    // CHAR_ALLOW_NODE may name the running major (goldens were byte-identical on 22 and 24).
    expect(setup).toMatch(
      /major !== REQUIRED_NODE_MAJOR && process\.env\.CHAR_ALLOW_NODE !== String\(major\)/
    );
    // The frozen PR-1 hashes are never written by tooling (the comparison's anchor).
    expect(setup).not.toMatch(/frozen/);
  });
});
