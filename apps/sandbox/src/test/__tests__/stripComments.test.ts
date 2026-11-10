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
 * in six guards survived in 21 more). Every test file, test helper and e2e spec in every
 * workspace is parsed, and a comment stripper FAILS however it is written (10th audit: the first
 * version caught one spelling): a regex whose pattern — or one top-level alternative of it — is
 * `//` (`\/\/`, `[/][/]`, `\/{2}`) followed by the rest of the line (`.*`, `.+`, `.*?`, `[^\n]*`,
 * `[^\r\n]*`, with or without `$`), as a literal anywhere or a string given to `new RegExp`; and
 * `.split('//')`. A pattern that only TOLERATES a comment inside a larger match passes.
 */
describe('5.623 · every source-scanning test strips comments through @diboas/test-support', () => {
  const REPO = resolve(__dirname, '../../../../..');
  const SLASHES = String.raw`(?:\\\/\\\/|\[\/\]\[\/\]|\[\\\/\]\[\\\/\]|\\\/\{2\})`;
  const REST = String.raw`(?:\.\*\??|\.\+\??|\[\^(?:\\n|\\r\\n|\\n\\r)\]\*)\$?`;
  const STRIPPER_ALTERNATIVE = new RegExp(String.raw`^(?:\(\^\|\[\^:\]\))?` + SLASHES + REST + '$');

  /** Top-level alternatives of a regex source (a `|` outside groups and classes). */
  function alternatives(source: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let inClass = false;
    let start = 0;
    for (let i = 0; i < source.length; i += 1) {
      const c = source[i];
      if (c === '\\') i += 1;
      else if (inClass) inClass = c !== ']';
      else if (c === '[') inClass = true;
      else if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      else if (c === '|' && depth === 0) {
        out.push(source.slice(start, i));
        start = i + 1;
      }
    }
    out.push(source.slice(start));
    return out;
  }
  const isStripper = (pattern: string) =>
    alternatives(pattern).some((alt) => STRIPPER_ALTERNATIVE.test(alt));

  /** Comment strippers in one source text, however they are spelled. */
  function ownStrippers(text: string, fileName: string): string[] {
    const found: string[] = [];
    const visit = (n: ts.Node) => {
      if (ts.isRegularExpressionLiteral(n)) {
        const pattern = n.text.slice(1, n.text.lastIndexOf('/'));
        if (isStripper(pattern)) found.push(n.text);
      } else if (
        ts.isNewExpression(n) &&
        ts.isIdentifier(n.expression) &&
        n.expression.text === 'RegExp' &&
        n.arguments?.[0] &&
        ts.isStringLiteralLike(n.arguments[0]) &&
        isStripper(n.arguments[0].text.replace(/\//g, '\\/'))
      )
        found.push(`new RegExp(${JSON.stringify(n.arguments[0].text)})`);
      else if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        n.expression.name.text === 'split' &&
        n.arguments[0] &&
        ts.isStringLiteralLike(n.arguments[0]) &&
        n.arguments[0].text === '//'
      )
        found.push(".split('//')");
      ts.forEachChild(n, visit);
    };
    visit(parseSource(text, fileName));
    return found;
  }

  /** Test files, test helpers (`src/test/`) and e2e specs, in every workspace. */
  function scanned(): string[] {
    const files: string[] = [];
    const walk = (dir: string, all: boolean) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, all || name === 'test' || name === '__tests__');
        else if (/\.(m?js|tsx?)$/.test(name) && (all || /\.(test|spec)\.(m?js|tsx?)$/.test(name)))
          files.push(p);
      }
    };
    for (const ws of ['apps', 'packages'])
      for (const pkg of readdirSync(join(REPO, ws)))
        for (const sub of ['src', 'e2e']) {
          const dir = join(REPO, ws, pkg, sub);
          try {
            if (statSync(dir).isDirectory()) walk(dir, sub === 'e2e');
          } catch {
            /* a workspace without this folder */
          }
        }
    const e2e = join(REPO, 'tests');
    try {
      if (statSync(e2e).isDirectory()) walk(e2e, true);
    } catch {
      /* no repository-level tests folder */
    }
    return files;
  }

  it('should find no test, test helper or e2e spec with its own // comment stripper', () => {
    const files = scanned();
    expect(files.length, 'an empty corpus proves nothing').toBeGreaterThan(300);
    const offenders = files
      .filter((f) => !f.endsWith(join('test-support', 'src', 'stripComments.ts')))
      .flatMap((f) =>
        ownStrippers(readFileSync(f, 'utf8'), f).map((r) => `${f.slice(REPO.length + 1)}: ${r}`)
      );
    expect(offenders).toEqual([]);
  }, 60_000);

  it('should recognise the stripper however it is spelled, and pass a pattern that only tolerates a comment (non-vacuity)', () => {
    const naive = [
      "s.replace(/\\/\\/.*$/gm, '')",
      "s.replace(/\\/\\/.*/g, '')",
      "s.replace(/\\/\\/.+$/gm, '')",
      "s.replace(/\\/\\/.*?$/gm, '')",
      "s.replace(/\\/\\/[^\\n]*/g, '')",
      "s.replace(/\\/\\/[^\\r\\n]*/g, '')",
      "s.replace(/[/][/].*$/gm, '')",
      "s.replace(/\\/{2}.*$/gm, '')",
      "s.replaceAll(/\\/\\/.*$/gm, '')",
      "s.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$/gm, '')",
      "s.replace(/(^|[^:])\\/\\/.*$/gm, '$1')",
      "const LINE = /\\/\\/.*$/gm; s.replace(LINE, '')",
      "s.replace(new RegExp('//.*$', 'gm'), '')",
      "s.split('//')[0]",
    ];
    for (const code of naive) expect(ownStrippers(code, 'x.ts'), code).toHaveLength(1);
    expect(ownStrippers("s.match(/\\?\\?\\s*(?:\\/\\/[^\\n]*\\n)?'x'/)", 'x.ts')).toEqual([]);
    expect(ownStrippers("css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '')", 'x.ts')).toEqual([]);
    expect(ownStrippers("url.split('/')", 'x.ts')).toEqual([]);
  });
});
