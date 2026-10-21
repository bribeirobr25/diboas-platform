import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as ledgerClient from '@/lib/ledgerClient';
import { moduleBase, resolveModule, runtimeImports } from '@/test/importGraph';
import { stripComments } from '@/test/stripComments';

/**
 * ⚙ `CI-N3` · NO MODELLED VALUE REACHES AN ACTUAL BALANCE OR GOAL COMPLETION.
 *
 * **Requirement:** traced to `LC-RR-01-10` and `LC-RR-01-12` (the authority
 * texts live in the private canon). The engineering invariant enforced: a
 * modelled value (a projection) never feeds an actual Goal balance or Goal
 * completion — actual and modelled values are kept apart.
 *
 * ⚑ THE BEHAVIOUR IS ALREADY CORRECT — DO NOT INVENT A RUNTIME DEFECT BECAUSE
 * THE GATE IS MISSING. Measured 2026-09-25: `Projection.tsx` and
 * `ExpenseImpactCard.tsx` import **zero** ledger-write APIs, and
 * `goalCurrentValue` reads only `goal.cash` plus each open position's
 * `principal` and `accrued`. What was absent is the assertion that keeps that
 * true; this gate makes a FUTURE violation impossible, which is the same shape
 * as `CI-N1`.
 *
 * ⚑ A NAME COLLISION WORTH STATING, because it would mislead the next reader:
 * `@diboas/banking`'s `project(events)` is the event-sourcing REDUCER — it
 * projects events into state. It is not a financial projection and is not what
 * this gate is about. The modelled values here are `projectionRange` /
 * `projectionDisplay` in `@diboas/investing`.
 */

const SANDBOX_SRC = join(__dirname, '..');

function source(relative: string): string {
  return readFileSync(join(SANDBOX_SRC, relative), 'utf8');
}

/** Comments stripped (by the parser) — a docstring naming the ledger is not a dependency. */
function code(relative: string): string {
  return stripComments(source(relative), relative);
}

/* ── 1 · the surfaces that DISPLAY a projection cannot WRITE ──────────────── */

/** The ledger-write modules, as paths relative to `src/`. */
const LEDGER_WRITE_MODULE =
  /^lib\/(?:ledgerClient\.tsx?|ledger\/(?:core|journey|credits|rules|simEvents)(?:\.tsx?|\/))/;

/**
 * ⛑ REACHABILITY, NOT ONE FILE'S IMPORTS (R4-7, independent review 2026-10-16).
 * The checks above read the surface's own text, so a write one hop away was
 * invisible: `hooks/useSettleToNow.ts` calls `advanceTime`, and a projection
 * surface calling `useSettleToNow()` matched neither the import pattern nor the
 * write list. This walks every RUNTIME import (static, re-export, `import()`,
 * `require()`; alias `@/` or relative; type-only imports excluded) from a
 * surface and fails if any path reaches a ledger-write module.
 *
 * `read` is injectable so planted surfaces can be judged against the real tree.
 * The import reading is shared with `PRU-1` (`@/test/importGraph`).
 */
function ledgerPath(
  entry: string,
  read: (rel: string) => string | null = (rel) =>
    existsSync(join(SANDBOX_SRC, rel)) ? readFileSync(join(SANDBOX_SRC, rel), 'utf8') : null
): string[] | null {
  const exists = (rel: string): boolean => read(rel) !== null;
  const seen = new Set([entry]);
  const queue: string[][] = [[entry]];
  while (queue.length) {
    const path = queue.shift()!;
    const file = path[path.length - 1]!;
    const text = read(file);
    if (text === null) continue;
    for (const spec of runtimeImports(text, file)) {
      const target = resolveModule(file, spec, exists);
      const base = moduleBase(file, spec);
      /* A write module named in a spelling that does not resolve — fail closed. */
      if (!target && base !== null && LEDGER_WRITE_MODULE.test(`${base}.ts`))
        return [...path, `${base}.ts`];
      if (!target || seen.has(target)) continue;
      if (LEDGER_WRITE_MODULE.test(target)) return [...path, target];
      seen.add(target);
      queue.push([...path, target]);
    }
  }
  return null;
}

