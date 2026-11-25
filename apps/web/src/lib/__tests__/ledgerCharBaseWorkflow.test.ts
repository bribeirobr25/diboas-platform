/**
 * ⛑ LEDGER-CHAR-1 · the `ledger-char-base` workflow's shape (plan P12a J1–J3, J6; register 5.1029).
 *
 * Read as YAML, not as text, so a comment or a step that never runs cannot satisfy it. It pins:
 * - the judge list (J1) and the paths that decide whether there is anything to compare, set once at
 *   the top and redefined by no job or step;
 * - `record-head`'s order: install and build, restore the judge from the base, verify (diff and
 *   untracked), record, verify again — every step unconditional;
 * - both recordings start the recorder directly, NODE_OPTIONS cleared, never through package.json;
 * - the final job always runs, fails when the plan or a recording did not succeed, and compares with
 *   the base's comparator and frozen ids, with no `continue-on-error` and no `|| true` anywhere;
 * - nothing is refused (J2) and the job runs for PRs, retargeted PRs and pushes to main.
 * Lives with the other workflow guards because the website's tests can load `js-yaml`.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
  with?: Record<string, string | boolean>;
  'working-directory'?: string;
  'continue-on-error'?: boolean;
}
interface Job {
  needs?: string | string[];
  if?: string;
  env?: Record<string, string>;
  steps: Step[];
  'continue-on-error'?: boolean;
  'timeout-minutes'?: number;
}
interface Workflow {
  on: { pull_request: { branches: string[]; types: string[] }; push: { branches: string[] } };
  env: Record<string, string>;
  jobs: Record<string, Job>;
}

const FILE = resolve(__dirname, '../../../../../.github/workflows/ledger-char-base.yml');
const wf = yaml.load(readFileSync(FILE, 'utf8')) as Workflow;
const words = (value: string | undefined) => (value ?? '').split(/\s+/).filter(Boolean);
const RECORD = 'node node_modules/vitest/vitest.mjs run --config vitest.char-update.config.mts';

/** P12a J1. */
const JUDGE = [
  'apps/sandbox/src/lib/ledger/decide/__tests__/characterization',
  'apps/sandbox/scripts/characterization',
  'apps/sandbox/vitest.char-update.config.mts',
  'apps/sandbox/src/test/setup.ts',
  'apps/sandbox/src/test/networkGuard.ts',
];
/** P12a §3: the build settings that reach a PR's recording (named, and watched for a comparison). */
const NOTICE_PATHS = [
  'apps/sandbox/tsconfig.json',
  '.npmrc',
  'pnpm-workspace.yaml',
  'patches',
  'package.json',
  'turbo.json',
  'packages/test-support',
];

