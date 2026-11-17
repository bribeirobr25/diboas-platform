import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * COV-1 · register `5.70` — THE COVERAGE POLICY BLOCKS INSTEAD OF ASPIRING.
 *
 * CLAUDE.md sets coverage minimums (80% `lib/` and `hooks/`, 60% components, 100% security
 * utilities). Until 2026-11-10 nothing enforced them: CI ran plain `pnpm test`, no vitest config
 * set `coverage.thresholds`, and four workspaces had no coverage provider at all.
 *
 * The gate: every workspace that runs vitest has the v8 provider and a `test:coverage` script,
 * its config sets global floors (a per-directory ratchet measured 2026-11-10), each app keeps its
 * security utilities at 100%, turbo and the root script run the task, and CI's quality job runs
 * `pnpm test:coverage` (the thresholds only apply when coverage runs).
 *
 * Scope limit: the floors' VALUES are a ratchet, not the policy. The web app sits far below the
 * 80/60 policy; that gap is registered, not hidden. This guard keeps the gate wired; the run
 * itself is what fails when coverage drops.
 *
 * Twelfth audit (agent D): the gate stayed wired but could be SOFTENED without this file
 * noticing — a locked file added to `coverage.exclude` (vitest scores an empty glob `Unknown`,
 * which passes 100), `coverage.include` narrowed to a few files, floors lowered or deleted (a
 * negative floor means "at most N uncovered" and switches it off), a second softer config that
 * vitest loads first, a `v8 ignore` comment, an `if:` on the quality job. So the measured scope
 * is PINNED below, every floor has a BASELINE it may rise above but never fall below, each
 * workspace has exactly one config, and coverage-ignore comments are banned. Changing a pin or
 * lowering a baseline means editing this file: a visible, reviewable act.
 */

const REPO = resolve(__dirname, '../../../../..');
const METRICS = ['lines', 'branches', 'functions', 'statements'] as const;

/** CLAUDE.md "100% for security utilities", per app (globs relative to the app). */
const SECURITY_AT_100: Record<string, string[]> = {
  web: [
    'src/lib/security/**',
    'middleware.ts',
    'src/app/api/email/unsubscribe/route.ts',
    'src/app/api/cron/purge-audit-logs/route.ts',
    'src/app/api/consent/route.ts',
    'src/app/api/monitoring/route.ts',
    'src/lib/api/routeHelpers.ts',
    'src/lib/api/validators.ts',
    'src/lib/utils/redactContext.ts',
    'src/lib/email/unsubscribeUrl.ts',
    'src/lib/email/unsubscribeToken.ts',
    'src/lib/utils/scrubUrl.ts',
    'src/lib/monitoring/sentryScrub.ts',
    'src/lib/analytics/scrubAnalyticsEvent.ts',
    'src/app/api/waitlist/delete/route.ts',
    'src/lib/waitingList/store/internals.ts',
  ],
  sandbox: [
    'src/lib/security/**',
    'src/middleware.ts',
    'src/lib/ids.ts',
    'src/app/*/gate/actions.ts',
    'src/lib/gate.ts',
    'src/config/geofence.ts',
    'src/lib/auth/admission.ts',
    'src/lib/auth/SimulatedAuthProvider.ts',
    'src/lib/auth/factory.ts',
    'src/app/*/welcome/actions.ts',
    'src/app/*/consent/actions.ts',
  ],
};

/** How many 100% keys each workspace has (5.893): raise it when a file is locked, never lower it. */
const LOCKED_AT_100: Record<string, number> = { web: 16, sandbox: 12 };

/** The measured scope of each workspace, exactly (agent D findings 1–2). */
const PINNED_SCOPE: Record<string, { include: string[]; exclude: string[] }> = {
  web: {
    include: ['src/**/*.{ts,tsx}', 'middleware.ts'],
    exclude: [
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.stories.tsx',
      '**/*.d.ts',
      'src/test/**',
    ],
  },
  sandbox: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['**/__tests__/**', '**/*.stories.tsx', '**/*.d.ts', 'src/test/**'],
  },
  banking: { include: ['src/**/*.ts'], exclude: ['src/**/__tests__/**', 'src/index.ts'] },
  defi: { include: ['src/**/*.ts'], exclude: ['src/**/__tests__/**'] },
  investing: { include: ['src/**/*.ts'], exclude: ['src/**/__tests__/**'] },
  format: { include: ['src/**/*.ts'], exclude: ['src/**/__tests__/**'] },
};

