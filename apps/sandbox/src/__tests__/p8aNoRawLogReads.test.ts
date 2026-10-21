import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { parseSource } from '@/test/parseSource';

/**
 * ⚙ P8a · no reader walks the ledger's RAW log (register `5.485`).
 *
 * `state.events` keeps every event, refused ones included. Eight screens and
 * helpers walked it directly, so a refused cross-tab write was counted by
 * History, the charts, the month report, Home and the weekly flow. Every reader
 * now uses `@diboas/banking`'s `appliedEvents` / `eventsWithDisposition`.
 *
 * This guard is deliberately FAIL-CLOSED: any `.events` property read in the
 * scanned source is a finding unless it is one of the NAMED exemptions below —
 * so a raw read under a new variable name (`ledger.events`, `s.events`) is caught
 * too, not only `state.events`.
 */

const REPO = resolve(__dirname, '../../../..');
const ROOTS = [
  'apps/sandbox/src',
  'packages/banking/src',
  'packages/investing/src',
  'packages/defi/src',
];

/**
 * The ONLY places a `.events` read is allowed — each pinned to its file AND, where the
 * file also holds other code, to the function or exact read. A whole-file or
 * text-only exemption was too wide (independent review, 2026-10-16): a later raw read
 * in `reconcile()` would have passed, and `this.events` would have passed in any file.
 */
const EXEMPT: { file: string; fn?: string; read?: string; why: string }[] = [
  { file: 'packages/banking/src/ledger/engine.ts', fn: 'project', why: 'writes the snapshot' },
  { file: 'packages/banking/src/ledger/engine.ts', fn: 'dispositionsOf', why: 'the accessor' },
  { file: 'packages/banking/src/ledger/engine.ts', fn: 'appliedEvents', why: 'the accessor' },
  {
    file: 'packages/banking/src/ledger/dispositions.ts',
    fn: 'eventsWithDisposition',
    why: 'the accessor',
  },
  {
    file: 'packages/banking/src/ledger/store.ts',
    read: 'this.events',
    why: "a store's own append buffer",
  },
  {
    file: 'apps/sandbox/src/lib/simulatedEvents.ts',
    read: 'SIMULATED_EVENT_CATALOGUE.events',
    why: 'the simulated-event catalogue, a static list of definitions',
  },
  /* The two other routes to the FULL log (second P8a audit): `eventsWithDisposition`
     returns every event, refused ones included, and a store's `getAll()` returns the
     persisted log. Each is allowed at its one sanctioned place. */
  {
    file: 'packages/banking/src/ledger/dispositions.ts',
    read: 'eventsWithDisposition',
    why: 'defines it, and `refusedEvents` filters it to the refused ones',
  },
  {
    file: 'apps/sandbox/src/lib/ledger/core.ts',
    fn: 'hydrate',
    read: 'getAll()',
    why: 'loads the persisted log into memory; every reader then projects it',
  },
  {
    file: 'packages/banking/src/ledger/store.ts',
    fn: 'getAll',
    read: 'getAll()',
    why: 'LocalStorageLedgerStore delegating to its own memory',
  },
  {
    file: 'packages/banking/src/ledger/store.ts',
    fn: 'persist',
    read: 'getAll()',
    why: 'the store serialising its own log',
  },
];

/**
 * Is this object literal the TARGET of an assignment — `({ events } = state)`, also when
 * nested inside a larger pattern (`({ a: { events } } = x)`, `[{ events }] = list`)?
 */
function isAssignmentTarget(obj: ts.Node): boolean {
  let n = obj;
  for (;;) {
    const p = n.parent;
    if (ts.isParenthesizedExpression(p) || ts.isArrayLiteralExpression(p)) n = p;
    else if (ts.isPropertyAssignment(p) && p.initializer === n) n = p.parent;
    else break;
  }
  return (
    ts.isBinaryExpression(n.parent) &&
    n.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    n.parent.left === n
  );
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '__tests__' || name === 'test')
      continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (
      /\.tsx?$/.test(name) &&
      !/\.(test|stories)\.tsx?$/.test(name) &&
      !name.endsWith('.d.ts')
    )
      acc.push(full);
  }
  return acc;
}

interface EventsRead {
  read: string;
  /** The named function the read sits in, or '' at module level / in an anonymous one. */
  fn: string;
}

function enclosingFunction(n: ts.Node): string {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name)
      return p.name.getText();
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent))
      return p.parent.name.getText();
  }
  return '';
}

