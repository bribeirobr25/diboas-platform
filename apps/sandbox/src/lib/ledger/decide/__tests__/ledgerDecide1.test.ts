/**
 * ⛑ LEDGER-DECIDE-1 · the ledger's decisions are pure (plan P12 D10, S1a PR-2; ADR-003).
 *
 * 1. The ESLint block bans every impure form, planted here one by one (`lintText` on this app's
 *    own config), and passes the clean controls; a rule that stopped firing fails here.
 * 2. Direct importers: only the adapters in `lib/ledger/` and other decisions import a decision
 *    (in S1a no file under `src/app` may; S2b adds one named server route folder).
 * 3. Reach: every app module a decision reaches, transitively, is on the allow-list of pure
 *    modules; a new module on the path fails until it is reviewed and listed (and linted, part 2
 *    of the ESLint block). Scope limit: package specifiers are not followed (the named-import
 *    allow-list in the ESLint block is their control).
 * 4. One definition: `feeInCents` and `splitEntry` exist once, in `decide/fees.ts` (D8).
 * 5. What a decision can touch, whatever the spelling: `ledgerDecide1Surface.test.ts`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { resolveModule, runtimeImports } from '@/test/importGraph';

const APP = join(__dirname, '../../../../..');
const SRC = join(APP, 'src');
const rel = (abs: string) => relative(SRC, abs).split(sep).join('/');
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : files(full);
    return /\.tsx?$/.test(e.name) && !/\.(test|stories)\./.test(e.name) ? [full] : [];
  });
const SOURCE = files(SRC);
const DECIDE = SOURCE.filter((f) => rel(f).startsWith('lib/ledger/decide/'));

/* ── 1 · the lint block, planted ───────────────────────────────────────────────────── */
const eslint = new ESLint({ cwd: APP });
const PLANTED = join(SRC, 'lib/ledger/decide/__planted__.ts');
async function errors(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: PLANTED });
  return result!.messages.filter((m) => m.severity === 2).map((m) => m.message);
}