type Floor = Partial<Record<(typeof METRICS)[number], number>> | { 100: true };

/**
 * The ratchet's floor (agent D finding 3): measured 2026-11-10. A config may RAISE any value and
 * add keys; it may not lower, drop or negate one. Raise these when a config's floors rise.
 */
const FLOOR_BASELINE: Record<string, Record<string, Floor | number>> = {
  web: {
    lines: 34,
    branches: 29,
    functions: 28,
    statements: 34,
    'src/app/**': { lines: 26, branches: 21, functions: 23, statements: 27 },
    'src/components/**': { lines: 12, branches: 12, functions: 11, statements: 12 },
    'src/config/**': { lines: 31, branches: 49, functions: 27, statements: 31 },
    'src/hooks/**': { lines: 54, branches: 51, functions: 58, statements: 54 },
    'src/lib/**': { lines: 58, branches: 50, functions: 50, statements: 58 },
  },
  sandbox: {
    lines: 89,
    branches: 81,
    functions: 87,
    statements: 88,
    'src/app/**': { lines: 72, branches: 58, functions: 62, statements: 73 },
    'src/components/**': { lines: 79, branches: 70, functions: 79, statements: 78 },
    'src/config/**': { 100: true },
    'src/hooks/**': { lines: 98, branches: 88, functions: 90, statements: 94 },
    'src/i18n/**': { lines: 100, branches: 100, functions: 95, statements: 98 },
    'src/lib/**': { lines: 97, branches: 92, functions: 96, statements: 95 },
    'src/view/**': { lines: 100, branches: 96, functions: 100, statements: 99 },
  },
  banking: { lines: 99, branches: 96, functions: 100, statements: 98 },
  defi: {
    lines: 99,
    branches: 96,
    functions: 100,
    statements: 98,
    'src/providers/**': { lines: 100, branches: 98, functions: 100, statements: 100 },
  },
  investing: { lines: 99, branches: 92, functions: 100, statements: 96 },
  format: { lines: 100, branches: 88, functions: 100, statements: 100 },
};

/** Every config file name vitest (or vite, which it falls back to) reads. */
const CONFIG_NAMES = ['vitest', 'vite'].flatMap((base) =>
  ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'].map((ext) => `${base}.config.${ext}`)
);

/** A comment that tells the coverage tool to skip code (agent D finding 5). */
const COVERAGE_IGNORE = /\b(?:v8|c8|istanbul)\s+ignore\b/;

/** Files (not directories) a glob matches under a workspace directory. */
const filesMatching = (dir: string, glob: string): string[] =>
  globSync(glob, { cwd: join(REPO, dir) }).filter((f) => statSync(join(REPO, dir, f)).isFile());

