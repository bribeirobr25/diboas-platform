import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

/**
 * `5.814` · ONE AGE, ONE ORIGIN, ONE PLACE THAT PICKS A RATE LINE (plan P10,
 * guards 3 and 8).
 *
 * The defect `5.814` fixed was a rate line chosen by ORIGIN alone, in two
 * components. These source scans keep both halves of the fix structural:
 *
 * ```text
 * guard 3  view/strategy.ts ages a rate only through currentFacingTimeState (no
 *          second age derivation — system gate X1) and reads origin only through
 *          the provenance path (no provider name, 5.440)
 * guard 8  no other source file names a rate-line message id, so no surface can
 *          pick a line by origin again
 * ```
 *
 * Comments are stripped first: prose naming a concept is not a dependency.
 */

const SRC = join(__dirname, '..', '..');
const DEFI_SRC = join(SRC, '..', '..', '..', 'packages', 'defi', 'src');
const codeOf = (file: string) => stripComments(readFileSync(file, 'utf8'));
const VIEW = join(SRC, 'view', 'strategy.ts');

/** The parameter lists of every call to `name(` in `code`, split at top-level commas. */
function callArguments(code: string, name: string): string[][] {
  const calls: string[][] = [];
  let from = 0;
  for (;;) {
    const at = code.indexOf(`${name}(`, from);
    if (at < 0) return calls;
    let depth = 0;
    let current = '';
    const args: string[] = [];
    for (const ch of code.slice(at + name.length + 1)) {
      if (depth === 0 && ch === ')') break;
      if ('({['.includes(ch)) depth += 1;
      if (')}]'.includes(ch)) depth -= 1;
      if (depth === 0 && ch === ',') {
        args.push(current);
        current = '';
      } else current += ch;
    }
    if (current.trim()) args.push(current);
    calls.push(args);
    from = at + name.length;
  }
}

describe('5.814 · guard 3 · view/strategy.ts derives age and origin once', () => {
  const code = codeOf(VIEW);

  it('should age a rate only through currentFacingTimeState', () => {
    expect(code).toMatch(/\bcurrentFacingTimeState\b/);
    for (const banned of [
      'isRefusedForCurrentFacingUse',
      'freshnessUnder',
      'dataFreshness',
      'DEFAULT_PRACTICE_REFERENCE_POLICY',
    ]) {
      expect(
        new RegExp(`\\b${banned}\\b`).test(code),
        `${banned} in view/strategy.ts would be a second age derivation (X1)`
      ).toBe(false);
    }
  });

  it('should call currentFacingTimeState with exactly a stamp and a clock', () => {
    /* No policy argument: one policy for every leg would bypass per-source
       resolution, which is the only place a stricter contract can win. */
    const calls = callArguments(code, 'currentFacingTimeState');
    expect(calls.length, 'the call is present').toBeGreaterThan(0);
    for (const args of calls) expect(args).toHaveLength(2);
  });

  it('should hold no date arithmetic of its own', () => {
    for (const banned of [/Date\.parse\b/, /\.getTime\(/, /86_?400_?000/, /\bDAY_MS\b/]) {
      expect(code, String(banned)).not.toMatch(banned);
    }
  });

  it('should read origin only through the provenance path, never a provider name', () => {
    /* 5.440: liveness is a property of the stamp. `'fixture'` stays allowed — the
       provenance origin type spells it. */
    expect(code).not.toMatch(/\.source\b/);
    expect(code).not.toMatch(/['"`](?:defillama|coingecko)['"`]/);
    expect(code).toMatch(/\bstrategyProvenance\(/);
  });

  it('should define the refusal through the age state in @diboas/defi', () => {
    const defi = codeOf(join(DEFI_SRC, 'currentFacing.ts'));
    const start = defi.indexOf('export function isRefusedForCurrentFacingUse(');
    expect(start).toBeGreaterThanOrEqual(0);
    const body = defi.slice(start, defi.indexOf('\n}', start));
    expect(body).toMatch(/currentFacingTimeState\(/);
    expect(body).not.toMatch(/freshnessUnder\(/);
  });
});

/** Every non-test source file of the Practice app, relative to `src/`. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('5.814 · guard 8 · only view/strategy.ts names a rate-line message', () => {
  const RATE_LINE_ID = /goalNew\.apy[A-Z]\w*/;
  const files = sourceFiles(SRC);

  it('should scan the app source (the guard is not vacuous)', () => {
    expect(files.length).toBeGreaterThan(50);
    expect(codeOf(VIEW)).toMatch(RATE_LINE_ID);
  });

  it('should find no rate-line id anywhere else', () => {
    const elsewhere = files
      .filter((file) => file !== VIEW && RATE_LINE_ID.test(codeOf(file)))
      .map((file) => relative(SRC, file).split(sep).join('/'));
    expect(
      elsewhere,
      'a surface that names a rate line can choose it by origin again (5.814); render RateLine'
    ).toEqual([]);
  });
});