describe('LEDGER-DECIDE-1 · the lint block', { timeout: 60_000 }, () => {
  it.each([
    ["import { appendAll } from '../core';", 'an adapter or the core, relative'],
    ["import { createGoal } from '../journey';", 'an adapter, relative'],
    ["import { generateId } from '../../ids';", 'the id generator, relative'],
    ["import { recordDecline } from '../../proposalStore';", 'a side store, relative'],
    ["import { Logger } from '../../monitoring/Logger';", 'monitoring, relative'],
    ["import { x } from '../../market/fetchSeries';", 'market I/O, relative'],
    ["import { x } from '../../../hooks/useMarket';", 'a hook, relative'],
    ["import { getLedgerState } from '@/lib/ledgerClient';", 'the client barrel'],
    ["import { appendAll } from '@/lib/ledger/core';", 'the core, alias'],
    ["import { generateId } from '@/lib/ids';", 'the id generator, alias'],
    ["import { x } from '@/lib/market/fetchSeries';", 'market I/O, alias'],
    ["import { x } from '@/lib/database/client';", 'the database, alias'],
    ["import { LocalStorageLedgerStore } from '@diboas/banking';", 'the banking store'],
    ["import { getStrategy } from '@diboas/defi';", 'a defi export not on the list'],
    ["import React from 'react';", 'React'],
    ["import { headers } from 'next/headers';", 'Next'],
    ["import { readFileSync } from 'node:fs';", 'node built-ins'],
    ['export const t = () => new Date();', 'a clock read'],
    ['export const t = () => Date();', 'Date() called as a function'],
    ['export const t = () => Date.now();', 'Date.now()'],
    ['export const t = () => globalThis.Date;', 'globalThis.Date'],
    ['export const t = () => performance.now();', 'performance.now()'],
    ['export const t = () => Math.random();', 'randomness'],
    ["export const t = () => fetch('/x');", 'fetch'],
    ["export const t = () => import('./stamp');", 'a dynamic import'],
    ["export const t = () => localStorage.getItem('k');", 'localStorage'],
    ['export const t = () => window.location;', 'window'],
    ['export const t = () => process.env.X;', 'process'],
    ['export const t = () => indexedDB;', 'indexedDB'],
    ['export const t = (s: { a: number }) => { s.a = 1; };', 'mutating an argument'],
    [
      "import { generateProposal } from '@diboas/investing';",
      'an investing export not on the list',
    ],
    ["import { neon } from '@neondatabase/serverless';", 'another package'],
    ["import os from 'os';", 'a bare built-in'],
    ["import x from '@diboas/banking/dist/index.mjs';", 'a package subpath'],
    ["import { appendAll } from './../core';", 'a ./.. spelling'],
    ["import { appendAll } from '@/lib/ledger/decide/../core';", 'an alias walking back out'],
    ["import { appendAll } from '../decide/../core';", 'a relative path walking back out'],
    ["export const t = () => require('@diboas/banking');", 'require()'],
    ["import banking = require('@diboas/banking');", 'import = require()'],
    ["export { LocalStorageLedgerStore } from '@diboas/banking';", 'a re-export'],
    ["export * from '@diboas/banking';", 'a star re-export'],
    ["export const t = () => globalThis.localStorage.getItem('k');", 'globalThis'],
    ['export const t = () => self.fetch;', 'self'],
    ['export const t = () => setTimeout(() => 0, 1);', 'a timer'],
    ["export const t = () => eval('1');", 'eval'],
    ['export const t = () => new Date(...([] as []));', 'a spread Date'],
    ["export const t = () => Date['now']();", 'a computed Date member'],
    ['export const t = () => Reflect.construct(Date, []);', 'Reflect'],
    ["export const t = () => new Intl.DateTimeFormat('en').format();", 'Intl'],
    ['export const t = (s: object) => Object.assign(s, { a: 1 });', 'Object.assign'],
    ['let n = 0;\nexport const t = () => ++n;', 'module-level let'],
    [
      '// eslint-disable-next-line no-restricted-syntax\nexport const t = () => Date.now();',
      'an inline disable (ignored)',
    ],
    [
      "declare const localStorage: { getItem(k: string): string | null };\nexport const t = () => localStorage.getItem('k');",
      'a declare hiding storage',
    ],
    ['class Clock extends Date {}\nexport const t = () => new Clock();', 'a class extending Date'],
    ['export const t = () => new (Date<never>)();', 'an instantiation expression'],
    ["export const t = () => ({}).constructor.constructor('return 1')();", 'the constructor chain'],
    [
      "import Decimal from 'decimal.js';\nexport const t = () => Decimal.random();",
      'Decimal.random',
    ],
    [
      "import Decimal from 'decimal.js';\nexport const t = () => Decimal.set({ precision: 2 });",
      'Decimal.set',
    ],
  ])('should refuse %s (%s) when it is written in a decision', async (code) => {
    expect(await errors(code)).not.toEqual([]);
  });

  it('should lint every source extension under decide/ (a .tsx or .mts is not a way out)', async () => {
    for (const ext of ['tsx', 'mts', 'cts']) {
      const [result] = await eslint.lintText('export const t = () => Date.now();', {
        filePath: join(SRC, `lib/ledger/decide/__planted__.${ext}`),
      });
      expect(result!.messages.filter((m) => m.severity === 2)).not.toEqual([]);
    }
  });

  it.each([
    ["export { LocalStorageLedgerStore } from '@diboas/banking';", 're-exporting a store'],
    ["export const p = () => globalThis.localStorage.getItem('k');", 'reading storage'],
    ['export const p = () => navigator.userAgent;', 'reading navigator'],
    ['export const p = () => process.env.X;', 'reading process'],
    ['export const p = () => new Date(...([] as []));', 'reading the clock'],
    ['export const m = (s: { a: number }) => { s.a = 1; };', 'mutating an argument'],
    ['let n = 0;\nexport const t = () => ++n;', 'module-level let'],
    [
      'class Instant extends Date {}\nexport const t = () => new Instant();',
      'a class extending Date',
    ],
    [
      "declare const localStorage: { getItem(k: string): string | null };\nexport const p = () => localStorage.getItem('k');",
      'a declare hiding storage',
    ],
  ])('should refuse %s (%s) when it is written in a pure helper', async (code) => {
    const [result] = await eslint.lintText(code, { filePath: join(SRC, 'lib/weeklyCycle.ts') });
    expect(result!.messages.filter((m) => m.severity === 2)).not.toEqual([]);
  });

  it.each([
    ["import Decimal from 'decimal.js';\nexport const d = new Decimal(1);"],
    [
      "import { computeExitFee, type LedgerEvent } from '@diboas/banking';\nexport const f = computeExitFee; export type E = LedgerEvent;",
    ],
    ["import { isValidRuleSplit } from '@diboas/investing';\nexport const v = isValidRuleSplit;"],
    ["import { stamp } from './stamp';\nexport const s = stamp;"],
    ["import { getCollectView } from '../../weeklyCycle';\nexport const g = getCollectView;"],
    [
      "import { weeklyCreditAmount } from '@/lib/growthConstants';\nexport const w = weeklyCreditAmount;",
    ],
    ['export const d = (iso: string) => new Date(`${iso}T00:00:00Z`);'],
    ['export const p = (s: string) => Date.parse(s);'],
  ])('should accept the pure form %s when it is written in a decision (control)', async (code) => {
    expect(await errors(code)).toEqual([]);
  });
});

