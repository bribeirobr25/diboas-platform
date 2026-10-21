import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * ⚙ `VAC-1` · A TEST MUST ASSERT SOMETHING.
 *
 * `5.114` — *"tests that encode a DEFECT instead of a requirement"* — is a
 * reading problem in general, but it has a MECHANICAL half that a gate can own:
 * a test with no assertion at all. Such a test passes forever, counts toward
 * the published total, and reads like protection.
 *
 * Measured across the workspace when written: **5,578 `it()` blocks, 4 with no
 * assertion**, all four in `apps/web/src/lib/errors/__tests__/` — where the
 * entire claim is the comment `// Should not throw`. `apps/web` is the WEBSITE
 * lane, excluded from Pre-I2, so those are handed off (`5.114`) rather than
 * fixed here — the same split the `CI-N4` ruling established: scan what this
 * lane owns, report what it does not.
 *
 * ⚑ SCOPE: the webapp-reachable surface — `packages/defi|banking|investing` and
 * `apps/sandbox`. Currently ZERO offenders, so this gate is preventive: it stops
 * the next assertion-free test rather than cleaning up after one.
 *
 * ⚑ A comment is not an assertion. `// Should not throw` tests nothing a reader
 * can rely on; an unhandled throw would fail the test anyway, which means the
 * comment describes the harness, not the requirement.
 */

/**
 * ⛑ SCOPE CORRECTED 2026-09-25 (retro-audit of Block D under Block G's criteria).
 *
 * The docstring above claimed `apps/sandbox` was in scope. **It was not** — this
 * list held the three packages only, leaving **881 `it()` blocks** — the largest
 * test surface in the webapp — completely unguarded while the gate reported a
 * clean zero. Proven by planting an assertion-free test there and watching this
 * gate PASS. Zero offenders exist today, so nothing shipped broken; what was
 * broken was the CLAIM.
 *
 * Paths are read with `node:fs`, never imported, so this carries none of the
 * `dist/`-resolution hazard `5.452` records.
 */
const ROOTS = [
  join(__dirname, '..', '..', '..', 'defi', 'src'),
  join(__dirname, '..', '..', '..', 'banking', 'src'),
  join(__dirname, '..', '..', '..', 'investing', 'src'),
  join(__dirname, '..', '..', '..', '..', 'apps', 'sandbox', 'src'),
];

function testFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) testFiles(full, acc);
    else if (/\.test\.tsx?$/.test(e)) acc.push(full);
  }
  return acc;
}

/**
 * Test bodies that contain no assertion of any kind.
 *
 * ⛑ TWO DEFECTS CORRECTED 2026-09-25, both found by probing rather than reading.
 *
 * **1 · The TITLE was scanned as part of the body.** A test named
 * `it('should assert the thing', …)` with an empty body was reported CLEAN,
 * because `\bassert\b` matched its own name. Proven with a matched pair: the
 * identical body under a neutral name FAILS, under a name containing "assert"
 * PASSES. The guard's own planted positive never caught it because that fixture
 * is called *"should look like protection"* — a name with no assertion word in
 * it. **A planted positive only proves the case it happens to embody.**
 *
 * **2 · Only `it(` was matched.** `it.each(` — which this corpus uses — was
 * invisible, as would be `test(`, `it.only(` and `it.skip(`.
 *
 * The title is now separated from the BODY, so only the body is searched, and
 * every block form is recognised.
 *
 * ⛑ READ BY THE TYPESCRIPT PARSER (independent review of PB-3, 2026-10-15). A
 * hand-written brace scanner bounded each body, but it had no notion of regex
 * literals: a `'` inside `/reason: '|'/g` opened a fake string, the scan never
 * closed, and 12 of 1,540 real blocks silently fell back to "everything up to
 * the next test" — the defect the scanner existed to remove. The parser knows
 * where every literal ends. An assertion is now a real CALL or IDENTIFIER in
 * the callback (`expect*(…)`, `assert`, `.toThrow`, `.rejects`, `.resolves`),
 * so a word in a comment or a string can never count.
 */
