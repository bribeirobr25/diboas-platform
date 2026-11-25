/**
 * ⛑ LEDGER-CHAR-1 · the recording config and the comparison (plan P12a J4–J6; register 5.1029).
 *
 * Lives OUTSIDE `characterization/`, so it never runs inside a recording and the harness's no-write
 * control is untouched. The workflow's shape is pinned with the other workflow guards
 * (`apps/web/src/lib/__tests__/ledgerCharBaseWorkflow.test.ts`). This file pins:
 * 1. the recording config imports no other config and runs tests exactly as the main config does,
 *    apart from a named list of intended differences;
 * 2. the comparison (in memory) fails on everything that must fail and passes what must pass.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import mainConfig from '../../../../../vitest.config.mjs';
import charConfig from '../../../../../vitest.char-update.config.mjs';
import { compareRecordings } from '../../../../../scripts/characterization/compareRecordings.mjs';

const APP = join(__dirname, '../../../../..');

/** What the recording run sets differently from the main config, on purpose (P12a J4). */
const INTENDED_TEST_DIFFERENCES = [
  'include',
  'setupFiles',
  'globalSetup',
  'fileParallelism',
  'coverage',
  'maxWorkers',
];

describe('LEDGER-CHAR-1 · the recording config stands alone', () => {
  const source = readFileSync(join(APP, 'vitest.char-update.config.mts'), 'utf8');

  it('should import no other config when the base restores it into a PR', () => {
    const imports = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['vitest/config', '@vitejs/plugin-react', 'node:path']);
  });

  it('should set every test option the main config sets when the option is not an intended difference', () => {
    const omit = (test: Record<string, unknown> = {}) =>
      Object.fromEntries(
        Object.entries(test).filter(([key]) => !INTENDED_TEST_DIFFERENCES.includes(key))
      );
    expect(omit(charConfig.test as Record<string, unknown>)).toEqual(
      omit(mainConfig.test as Record<string, unknown>)
    );
  });

  it('should match the main config outside `test` when both declare plugins, aliases and the rest', () => {
    const outside = (config: Record<string, unknown>) => {
      const { test: _test, plugins, ...rest } = config;
      return {
        ...rest,
        plugins: (plugins as unknown[]).flat().map((p) => (p as { name?: string } | null)?.name),
      };
    };
    expect(outside(charConfig as Record<string, unknown>)).toEqual(
      outside(mainConfig as Record<string, unknown>)
    );
  });

  it('should keep the main setup file when it adds its own', () => {
    expect(charConfig.test?.setupFiles).toEqual(
      expect.arrayContaining(mainConfig.test?.setupFiles as string[])
    );
  });
});

describe('LEDGER-CHAR-1 · the comparison', () => {
  const base = { journey: { a: { r: 1 }, b: { r: 2 } }, credits: { c: { r: 3 } } };
  const frozen = { journey: { a: 'h', b: 'h' }, credits: { c: 'h' } };

  it.each([
    ['the base is empty', {}, base, frozen, /no family/],
    ['the base has a family with no case', { journey: {} }, { journey: {} }, {}, /no case/],
    [
      'a frozen family is missing from the base',
      { journey: base.journey },
      base,
      frozen,
      /credits: a frozen family/,
    ],
    [
      'a frozen case is missing from the base',
      { journey: { a: { r: 1 } }, credits: base.credits },
      base,
      frozen,
      /journey · b: a frozen case/,
    ],
    [
      'a frozen case named like a built-in is missing',
      base,
      base,
      { ...frozen, journey: { toString: 'h' } },
      /journey · toString: a frozen case/,
    ],
    [
      'a case is lost',
      base,
      { journey: { a: { r: 1 } }, credits: base.credits },
      frozen,
      /journey · b: lost/,
    ],
    [
      'a case named like a built-in is lost',
      { journey: { constructor: { r: 1 } } },
      { journey: {} },
      {},
      /journey · constructor: lost/,
    ],
    [
      'a case changed',
      base,
      { journey: { a: { r: 1 }, b: { r: 9 } }, credits: base.credits },
      frozen,
      /journey · b: changed/,
    ],
    [
      'a family is missing from the PR',
      base,
      { journey: base.journey },
      frozen,
      /credits: missing from the PR/,
    ],
    [
      'the PR has a case the base lacks',
      base,
      { journey: { ...base.journey, z: {} }, credits: base.credits },
      frozen,
      /journey · z: only in the PR/,
    ],
    [
      'the PR has a family the base lacks',
      base,
      { ...base, extra: { y: {} } },
      frozen,
      /extra: a family only in the PR/,
    ],
  ] as const)('should fail when %s', (_name, b, h, f, problem) => {
    const result = compareRecordings(b, h, f);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toMatch(problem);
  });

  it('should pass and count every case when the recordings are identical', () => {
    expect(compareRecordings(base, structuredClone(base), frozen)).toEqual({
      ok: true,
      problems: [],
      compared: 3,
      families: 2,
    });
  });
});
