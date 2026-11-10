/**
 * 5.824 · NO PLAINTEXT FALLBACK FOR ENCRYPTED PII.
 *
 * `encrypt()` and `hmacHash()` return null in production when no usable key exists. Two writers
 * used `encrypt(x) || x` and `hmacHash(x) || ''`, which stored an email in clear (and under an
 * empty blind index) exactly then. Every writer must refuse instead (`EncryptionUnavailableError`,
 * as `store/repository.ts` does).
 *
 * Twelfth audit: the first version matched one line-level shape and missed most realistic
 * variants (a ternary, `if (!enc) enc = email`, a later `enc || x`, nested arguments, a cast,
 * a call split over lines, an alias). This version reads the syntax tree. A value is SEALED when
 * it is a call to `encrypt`/`hmacHash` (or an alias of either), a variable initialised from one,
 * or a `?:` with a sealed branch. It fails on:
 *   1. `sealed || x` / `sealed ?? x` where `x` is not `null`/`undefined`;
 *   2. a `?:` with one sealed branch and one branch that is neither sealed nor `null`/`undefined`;
 *   3. re-assigning a sealed variable to anything but a sealed value or `null`/`undefined`.
 *
 * Scope limits: bindings are tracked by name per file, not by scope; a helper that returns its
 * input through an `if (!enc) return x` is not matched; storing a value without calling
 * `encrypt` at all is the writers' behaviour tests' job (WaitlistApplicationService.test.ts,
 * deliveryLogger.test.ts, store tests). `decrypt(x) || x` is a READ of legacy rows and is not
 * in scope. Only files mentioning `encrypt` or `hmacHash` are parsed (the cost was ~4 s in CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { parseSource } from '@diboas/test-support';

const REPO = path.resolve(__dirname, '../../../../../..');
const ROOTS = ['apps', 'packages'];
const SEALERS = ['encrypt', 'hmacHash'];

const unwrap = (e: ts.Expression): ts.Expression => {
  let x = e;
  while (
    ts.isParenthesizedExpression(x) ||
    ts.isAsExpression(x) ||
    ts.isNonNullExpression(x) ||
    ts.isTypeAssertionExpression(x) ||
    ts.isSatisfiesExpression(x)
  )
    x = x.expression;
  return x;
};

const isNullish = (e: ts.Expression): boolean => {
  const x = unwrap(e);
  return (
    x.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(x) && x.text === 'undefined') ||
    ts.isVoidExpression(x)
  );
};

/** Every plaintext-fallback shape in one source text, as `line: shape`. */
function findFallbacks(text: string, fileName = 'x.ts'): string[] {
  const sf = parseSource(text, fileName);
  const sealers = new Set(SEALERS);
  const sealedVars = new Set<string>();

  const calleeName = (c: ts.CallExpression): string | null => {
    const x = unwrap(c.expression);
    if (ts.isIdentifier(x)) return x.text;
    if (ts.isPropertyAccessExpression(x)) return x.name.text;
    return null;
  };
  const isSealed = (e: ts.Expression): boolean => {
    const x = unwrap(e);
    if (ts.isCallExpression(x)) return sealers.has(calleeName(x) ?? '');
    if (ts.isIdentifier(x)) return sealedVars.has(x.text);
    if (ts.isConditionalExpression(x)) return isSealed(x.whenTrue) || isSealed(x.whenFalse);
    return false;
  };

  // Aliases (`const e = encrypt`) and sealed variables, to a fixed point.
  let size = -1;
  while (size !== sealers.size + sealedVars.size) {
    size = sealers.size + sealedVars.size;
    const collect = (n: ts.Node): void => {
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
        const init = unwrap(n.initializer);
        if (ts.isIdentifier(init) && sealers.has(init.text)) sealers.add(n.name.text);
        else if (isSealed(init)) sealedVars.add(n.name.text);
      }
      ts.forEachChild(n, collect);
    };
    collect(sf);
  }

  const hits: string[] = [];
  const hit = (n: ts.Node, shape: string) =>
    hits.push(`${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}: ${shape}`);
  const okOther = (e: ts.Expression) => isSealed(e) || isNullish(e);

  const visit = (n: ts.Node): void => {
    if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind;
      if (
        (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) &&
        isSealed(n.left) &&
        !isNullish(n.right)
      )
        hit(n, 'sealed || / ?? fallback');
      if (
        (op === ts.SyntaxKind.EqualsToken ||
          op === ts.SyntaxKind.BarBarEqualsToken ||
          op === ts.SyntaxKind.QuestionQuestionEqualsToken) &&
        ts.isIdentifier(unwrap(n.left)) &&
        sealedVars.has((unwrap(n.left) as ts.Identifier).text) &&
        !okOther(n.right)
      )
        hit(n, 'sealed variable re-assigned');
    }
    if (
      ts.isConditionalExpression(n) &&
      (isSealed(n.whenTrue) || isSealed(n.whenFalse)) &&
      !(okOther(n.whenTrue) && okOther(n.whenFalse))
    )
      hit(n, 'sealed ?: fallback');
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hits;
}