/**
 * ⛑ AN ASSERTION IS A CALL THAT CAN FAIL, AND ONLY WHERE IT RUNS (R4-4,
 * independent review 2026-10-16). Any identifier matching `/^expect\w*$/` used
 * to count, so `const expected = compute()`, `r.expected`, a bare `expect(x)`
 * with no matcher, `void expectTypeOf` and `{ rejects: 1 }` all read as
 * protected; an `expect` inside a helper that is never called, inside a
 * floating promise, under `if (false)` or in a loop over `[]` counted too; and
 * `it.skip` / `describe.skip` / `it['skip']` tests — which never run — counted
 * as asserting. `skipIf`, `runIf`, `test.for`, `test.extend` and an aliased
 * `it` were invisible. Every one is a planted case below.
 *
 * Counted as an assertion:
 *   - a matcher call on `expect(…)` / `expectTypeOf(…)` / `expect.soft(…)` /
 *     `expect.poll(…)` — `expect(x).toBe(y)`, `.not.toBe`, `.rejects.toThrow()`;
 *   - `expect.assertions(n)` / `expect.hasAssertions()`;
 *   - a call to an assertion helper: `expectSomething(…)`, `assert(…)`,
 *     `assert.equal(…)`, `assertSomething(…)`.
 * NOT counted: an assertion inside a function literal that is neither passed to
 * a call nor called by name; inside a promise chain that is neither awaited nor
 * returned; inside `if (false)` / `if (0)`; inside `for (… of [])`.
 * A file the parser cannot read FAILS — it is never skipped.
 *
 * SCOPE LIMIT (stated): this is a reading of the source, not an execution. A
 * condition that is false only at runtime, or a helper that is called but
 * swallows its own failure, is not detected.
 */
const BLOCK_NAMES = new Set(['it', 'test']);
const SUITE_NAMES = new Set(['describe', 'suite']);
const BLOCK_MODIFIERS = new Set([
  'each',
  'only',
  'skip',
  'skipIf',
  'runIf',
  'for',
  'todo',
  'fails',
  'concurrent',
  'sequential',
]);
const ASSERTION_ROOTS = new Set(['expect', 'expectTypeOf']);
const PROMISE_CHAIN = new Set(['then', 'catch', 'finally', 'rejects', 'resolves']);

interface Kind {
  name: string | null;
  isTodo: boolean;
  isSkipped: boolean;
}

function memberName(n: ts.Node): string | null {
  if (ts.isPropertyAccessExpression(n)) return n.name.text;
  if (ts.isElementAccessExpression(n) && ts.isStringLiteralLike(n.argumentExpression))
    return n.argumentExpression.text;
  return null;
}

/** `it` / `test` / an alias, with modifiers (`it.only`, `it.each(t)`, `it['skip']`, `` it.each`…` ``). */
function kindOf(callee: ts.Expression, namespaces: ReadonlySet<string> = new Set()): Kind {
  let node: ts.Expression = callee;
  let isTodo = false;
  let isSkipped = false;
  for (;;) {
    const m = memberName(node);
    if (ts.isCallExpression(node)) {
      /* ⛑ \`it.skipIf(true)\` / \`it.runIf(false)\` never run (R4-4, third review). A condition that
         is not a constant cannot be known from the source and is counted as running (stated limit). */
      const modifier = memberName(node.expression);
      const arg = node.arguments[0];
      if (arg && modifier === 'skipIf' && isConstTrue(unwrap(arg))) isSkipped = true;
      if (arg && modifier === 'runIf' && isConstFalse(unwrap(arg))) isSkipped = true;
      node = node.expression;
    } else if (ts.isTaggedTemplateExpression(node)) node = node.tag;
    else if (m !== null && BLOCK_MODIFIERS.has(m)) {
      if (m === 'todo') isTodo = true;
      if (m === 'skip') isSkipped = true;
      node = (node as ts.PropertyAccessExpression | ts.ElementAccessExpression).expression;
    } else break;
  }
  /* `v.it(…)` after `import * as v from 'vitest'` (R4 correction). */
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    namespaces.has(node.expression.text)
  )
    return { name: node.name.text, isTodo, isSkipped };
  return { name: ts.isIdentifier(node) ? node.text : null, isTodo, isSkipped };
}