/**
 * ⛑ THE WRITE LIST IS DERIVED, AND IT FAILS CLOSED (PB-3). The hand-written
 * list named 5 of ~21 writers — `accomplishGoal`, the invariant's own subject,
 * was missing. Every function `ledgerClient` exports now counts as a WRITE
 * unless it is one of these named, side-effect-free readers; a new export is
 * therefore guarded the day it exists, and a new reader must be added here on
 * purpose.
 */
const LEDGER_READERS = new Set([
  'flush',
  'getLedgerState',
  'getReady',
  'subscribe',
  'previewExit',
  'previewGoalStop',
  'previewPositionStop',
  'splitEntry',
]);
const LEDGER_WRITES = Object.entries(ledgerClient)
  .filter(([name, value]) => typeof value === 'function' && !LEDGER_READERS.has(name))
  .map(([name]) => name);

/**
 * The surfaces that DISPLAY a modelled value: the two named at the gate's
 * creation, plus every file under `components/` or `view/` that calls the
 * projection seam (`projectionDisplay` / `projectionRange`) — so a new surface
 * that calls the seam directly is covered without an edit here.
 *
 * ⚑ SCOPE LIMIT (corrected after independent review, 2026-10-15). A PARENT that
 * only renders a projection surface is NOT covered: `GoalDetailScreen` renders
 * `<Projection>` and legitimately calls ledger writes from its own buttons, so
 * "no write in the file" cannot be its rule — whether a modelled value flows
 * INTO one of those writes needs data-flow analysis this text scan does not do.
 * Today the only `SCENARIO_RATES` consumer in the app is `Projection.tsx`.
 */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'test') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}
const PROJECTION_SURFACES = [
  ...new Set([
    'components/Projection.tsx',
    'components/ExpenseImpactCard.tsx',
    ...sourceFiles(join(SANDBOX_SRC, 'components'))
      .concat(sourceFiles(join(SANDBOX_SRC, 'view')))
      .filter((f) => /projectionDisplay|projectionRange/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SANDBOX_SRC, f)),
  ]),
];

