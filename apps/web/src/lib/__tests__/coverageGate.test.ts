import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
  web: ['src/lib/security/**', 'middleware.ts'],
  sandbox: [
    'src/lib/security/**',
    'src/middleware.ts',
    'src/lib/ids.ts',
    'src/app/*/gate/actions.ts',
  ],
};

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

  it('should run the coverage task through turbo after the dependencies build', () => {
    const turbo = JSON.parse(readFileSync(join(REPO, 'turbo.json'), 'utf8'));
    expect(turbo.tasks['test:coverage']?.dependsOn).toContain('^build');
    const root = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'));
    expect(root.scripts['test:coverage']).toMatch(/^turbo run test:coverage\b/);
  });

  it('should run pnpm test:coverage, not a plain pnpm test, in CI’s quality job', () => {
    const ci = readFileSync(join(REPO, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toMatch(/^\s*- run: pnpm test:coverage\s*$/m);
    expect(ci).not.toMatch(/^\s*- run: pnpm test\s*$/m);
  });
});
