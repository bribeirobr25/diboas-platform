import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs';
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
  ],
  sandbox: [
    'src/lib/security/**',
    'src/middleware.ts',
    'src/lib/ids.ts',
    'src/app/*/gate/actions.ts',
    'src/lib/gate.ts',
    'src/config/geofence.ts',
    'src/lib/auth/admission.ts',
  ],
};

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

async function coverageOf(w: Workspace) {
  const file = ['vitest.config.mts', 'vitest.config.ts'].find((f) =>
    existsSync(join(REPO, w.dir, f))
  );
  expect(file, `${w.dir} has no vitest config`).toBeDefined();
  const config = (await import(join(REPO, w.dir, file!))).default;
  return config.test?.coverage ?? {};
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
    /* A change to the gate's own wiring must re-run it, never replay a cached pass. */
    expect(turbo.tasks['test:coverage']?.inputs).toEqual(
      expect.arrayContaining([
        '$TURBO_ROOT$/.github/workflows/ci.yml',
        '$TURBO_ROOT$/turbo.json',
        '$TURBO_ROOT$/package.json',
      ])
    );
  });

  it('should run pnpm test:coverage, not a plain pnpm test, in CI’s quality job', () => {
    const ci = readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toMatch(/^\s*- run: pnpm test:coverage\s*$/m);
    expect(ci).not.toMatch(/^\s*- run: pnpm test\s*$/m);
  });

  /* 5.837: `continue-on-error` or an `if:` on the step (or the job) lets a failed run pass. */
  it('should let nothing soften the coverage step or the quality job', () => {
    const lines = readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8').split('\n');
    const at = lines.findIndex((l) => /^\s*- run: pnpm test:coverage\s*$/.test(l));
    const indent = lines[at].indexOf('-');
    const step: string[] = [lines[at]];
    for (let i = at + 1; i < lines.length; i += 1) {
      const l = lines[i];
      if (l.trim() === '' || l.trim().startsWith('#')) continue;
      if (l.length - l.trimStart().length <= indent) break;
      step.push(l);
    }
    expect(step.join('\n')).not.toMatch(/continue-on-error|^\s*if:/m);
    const job = lines.slice(0, at).join('\n');
    const quality = job.slice(job.lastIndexOf('\n  quality:'));
    expect(quality).not.toMatch(/continue-on-error:\s*true/);
  });
});