describe('CI-N3 · a projection surface holds no ledger-write capability', () => {
  it.each(PROJECTION_SURFACES)('should call no ledger-write function in %s', (file) => {
    const text = code(file);
    const found = [...LEDGER_WRITES, 'appendAll'].filter((w) =>
      new RegExp(`\\b${w}\\s*\\(`).test(text)
    );
    expect(found, `${file} calls ledger write(s): ${found.join(', ')}`).toEqual([]);
  });

  it('should derive a complete write list (non-vacuity, PB-3)', () => {
    for (const writer of ['accomplishGoal', 'createGoal', 'enterStrategy', 'resetSandbox']) {
      expect(LEDGER_WRITES, `${writer} is not treated as a write`).toContain(writer);
    }
    expect(LEDGER_WRITES).not.toContain('getLedgerState');
    expect(LEDGER_WRITES.length).toBeGreaterThan(15);
  });

  it.each(PROJECTION_SURFACES)(
    'should REACH no ledger-write module through any import chain from %s',
    (file) => {
      const path = ledgerPath(file);
      expect(path?.join(' → ') ?? null, `${file} reaches a ledger-write module`).toBeNull();
    }
  );

  /**
   * ⛑ ONE RULE, EVERY SPELLING (R4 correction). A per-file import regex used to
   * duplicate this reach rule — and shared its blind spot for `.js` suffixes. It
   * was deleted; its planted spellings are judged by the reach rule here.
   */
  it('should reach a write module in EVERY import spelling, and not through a package', () => {
    const planted: Record<string, string> = {
      'components/PAlias.tsx': "import { createGoal } from '@/lib/ledgerClient';",
      'components/PRelative.tsx': "import { accomplishGoal as done } from '../lib/ledgerClient';",
      'components/deep/PDeep.tsx': "import { appendAll } from '../../lib/ledger/core';",
      'components/PDynamic.tsx':
        "export async function f() { return import('@/lib/ledger/journey'); }",
      'lib/PReexport.ts': "export { createRule } from './ledger/rules';",
      'components/PJs.tsx': "import { createGoal } from '@/lib/ledgerClient.js';",
      'components/PEquals.ts': "import lc = require('../lib/ledgerClient');",
      'components/PSideEffect.tsx': "import {} from '@/lib/ledgerClient';",
      'components/barrel.ts': "export * from '@/lib/ledgerClient';",
      'components/PBarrel.tsx': "import { createGoal } from './barrel';",
      'components/PPackage.tsx': "import { projectionDisplay } from '@diboas/investing';",
    };
    const read = (rel: string): string | null =>
      planted[rel] ??
      (existsSync(join(SANDBOX_SRC, rel)) ? readFileSync(join(SANDBOX_SRC, rel), 'utf8') : null);
    for (const entry of Object.keys(planted).filter(
      (k) => k !== 'components/barrel.ts' && k !== 'components/PPackage.tsx'
    ))
      expect(ledgerPath(entry, read), entry).not.toBeNull();
    expect(ledgerPath('components/PPackage.tsx', read)).toBeNull();
  });

  it('should catch a write reached through a HOOK, and a template-literal import (R4-7)', () => {
    const planted: Record<string, string> = {
      'components/PlantedViaHook.tsx':
        "import { useSettleToNow } from '@/hooks/useSettleToNow';\nexport function P() { useSettleToNow(); return null; }\n",
      'components/PlantedTemplate.tsx':
        'export async function P() { const { createGoal } = await import(`@/lib/ledgerClient`); return createGoal; }\n',
      'components/PlantedTypeOnly.tsx':
        "import type { LedgerState } from '@/lib/ledgerClient';\nexport type S = LedgerState;\n",
    };
    const read = (rel: string): string | null =>
      planted[rel] ??
      (existsSync(join(SANDBOX_SRC, rel)) ? readFileSync(join(SANDBOX_SRC, rel), 'utf8') : null);
    expect(ledgerPath('components/PlantedViaHook.tsx', read)).toEqual([
      'components/PlantedViaHook.tsx',
      'hooks/useSettleToNow.ts',
      'lib/ledgerClient.ts',
    ]);
    expect(ledgerPath('components/PlantedTemplate.tsx', read)?.pop()).toBe('lib/ledgerClient.ts');
    /* A type-only import carries no capability — it must not fail the rule. */
    expect(ledgerPath('components/PlantedTypeOnly.tsx', read)).toBeNull();
  });

  it('should have actually read the surfaces — an empty read proves nothing', () => {
    for (const file of PROJECTION_SURFACES) {
      expect(source(file).length, file).toBeGreaterThan(500);
    }
  });
});

/* ── 2 · the balance reads the ledger and nothing else ────────────────────── */

describe('CI-N3 · the actual balance is derived from the ledger alone', () => {
  it('should compute goal value without importing the projection package', () => {
    /**
     * `goalCurrentValue` / `goalTargetReached` ARE the "actual Goal balance and
     * completion" the invariant names. If a modelled value were ever to reach
     * them it would arrive as an import from `@diboas/investing`, which is
     * where every projection in this repository lives.
     */
    const text = code('lib/goalValue.ts');
    expect(text).not.toContain('@diboas/investing');
    for (const modelled of ['projectionRange', 'projectionDisplay', 'SCENARIO_RATES']) {
      expect(text, `goalValue.ts reaches a modelled value: ${modelled}`).not.toContain(modelled);
    }
  });

  it('should derive completion from the ledger terms only', () => {
    /* `current >= target`, where current is cash + principal + accrued. */
    const text = code('lib/goalValue.ts');
    for (const ledgerTerm of ['.cash', '.principal', '.accrued', '.targetAmount']) {
      expect(text, `the ledger term ${ledgerTerm} disappeared from goalValue.ts`).toContain(
        ledgerTerm
      );
    }
  });
});
