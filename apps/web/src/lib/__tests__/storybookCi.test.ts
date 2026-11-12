/**
 * 5.919: CI builds every Storybook in the workspace.
 *
 * On 2026-11-11 a lockfile that resolved two webpack copies broke BOTH Storybook builds ("The
 * 'compilation' argument must be an instance of Compilation"), but CI's quality job built only
 * the web one, so a split that breaks just the Practice Storybook would have passed. The rule is
 * derived from the package files, not a list: every workspace whose package.json has a
 * `build-storybook` script must be built by an unconditional step of the quality job. The
 * workflow is PARSED (a text match passed a commented-out step and an `if:` before, 5.896).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };

const REPO = resolve(__dirname, '../../../../..');

interface Step {
  run?: string;
  if?: unknown;
  shell?: string;
  'continue-on-error'?: unknown;
}
interface Job {
  if?: unknown;
  'continue-on-error'?: unknown;
  defaults?: { run?: { shell?: string } };
  steps?: Step[];
}
interface Workflow {
  defaults?: { run?: { shell?: string } };
  jobs?: Record<string, Job>;
}

/** Every workspace package name with a `build-storybook` script. */
function storybookWorkspaces(): string[] {
  const out: string[] = [];
  for (const group of ['apps', 'packages']) {
    for (const dir of readdirSync(join(REPO, group))) {
      const file = join(REPO, group, dir, 'package.json');
      if (!existsSync(file)) continue;
      const pkg = JSON.parse(readFileSync(file, 'utf8')) as {
        name: string;
        scripts?: Record<string, string>;
      };
      if (pkg.scripts?.['build-storybook']) out.push(pkg.name);
    }
  }
  return out.sort();
}

function storybookGaps(ci: Workflow, workspaces: string[]): string[] {
  const out: string[] = [];
  const quality = ci.jobs?.quality;
  if (!quality) return ['no quality job'];
  if (quality.if !== undefined) out.push('the quality job has an if:');
  if (quality['continue-on-error']) out.push('the quality job continues on error');
  for (const name of workspaces) {
    const steps = (quality.steps ?? []).filter(
      (s) => s.run?.trim() === `pnpm --filter ${name} build-storybook`
    );
    if (steps.length === 0) out.push(`${name}: no build-storybook step in the quality job`);
    for (const s of steps) {
      if (s.if !== undefined) out.push(`${name}: its build-storybook step has an if:`);
      if (s['continue-on-error']) out.push(`${name}: its build-storybook step continues on error`);
      /* A shell like 'true {0}' turns the step into a no-op (fifteenth audit, C-4). */
      const shell = s.shell ?? quality.defaults?.run?.shell ?? ci.defaults?.run?.shell;
      if (shell !== undefined && shell !== 'bash')
        out.push(`${name}: its build-storybook step runs with shell ${shell}`);
    }
  }
  return out;
}

const realCi = () =>
  yaml.load(readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8')) as Workflow;

describe('CI builds every Storybook (5.919)', () => {
  it('should find both Storybooks among the workspaces (the guard is not vacuous)', () => {
    expect(storybookWorkspaces()).toEqual(expect.arrayContaining(['web', 'sandbox']));
  });

  it('should build every Storybook in an unconditional step of the quality job', () => {
    expect(storybookGaps(realCi(), storybookWorkspaces())).toEqual([]);
  });

  const stepOf = (ci: Workflow, name: string) =>
    ci.jobs!.quality.steps!.find((s) => s.run?.trim() === `pnpm --filter ${name} build-storybook`)!;

  it.each<[string, (ci: Workflow) => void, RegExp]>([
    [
      'the Practice step removed',
      (ci) => {
        ci.jobs!.quality.steps = ci.jobs!.quality.steps!.filter((s) => s !== stepOf(ci, 'sandbox'));
      },
      /sandbox: no build-storybook step/,
    ],
    [
      'a step that only runs on push',
      (ci) => {
        stepOf(ci, 'sandbox').if = "github.event_name == 'push'";
      },
      /sandbox: its build-storybook step has an if:/,
    ],
    [
      'a step allowed to fail',
      (ci) => {
        stepOf(ci, 'web')['continue-on-error'] = true;
      },
      /web: its build-storybook step continues on error/,
    ],
    [
      'a no-op shell on the step',
      (ci) => {
        stepOf(ci, 'sandbox').shell = 'true {0}';
      },
      /sandbox: its build-storybook step runs with shell true \{0\}/,
    ],
    [
      'a no-op shell for the whole workflow',
      (ci) => {
        ci.defaults = { run: { shell: 'true {0}' } };
      },
      /web: its build-storybook step runs with shell/,
    ],
    [
      'a skipped quality job',
      (ci) => {
        ci.jobs!.quality.if = 'false';
      },
      /the quality job has an if:/,
    ],
  ])('should report %s (the guard is not blind)', (_label, plant, expected) => {
    const ci = realCi();
    plant(ci);
    expect(storybookGaps(ci, storybookWorkspaces()).join('\n')).toMatch(expected);
  });

  it('should require a step for a NEW workspace that adds a Storybook', () => {
    expect(storybookGaps(realCi(), [...storybookWorkspaces(), '@diboas/ui']).join('\n')).toMatch(
      /@diboas\/ui: no build-storybook step/
    );
  });
});