/* ── 2 · direct importers ─────────────────────────────────────────────────────────── */
describe('LEDGER-DECIDE-1 · who imports a decision', { timeout: 30_000 }, () => {
  const exists = (r: string) => existsSync(join(SRC, r));
  const importers = SOURCE.filter((f) =>
    runtimeImports(readFileSync(f, 'utf8'), f).some((spec) =>
      (resolveModule(rel(f), spec, exists) ?? '').startsWith('lib/ledger/decide/')
    )
  ).map(rel);

  it('should find the adapters importing decisions (non-vacuity)', () => {
    expect(importers).toEqual(
      expect.arrayContaining([
        'lib/ledger/journey.ts',
        'lib/ledger/rules.ts',
        'lib/ledger/credits.ts',
        'lib/ledger/simEvents.ts',
      ])
    );
  });

  it('should let only the ledger adapters and other decisions import a decision', () => {
    const outside = importers.filter(
      (f) => !/^lib\/ledger\/[^/]+\.ts$/.test(f) && !f.startsWith('lib/ledger/decide/')
    );
    expect(outside).toEqual([]);
  });
});

/* ── 3 · reach ────────────────────────────────────────────────────────────────────── */
/** The pure modules a decision may reach (each is also held by part 2 of the lint block). */
const PURE = new Set([
  'lib/growthConstants.ts',
  'lib/weeklyCycle.ts',
  'lib/advancePlanner.ts',
  'i18n/config.ts',
]);

describe('LEDGER-DECIDE-1 · what a decision reaches', { timeout: 30_000 }, () => {
  const exists = (r: string) => existsSync(join(SRC, r));
  const reached = new Set<string>();
  const unresolved: string[] = [];
  const queue = DECIDE.map(rel);
  while (queue.length) {
    const from = queue.shift()!;
    if (reached.has(from)) continue;
    reached.add(from);
    for (const spec of runtimeImports(readFileSync(join(SRC, from), 'utf8'), from)) {
      const to = resolveModule(from, spec, exists);
      // Fail closed: an app specifier that does not resolve to a .ts/.tsx file is a way around
      // the walk (a .mts behind a .mjs spelling, a template path), so it is a finding.
      if (!to && (spec.startsWith('.') || spec.startsWith('@/')))
        unresolved.push(`${from} → ${spec}`);
      if (to && !reached.has(to)) queue.push(to);
    }
  }

  it('should walk every decision and reach the pure helpers (non-vacuity)', () => {
    expect(DECIDE.length).toBeGreaterThanOrEqual(6);
    expect([...reached]).toEqual(
      expect.arrayContaining(['lib/growthConstants.ts', 'lib/weeklyCycle.ts'])
    );
  });

  it('should reach no app module outside the decisions and the pure allow-list', () => {
    const impure = [...reached].filter((m) => !m.startsWith('lib/ledger/decide/') && !PURE.has(m));
    expect(impure).toEqual([]);
  });

  it('should resolve every app import on the path and reach no test file', () => {
    expect(unresolved).toEqual([]);
    expect([...reached].filter((m) => m.includes('/__tests__/'))).toEqual([]);
  });
});

/* ── 4 · one definition of the fee helpers ────────────────────────────────────────── */
describe('LEDGER-DECIDE-1 · the fee helpers are defined once', { timeout: 30_000 }, () => {
  it('should define feeInCents and splitEntry only in decide/fees.ts', () => {
    const DEFINES =
      /\b(?:function\s+(feeInCents|splitEntry)\b|(?:const|let|var)\s+(feeInCents|splitEntry)\s*=)/;
    const definers = SOURCE.filter((f) =>
      DEFINES.test(stripComments(readFileSync(f, 'utf8'), f))
    ).map(rel);
    expect(definers).toEqual(['lib/ledger/decide/fees.ts']);
  });
});
