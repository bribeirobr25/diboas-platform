/**
 * 5.958 (plan P9, founder D7 in DR-2026-11-17-p9-genius-lexicon-decisions): the GENIUS wall's
 * controls may only grow. The wall enforces LC-RR-01-01 (a payment stablecoin is never presented
 * as earning); a control that silently disappears is how a narrowed wall stays green.
 *
 * The walls' count floors catch a deleted control but not a REPLACED one: review proved that a
 * removed alternative ("wuchs") with its controls rewritten into strings that still pair through
 * another word ("rendeu wuchs") kept every count and test green. `scripts/check-genius-controls-
 * grow.mjs` compares the fixture with the pull request's base. These tests prove the comparison
 * in both directions and that CI's quality job really runs it (the workflow is PARSED, as in
 * storybookCi.test.ts: a text match once passed a commented-out step, 5.896).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COVERAGE_LISTS,
  CONTROLS_PATH,
  controlsShrinkage,
} from '../../../../../scripts/check-genius-controls-grow.mjs';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };

const REPO = resolve(__dirname, '../../../../..');
const SCRIPT = 'scripts/check-genius-controls-grow.mjs';
type Controls = Record<string, unknown> & { windowChars: number };
const real = (): Controls => JSON.parse(readFileSync(join(REPO, CONTROLS_PATH), 'utf8'));
const list = (c: Controls, key: string): string[] => c[key] as string[];

describe('the GENIUS controls only grow (5.958)', () => {
  it('should cover every list that pins what the wall catches when the fixture is read', () => {
    const keys = Object.keys(real()).filter((k) => Array.isArray(real()[k]));
    expect([...COVERAGE_LISTS, 'nonEarnForms'].sort()).toEqual(keys.sort());
  });

  it('should pass when the fixture is unchanged', () => {
    expect(controlsShrinkage(real(), real())).toEqual({ failures: [], notices: [] });
  });

  it('should pass when a control is added to every list', () => {
    const head = real();
    for (const key of COVERAGE_LISTS) list(head, key).push(`added to ${key}`);
    expect(controlsShrinkage(real(), head).failures).toEqual([]);
  });

  it.each(COVERAGE_LISTS)('should fail when an entry of %s is deleted', (key) => {
    const head = real();
    const gone = list(head, key).shift();
    expect(controlsShrinkage(real(), head).failures).toContain(`${key}: "${gone}" disappeared`);
  });

  it('should fail when a control is replaced by one that still pairs (the case floors miss)', () => {
    const head = real();
    const forms = list(head, 'earnForms');
    const i = forms.indexOf('wuchs');
    expect(i).toBeGreaterThanOrEqual(0);
    forms[i] = 'rendeu wuchs';
    expect(forms.length).toBe(list(real(), 'earnForms').length);
    expect(controlsShrinkage(real(), head).failures).toEqual([`earnForms: "wuchs" disappeared`]);
  });

  it('should fail when a list is removed from the fixture', () => {
    const head = real();
    delete head.rateForms;
    expect(controlsShrinkage(real(), head).failures).toEqual([
      'rateForms: the list is gone on this branch',
    ]);
  });

  it('should fail when the window shrinks', () => {
    const head = { ...real(), windowChars: real().windowChars - 1 };
    expect(controlsShrinkage(real(), head).failures.join('\n')).toMatch(/windowChars/);
  });

  it('should fail when a list is renamed, even one the script does not name (code review)', () => {
    const base = { ...real(), legacyForms: ['kept'] };
    const head = real();
    expect(controlsShrinkage(base, head).failures).toEqual([
      'legacyForms: the list is gone on this branch',
    ]);
  });

  it.each([
    ['the base window is not a number', { windowChars: 'abc' }, {}],
    ['the branch window is a string', {}, { windowChars: '40' }],
  ])('should fail when %s', (_label, baseOverride, headOverride) => {
    const failures = controlsShrinkage(
      { ...real(), ...baseOverride },
      { ...real(), ...headOverride }
    ).failures;
    expect(failures.join('\n')).toMatch(/windowChars/);
  });

  it('should accept a list the base did not have yet (this change adds rateForms)', () => {
    const base = real();
    delete base.rateForms;
    expect(controlsShrinkage(base, real()).failures).toEqual([]);
  });

  it('should warn, not fail, when a look-alike leaves the ceiling (a founder ruling)', () => {
    const head = real();
    list(head, 'nonEarnForms').pop();
    const { failures, notices } = controlsShrinkage(real(), head);
    expect(failures).toEqual([]);
    expect(notices.join('\n')).toMatch(/founder's ruling/);
  });

  const run = (base: string): { status: number; out: string } => {
    try {
      const out = execFileSync('node', [SCRIPT, base], {
        cwd: REPO,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, out };
    } catch (error) {
      const e = error as { status: number; stderr: string };
      return { status: e.status, out: e.stderr };
    }
  };

  it('should pass against the current commit when run as CI runs it', () => {
    const r = run('HEAD');
    expect(r.out).toMatch(/PASS/);
    expect(r.status).toBe(0);
  });

  it.each([
    ['no base', ''],
    ['an all-zero base (a new branch)', '0000000000000000000000000000000000000000'],
    ['a base that does not exist', 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'],
  ])('should fail closed when given %s', (_label, base) => {
    const r = run(base);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/FAIL/);
  });
});

interface Step {
  name?: string;
  run?: string;
  if?: unknown;
  shell?: string;
  env?: Record<string, string>;
  'continue-on-error'?: unknown;
}
interface Workflow {
  defaults?: { run?: { shell?: string } };
  jobs?: Record<
    string,
    {
      if?: unknown;
      'continue-on-error'?: unknown;
      defaults?: { run?: { shell?: string } };
      steps?: Step[];
    }
  >;
}
const realCi = (): Workflow =>
  yaml.load(readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8')) as Workflow;
const isTheStep = (s: Step): boolean =>
  (s.run ?? '').split('\n').some((l) => l.trim() === `node ${SCRIPT} "$BASE_SHA"`);
/* Exact, not "contains": an `exit 0`, a `set +e` or a reassigned BASE_SHA beside the right lines
   passed a contains-check (P9 code review). */
