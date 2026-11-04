import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `5.729` · APP WORK OUTSIDE TURBO BUILDS EVERY WORKSPACE PACKAGE THE APP IMPORTS FIRST.
 *
 * **Requirement:** the apps consume workspace packages from their built `dist/`
 * (`apps/sandbox/next.config.mjs`; `apps/web` via package `exports`). Turbo's `^build`
 * orders that inside `turbo run build|test|lint|type-check|dev`. Outside turbo — a
 * workflow step or a root script calling `pnpm --filter <app> …` — nothing does, unless
 * the step builds the app's dependencies itself.
 *
 * **The defect class (audit 2026-11-03):** those places built a HAND-WRITTEN list of
 * packages. When `@diboas/format` was added, the weekly /market workflow (which built
 * only `@diboas/i18n`) would have failed its blocking test step on the next Monday run,
 * and `pnpm dev:sandbox` (which named banking/defi/investing) broke on a fresh clone. So
 * the rule is about the list, not the package:
 *
 * 1. No workflow or root script builds named `@diboas/*` packages.
 * 2. A workflow JOB that runs app work through `pnpm --filter <app>` (tests, e2e, pa11y,
 *    lighthouse, storybook, start) builds through turbo first: `pnpm build`,
 *    `turbo run build` unfiltered, `--filter=<app>...` or `--filter='<app>^...'`.
 * 3. A root script that runs `pnpm --filter <app> exec|test|dev` builds the same way
 *    earlier in the same script (or is itself a turbo task, where `^build` applies).
 * 4. Turbo's `dev` task depends on `^build`.
 */

const REPO = resolve(__dirname, '../../../../..');
const APPS = ['web', 'sandbox'];

/** A build that covers every workspace dependency of `app`. */
const coversApp = (text: string, app: string): boolean =>
  /(?:^|[\s;&|(])pnpm build\b/m.test(text) ||
  /turbo run build(?![^\n]*--filter)/.test(text) ||
  new RegExp(`turbo run build[^\\n]*--filter[= ]'?${app}(?:\\^)?\\.\\.\\.`).test(text);

/** App work run through pnpm outside turbo. */
const appWork = (app: string) =>
  new RegExp(`pnpm --filter ${app} (?:exec |test|e2e|pa11y|lighthouse|build-storybook|start|dev)`);

const NAMED_PACKAGE_BUILD =
  /turbo run build[^\n&|;]*--filter[= ]'?@diboas\/|pnpm --filter[= ]'?@diboas\/[\w-]+'? build\b/;

/** Each job of a workflow, as its own text (jobs are the 2-space keys under `jobs:`). */
function jobsOf(workflow: string): Array<{ name: string; text: string }> {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (start < 0) return [];
  const jobs: Array<{ name: string; text: string }> = [];
  for (const line of lines.slice(start + 1)) {
    const key = /^ {2}([\w-]+):\s*$/.exec(line);
    if (key) jobs.push({ name: key[1], text: '' });
    else if (jobs.length) jobs[jobs.length - 1].text += `${line}\n`;
  }
  return jobs;
}

/** Strip YAML comments, so a comment that MENTIONS a command is not a step. */
const withoutComments = (text: string) => text.replace(/^\s*#.*$/gm, '').replace(/\s#\s.*$/gm, '');

const WORKFLOW_DIR = join(REPO, '.github/workflows');
const workflows = readdirSync(WORKFLOW_DIR)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ file: f, text: withoutComments(readFileSync(join(WORKFLOW_DIR, f), 'utf8')) }));

const rootScripts = Object.entries(
  (
    JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    }
  ).scripts
);

function jobViolations(workflow: string): string[] {
  return jobsOf(workflow).flatMap(({ name, text }) =>
    APPS.flatMap((app) => {
      const work = appWork(app).exec(text);
      if (!work) return [];
      const before = text.slice(0, work.index);
      return coversApp(before, app)
        ? []
        : [`job ${name}: "${work[0]}" with no dependency build before it`];
    })
  );
}

