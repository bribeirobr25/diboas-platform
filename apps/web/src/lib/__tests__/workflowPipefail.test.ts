/**
 * A workflow step that pipes into `tee` must not take `tee`'s exit code.
 *
 * GitHub runs a step with no `shell:` as `bash -e {0}`: no pipefail, so `scan | tee out.txt`
 * exits with tee's 0 and a failing scan leaves the run green. The quarterly security scan did
 * exactly that, although its header says a failure marks the run red (fifteenth audit, agent C).
 * A step is safe when it sets `shell: bash` (GitHub then adds `-o pipefail`), sets pipefail
 * itself, or reads the command's own code from PIPESTATUS. Every workflow is PARSED.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };

const WORKFLOWS = resolve(__dirname, '../../../../../.github/workflows');

interface Step {
  name?: string;
  run?: string;
  shell?: string;
}
interface Job {
  defaults?: { run?: { shell?: string } };
  steps?: Step[];
}
interface Workflow {
  defaults?: { run?: { shell?: string } };
  jobs?: Record<string, Job>;
}

const PIPES_INTO_TEE = /\|\s*tee\b/;
const SETS_PIPEFAIL = /\bset\b[^\n]*-o\s+pipefail|\bset\s+-[a-z]*o[a-z]*\s+pipefail/;

export function maskedPipes(file: string, wf: Workflow): string[] {
  const out: string[] = [];
  for (const [jobName, job] of Object.entries(wf.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (typeof step.run !== 'string' || !PIPES_INTO_TEE.test(step.run)) continue;
      const shell = step.shell ?? job.defaults?.run?.shell ?? wf.defaults?.run?.shell;
      const safe = shell === 'bash' || SETS_PIPEFAIL.test(step.run) || /PIPESTATUS/.test(step.run);
      if (!safe) out.push(`${file} :: ${jobName} :: ${step.name ?? step.run.split('\n')[0]}`);
    }
  }
  return out;
}

const workflows = () =>
  readdirSync(WORKFLOWS)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => ({ file: f, wf: yaml.load(readFileSync(join(WORKFLOWS, f), 'utf8')) as Workflow }));

describe('no workflow step hides a failure behind tee', () => {
  it('should read every workflow (the scan is not vacuous)', () => {
    expect(workflows().length).toBeGreaterThanOrEqual(8);
  });

  it('should give every step that pipes into tee the command its own exit code', () => {
    expect(workflows().flatMap(({ file, wf }) => maskedPipes(file, wf))).toEqual([]);
  });

  const one = (step: Step, job: Partial<Job> = {}, wf: Partial<Workflow> = {}): Workflow => ({
    ...wf,
    jobs: { j: { ...job, steps: [step] } },
  });

  it.each<[string, Workflow, boolean]>([
    ['tee with the default shell', one({ run: 'scan | tee out.txt' }), true],
    ['tee with shell: bash', one({ run: 'scan | tee out.txt', shell: 'bash' }), false],
    ['tee with set -o pipefail', one({ run: 'set -o pipefail\nscan | tee out.txt' }), false],
    ['tee with set +e -u -o pipefail', one({ run: 'set +e -u -o pipefail\nscan | tee o' }), false],
    ['tee read through PIPESTATUS', one({ run: 'scan | tee o\ncode=${PIPESTATUS[0]}' }), false],
    [
      'tee under a job default of bash',
      one({ run: 'scan | tee o' }, { defaults: { run: { shell: 'bash' } } }),
      false,
    ],
    ['tee with shell: sh', one({ run: 'scan | tee o', shell: 'sh' }), true],
    [
      'a pipe into grep -q in a test',
      one({ run: 'if echo "$X" | grep -q y; then exit 1; fi' }),
      false,
    ],
  ])('should judge %s', (_label, wf, masked) => {
    expect(maskedPipes('x.yml', wf).length > 0).toBe(masked);
  });
});