/** The local names a file uses for `it`/`test`: imports renamed from vitest, and `test.extend(…)` results. */
/** The local names for `it`/`test` and the vitest namespace imports (`import * as v`). */
function testNamesIn(sf: ts.SourceFile): { names: Set<string>; namespaces: Set<string> } {
  const names = new Set(BLOCK_NAMES);
  const namespaces = new Set<string>();
  const visit = (n: ts.Node): void => {
    if (
      ts.isImportDeclaration(n) &&
      ts.isStringLiteral(n.moduleSpecifier) &&
      n.moduleSpecifier.text === 'vitest' &&
      n.importClause?.namedBindings &&
      ts.isNamedImports(n.importClause.namedBindings)
    ) {
      for (const el of n.importClause.namedBindings.elements) {
        const imported = (el.propertyName ?? el.name).text;
        if (BLOCK_NAMES.has(imported)) names.add(el.name.text);
      }
    }
    if (
      ts.isImportDeclaration(n) &&
      ts.isStringLiteral(n.moduleSpecifier) &&
      n.moduleSpecifier.text === 'vitest' &&
      n.importClause?.namedBindings &&
      ts.isNamespaceImport(n.importClause.namedBindings)
    )
      namespaces.add(n.importClause.namedBindings.name.text);
    /* `const spec = it` — a plain alias (R4 correction). */
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      ts.isIdentifier(n.initializer) &&
      names.has(n.initializer.text)
    )
      names.add(n.name.text);
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      ts.isCallExpression(n.initializer) &&
      memberName(n.initializer.expression) === 'extend'
    ) {
      const base = (n.initializer.expression as ts.PropertyAccessExpression).expression;
      if (ts.isIdentifier(base) && names.has(base.text)) names.add(n.name.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { names, namespaces };
}

/** The identifier a call chain is rooted at: `expect(x).not.toBe` → `expect`; `assert.equal` → `assert`. */
function rootOf(e: ts.Expression): { root: string | null; viaCall: boolean } {
  let node: ts.Expression = e;
  let viaCall = false;
  for (;;) {
    if (ts.isCallExpression(node)) {
      viaCall = true;
      node = node.expression;
    } else if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      /* \`v.expect(x)\` through a vitest namespace import is \`expect\` (R4 correction). */
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ASSERTION_ROOTS.has(node.name.text)
      )
        return { root: node.name.text, viaCall };
      node = node.expression;
    } else if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
      node = node.expression;
    } else break;
  }
  return { root: ts.isIdentifier(node) ? node.text : null, viaCall };
}

function isAssertionCall(call: ts.CallExpression): boolean {
  const callee = call.expression;
  /* expect(x).toBe(y) · expect.soft(x).toBe(y) · expect(p).rejects.toThrow() */
  if (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)) {
    const { root, viaCall } = rootOf(callee);
    if (root && ASSERTION_ROOTS.has(root)) {
      const name = memberName(callee);
      if (viaCall) return name !== null && !PROMISE_CHAIN.has(name);
      return name === 'assertions' || name === 'hasAssertions';
    }
    if (root === 'assert') return true; /* assert.equal(…) */
    return false;
  }
  if (ts.isIdentifier(callee)) {
    /* assertion helpers: assert(…), assertX(…), expectX(…) — never bare expect(…) */
    return (
      callee.text === 'assert' ||
      /^assert[A-Z]\w*$/.test(callee.text) ||
      /^expect[A-Z]\w*$/.test(callee.text)
    );
  }
  return false;
}

const isFunctionLike = (
  n: ts.Node
): n is ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration =>
  ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n);

const isConstFalse = (e: ts.Expression): boolean =>
  e.kind === ts.SyntaxKind.FalseKeyword || (ts.isNumericLiteral(e) && Number(e.text) === 0);
const isConstTrue = (e: ts.Expression): boolean =>
  e.kind === ts.SyntaxKind.TrueKeyword || (ts.isNumericLiteral(e) && Number(e.text) !== 0);
const isAsyncFn = (f: ts.Node): boolean =>
  (ts.getCombinedModifierFlags(f as ts.Declaration) & ts.ModifierFlags.Async) !== 0;

const unwrap = (e: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)
    ? unwrap(e.expression)
    : e;
const isEmptyArray = (e: ts.Expression): boolean => {
  const u = unwrap(e);
  return ts.isArrayLiteralExpression(u) && u.elements.length === 0;
};