/** Every `.events` property read in `text`, as written (`state.events`, `ledger.events`, …). */
function eventsReads(text: string, fileName: string): EventsRead[] {
  const sf = parseSource(text, fileName);
  const out: EventsRead[] = [];
  const add = (n: ts.Node, read: string) => out.push({ read, fn: enclosingFunction(n) });
  const visit = (n: ts.Node): void => {
    if (ts.isPropertyAccessExpression(n) && n.name.text === 'events') add(n, n.getText(sf));
    // `state['events']` — the same read through an element access.
    if (
      ts.isElementAccessExpression(n) &&
      ts.isStringLiteralLike(n.argumentExpression) &&
      n.argumentExpression.text === 'events'
    )
      add(n, n.getText(sf));
    // `({ events } = state)` / `({ events: log } = state)` — destructuring by ASSIGNMENT.
    // An object literal that is not an assignment target (`{ ...state, events: [] }`) writes.
    if (
      (ts.isShorthandPropertyAssignment(n) || ts.isPropertyAssignment(n)) &&
      (ts.isIdentifier(n.name) || ts.isStringLiteralLike(n.name)) &&
      n.name.text === 'events' &&
      isAssignmentTarget(n.parent)
    )
      add(n, `({ events } = …)`);
    // The full log by another door. `eventsWithDisposition` is flagged wherever its NAME
    // appears — a call, an aliased import, a reference passed on — and a store's
    // `getAll()` at any call, dotted or bracketed. Fail-closed: an unrelated `.getAll()`
    // (URLSearchParams, FormData) is flagged too; give it a named exemption if one appears.
    if (ts.isIdentifier(n) && n.text === 'eventsWithDisposition') add(n, 'eventsWithDisposition');
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const name = ts.isPropertyAccessExpression(callee)
        ? callee.name.text
        : ts.isElementAccessExpression(callee) && ts.isStringLiteralLike(callee.argumentExpression)
          ? callee.argumentExpression.text
          : '';
      if (name === 'getAll') add(n, 'getAll()');
    }
    // `const { events } = state` / `({ events: log }) => …` — the same read by destructuring.
    if (ts.isBindingElement(n) && ts.isObjectBindingPattern(n.parent)) {
      const key = n.propertyName ?? n.name;
      if ((ts.isIdentifier(key) || ts.isStringLiteralLike(key)) && key.text === 'events')
        add(n, `{ events } from ${n.parent.parent.getText(sf).slice(0, 60)}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function findings(text: string, rel: string): string[] {
  return eventsReads(text, rel)
    .filter(
      ({ read, fn }) =>
        !EXEMPT.some(
          (x) =>
            x.file === rel &&
            (x.fn === undefined || x.fn === fn) &&
            (x.read === undefined || x.read === read)
        )
    )
    .map(({ read, fn }) => `${rel}${fn ? ` (${fn})` : ''}: ${read}`);
}

describe('P8a · no raw ledger-log read outside the accessor', () => {
  const files = ROOTS.flatMap((r) => sourceFiles(join(REPO, r)));

  it('should scan the app and all three packages — an empty scan proves nothing', () => {
    for (const root of ROOTS)
      expect(files.filter((f) => relative(REPO, f).startsWith(root)).length, root).toBeGreaterThan(
        3
      );
  });

  it('should find NO raw `.events` read anywhere else', () => {
    const hits = files.flatMap((f) => findings(readFileSync(f, 'utf8'), relative(REPO, f)));
    expect(hits).toEqual([]);
  });

  it('should CATCH a raw read under any name — planted positives', () => {
    for (const planted of [
      'export const n = (state: LedgerState) => state.events.length;',
      'export function f(ledger: LedgerState) { for (const e of ledger.events) void e; }',
      'export const g = (s: LedgerState) => [...s.events].reverse();',
      "export const h = (s: LedgerState) => s['events'].length;",
      'export function k(state: LedgerState) { const { events } = state; return events; }',
      'export const m = ({ events: log }: LedgerState) => log.length;',
      'export function p(state: LedgerState) { let events; ({ events } = state); return events; }',
      'export function q(state: LedgerState) { let log; ({ events: log } = state); return log; }',
      'export const r = (s: LedgerState) => eventsWithDisposition(s).map((x) => x.event);',
      'export async function t(store: ILedgerStore) { return (await store.getAll()).length; }',
      "import { eventsWithDisposition as ewd } from '@diboas/banking';",
      'export const pass = (f: unknown) => f; export const u = pass(eventsWithDisposition);',
      "export async function v(store: ILedgerStore) { return (await store['getAll']()).length; }",
      'export function w(x: { a: LedgerState }) { let events; ({ a: { events } } = x); return events; }',
    ])
      expect(findings(planted, 'apps/sandbox/src/lib/planted.ts'), planted).toHaveLength(1);
  });

  it('should CATCH a raw read inside an OWNER file but outside its exempt function, and an exempt text elsewhere', () => {
    const engine = 'packages/banking/src/ledger/engine.ts';
    expect(
      findings(
        'export function reconcile(state: LedgerState) { return state.events.length; }',
        engine
      )
    ).toHaveLength(1);
    expect(
      findings('export const total = (state: LedgerState) => state.events.length;', engine)
    ).toHaveLength(1);
    expect(
      findings('class S { all() { return [...this.events]; } }', 'apps/sandbox/src/lib/other.ts')
    ).toHaveLength(1);
    expect(
      findings(
        'export const d = SIMULATED_EVENT_CATALOGUE.events[0];',
        'apps/sandbox/src/lib/other.ts'
      )
    ).toHaveLength(1);
  });

  it('should NOT flag the accessor or the named exemptions in their own place — negative controls', () => {
    for (const ok of [
      'export const n = (state: LedgerState) => appliedEvents(state).length;',
      '// state.events in a comment is not a read',
      "export const label = 'state.events';",
      // Writing a log into a new object is not a read.
      'export const fresh = (state: LedgerState) => ({ ...state, events: [] });',
      'export const refused = (state: LedgerState) => refusedEvents(state).length;',
    ])
      expect(findings(ok, 'apps/sandbox/src/lib/ok.ts'), ok).toEqual([]);
    expect(
      findings(
        'class S { private events: E[] = []; all() { return [...this.events]; } }',
        'packages/banking/src/ledger/store.ts'
      )
    ).toEqual([]);
    expect(
      findings(
        'export const d = SIMULATED_EVENT_CATALOGUE.events.find((e) => e.wave === "R1");',
        'apps/sandbox/src/lib/simulatedEvents.ts'
      )
    ).toEqual([]);
    expect(
      findings(
        'export function appliedEvents(state: LedgerState) { return state.events.filter(Boolean); }',
        'packages/banking/src/ledger/engine.ts'
      )
    ).toEqual([]);
  });
});