/** Never walk dependencies or build output: `readdirSync({ recursive })` would. */
const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist', 'coverage', '__tests__']);
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return SKIP_DIRS.has(d.name) || d.name.startsWith('.') ? [] : walk(full);
    return /\.(ts|tsx)$/.test(d.name) && !/\.test\.|\.stories\.|\.d\.ts$/.test(d.name)
      ? [full]
      : [];
  });

/** Every `src/` tree under apps/* and packages/*. */
const sources = (): string[] =>
  ROOTS.flatMap((root) =>
    fs
      .readdirSync(path.join(REPO, root), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(REPO, root, d.name, 'src')))
      .flatMap((d) => walk(path.join(REPO, root, d.name, 'src')))
  );

describe('5.824 · no plaintext fallback for encrypted PII', { timeout: 30_000 }, () => {
  it.each([
    ['the original shape', 'const a = encrypt(email) || email;'],
    ['an empty blind index', 'const b = hmacHash(email.toLowerCase().trim()) || "";'],
    ['a nullish fallback', 'const c = encrypt(x) ?? x;'],
    ['a ternary on a variable', 'const e = encrypt(x); const v = e ? e : x;'],
    ['a negated ternary', 'const e = encrypt(x); const v = !e ? x : e;'],
    ['a re-assignment', 'let enc = encrypt(email); if (!enc) enc = email;'],
    ['a later fallback', 'const enc = encrypt(x);\nfoo();\nsave(enc || x);'],
    ['nested arguments', 'const v = encrypt(String(x.toLowerCase())) || x;'],
    ['a cast', 'const v = (encrypt(x) as string) || x;'],
    ['a call split over lines', 'const v = encrypt(\n  x\n)\n  || x;'],
    ['an alias', 'const e = encrypt; const v = e(x) || x;'],
    ['a member call', 'const v = security.hmacHash(x) || x;'],
    ['a helper', 'const seal = (v: string) => encrypt(v) || v;'],
    ['a ||= fallback', 'let enc = encrypt(x); enc ||= x;'],
  ])('should catch %s (detector self-test)', (_l, src) => {
    expect(findFallbacks(src).length, src).toBeGreaterThan(0);
  });

  it.each([
    ['a refusal', 'const e = encrypt(x); const h = hmacHash(x); if (!e || !h) throw new Error();'],
    ['a boolean test', 'if (!hmacHash(email) || optedOut) return;'],
    ['a null default', 'const n = encrypt(name) ?? null;'],
    ['an optional field', 'const n = input.name ? encrypt(input.name) : null;'],
    ['an unrelated ternary', 'const h = hmacHash(x); const u = h ? build(h) : undefined;'],
    ['a sealed re-assignment', 'let e = encrypt(x); e = encrypt(y);'],
    ['a read of legacy rows', 'const v = decrypt(row.email) || row.email;'],
  ])('should pass %s (detector self-test)', (_l, src) => {
    expect(findFallbacks(src), src).toEqual([]);
  });

  it('should find no plaintext fallback in any app or package source', () => {
    const files = sources();
    expect(files.length).toBeGreaterThan(200);
    const parsed = files.filter((f) => /\b(?:encrypt|hmacHash)\b/.test(fs.readFileSync(f, 'utf8')));
    /* Non-vacuity: the writers this guard exists for are among the files it reads. */
    expect(parsed.map((f) => path.basename(f))).toEqual(
      expect.arrayContaining([
        'deliveryLogger.ts',
        'WaitlistApplicationService.ts',
        'repository.ts',
      ])
    );
    const hits = parsed.flatMap((f) =>
      findFallbacks(fs.readFileSync(f, 'utf8'), f).map((h) => `${path.relative(REPO, f)}:${h}`)
    );
    expect(hits).toEqual([]);
  });
});