/** The whole chain an expression belongs to: `p.then(cb)` inside `p.then(cb).catch(x)` → the outer call. */
function chainTop(n: ts.Node): ts.Node {
  let cur = n;
  for (;;) {
    const p = cur.parent;
    if (!p) return cur;
    const continues =
      ((ts.isPropertyAccessExpression(p) || ts.isElementAccessExpression(p)) &&
        p.expression === cur) ||
      (ts.isCallExpression(p) && p.expression === cur) ||
      ts.isParenthesizedExpression(p) ||
      ts.isNonNullExpression(p) ||
      ts.isAsExpression(p);
    if (!continues) return cur;
    cur = p;
  }
}
/** Does the chain below `top` use one of these members (`then`, `rejects`, …)? */
function chainUses(top: ts.Node, members: ReadonlySet<string>): boolean {
  let node: ts.Node = top;
  for (;;) {
    const m = memberName(node);
    if (m !== null && members.has(m)) return true;
    if (
      ts.isCallExpression(node) ||
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node) ||
      ts.isParenthesizedExpression(node)
    )
      node = node.expression;
    else return false;
  }
}
/** Is a promise-valued chain awaited or returned — directly, or through the variable that holds it? */
function settled(top: ts.Node, testBody: ts.Node): boolean {
  const p = top.parent;
  if (!p) return false;
  if (ts.isAwaitExpression(p) || ts.isReturnStatement(p)) return true;
  if (ts.isArrowFunction(p) && p.body === top) return true; /* concise body returns it */
  if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) {
    const name = p.name.text;
    let used = false;
    /* ⛑ Only an \`await\` / \`return\` that can RUN settles it (R4-4, third review): one inside
       \`if (false)\` used to count. Nested function bodies are searched too — an await inside a
       helper that never runs still counts there (stated limit). */
    const onNode = (n: ts.Node): void => {
      if (
        !used &&
        (ts.isAwaitExpression(n) || ts.isReturnStatement(n)) &&
        n.expression &&
        ts.isIdentifier(unwrap(n.expression)) &&
        (unwrap(n.expression) as ts.Identifier).text === name
      )
        used = true;
    };
    const onFunction = (f: ts.Node): void => walkRunnable(f, onNode, onFunction);
    walkRunnable(testBody, onNode, onFunction);
    return used;
  }
  return false;
}

const PROMISE_CALLBACKS = new Set(['then', 'catch', 'finally']);
const SETTLING_MATCHERS = new Set(['rejects', 'resolves']);

/**
 * Walk the code that RUNS from `root`: never into dead branches (`if (false)`,
 * `while (false)`, `false && …`, a loop over `[]`, statements after a `return` or
 * `throw`), and never into a function literal — those are handed to `onFunction`.
 */
function walkRunnable(
  root: ts.Node,
  onNode: (n: ts.Node) => void,
  onFunction: (f: ts.Node) => void
): void {
  const walk = (n: ts.Node): void => {
    if (n !== root && isFunctionLike(n)) {
      onFunction(n);
      return;
    }
    if (ts.isIfStatement(n) && isConstFalse(n.expression)) {
      if (n.elseStatement) walk(n.elseStatement);
      return;
    }
    if (ts.isWhileStatement(n) && isConstFalse(n.expression)) return;
    if (ts.isForStatement(n) && n.condition && isConstFalse(n.condition)) return;
    if ((ts.isForOfStatement(n) || ts.isForInStatement(n)) && isEmptyArray(n.expression)) return;
    if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      isConstFalse(unwrap(n.left))
    )
      return;
    if (ts.isBlock(n) || ts.isSourceFile(n)) {
      for (const st of n.statements) {
        walk(st);
        if (ts.isReturnStatement(st) || ts.isThrowStatement(st)) break; /* the rest never runs */
      }
      return;
    }
    onNode(n);
    ts.forEachChild(n, walk);
  };
  if (isFunctionLike(root) && root.body) walk(root.body);
  else walk(root);
}

/**
 * ⛑ A FUNCTION COUNTS ONLY IF IT RUNS (R4 correction, independent review
 * 2026-10-16). "Its name is called somewhere" let a helper that calls ITSELF,
 * one called only from another dead helper, an unawaited `async` IIFE and a
 * callback on `[]` count as run. Liveness now starts from the test body and
 * spreads only through code that runs: a function literal is live when it is
 * passed to a call (not a `then`/`catch`/`finally` whose chain is left floating,
 * not a method of an empty array), invoked where it is written (an `async` one
 * only if awaited or returned), or called by name FROM LIVE CODE.
 */