const RUN_LINES = [
  'git fetch --no-tags --depth=1 origin "$BASE_SHA"',
  `node ${SCRIPT} "$BASE_SHA"`,
];
const BASE_EXPR =
  "${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event.before }}";
type Trigger = { branches?: string[]; paths?: unknown; 'paths-ignore'?: unknown } | null;

function triggerGaps(ci: Workflow): string[] {
  const out: string[] = [];
  const on = (ci as { on?: Record<string, Trigger> }).on ?? {};
  for (const event of ['push', 'pull_request']) {
    const t = on[event];
    if (t === undefined) out.push(`the workflow does not run on ${event}`);
    else if (!t?.branches?.includes('main')) out.push(`${event} does not target main`);
    if (t && (t.paths !== undefined || t['paths-ignore'] !== undefined))
      out.push(`${event} has a path filter`);
  }
  return out;
}

function stepGaps(ci: Workflow): string[] {
  const quality = ci.jobs?.quality;
  if (!quality) return ['no quality job'];
  const out: string[] = [...triggerGaps(ci)];
  if (quality.if !== undefined) out.push('the quality job has an if:');
  if (quality['continue-on-error']) out.push('the quality job continues on error');
  const steps = (quality.steps ?? []).filter(isTheStep);
  if (steps.length === 0) out.push('no step runs the controls check');
  for (const s of steps) {
    if (s.if !== undefined) out.push('the step has an if:');
    if (s['continue-on-error']) out.push('the step continues on error');
    const shell = s.shell ?? quality.defaults?.run?.shell ?? ci.defaults?.run?.shell;
    if (shell !== 'bash') out.push(`the step runs with shell ${shell}`);
    if (JSON.stringify(s.env ?? {}) !== JSON.stringify({ BASE_SHA: BASE_EXPR }))
      out.push("BASE_SHA is not exactly the pull request's base (a push: its before)");
    const lines = (s.run ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (JSON.stringify(lines) !== JSON.stringify(RUN_LINES))
      out.push('the step runs something other than exactly the fetch and the check');
    if ((s as { 'working-directory'?: unknown })['working-directory'] !== undefined)
      out.push('the step has a working-directory');
  }
  return out;
}

describe('CI runs the controls check on every pull request and push (5.958)', () => {
  it('should run the check in an unconditional bash step of the quality job when CI runs', () => {
    expect(stepGaps(realCi())).toEqual([]);
  });

  const stepOf = (ci: Workflow): Step => ci.jobs!.quality.steps!.find(isTheStep)!;
  it.each<[string, (ci: Workflow) => void, RegExp]>([
    [
      'the step removed',
      (ci) => {
        ci.jobs!.quality.steps = ci.jobs!.quality.steps!.filter((s) => !isTheStep(s));
      },
      /no step runs the controls check/,
    ],
    [
      'a step that only runs on push',
      (ci) => void (stepOf(ci).if = "github.event_name == 'push'"),
      /has an if:/,
    ],
    [
      'a step allowed to fail',
      (ci) => void (stepOf(ci)['continue-on-error'] = true),
      /continues on error/,
    ],
    ['a no-op shell', (ci) => void (stepOf(ci).shell = 'true {0}'), /shell true \{0\}/],
    [
      'a skipped quality job',
      (ci) => void (ci.jobs!.quality.if = 'false'),
      /quality job has an if:/,
    ],
    [
      'a base read from the push only',
      (ci) => void (stepOf(ci).env = { BASE_SHA: '${{ github.event.before }}' }),
      /pull request's base/,
    ],
    [
      'a PR compared with itself (both expressions still named)',
      (ci) =>
        void (stepOf(ci).env = {
          BASE_SHA:
            '${{ github.event.pull_request.base.sha && github.sha || github.event.before }}',
        }),
      /pull request's base/,
    ],
    [
      'an exit 0 before the check',
      (ci) => void (stepOf(ci).run = `exit 0\n${stepOf(ci).run}`),
      /something other than exactly/,
    ],
    [
      'BASE_SHA reassigned inside the step',
      (ci) => void (stepOf(ci).run = `BASE_SHA=HEAD\n${stepOf(ci).run}`),
      /something other than exactly/,
    ],
    [
      'a working-directory on the step',
      (ci) => void ((stepOf(ci) as Record<string, unknown>)['working-directory'] = 'apps/web'),
      /working-directory/,
    ],
    [
      'pull requests no longer trigger the workflow',
      (ci) => void delete (ci as { on: Record<string, unknown> }).on.pull_request,
      /does not run on pull_request/,
    ],
    [
      'a path filter that skips config changes',
      (ci) =>
        void ((ci as { on: Record<string, Record<string, unknown>> }).on.pull_request![
          'paths-ignore'
        ] = ['config/**']),
      /pull_request has a path filter/,
    ],
  ])('should report %s (the guard is not blind)', (_label, plant, expected) => {
    const ci = realCi();
    plant(ci);
    expect(stepGaps(ci).join('\n')).toMatch(expected);
  });
});
