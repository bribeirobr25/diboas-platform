/**
 * The CI steps W-D1's gates depend on are wired into REQUIRED jobs and cannot be quietly switched
 * off (market clean-up W-D1, spec §4, CONSENT-TEXT-1; WITHDRAW-1's e2e step joins in group A').
 * The workflows are PARSED (a text match once passed a commented-out step, 5.896): each step must
 * sit in its job, run exactly its lines, and carry no `if:` and no `continue-on-error`, nor may
 * its job.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };
const REPO = resolve(__dirname, '../../../../..');

interface Step {
  name?: string;
  run?: string;
  if?: unknown;
  shell?: string;
  env?: Record<string, string>;
  'continue-on-error'?: unknown;
}
interface Job {
  if?: unknown;
  'continue-on-error'?: unknown;
  steps?: Step[];
}
const workflow = (file: string): { jobs?: Record<string, Job> } =>
  yaml.load(readFileSync(join(REPO, '.github/workflows', file), 'utf8')) as {
    jobs?: Record<string, Job>;
  };

const BASE_EXPR =
  "${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.event.before }}";

/** Each pinned step: where it lives, its exact run lines, its exact env. */
const PINNED = [
  {
    gate: 'CONSENT-TEXT-1',
    file: 'ci.yml',
    job: 'quality',
    lines: [
      'git fetch --no-tags --depth=1 origin "$BASE_SHA"',
      'node scripts/check-consent-texts-grow.mjs "$BASE_SHA"',
    ],
    env: { BASE_SHA: BASE_EXPR },
    shell: 'bash',
  },
];

function gaps(pin: (typeof PINNED)[number], wf = workflow(pin.file)): string[] {
  const job = wf.jobs?.[pin.job];
  if (!job) return [`no ${pin.job} job`];
  const out: string[] = [];
  if (job.if !== undefined) out.push('the job has an if:');
  if (job['continue-on-error']) out.push('the job continues on error');
  const lines = (s: Step) =>
    (s.run ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  const steps = (job.steps ?? []).filter((s) => lines(s).includes(pin.lines.at(-1)!));
  if (steps.length !== 1) return [...out, `${steps.length} steps run the check (expected 1)`];
  const [step] = steps;
  if (step.if !== undefined) out.push('the step has an if:');
  if (step['continue-on-error']) out.push('the step continues on error');
  if (step.shell !== pin.shell) out.push(`the step's shell is ${step.shell}`);
  if (JSON.stringify(step.env ?? {}) !== JSON.stringify(pin.env)) out.push('the env differs');
  if (JSON.stringify(lines(step)) !== JSON.stringify(pin.lines)) out.push('the run lines differ');
  return out;
}

describe('the CI steps W-D1 depends on', () => {
  it.each(PINNED)('should run the $gate step in the required $job job, unconditionally', (pin) => {
    expect(gaps(pin)).toEqual([]);
  });

  it('should catch each way of switching the step off', () => {
    const pin = PINNED[0];
    const variant = (edit: (step: Step, job: Job) => void) => {
      const wf = workflow(pin.file);
      const job = wf.jobs![pin.job];
      const step = job.steps!.find((s) => (s.run ?? '').includes('check-consent-texts-grow'))!;
      edit(step, job);
      return gaps(pin, wf);
    };
    expect(variant((s) => (s.if = 'false'))).toContain('the step has an if:');
    expect(variant((s) => (s['continue-on-error'] = true))).toContain(
      'the step continues on error'
    );
    expect(variant((_s, j) => (j.if = "github.actor != 'x'"))).toContain('the job has an if:');
    expect(variant((s) => (s.run = `${s.run}\nexit 0`))).toContain('the run lines differ');
    expect(variant((s) => (s.env = { BASE_SHA: 'HEAD' }))).toContain('the env differs');
    expect(
      variant(
        (_s, j) => (j.steps = j.steps!.filter((x) => !(x.run ?? '').includes('consent-texts')))
      )
    ).toEqual(['0 steps run the check (expected 1)']);
  });
});
