import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `5.816` · VERCEL READS `vercel.json` FROM THE PROJECT'S ROOT DIRECTORY, NEVER THE REPO ROOT.
 *
 * **The defect:** each app is its own Vercel project with a Root Directory of
 * `apps/<app>`. The audit-log retention cron (`5.39`) was declared in a `vercel.json` at
 * the REPOSITORY root, which Vercel never reads for these projects. The production
 * deployment registered no cron (`crons: []`; `vercel crons ls` → "not deployed"), so the
 * 90-day purge the privacy policy discloses never ran.
 *
 * **Rule:**
 * 1. No `vercel.json` / `vercel.ts` at the repository root (it is silently ignored).
 * 2. Every cron route `apps/<app>/src/app/api/cron/<name>/route.ts` is scheduled in
 *    `apps/<app>/vercel.json`, and every scheduled path is an existing cron route.
 * 3. The web project keeps its Dependabot deploy-gating.
 *
 * **5.836 / 5.834 (eleventh audit):** Vercel reads more config forms than `vercel.json`; one
 * app may hold only one; nested cron routes count; a `schedules` entry may not repeat a cron;
 * and every app (derived from `apps/`, never a hard-coded list) keeps Dependabot from deploying.
 *
 * **Scope limit:** this proves where the file is, not what the dashboard says. That the
 * project's Root Directory is `apps/web` is checked after deploy (`vercel crons ls`).
 */

const REPO = resolve(__dirname, '../../../../..');
/** Every app is its own Vercel project — derived, so a new app cannot slip past. */
const APPS = readdirSync(join(REPO, 'apps'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(REPO, 'apps', d.name, 'package.json')))
  .map((d) => d.name);
/** Every config file name Vercel reads. */
const CONFIG_FORMS = [
  'vercel.json',
  'vercel.ts',
  'vercel.js',
  'vercel.mjs',
  'vercel.cjs',
  'vercel.mts',
  'vercel.toml',
];

/**
 * Twelfth audit (agent C, LOW-6): the build-skip rule lived only in each project's dashboard,
 * untracked. It is now the repo's: production builds (exit 1), every other deployment is skipped
 * (exit 0), so PRs and Dependabot branches build nothing. `=` (POSIX), never bash's `==`, so the
 * rule cannot invert under a non-bash `sh` (under dash `==` errors and exits 0: production skipped).
 */
const PRODUCTION_ONLY = 'if [ "$VERCEL_ENV" = "production" ]; then exit 1; else exit 0; fi';

interface VercelConfig {
  ignoreCommand?: string;
  crons?: { path: string; schedule: string }[];
  schedules?: { path?: string }[];
  git?: { deploymentEnabled?: Record<string, boolean> };
}

const readConfig = (app: string): VercelConfig | null => {
  const file = join(REPO, 'apps', app, 'vercel.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as VercelConfig) : null;
};

/** Every `route.ts` under `api/cron/`, at any depth. */
const cronRoutes = (app: string): string[] => {
  const root = join(REPO, 'apps', app, 'src', 'app', 'api', 'cron');
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const path = `${prefix}/${d.name}`;
      if (existsSync(join(dir, d.name, 'route.ts'))) found.push(path);
      walk(join(dir, d.name), path);
    }
  };
  walk(root, '/api/cron');
  return found.sort();
};

describe('5.816 · Vercel project config lives where Vercel reads it', () => {
  it('should find the web cron route and both apps when scanning (non-vacuity)', () => {
    expect(cronRoutes('web')).toContain('/api/cron/purge-audit-logs');
    expect(APPS).toEqual(expect.arrayContaining(['web', 'sandbox']));
  });

  it('should keep no Vercel config of any form at the repository root when each app is its own project', () => {
    for (const form of CONFIG_FORMS) expect(existsSync(join(REPO, form)), form).toBe(false);
  });

  it.each(APPS)('should give apps/%s at most one Vercel config, a vercel.json', (app) => {
    const present = CONFIG_FORMS.filter((f) => existsSync(join(REPO, 'apps', app, f)));
    expect(present.filter((f) => f !== 'vercel.json')).toEqual([]);
  });

  it.each(APPS)(
    'should never schedule a cron route a second time under schedules in apps/%s',
    (app) => {
      const schedules = (readConfig(app)?.schedules ?? []).map((x) => x.path);
      for (const cron of readConfig(app)?.crons ?? []) expect(schedules).not.toContain(cron.path);
    }
  );

  it.each(APPS)(
    'should schedule exactly the existing cron routes in apps/%s/vercel.json',
    (app) => {
      const scheduled = (readConfig(app)?.crons ?? []).map((c) => c.path).sort();
      expect(scheduled).toEqual(cronRoutes(app));
    }
  );

  it('should give every web cron a five-field schedule', () => {
    for (const cron of readConfig('web')?.crons ?? []) {
      expect(cron.schedule.trim().split(/\s+/)).toHaveLength(5);
    }
  });

  it.each(APPS)('should build only production deployments of the %s project', (app) => {
    expect(readConfig(app)?.ignoreCommand, app).toBe(PRODUCTION_ONLY);
  });

  it.each(APPS)('should keep Dependabot branches from deploying the %s project', (app) => {
    expect(readConfig(app)?.git?.deploymentEnabled?.['dependabot/**'], app).toBe(false);
  });
});