function scriptViolations(name: string, script: string): string[] {
  if (/^turbo run /.test(script)) return []; // turbo applies ^build itself
  return APPS.flatMap((app) => {
    const work = appWork(app).exec(script);
    if (!work || /pnpm --filter \w+ start\b/.test(work[0])) return []; // start needs a build already
    return coversApp(script.slice(0, work.index), app)
      ? []
      : [`script ${name}: "${work[0]}" with no dependency build before it`];
  });
}

describe('5.729 · app work outside turbo builds every workspace dependency first', () => {
  it('should build no hand-written @diboas/* package list in any workflow or root script', () => {
    const found = [
      ...workflows.filter((w) => NAMED_PACKAGE_BUILD.test(w.text)).map((w) => w.file),
      ...rootScripts.filter(([, s]) => NAMED_PACKAGE_BUILD.test(s)).map(([n]) => `script ${n}`),
    ];
    expect(found).toEqual([]);
  });

  it('should build the app dependencies before app work in every workflow job', () => {
    const found = workflows.flatMap((w) => jobViolations(w.text).map((v) => `${w.file} ${v}`));
    expect(found).toEqual([]);
  });

  it('should build the app dependencies before app work in every root script', () => {
    expect(rootScripts.flatMap(([n, s]) => scriptViolations(n, s))).toEqual([]);
  });

  it("should make turbo's dev task depend on ^build", () => {
    const turbo = JSON.parse(readFileSync(join(REPO, 'turbo.json'), 'utf8')) as {
      tasks: Record<string, { dependsOn?: string[] }>;
    };
    expect(turbo.tasks.dev?.dependsOn ?? []).toContain('^build');
  });

  it('should catch the shapes that shipped, and pass the ones that are right', () => {
    const job = (steps: string) => `jobs:\n  refresh:\n    steps:\n${steps}`;
    /* The weekly /market job before the fix: i18n only, then website tests. */
    expect(
      jobViolations(
        job(
          '      - run: pnpm --filter @diboas/i18n build\n      - run: pnpm --filter web exec vitest run src\n'
        )
      )
    ).toHaveLength(1);
    expect(NAMED_PACKAGE_BUILD.test('pnpm --filter @diboas/i18n build')).toBe(true);
    /* `dev:sandbox` before the fix. */
    expect(
      NAMED_PACKAGE_BUILD.test(
        'turbo run build --filter=@diboas/banking --filter=@diboas/defi && pnpm --filter sandbox dev'
      )
    ).toBe(true);
    expect(scriptViolations('x', 'pnpm --filter web exec vitest run a.test.ts')).toHaveLength(1);
    /* Right shapes. */
    expect(
      jobViolations(
        job(
          "      - run: pnpm exec turbo run build --filter='web^...'\n      - run: pnpm --filter web exec vitest run\n"
        )
      )
    ).toEqual([]);
    expect(
      jobViolations(
        job('      - run: pnpm build || pnpm build\n      - run: pnpm --filter web pa11y\n')
      )
    ).toEqual([]);
    expect(
      jobViolations(
        job(
          '      - run: pnpm exec turbo run build --filter=sandbox...\n      - run: pnpm --filter sandbox e2e\n'
        )
      )
    ).toEqual([]);
    expect(
      scriptViolations(
        'x',
        "pnpm exec turbo run build --filter='web^...' && pnpm --filter web exec vitest run"
      )
    ).toEqual([]);
    /* A build for the OTHER app does not cover this one. */
    expect(
      jobViolations(
        job(
          '      - run: pnpm exec turbo run build --filter=sandbox...\n      - run: pnpm --filter web exec vitest\n'
        )
      )
    ).toHaveLength(1);
  });

  it('should have read real workflows and scripts', () => {
    expect(workflows.map((w) => w.file)).toEqual(
      expect.arrayContaining(['ci.yml', 'e2e.yml', 'market-refresh-weekly.yml'])
    );
    expect(jobsOf(workflows.find((w) => w.file === 'e2e.yml')!.text).length).toBeGreaterThan(1);
    expect(rootScripts.length).toBeGreaterThan(30);
  });
});
