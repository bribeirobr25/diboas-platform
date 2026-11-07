import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { parseSource, stripComments } from '@diboas/test-support';

/**
 * `stripComments` feeds CI-N1, CI-N3 and PRU-1: whatever it blanks, those
 * guards can never see. So the property under test is two-sided: every comment
 * goes, and NO code goes.
 *
 * ⛑ R4-3 (independent review, 2026-10-16). Walking INTO a JSDoc node made the
 * trivia scanner start inside `/** … // old *\/`, read `// old *\/ const …` as a
 * line comment, and blank the real code after the closing `*\/`:
 * `/** @deprecated // old *\/ const kycStatus = verifyKyc(u);` came back empty.
 */

/** The code tokens of a source, in order — comments and whitespace excluded. */
function codeTokens(text: string, fileName: string): string[] {
  const sf = parseSource(text, fileName);
  const out: string[] = [];
  const walk = (node: ts.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode)
      return;
    const kids = node.getChildren(sf);
    if (kids.length === 0) {
      if (node.kind !== ts.SyntaxKind.EndOfFileToken) out.push(node.getText(sf).trim());
      return;
    }
    kids.forEach(walk);
  };
  walk(sf);
  return out.filter(Boolean);
}

const JSDOC_CASES = [
  '/** @deprecated // old */ const kycStatus = verifyKyc(u);',
  '/** @type {string} // note */ const kycStatus = verifyKyc(u);',
  '/** @param x // the thing */ function f(x) { return verifyKyc(x); }',
  '/** @see https://example.com/kyc */ const kycStatus = verifyKyc(u);',
  '/** {@link http://example.com} */ const kycStatus = verifyKyc(u);',
  '/** @template T // generic */ const kycStatus = verifyKyc(u);',
];

describe('stripComments · removes comments and never code', () => {
  it.each(JSDOC_CASES)('should keep the code after a one-line JSDoc: %s', (src) => {
    const out = stripComments(src);
    expect(out, 'the code after the JSDoc was blanked').toContain('verifyKyc(');
    expect(out).not.toMatch(/@deprecated|@type|@param|@see|@link|@template/);
  });

  it('should keep URLs in strings, nested templates, regex literals and JSX text', () => {
    const src = [
      'const a = "https://x/kyc"; const kycA = 1;',
      'const b = `${`${"//inner"}`}`; const kycB = 2; // trailing',
      'const c = /\\/\\/not-a-comment/; const kycC = 3; /* block */',
    ].join('\n');
    const out = stripComments(src);
    for (const keep of [
      'https://x/kyc',
      'kycA',
      '"//inner"',
      'kycB',
      '/\\/\\/not-a-comment/',
      'kycC',
    ])
      expect(out).toContain(keep);
    expect(out).not.toContain('trailing');
    expect(out).not.toContain('block');
    const jsx = stripComments('const v = <p> // docs</p>; const kycD = 4;', 'x.tsx');
    expect(jsx).toContain('// docs');
    expect(jsx).toContain('kycD');
  });

  /**
   * The corpus check: across every file the three guards read, the stripped
   * output has EXACTLY the original's code tokens and no comment left.
   */
  it('should preserve every code token of the real corpus the guards scan', () => {
    /* The files CI-N1, CI-N3 and PRU-1 read: the sandbox source and the investing package (CI-N3's seam). */
    const roots = [
      resolve(__dirname, '../..'),
      resolve(__dirname, '../../../../../packages/investing/src'),
    ];
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) files.push(p);
      }
    };
    roots.forEach(walk);
    expect(files.length, 'an empty corpus proves nothing').toBeGreaterThan(200);
    const lost: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      const before = codeTokens(text, f);
      const after = codeTokens(stripComments(text, f), f);
      if (before.join('\u0000') !== after.join('\u0000')) lost.push(f);
    }
    expect(lost, 'stripComments changed the code of these files').toEqual([]);
    /* Parses every file twice: ~6.5 s under the full suite (measured 2026-10-16), so it gets its own budget. */
  }, 60_000);
});

/**
 * 5.623 · ONE comment stripper. A test that rolls its own `//` regex truncates its scan at the
 * first URL or string holding `//`, so the guard misses whatever follows (the defect `5.493` fixed
 * in six guards survived in 21 more). Every test file in every workspace is parsed; a regex
 * literal passed to `.replace(` that removes `//…` to the end of a line FAILS. Matching a pattern
 * (`.match`) and stripping CSS block comments are not stripping TypeScript comments: they pass.
 */
describe('5.623 · every source-scanning test strips comments through @diboas/test-support', () => {
  const REPO = resolve(__dirname, '../../../../..');
  const LINE_COMMENT_REGEX = new RegExp(['\\\\/\\\\/', '(?:\\.\\*\\$|\\[\\^\\\\n\\]\\*)'].join(''));

  /** Regex literals handed to `.replace(` that delete `//` line comments, in one source text. */
  function ownStrippers(text: string, fileName: string): string[] {
    const found: string[] = [];
    const visit = (n: ts.Node) => {
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        n.expression.name.text === 'replace' &&
        n.arguments[0] &&
        ts.isRegularExpressionLiteral(n.arguments[0]) &&
        LINE_COMMENT_REGEX.test(n.arguments[0].text)
      )
        found.push(n.arguments[0].text);
      ts.forEachChild(n, visit);
    };
    visit(parseSource(text, fileName));
    return found;
  }

  it('should find no test file with its own // comment stripper', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.test\.tsx?$/.test(name)) files.push(p);
      }
    };
    for (const ws of ['apps', 'packages'])
      for (const pkg of readdirSync(join(REPO, ws))) {
        const src = join(REPO, ws, pkg, 'src');
        try {
          if (statSync(src).isDirectory()) walk(src);
        } catch {
          /* a workspace without src */
        }
      }
    expect(files.length, 'an empty corpus proves nothing').toBeGreaterThan(300);
    const offenders = files.flatMap((f) =>
      ownStrippers(readFileSync(f, 'utf8'), f).map((r) => `${f.slice(REPO.length + 1)}: ${r}`)
    );
    expect(offenders).toEqual([]);
  }, 60_000);

  it('should recognise the naive strippers, and pass a match or a CSS block stripper (non-vacuity)', () => {
    const naive = [
      "s.replace(/\\/\\/.*$/gm, '')",
      "s.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$/gm, '')",
      "s.replace(/(^|[^:])\\/\\/.*$/gm, '$1')",
      "s.replace(/\\/\\/[^\\n]*/g, '')",
    ];
    for (const code of naive) expect(ownStrippers(code, 'x.ts'), code).toHaveLength(1);
    expect(ownStrippers("s.match(/\\?\\?\\s*(?:\\/\\/[^\\n]*\\n)?'x'/)", 'x.ts')).toEqual([]);
    expect(ownStrippers("css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '')", 'x.ts')).toEqual([]);
  });
});
