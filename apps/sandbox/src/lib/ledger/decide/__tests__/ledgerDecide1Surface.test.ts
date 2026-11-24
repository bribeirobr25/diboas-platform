/**
 * ⛑ LEDGER-DECIDE-1, part 5 · what a decision can TOUCH, measured by the compiler, not by spelling
 * (S1a PR-2 review: the lint checks how an import or a clock read is written; `globalThis.fetch`,
 * `self.Date.now()`, `require(...)`, `eval`, `Intl`, `Reflect.construct(Date, [])`, an aliased
 * `Date` or a helper re-exporting a store all passed it).
 *
 * For every decision and every pure helper on a decision's path, the TypeScript checker resolves
 * each identifier used as a value. One that resolves to the platform's own declarations (the
 * default library: `globalThis`, `localStorage`, `setTimeout`, `Date` …) or to nothing at all
 * (`require`, `process` with no Node types loaded) is a GLOBAL, and every global use must match
 * this file's allow-list exactly — name, and how it is used (a named member, a `new` with one
 * plain argument, a call). Anything else fails, whatever it is called. Imports are checked the same
 * way: packages by exact name and named import (types are free), no re-exports, no namespace or
 * `require` imports, no module-level `let`, no `eslint-disable`, only `.ts` files.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '../../../../..');
const SRC = join(APP, 'src');
const DECIDE_DIR = join(SRC, 'lib/ledger/decide');
const rel = (abs: string) => relative(SRC, abs).split(sep).join('/');

/** Every file under decide/ except its tests, whatever its extension. */
const allUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === '__tests__'
        ? []
        : allUnder(join(dir, e.name))
      : [join(dir, e.name)]
  );
const DECIDE_FILES = allUnder(DECIDE_DIR);
/** The pure helpers (the same list as part 3's reach test and part 2 of the lint block). */
const HELPERS = [
  'lib/growthConstants.ts',
  'lib/weeklyCycle.ts',
  'lib/advancePlanner.ts',
  'i18n/config.ts',
].map((f) => join(SRC, f));

type Use = 'bare' | 'call' | 'new0' | 'new1' | `.${string}`;
/** The globals a decision or a helper may use, and how (measured 2026-11-24; each is pure). */
const GLOBALS: Record<string, readonly Use[]> = {
  undefined: ['bare'],
  Number: ['call', '.isFinite', '.isInteger'],
  Set: ['new0', 'new1', 'bare'],
  Map: ['new0', 'new1', 'bare'],
  // Date arithmetic on a GIVEN instant only: `new Date(x)` with one plain argument; never `Date()`,
  // `new Date()`, `Date.now()` or a spread (`new Date(...[])` reads the clock).
  Date: ['new1', '.parse', '.UTC'],
  Math: ['.abs', '.ceil', '.floor', '.max', '.min', '.pow', '.round', '.sign', '.trunc'],
};

/** Per group: the packages that may be imported, and which VALUE names (types are free). */
const DECIDE_PACKAGES: Record<string, readonly string[]> = {
  'decimal.js': ['default'],
  '@diboas/banking': ['computeExitFee'],
  '@diboas/investing': ['isValidRuleSplit'],
  '@diboas/defi': [],
};
const HELPER_PACKAGES: Record<string, readonly string[]> = {
  'decimal.js': ['default'],
  '@diboas/banking': [
    'WEEKLY_CADENCE_DAYS',
    'appliedEvents',
    'collectibleWeeks',
    'creditCeilingReached',
    'accrualSegmentDays',
    'recurringDepositDays',
  ],
  '@diboas/investing': [
    'generateProposal',
    'apyFactorsForSpan',
    'apyFactorsForSpanWindowed',
    'priceFactorsForSpan',
    'priceFactorsForSpanWindowed',
    'ratesForSpan',
    'ratesForSpanWindowed',
    'windowCoverage',
    'replayLegged',
  ],
  '@diboas/defi': ['FIXTURE_VERSION'],
};

/** How `node` (an identifier) is used by its parent. */
function howUsed(node: ts.Identifier): Use | 'computed' | 'new-other' {
  const p = node.parent;
  if (ts.isPropertyAccessExpression(p) && p.expression === node) return `.${p.name.text}`;
  if (ts.isElementAccessExpression(p) && p.expression === node) return 'computed';
  if (ts.isNewExpression(p) && p.expression === node) {
    const args = p.arguments ?? [];
    if (args.length === 0) return 'new0';
    return args.length === 1 && !ts.isSpreadElement(args[0]!) ? 'new1' : 'new-other';
  }
  if (ts.isCallExpression(p) && p.expression === node) return 'call';
  return 'bare';
}

/** Identifiers that NAME a property rather than reference a value. */
function namesAProperty(node: ts.Identifier): boolean {
  const p = node.parent;
  return (
    (ts.isPropertyAccessExpression(p) && p.name === node) ||
    (ts.isBindingElement(p) && p.propertyName === node) ||
    ((ts.isPropertyAssignment(p) ||
      ts.isMethodDeclaration(p) ||
      ts.isPropertyDeclaration(p) ||
      ts.isGetAccessorDeclaration(p) ||
      ts.isSetAccessorDeclaration(p)) &&
      p.name === node)
  );
}