function liveFunctions(testBody: ts.Node): Set<ts.Node> {
  const live = new Set<ts.Node>([testBody]);
  const queue: ts.Node[] = [testBody];
  /** Every call site, by callee name — a named helper runs only through one of them. */
  const calls = new Map<string, ts.CallExpression[]>();
  /* ⛑ An \`async\` helper runs to its assertions only if its promise is awaited or returned
     (R4-4, third review): \`check();\` on an async helper used to count. */
  const canRun = (f: ts.Node, call: ts.CallExpression): boolean =>
    !isAsyncFn(f) || settled(chainTop(call), testBody);
  const pending = new Map<string, ts.Node[]>();
  const nameOf = (f: ts.Node): string | null =>
    ts.isFunctionDeclaration(f) && f.name
      ? f.name.text
      : ts.isVariableDeclaration(f.parent) && ts.isIdentifier(f.parent.name)
        ? f.parent.name.text
        : null;
  const activate = (f: ts.Node): void => {
    if (live.has(f)) return;
    live.add(f);
    queue.push(f);
  };
  const classify = (f: ts.Node): void => {
    const parent = f.parent;
    if (ts.isCallExpression(parent) && parent.arguments.includes(f as ts.Expression)) {
      const callee = parent.expression;
      const method = memberName(callee);
      const onEmptyArray =
        (ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)) &&
        isEmptyArray(callee.expression);
      const floating =
        method !== null && PROMISE_CALLBACKS.has(method) && !settled(chainTop(parent), testBody);
      if (!onEmptyArray && !floating) activate(f);
      return;
    }
    let wrapper: ts.Node = f;
    while (ts.isParenthesizedExpression(wrapper.parent)) wrapper = wrapper.parent;
    if (ts.isCallExpression(wrapper.parent) && wrapper.parent.expression === wrapper) {
      const isAsync =
        (ts.getCombinedModifierFlags(f as ts.Declaration) & ts.ModifierFlags.Async) !== 0;
      if (!isAsync || settled(chainTop(wrapper.parent), testBody)) activate(f);
      return;
    }
    const name = nameOf(f);
    if (name === null) return;
    if ((calls.get(name) ?? []).some((c) => canRun(f, c))) activate(f);
    else pending.set(name, [...(pending.get(name) ?? []), f]);
  };
  while (queue.length) {
    const root = queue.shift()!;
    walkRunnable(
      root,
      (n) => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
          const name = n.expression.text;
          calls.set(name, [...(calls.get(name) ?? []), n]);
          const waiting = pending.get(name) ?? [];
          const runnable = waiting.filter((f) => canRun(f, n));
          runnable.forEach(activate);
          pending.set(
            name,
            waiting.filter((f) => !runnable.includes(f))
          );
        }
      },
      classify
    );
  }
  return live;
}

function asserts(testBody: ts.Node): boolean {
  const live = liveFunctions(testBody);
  let found = false;
  for (const root of live) {
    walkRunnable(
      root,
      (n) => {
        if (found || !ts.isCallExpression(n) || !isAssertionCall(n)) return;
        /* `expect(p).rejects.toThrow()` asserts only if that promise is awaited or returned. */
        const top = chainTop(n);
        if (chainUses(top, SETTLING_MATCHERS) && !settled(top, testBody)) return;
        found = true;
      },
      () => {}
    );
    if (found) break;
  }
  return found;
}

function vacuousIn(code: string, fileName = 'x.test.ts'): string[] {
  /* TSX only for `.tsx`: parsed as TSX, a `.ts` file's `<T>(x) =>` or `<Type>v` misreads. */
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, kind);
  /* A file the parser cannot read is a file this gate did not check — FAIL, never skip. */
  const diagnostics =
    (sf as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  if (diagnostics.length) return [`PARSE ERROR (${diagnostics.length}) — not checked`];
  const { names, namespaces } = testNamesIn(sf);
  const out: string[] = [];
  const visit = (n: ts.Node, inSkippedSuite: boolean): void => {
    /* In a curried `it.each(table)(name, fn)` only the OUTER call is the test;
       the inner `it.each(table)` is its callee and carries no callback. */
    const isCalleeOfCall =
      n.parent !== undefined && ts.isCallExpression(n.parent) && n.parent.expression === n;
    let skipped = inSkippedSuite;
    if (ts.isCallExpression(n) && !isCalleeOfCall) {
      const k = kindOf(n.expression, namespaces);
      if (k.name !== null && SUITE_NAMES.has(k.name) && k.isSkipped) skipped = true;
      /* `it.todo('…')` declares an intention and has no body by design (the
         CI-N2 scope-limit marker is one) — not a vacuous test. */
      if (k.name !== null && names.has(k.name) && !k.isTodo) {
        const title = n.arguments[0];
        const name = (title && ts.isStringLiteralLike(title) ? title.text : n.getText(sf)).slice(
          0,
          70
        );
        const callback = [...n.arguments]
          .reverse()
          .find((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a));
        /* A skipped test never runs, so whatever it asserts protects nothing. A
           callback passed by reference cannot be verified here — FAIL CLOSED. */
        if (k.isSkipped || skipped) out.push(`${name} (skipped — never runs)`);
        else if (!callback || !asserts(callback.body)) out.push(name);
      }
    }
    ts.forEachChild(n, (c) => visit(c, skipped));
  };
  visit(sf, false);
  return out;
}

