/**
 * ⛑ LEDGER-CHAR-1 · the CI job's judge and its comparison (plan P12a J6; register 5.1029).
 *
 * Lives OUTSIDE `characterization/`, so it never runs inside a recording and the harness's no-write
 * control is untouched. It pins:
 * 1. the job restores exactly P12a J1's judge set from the base, and verifies it, before AND after
 *    recording the PR; it refuses nothing; the recorder is started directly, NODE_OPTIONS cleared;
 * 2. the recording config imports no other config and runs the tests the way the main config does;
 * 3. the comparison (in memory) fails on everything that must fail and passes what must pass.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import mainConfig from '../../../../../vitest.config.mjs';
import charConfig from '../../../../../vitest.char-update.config.mjs';
import { compareRecordings } from '../../../../../scripts/characterization/compareRecordings.mjs';

const APP = join(__dirname, '../../../../..');
const REPO = join(APP, '../..');
const workflow = readFileSync(join(REPO, '.github/workflows/ledger-char-base.yml'), 'utf8');

/** P12a J1: the judge set, in the order the workflow lists it. */
const J1 = [
  'apps/sandbox/src/lib/ledger/decide/__tests__/characterization',
  'apps/sandbox/scripts/characterization',
  'apps/sandbox/vitest.char-update.config.mts',
  'apps/sandbox/src/test/setup.ts',
  'apps/sandbox/src/test/networkGuard.ts',
];

/** The folded `env` list `name` of the workflow, one path per entry. */
function envList(name: string): string[] {
  const lines = workflow.split('\n');
  const at = lines.findIndex((l) => l.trim() === `${name}: >-`);
  expect(at, `${name} in the workflow`).toBeGreaterThan(-1);
  const out: string[] = [];
  for (let i = at + 1; i < lines.length && /^ {4}\S/.test(lines[i]!); i += 1)
    out.push(lines[i]!.trim());
  return out;
}

describe('LEDGER-CHAR-1 · the job takes its judge from the base', () => {
  it('should restore exactly the J1 judge set when it records the PR', () => {
    expect(envList('JUDGE')).toEqual(J1);
  });

  it('should restore from the base, then verify before and after recording the PR', () => {
    const head = workflow.slice(
      workflow.indexOf('  record-head:'),
      workflow.indexOf('  ledger-char-base:')
    );
    const restore = head.indexOf('git restore --source="$BASE_SHA" --staged --worktree -- $JUDGE');
    const record = head.indexOf('vitest.mjs run --config vitest.char-update.config.mts');
    const verifies = [...head.matchAll(/git diff --exit-code "\$BASE_SHA" -- \$JUDGE/g)].map(
      (m) => m.index!
    );
    const untracked = [...head.matchAll(/git ls-files --others -- \$JUDGE/g)].length;
    expect(restore).toBeGreaterThan(head.indexOf("pnpm --filter 'sandbox^...' build"));
    expect(record).toBeGreaterThan(restore);
    expect(verifies.some((v) => v > restore && v < record)).toBe(true);
    expect(verifies.some((v) => v > record)).toBe(true);
    expect(untracked).toBe(2);
  });

  it('should start the recorder directly, with NODE_OPTIONS cleared, in both recordings', () => {
    expect(workflow).not.toMatch(/char:update/);
    expect(
      workflow.match(
        /node node_modules\/vitest\/vitest\.mjs run --config vitest\.char-update\.config\.mts/g
      )
    ).toHaveLength(2);
    expect(workflow.match(/NODE_OPTIONS: ''/g)).toHaveLength(2);
  });

  it('should refuse nothing: no step fails because the PR changed the judge', () => {
    expect(workflow).not.toMatch(/may not|refuse a changed judge/i);
    expect(workflow).toMatch(/::notice::This PR changes the characterization judge/);
  });

  it('should compare with the base checkout only, its frozen ids included', () => {
    const compare = workflow.slice(workflow.indexOf('  ledger-char-base:'));
    expect(compare).toMatch(/ref: \$\{\{ needs\.plan\.outputs\.base \}\}/);
    expect(compare).toMatch(
      /compareOutputs\.mjs \\\n\s+"\$RUNNER_TEMP\/out-base" "\$RUNNER_TEMP\/out-head" \\\n\s+apps\/sandbox\/src\/lib\/ledger\/decide\/__tests__\/characterization\/frozen\.json/
    );
  });
});

describe('LEDGER-CHAR-1 · the recording config stands alone', () => {
  const source = readFileSync(join(APP, 'vitest.char-update.config.mts'), 'utf8');

  it('should import no other config when the base restores it into a PR', () => {
    const imports = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['vitest/config', '@vitejs/plugin-react', 'node:path']);
  });

  it('should run tests the way the main config does', () => {
    const pick = (c: typeof mainConfig) => ({
      environment: c.test?.environment,
      environmentOptions: c.test?.environmentOptions,
      globals: c.test?.globals,
      clearMocks: c.test?.clearMocks,
      testTimeout: c.test?.testTimeout,
      alias: c.resolve?.alias,
      plugins: (c.plugins ?? []).flat().map((p: unknown) => (p as { name?: string } | null)?.name),
    });
    expect(pick(charConfig)).toEqual(pick(mainConfig));
    expect(charConfig.test?.setupFiles).toEqual(
      expect.arrayContaining(mainConfig.test?.setupFiles as string[])
    );
  });
});

describe('LEDGER-CHAR-1 · the comparison', () => {
  const base = { journey: { a: { r: 1 }, b: { r: 2 } }, credits: { c: { r: 3 } } };
  const frozen = { journey: { a: 'h', b: 'h' }, credits: { c: 'h' } };

  it.each([
    ['an empty base', {}, base, frozen, /no family/],
    [
      'a frozen family missing from the base',
      { journey: base.journey },
      base,
      frozen,
      /credits: a frozen family/,
    ],
    [
      'a frozen case missing from the base',
      { journey: { a: { r: 1 } }, credits: base.credits },
      base,
      frozen,
      /journey · b: a frozen case/,
    ],
    ['a base family with no case', { journey: {} }, { journey: {} }, {}, /no case/],
    [
      'a lost case',
      base,
      { journey: { a: { r: 1 } }, credits: base.credits },
      frozen,
      /journey · b: lost/,
    ],
    [
      'a changed case',
      base,
      { journey: { a: { r: 1 }, b: { r: 9 } }, credits: base.credits },
      frozen,
      /journey · b: changed/,
    ],
    [
      'a family missing from the PR',
      base,
      { journey: base.journey },
      frozen,
      /credits: missing from the PR/,
    ],
  ] as const)('should fail on %s', (_name, b, h, f, problem) => {
    const result = compareRecordings(b, h, f);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toMatch(problem);
  });

  it('should pass identical recordings and count every case', () => {
    expect(compareRecordings(base, structuredClone(base), frozen)).toMatchObject({
      ok: true,
      compared: 3,
      families: 2,
      added: [],
    });
  });

  it('should pass and list a case only the PR has', () => {
    const head = {
      journey: { ...base.journey, z: { r: 0 } },
      credits: base.credits,
      newFamily: { y: {} },
    };
    const result = compareRecordings(base, head, frozen);
    expect(result.ok).toBe(true);
    expect(result.added).toEqual(['journey · z', 'newFamily · y']);
  });
});