interface Workspace {
  dir: string;
  name: string;
  pkg: {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

/** Every workspace whose `test` script runs vitest — derived, so a new one cannot slip past. */
function vitestWorkspaces(): Workspace[] {
  return ['apps', 'packages'].flatMap((group) =>
    readdirSync(join(REPO, group), { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(REPO, group, d.name, 'package.json')))
      .map((d) => ({
        dir: join(group, d.name),
        name: d.name,
        pkg: JSON.parse(readFileSync(join(REPO, group, d.name, 'package.json'), 'utf8')),
      }))
      .filter((w) => /\bvitest\b/.test(w.pkg.scripts?.test ?? ''))
  );
}

/** The workspace's one config file; vitest loads `.ts` before `.mts`, so a second is a decoy. */
const configFileOf = (w: Workspace): string[] =>
  CONFIG_NAMES.filter((f) => existsSync(join(REPO, w.dir, f)));

async function coverageOf(w: Workspace) {
  const files = configFileOf(w);
  expect(files, `${w.dir}: exactly one vitest/vite config`).toHaveLength(1);
  const config = (await import(join(REPO, w.dir, files[0]))).default;
  return config.test?.coverage ?? {};
}

/** Every source file of a workspace (its `src/`, plus web's root middleware). */
const sourceFiles = (w: Workspace): string[] =>
  [...filesMatching(w.dir, 'src/**/*.{ts,tsx}'), ...filesMatching(w.dir, 'middleware.ts')]
    .filter((f) => !/__tests__|\.test\.|\.d\.ts$/.test(f))
    .map((f) => join(REPO, w.dir, f));

interface CiStep {
  run?: string;
  if?: unknown;
  shell?: string;
  'continue-on-error'?: unknown;
}
interface CiJob {
  if?: unknown;
  'continue-on-error'?: unknown;
  defaults?: { run?: { shell?: string } };
  steps?: CiStep[];
}
interface CiWorkflow {
  defaults?: { run?: { shell?: string } };
  jobs: Record<string, CiJob>;
}
const yamlLoad = (createRequire(import.meta.url)('js-yaml') as { load: (t: string) => unknown })
  .load;
const parsedCi = () =>
  yamlLoad(readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8')) as CiWorkflow;
const coverageStep = (ci: CiWorkflow) =>
  ci.jobs.quality?.steps?.find((x) => x.run?.trim() === 'pnpm test:coverage');

/** Why the coverage step could be skipped, softened or turned into a no-op (empty: none). */
function coverageStepProblems(ci: CiWorkflow): string[] {
  const out: string[] = [];
  const job = ci.jobs.quality;
  const step = coverageStep(ci);
  if (!job || !step) return ['no `pnpm test:coverage` step in the quality job'];
  if (job.if !== undefined) out.push('the quality job has an if:');
  if (step.if !== undefined) out.push('the coverage step has an if:');
  if (job['continue-on-error']) out.push('the quality job has continue-on-error');
  if (step['continue-on-error']) out.push('the coverage step has continue-on-error');
  const shell = step.shell ?? job.defaults?.run?.shell ?? ci.defaults?.run?.shell;
  if (shell !== undefined && shell !== 'bash')
    out.push(`the coverage step runs with shell ${shell}`);
  return out;
}

describe('COV-1 · 5.70 · coverage thresholds are enforced in CI', { timeout: 30_000 }, () => {
  const workspaces = vitestWorkspaces();

  it('should find the six vitest workspaces (non-vacuity)', () => {
    expect(workspaces.map((w) => w.name).sort()).toEqual(
      expect.arrayContaining(['banking', 'defi', 'format', 'investing', 'sandbox', 'web'])
    );
  });

  it('should give every vitest workspace the v8 provider and a test:coverage script', () => {
    for (const w of workspaces) {
      expect(w.pkg.devDependencies?.['@vitest/coverage-v8'], w.dir).toBeDefined();
      expect(w.pkg.scripts?.['test:coverage'], w.dir).toBe('vitest run --coverage');
    }
  });

  it('should set v8 coverage over every source file with global floors in each config', async () => {
    for (const w of workspaces) {
      const cov = await coverageOf(w);
      expect(cov.provider, w.dir).toBe('v8');
      expect(cov.include?.length, `${w.dir}: coverage.include`).toBeGreaterThan(0);
      /* 5.837: an include that matches nothing reports `Unknown` and passes every floor. */
      const counted = (cov.include as string[]).flatMap((g) => filesMatching(w.dir, g));
      expect(counted.length, `${w.dir}: coverage.include matches no file`).toBeGreaterThan(0);
      for (const m of METRICS) {
        expect(typeof cov.thresholds?.[m], `${w.dir}: thresholds.${m}`).toBe('number');
        expect(cov.thresholds[m], `${w.dir}: thresholds.${m}`).toBeGreaterThan(0);
      }
    }
  });

  it('should measure exactly the pinned scope in every workspace', async () => {
    expect(Object.keys(PINNED_SCOPE).sort()).toEqual(workspaces.map((w) => w.name).sort());
    for (const w of workspaces) {
      const cov = await coverageOf(w);
      expect({ include: cov.include, exclude: cov.exclude }, w.dir).toEqual(PINNED_SCOPE[w.name]);
    }
  });

  it('should keep every floor at or above its baseline, none dropped or negated', async () => {
    expect(Object.keys(FLOOR_BASELINE).sort()).toEqual(workspaces.map((w) => w.name).sort());
    for (const w of workspaces) {
      const thresholds = (await coverageOf(w)).thresholds ?? {};
      for (const [key, base] of Object.entries(FLOOR_BASELINE[w.name])) {
        const actual = thresholds[key];
        const at = `${w.dir}: thresholds['${key}']`;
        if (typeof base === 'number') {
          expect(actual, at).toBeGreaterThanOrEqual(base);
        } else if (100 in base) {
          expect(actual, at).toEqual({ 100: true });
        } else {
          expect(actual, `${at} is missing`).toBeDefined();
          if (actual?.[100] === true) continue;
          for (const m of METRICS) expect(actual[m], `${at}.${m}`).toBeGreaterThanOrEqual(base[m]!);
        }
      }
      /* A key added beyond the baseline may only add strictness: no negative or zero values. */
      for (const [key, value] of Object.entries(thresholds)) {
        if (typeof value === 'number') expect(value, `${w.dir}: ${key}`).toBeGreaterThan(0);
        else if (value && typeof value === 'object' && !(value as { 100?: boolean })[100])
          for (const v of Object.values(value as Record<string, unknown>))
            if (typeof v === 'number') expect(v, `${w.dir}: ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('should hold no coverage-ignore comment in any measured source file', () => {
    const files = workspaces.flatMap(sourceFiles);
    expect(files.length).toBeGreaterThan(500);
    const offenders = files
      .filter((f) => COVERAGE_IGNORE.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(REPO.length + 1));
    expect(offenders).toEqual([]);
  });

  it('should recognise every coverage-ignore form (detector self-test)', () => {
    for (const c of [
      '/* v8 ignore next */',
      '/* v8 ignore next -- @preserve */',
      '// istanbul ignore else',
      '/* c8 ignore start */',
    ])
      expect(COVERAGE_IGNORE.test(c), c).toBe(true);
    expect(COVERAGE_IGNORE.test('// ignore the v8 engine here')).toBe(false);
  });

  /* Fourteenth audit (5.893): the check below only looked one way, so a 100% key added only to
   * the config passed, and a file dropped from BOTH this list and the config (a conflict
   * resolution that loses a line on each side) passed too. The two sets must be equal, AND their
   * size is pinned: a symmetric drop changes the count, and adding a locked file means raising
   * the number here, a visible act. */
  it('should lock at 100% exactly the files this guard names, in every workspace', async () => {
    for (const w of workspaces) {
      const thresholds = (await coverageOf(w)).thresholds ?? {};
      const locked = Object.entries(thresholds)
        .filter(([, v]) => v && typeof v === 'object' && (v as { 100?: boolean })[100] === true)
        .map(([key]) => key)
        .sort();
      const baseline = Object.entries(FLOOR_BASELINE[w.name] ?? {})
        .filter(([, v]) => typeof v === 'object' && 100 in v)
        .map(([key]) => key);
      const named = [...new Set([...(SECURITY_AT_100[w.name] ?? []), ...baseline])].sort();
      expect(locked, `${w.dir}: 100% keys`).toEqual(named);
      expect(locked.length, `${w.dir}: the number of 100% keys`).toBe(LOCKED_AT_100[w.name] ?? 0);
    }
  });

  it('should hold each app’s security utilities at 100% when its config is read', async () => {
    for (const [app, globs] of Object.entries(SECURITY_AT_100)) {
      const cov = await coverageOf(workspaces.find((w) => w.name === app)!);
      for (const glob of globs)
        expect(cov.thresholds?.[glob], `${app}: ${glob}`).toEqual({ 100: true });
    }
  });

  /* 5.837: vitest scores a glob that matches nothing as `Unknown`, which passes `{ 100: true }`
   * silently — renaming `middleware.ts` to `proxy.ts` left it unmeasured and green. */
  it('should match at least one file with every 100% glob, so a rename cannot switch it off', () => {
    for (const [app, globs] of Object.entries(SECURITY_AT_100)) {
      const dir = workspaces.find((w) => w.name === app)!.dir;
      for (const glob of globs)
        expect(filesMatching(dir, glob).length, `${app}: ${glob} matches no file`).toBeGreaterThan(
          0
        );
    }
  });

  it('should run the coverage task through turbo after the dependencies build', () => {
    const turbo = JSON.parse(readFileSync(join(REPO, 'turbo.json'), 'utf8'));
    expect(turbo.tasks['test:coverage']?.dependsOn).toContain('^build');
    const root = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'));
    /* 5.837: exact — a `--filter` would measure one workspace and pass. */
    expect(root.scripts['test:coverage']).toBe('turbo run test:coverage --concurrency=1');
    /* A change to the gate's own wiring must re-run it, never replay a cached pass. Both tasks:
     * the guards that read `.github/`, turbo.json and package.json run under plain `pnpm test`
     * too (validate:all, local runs), which replayed a cached pass after a workflow-only edit
     * (fourteenth audit, 5.894). */
    for (const task of ['test', 'test:coverage'])
      expect(turbo.tasks[task]?.inputs, task).toEqual(
        expect.arrayContaining([
          '$TURBO_ROOT$/.github/**',
          '$TURBO_ROOT$/turbo.json',
          '$TURBO_ROOT$/package.json',
          /* Fifteenth audit (C-5): the guards also read the lockfile and every workspace's
             package file; without these a changed lockfile replayed a cached pass. */
          '$TURBO_ROOT$/pnpm-lock.yaml',
          '$TURBO_ROOT$/apps/*/package.json',
          '$TURBO_ROOT$/packages/*/package.json',
        ])
      );
    expect(turbo.tasks['test:coverage']?.inputs).toContain('$TURBO_ROOT$/.github/workflows/ci.yml');
  });

  /* Fifteenth audit (C-4): these checks matched ci.yml as TEXT, so the coverage step moved into a
     skipped job, or given `shell: 'true {0}'` (a no-op), passed. The workflow is parsed now. */
  it('should run pnpm test:coverage in an unconditional, bash step of the quality job', () => {
    expect(coverageStepProblems(parsedCi())).toEqual([]);
  });

  it.each<[string, (ci: CiWorkflow) => void, RegExp]>([
    [
      'the step moved into a skipped job',
      (ci) => {
        const steps = ci.jobs.quality.steps!;
        ci.jobs.quality.steps = steps.filter((x) => x.run?.trim() !== 'pnpm test:coverage');
        ci.jobs.coverage = { if: 'false', steps: [{ run: 'pnpm test:coverage' }] };
      },
      /no `pnpm test:coverage` step in the quality job/,
    ],
    [
      'a plain pnpm test instead',
      (ci) => void (coverageStep(ci)!.run = 'pnpm test'),
      /no `pnpm test:coverage`/,
    ],
    ['a no-op shell on the step', (ci) => void (coverageStep(ci)!.shell = 'true {0}'), /shell/],
    [
      'a no-op shell for the whole job',
      (ci) => void (ci.jobs.quality.defaults = { run: { shell: 'true {0}' } }),
      /shell/,
    ],
    [
      'continue-on-error on the step',
      (ci) => void (coverageStep(ci)!['continue-on-error'] = true),
      /continue-on-error/,
    ],
    ['an if: on the step', (ci) => void (coverageStep(ci)!.if = 'false'), /if:/],
    ['an if: on the job', (ci) => void (ci.jobs.quality.if = 'false'), /if:/],
    [
      'continue-on-error on the job',
      (ci) => void (ci.jobs.quality['continue-on-error'] = true),
      /continue-on-error/,
    ],
  ])('should report %s (the guard is not blind)', (_label, plant, expected) => {
    const ci = parsedCi();
    plant(ci);
    expect(coverageStepProblems(ci).join('\n')).toMatch(expected);
  });
});