describe('LEDGER-CHAR-1 · the workflow restores and verifies the base judge', () => {
  it('should define the judge list and the watched paths once, at the top, when it runs', () => {
    expect(words(wf.env.JUDGE)).toEqual(JUDGE);
    expect(words(wf.env.NOTICE_PATHS)).toEqual(NOTICE_PATHS);
    for (const [id, job] of Object.entries(wf.jobs)) {
      expect(job.env?.JUDGE, `${id} redefines JUDGE`).toBeUndefined();
      expect(job.env?.NOTICE_PATHS, `${id} redefines NOTICE_PATHS`).toBeUndefined();
      for (const step of job.steps) {
        expect(step.env?.JUDGE, `${id} · ${step.name} redefines JUDGE`).toBeUndefined();
        expect(step.env?.NOTICE_PATHS, `${id} · ${step.name}`).toBeUndefined();
      }
    }
  });

  it('should decide "nothing to compare" only over the ledger paths and the watched settings when a PR changes neither', () => {
    const plan = wf.jobs.plan!.steps.find((s) => s.run?.includes('nothing to compare'))!.run!;
    expect(plan).toContain(
      'git diff --name-only "$BASE_SHA" HEAD -- apps/sandbox packages pnpm-lock.yaml $NOTICE_PATHS'
    );
  });

  it('should install and build, restore, verify, record and verify again, in that order, when it records the PR', () => {
    const steps = wf.jobs['record-head']!.steps;
    const at = (needle: string) => steps.findIndex((s) => s.run?.includes(needle));
    const build = at("pnpm --filter 'sandbox^...' build");
    const restore = at('git restore --source="$BASE_SHA" --staged --worktree -- $JUDGE');
    const record = at(RECORD);
    const verifies = steps
      .map((s, i) =>
        s.run?.includes('git diff --exit-code "$BASE_SHA" -- $JUDGE') &&
        s.run.includes('git ls-files --others -- $JUDGE')
          ? i
          : -1
      )
      .filter((i) => i >= 0);
    expect(build).toBeGreaterThanOrEqual(0);
    expect(restore).toBeGreaterThan(build);
    expect(record).toBeGreaterThan(restore);
    expect(verifies.some((i) => i >= restore && i < record)).toBe(true);
    expect(verifies.some((i) => i > record)).toBe(true);
    for (const step of steps) {
      expect(step.if, `record-head · ${step.name} is conditional`).toBeUndefined();
      expect(step['continue-on-error'], `record-head · ${step.name}`).toBeUndefined();
    }
  });

  it('should start the recorder directly with NODE_OPTIONS cleared when it records either side', () => {
    for (const id of ['record-base', 'record-head']) {
      const recorders = wf.jobs[id]!.steps.filter((s) => s.run?.includes(RECORD));
      expect(recorders, id).toHaveLength(1);
      expect(recorders[0]!.env?.NODE_OPTIONS, id).toBe('');
      expect(recorders[0]!['working-directory'], id).toBe('apps/sandbox');
    }
    expect(readFileSync(FILE, 'utf8')).not.toMatch(/char:update/);
  });
});

describe('LEDGER-CHAR-1 · the workflow compares honestly', () => {
  const compare = wf.jobs['ledger-char-base']!;

  it('should always run and fail when the plan or a recording did not succeed', () => {
    expect(compare.if).toBe('always()');
    expect(compare.needs).toEqual(['plan', 'record-base', 'record-head']);
    const gate = compare.steps[0]!.run!;
    expect(gate).toContain('if [ "$PLAN" != "success" ]');
    expect(gate).toContain('if [ "$BASE" != "success" ] || [ "$HEAD" != "success" ]');
  });

  it("should compare with the base's comparator and frozen ids when both recordings exist", () => {
    const checkout = compare.steps.find((s) => s.uses?.startsWith('actions/checkout@'))!;
    expect(checkout.with?.ref).toBe('${{ needs.plan.outputs.base }}');
    expect(checkout.with?.['sparse-checkout-cone-mode']).toBe(false);
    const run = compare.steps.at(-1)!.run!;
    expect(run.replace(/\\\n\s*/g, '')).toBe(
      'node apps/sandbox/scripts/characterization/compareOutputs.mjs "$RUNNER_TEMP/out-base" "$RUNNER_TEMP/out-head" apps/sandbox/src/lib/ledger/decide/__tests__/characterization/frozen.json\n'
    );
  });

  it('should let no failure be swallowed anywhere in the workflow', () => {
    for (const [id, job] of Object.entries(wf.jobs)) {
      expect(job['continue-on-error'], id).toBeUndefined();
      for (const step of job.steps) {
        expect(step['continue-on-error'], `${id} · ${step.name}`).toBeUndefined();
        expect(step.run ?? '', `${id} · ${step.name}`).not.toMatch(/\|\|\s*(true|:)\s*$/m);
      }
    }
  });

  it('should refuse nothing and run for PRs, retargeted PRs and pushes to main', () => {
    expect(readFileSync(FILE, 'utf8')).not.toMatch(/may not|refuse a changed judge/i);
    expect(wf.on.pull_request.branches).toEqual(['main']);
    expect(wf.on.pull_request.types).toEqual(['opened', 'synchronize', 'reopened', 'edited']);
    expect(wf.on.push.branches).toEqual(['main']);
  });
});