interface Finding {
  file: string;
  line: number;
  what: string;
}

/** Everything in `files` that touches more than the allow-lists permit. */
function surfaceFindings(
  files: string[],
  packages: (file: string) => Record<string, readonly string[]>
): Finding[] {
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    baseUrl: APP,
    paths: { '@/*': ['src/*'] },
    // No Node types: `require`, `process`, `Buffer` stay unresolved, which counts as global.
    types: [],
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  });
  const checker = program.getTypeChecker();
  const findings: Finding[] = [];
  for (const file of files) {
    const sf = program.getSourceFile(file);
    if (!sf) {
      findings.push({ file: rel(file), line: 0, what: 'not compiled' });
      continue;
    }
    const at = (node: ts.Node, what: string) =>
      findings.push({
        file: rel(file),
        line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        what,
      });
    const allowed = packages(file);
    if (/eslint-(disable|enable)|\/\*\s*eslint\s/.test(sf.text))
      at(sf, 'an inline ESLint directive');

    for (const stmt of sf.statements) {
      if (ts.isVariableStatement(stmt) && !(stmt.declarationList.flags & ts.NodeFlags.Const))
        at(stmt, 'module-level let/var (hidden state between calls)');
      if (ts.isImportEqualsDeclaration(stmt)) at(stmt, 'import = require(...)');
      if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && !stmt.isTypeOnly)
        at(stmt, 're-export from another module');
      if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const spec = stmt.moduleSpecifier.text;
        if (spec.startsWith('.') || spec.startsWith('@/')) continue; // part 3 walks these
        const names = allowed[spec];
        if (!names) {
          at(stmt, `package "${spec}" is not allowed`);
          continue;
        }
        const clause = stmt.importClause;
        if (!clause) {
          at(stmt, `side-effect import of "${spec}"`);
          continue;
        }
        if (clause.isTypeOnly) continue;
        if (clause.name && !names.includes('default')) at(stmt, `default import of "${spec}"`);
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) at(stmt, `namespace import of "${spec}"`);
        if (bindings && ts.isNamedImports(bindings))
          for (const el of bindings.elements) {
            const name = (el.propertyName ?? el.name).text;
            if (!el.isTypeOnly && !names.includes(name))
              at(el, `"${name}" from "${spec}" is not on the allow-list`);
          }
      }
    }

    const visit = (node: ts.Node): void => {
      if (
        ts.isImportDeclaration(node) ||
        ts.isExportDeclaration(node) ||
        ts.isTypeNode(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)
      )
        return;
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
        at(node, 'dynamic import()');
      if (ts.isIdentifier(node) && !namesAProperty(node)) {
        const p = node.parent;
        const symbol = ts.isShorthandPropertyAssignment(p)
          ? checker.getShorthandAssignmentValueSymbol(p)
          : checker.getSymbolAtLocation(node);
        const decls = symbol?.declarations ?? [];
        const global =
          decls.length === 0 ||
          decls.every((d) => program.isSourceFileDefaultLibrary(d.getSourceFile()));
        if (global) {
          const use = howUsed(node);
          const permitted = GLOBALS[node.text] as readonly string[] | undefined;
          if (!permitted?.includes(use)) at(node, `global ${node.text} (${use})`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return findings;
}

const groupOf = (file: string) => (HELPERS.includes(file) ? HELPER_PACKAGES : DECIDE_PACKAGES);

describe(
  'LEDGER-DECIDE-1 · what a decision and its helpers can touch',
  { timeout: 120_000 },
  () => {
    it('should hold only .ts source files under decide/ (the lint glob and the walk read .ts)', () => {
      expect(DECIDE_FILES.length).toBeGreaterThanOrEqual(7);
      expect(
        DECIDE_FILES.map(rel).filter((f) => !f.endsWith('.ts') || f.endsWith('.d.ts'))
      ).toEqual([]);
    });

    it('should find nothing beyond the allow-lists in the real decisions and helpers', () => {
      expect(surfaceFindings([...DECIDE_FILES, ...HELPERS], groupOf)).toEqual([]);
    });

    /* Planted, both ways: each form must be found; the controls must not be. */
    const PLANT_DIR = join(DECIDE_DIR, '__tests__');
    const plant = (code: string, helper = false): Finding[] => {
      const file = join(PLANT_DIR, '__surface_plant__.ts');
      // Serve the planted text from memory: nothing is written to disk.
      const originalRead = ts.sys.readFile;
      const originalExists = ts.sys.fileExists;
      ts.sys.readFile = (p, enc) => (p === file ? code : originalRead(p, enc));
      ts.sys.fileExists = (p) => p === file || originalExists(p);
      try {
        return surfaceFindings([file], () => (helper ? HELPER_PACKAGES : DECIDE_PACKAGES));
      } finally {
        ts.sys.readFile = originalRead;
        ts.sys.fileExists = originalExists;
      }
    };

    it.each([
      ["export const f = () => globalThis.localStorage.getItem('k');", 'globalThis'],
      ["export const f = () => globalThis.fetch('/x');", 'globalThis.fetch'],
      ['export const f = () => self.Date.now();', 'self'],
      ['export const f = () => top;', 'top'],
      ['export const f = () => location.href;', 'location'],
      ['export const f = () => new XMLHttpRequest();', 'XMLHttpRequest'],
      ["export const f = () => new WebSocket('wss://x');", 'WebSocket'],
      ["export const f = () => new BroadcastChannel('x');", 'BroadcastChannel'],
      ['export const f = () => setTimeout(() => 0, 1);', 'setTimeout'],
      ['export const f = () => queueMicrotask(() => 0);', 'queueMicrotask'],
      ["export const f = () => eval('Date.now()');", 'eval'],
      ["export const f = () => new Function('return 1')();", 'Function'],
      ["export const f = () => require('@diboas/banking');", 'require'],
      ['export const f = () => process.env.X;', 'process'],
      ['export const f = () => new (Date as unknown as DateConstructor)();', 'Date through a cast'],
      ['export const f = () => new Date(...([] as []));', 'Date with a spread'],
      ['export const f = () => new Date();', 'Date with no argument'],
      ['export const f = () => Reflect.construct(Date, []);', 'Reflect.construct'],
      ["export const f = () => Date['now']();", 'computed Date member'],
      ['const { now } = Date;\nexport const f = now;', 'destructured Date.now'],
      ['const D = Date;\nexport const f = () => new D();', 'aliased Date'],
      ["export const f = () => new Intl.DateTimeFormat('en').format();", 'Intl'],
      ["export const f = () => Math['random']();", 'computed Math member'],
      ['export const f = () => Math.random();', 'Math.random'],
      ['export const f = (s: object) => Object.assign(s, { a: 1 });', 'Object.assign'],
      ["export const f = () => import('./stamp');", 'dynamic import'],
      ['let n = 0;\nexport const f = () => ++n;', 'module-level let'],
      ["export { LocalStorageLedgerStore } from '@diboas/banking';", 're-export'],
      [
        "import * as banking from '@diboas/banking';\nexport const f = banking;",
        'namespace import',
      ],
      [
        "import { LocalStorageLedgerStore } from '@diboas/banking';\nexport const f = LocalStorageLedgerStore;",
        'a store',
      ],
      [
        "import { getStrategy } from '@diboas/investing';\nexport const f = getStrategy;",
        'an investing name not on the list',
      ],
      [
        "import { neon } from '@neondatabase/serverless';\nexport const f = neon;",
        'another package',
      ],
      ["import os from 'os';\nexport const f = os;", 'a node built-in'],
      ["import x from '@diboas/banking/dist/index.mjs';\nexport const f = x;", 'a package subpath'],
      ["import '@diboas/banking';", 'a side-effect import'],
      [
        '// eslint-disable-next-line no-restricted-syntax\nexport const f = 1;',
        'an inline ESLint directive',
      ],
    ])('should find %s (%s) in a decision', (code) => {
      expect(plant(code)).not.toEqual([]);
    });

    it.each([
      [
        "import Decimal from 'decimal.js';\nexport const f = (x: string) => new Decimal(x).plus(1);",
      ],
      [
        "import { computeExitFee, type LedgerState } from '@diboas/banking';\nexport const f = (s: LedgerState) => [computeExitFee, s];",
      ],
      [
        "import type { Proposal } from '@diboas/investing';\nexport const f = (p: Proposal) => p.weekSet;",
      ],
      ['export const f = (iso: string) => new Date(iso).getTime();'],
      ['export const f = (s: string) => Date.parse(s);'],
      ['export const f = (a: number[]) => new Set(a).size + new Map<string, number>().size;'],
      ['export const f = (x: number) => Number.isFinite(x) && Math.max(x, 0) === Math.round(x);'],
      ['export const f = (x?: number) => (x === undefined ? 0 : x);'],
      [
        "export const f = (o: { a: number }) => ({ a: o.a, now: 'property names are not globals' });",
      ],
    ])('should accept the pure form %s (control)', (code) => {
      expect(plant(code)).toEqual([]);
    });

    it.each([
      [
        "export { LocalStorageLedgerStore } from '@diboas/banking';",
        'a helper re-exporting a store',
      ],
      [
        "import { LocalStorageLedgerStore } from '@diboas/banking';\nexport const s = LocalStorageLedgerStore;",
        'a helper importing a store',
      ],
      [
        'export const nowIso = () => new (Date as unknown as DateConstructor)().toISOString();',
        'a helper reading the clock',
      ],
      [
        "export const peek = () => globalThis.localStorage.getItem('k') ?? navigator.userAgent;",
        'a helper reading storage',
      ],
    ])('should find %s (%s) in a pure helper', (code) => {
      expect(plant(code, true)).not.toEqual([]);
    });
  }
);