describe('VAC-1 · a test must assert something', () => {
  it('should find test files under EVERY root, not merely in total', () => {
    /**
     * ⛑ A TOTAL HIDES A MISSING ROOT. The earlier floor was one workspace-wide
     * `> 20`, which the three packages satisfy on their own — so a root that
     * resolved to nothing (a moved directory, a typo in a path segment) would
     * have gone on reporting a clean zero. Each root is now floored
     * individually, which is what makes the `apps/sandbox` addition provable
     * rather than decorative.
     */
    for (const root of ROOTS) {
      expect(testFiles(root).length, `no test files found under ${root}`).toBeGreaterThan(3);
    }
    expect(ROOTS).toHaveLength(4);
  });

  it('should DETECT an assertion-free test — planted positive, before any zero is believed', () => {
    /**
     * The self-test this repository has paid for six times over: a scan that
     * reports zero because it is broken looks exactly like a clean repository.
     * Plant one and prove the detector sees it.
     */
    const planted = `
      it('should look like protection', async () => {
        // Should not throw
        doSomething();
      });
    `;
    expect(vacuousIn(planted)).toHaveLength(1);

    /* And the negative direction: a real assertion is NOT flagged. */
    const real = `
      it('should actually assert', () => {
        expect(1).toBe(1);
      });
    `;
    expect(vacuousIn(real)).toEqual([]);
  });

  it('should not be fooled by the TEST NAME — the title is not the body', () => {
    /**
     * ⛑ THE DEFECT THIS GATE SHIPPED WITH, and the reason a planted positive is
     * not enough on its own: the original fixture was named *"should look like
     * protection"*, a name containing no assertion word, so the title was never
     * part of the search in the one case anyone checked. A real test named
     * `should assert …` with an empty body was reported CLEAN.
     */
    const namedAssert = `
      it('should assert the thing', () => {
        doSomething();
      });
    `;
    expect(vacuousIn(namedAssert), 'the test NAME satisfied the assertion check').toHaveLength(1);

    const namedExpect = `
      it('should expect() a refusal', () => {
        doSomething();
      });
    `;
    expect(vacuousIn(namedExpect)).toHaveLength(1);
  });

  it('should see EVERY block form this corpus uses, not only bare it()', () => {
    /**
     * ⛑ `it.each(` is used in these packages today and was invisible. A guard
     * that covers one spelling of the thing it guards is a guard over that
     * spelling, not over the requirement.
     */
    const forms = [
      `it.each([1, 2])('should handle %s', (n) => { void n; });`,
      `test('should do the thing', () => { doSomething(); });`,
      `it.only('should focus', () => { doSomething(); });`,
      `it.skip('should be skipped', () => { doSomething(); });`,
    ];
    for (const form of forms) {
      expect(vacuousIn(`\n      ${form}\n`), form.slice(0, 28)).toHaveLength(1);
    }

    /* `it.todo` has no body by design and is not a vacuous test (PB-3). */
    expect(vacuousIn(`\n      it.todo('SCOPE LIMIT · not covered yet');\n`)).toEqual([]);

    /* Negative control: the same forms WITH assertions are not flagged. */
    expect(
      vacuousIn(`\n      it.each([1])('should x (%s)', (n) => { expect(n).toBe(1); });\n`)
    ).toEqual([]);
  });

  it('should bound a test body by its braces — a trailing helper is not its assertion (PB-3)', () => {
    const trailingHelper = `
      it('should protect', () => {
        doSomething();
      });
      function check(x: number) { expect(x).toBe(1); }
    `;
    expect(
      vacuousIn(trailingHelper),
      'a helper after the test counted as its assertion'
    ).toHaveLength(1);

    const nextHook = `
      it('should protect', () => {
        doSomething(); // don't count what follows
      });
      describe('next', () => { beforeEach(() => { expect(1).toBe(1); }); });
    `;
    expect(
      vacuousIn(nextHook),
      "the next block's hook counted as this test's assertion"
    ).toHaveLength(1);

    const helperAssert = `
      it('should use a helper', () => {
        expectBalance(state, '10.00');
      });
    `;
    expect(vacuousIn(helperAssert), 'an assertion helper was not recognised').toEqual([]);
  });

  it('should bound a body containing regex literals, comments and strings (independent review)', () => {
    /* A quote and a `//` inside regex literals made the brace scanner run on to
       the next test's assertion. */
    const regexBody = `
      it('should split', () => {
        const parts = 'a|b'.split(/reason: '|'/g);
        const url = /https?:\\/\\//;
        void parts; void url;
      });
      it('should really assert', () => { expect(1).toBe(1); });
    `;
    expect(vacuousIn(regexBody)).toEqual(['should split']);

    /* A comment or a string that MENTIONS an assertion is not one. */
    const mentions = `
      it('should not count words', () => {
        // expect(x).toBe(1) — a comment
        const note = 'remember to expect(this)';
        void note;
      });
    `;
    expect(vacuousIn(mentions)).toEqual(['should not count words']);

    /* A callback passed by reference cannot be verified here — fail closed. */
    expect(vacuousIn(`\n      it('should run a named check', namedCheck);\n`)).toHaveLength(1);
  });

  it('should have NO assertion-free test in the webapp-reachable packages', () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const f of testFiles(root)) {
        /* The guard's own file contains PLANTED examples by design — scanning it
           would report its own fixtures as offenders. Excluded by name, narrowly. */
        if (f.endsWith('testNonVacuity.test.ts')) continue;
        for (const name of vacuousIn(readFileSync(f, 'utf8'), f)) {
          offenders.push(`${f.split('/src/')[1]} :: ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    /* `5.578` residual (2026-10-20) — an explicit budget for a scan whose work IS the check
       and grows with the corpus: 179 test files (~1.46 MB, most of it the sandbox suite),
       each parsed exactly once (parse alone 342 ms — no waste found), then analysed. Measured
       on an 8-core Mac: 1.0–2.8 s alone even at load ≈ 24–28; 1.0–4.1 s inside the full serial
       suite; one > 5 s timeout when defi's own workers and external load shared the CPU.
       20 s keeps a hang failing while the corpus grows. */
  }, 20_000);
});

describe('VAC-1 · R4-4 planted cases (independent review, 2026-10-16)', () => {
  /* Each passed as "asserting" or was invisible before R4-4. Every one must be FLAGGED. */
  const VACUOUS: Record<string, string> = {
    'a variable named expected': `it('computes', () => { const expected = compute(); void expected; });`,
    'a property named expected': `it('computes', () => { const r = compute(); log(r.expected); });`,
    'expect() with no matcher': `it('computes', () => { expect(compute()); });`,
    'an assertion in a helper never called': `it('computes', () => { const check = () => expect(1).toBe(2); void check; });`,
    'expectTypeOf named, not called': `it('computes', () => { void expectTypeOf; });`,
    'a property named rejects': `it('computes', () => { const o = { rejects: 1 }; void o.rejects; });`,
    'an aliased it': `import { it as spec } from 'vitest'; spec('computes', () => { compute(); });`,
    'it.skipIf': `it.skipIf(false)('computes', () => { compute(); });`,
    'it.runIf': `it.runIf(true)('computes', () => { compute(); });`,
    'test.for': `test.for([1])('computes %s', (n) => { compute(n); });`,
    'test.extend': `const myTest = test.extend({}); myTest('computes', () => { compute(); });`,
    'a test inside describe.skip': `describe.skip('s', () => { it('computes', () => { expect(1).toBe(1); }); });`,
    'it.skip that asserts': `it.skip('computes', () => { expect(1).toBe(2); });`,
    'a floating then()': `it('computes', () => { Promise.resolve().then(() => expect(1).toBe(2)); });`,
    'a floating rejects': `it('computes', () => { expect(Promise.reject(1)).rejects.toThrow(); });`,
    'an assertion under if (false)': `it('computes', () => { if (false) expect(1).toBe(2); });`,
    'an assertion in a loop over []': `it('computes', () => { for (const x of []) expect(x).toBe(1); });`,
    'test.each with objects': `test.each([{a:1}])('$a', ({a}) => { compute(a); });`,
    'it.concurrent.each': `it.concurrent.each([1])('x %s', (n) => { compute(n); });`,
    "it['skip']": `it['skip']('computes', () => { compute(); });`,
    /* R4 correction · the second review's holes */
    'a helper that only calls itself': `it('x', () => { function check() { check(); expect(1).toBe(2); } });`,
    'a helper called only by a dead helper': `it('x', () => { const a = () => expect(1).toBe(2); const b = () => a(); void b; });`,
    'a floating chain held in a variable': `it('x', () => { const p = Promise.resolve().then(() => expect(1).toBe(2)); void p; });`,
    'a floating rejects held in a variable': `it('x', () => { const r = expect(Promise.reject(1)).rejects.toThrow(); void r; });`,
    'an unawaited async IIFE': `it('x', () => { (async () => { expect(1).toBe(2); })(); });`,
    'a callback on an empty array': `it('x', () => { [].forEach(() => expect(1).toBe(2)); });`,
    'a loop over an empty array cast': `it('x', () => { for (const v of [] as number[]) expect(v).toBe(1); });`,
    'false && expect': `it('x', () => { false && expect(1).toBe(2); });`,
    'while (false)': `it('x', () => { while (false) expect(1).toBe(2); });`,
    'for (;false;)': `it('x', () => { for (; false; ) expect(1).toBe(2); });`,
    /* R4-4 · third review: constant conditions, async helpers, unreachable awaits */
    'it.skipIf(true) that asserts': `it.skipIf(true)('x', () => { expect(1).toBe(2); });`,
    'it.runIf(false) that asserts': `it.runIf(false)('x', () => { expect(1).toBe(2); });`,
    'an async helper called without await': `it('x', () => { const check = async () => { expect(1).toBe(2); }; check(); });`,
    'an async function declaration called without await': `it('x', () => { async function check() { expect(1).toBe(2); } check(); });`,
    'a promise awaited only under if (false)': `it('x', async () => { const p = q().then((v) => expect(v).toBe(1)); if (false) await p; });`,
    'an assertion after return': `it('x', () => { return; expect(1).toBe(2); });`,
    'a vitest namespace import': `import * as v from 'vitest'; v.it('x', () => { compute(); });`,
    'a plain alias of it': `const spec = it; spec('x', () => { compute(); });`,
  };
  it.each(Object.entries(VACUOUS))('should FLAG %s', (_label, code) => {
    expect(vacuousIn(code)).toHaveLength(1);
  });

  /* Negative controls — real protection that must NOT be flagged. */
  const PROTECTED: Record<string, string> = {
    'a matcher call': `it('x', () => { expect(1).toBe(1); });`,
    'a negated matcher': `it('x', () => { expect(1).not.toBe(2); });`,
    'an awaited rejects': `it('x', async () => { await expect(p()).rejects.toThrow(); });`,
    'a returned rejects': `it('x', () => { return expect(p()).resolves.toBe(1); });`,
    'an awaited then': `it('x', async () => { await p().then((v) => expect(v).toBe(1)); });`,
    'a callback passed to a call': `it('x', async () => { await waitFor(() => expect(1).toBe(1)); });`,
    'a helper defined and called': `it('x', () => { const check = () => expect(1).toBe(1); check(); });`,
    'an immediately invoked async body': `it('x', () => { return (async () => { expect(1).toBe(1); })(); });`,
    'an assertion helper': `it('x', () => { expectBalance(state, '10.00'); });`,
    'node assert': `it('x', () => { assert.equal(1, 1); });`,
    'expect.assertions': `it('x', async () => { expect.assertions(1); await run(); });`,
    'an else branch of if (false)': `it('x', () => { if (false) noop(); else expect(1).toBe(1); });`,
    'an aliased it that asserts': `import { it as spec } from 'vitest'; spec('x', () => { expect(1).toBe(1); });`,
    'a sync IIFE': `it('x', () => { (() => { expect(1).toBe(1); })(); });`,
    'an awaited async IIFE': `it('x', async () => { await (async () => { expect(1).toBe(1); })(); });`,
    'a chain held in a variable, then awaited': `it('x', async () => { const p = q().then((v) => expect(v).toBe(1)); await p; });`,
    'a helper called from live code through another helper': `it('x', () => { const a = () => expect(1).toBe(1); const b = () => a(); b(); });`,
    'a namespace it that asserts': `import * as v from 'vitest'; v.it('x', () => { v.expect(1).toBe(1); });`,
    'it.skipIf(false) that asserts': `it.skipIf(false)('x', () => { expect(1).toBe(1); });`,
    'it.runIf(true) that asserts': `it.runIf(true)('x', () => { expect(1).toBe(1); });`,
    'it.skipIf(cond) that asserts — unknown at read time, counted as running': `it.skipIf(isCI)('x', () => { expect(1).toBe(1); });`,
    'an async helper that is awaited': `it('x', async () => { const check = async () => { expect(1).toBe(1); }; await check(); });`,
    'an async helper that is returned': `it('x', () => { const check = async () => { expect(1).toBe(1); }; return check(); });`,
    'a promise awaited in reachable code': `it('x', async () => { const p = q().then((v) => expect(v).toBe(1)); if (ready) await p; });`,
  };
  it.each(Object.entries(PROTECTED))('should NOT flag %s', (_label, code) => {
    expect(vacuousIn(code)).toEqual([]);
  });

  it('should FAIL a file the parser cannot read, never skip it', () => {
    expect(vacuousIn(`it('x', () => { expect(1).toBe(1); ;;; }}}`)).toHaveLength(1);
  });
});
