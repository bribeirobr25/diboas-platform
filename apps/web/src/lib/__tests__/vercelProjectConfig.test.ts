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
 * **Scope limit:** this proves where the file is, not what the dashboard says. That the
 * project's Root Directory is `apps/web` is checked after deploy (`vercel crons ls`).
 */

const REPO = resolve(__dirname, '../../../../..');
const APPS = ['web', 'sandbox'];

interface VercelConfig {
  crons?: { path: string; schedule: string }[];
  git?: { deploymentEnabled?: Record<string, boolean> };
}

const readConfig = (app: string): VercelConfig | null => {
  const file = join(REPO, 'apps', app, 'vercel.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as VercelConfig) : null;
};

const cronRoutes = (app: string): string[] => {
  const dir = join(REPO, 'apps', app, 'src', 'app', 'api', 'cron');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'route.ts')))
    .map((d) => `/api/cron/${d.name}`)
    .sort();
};

describe('5.816 · Vercel project config lives where Vercel reads it', () => {
  it('should find the web cron route when scanning (non-vacuity)', () => {
    expect(cronRoutes('web')).toContain('/api/cron/purge-audit-logs');
  });

  it('should keep no vercel.json or vercel.ts at the repository root when each app is its own project', () => {
    expect(existsSync(join(REPO, 'vercel.json'))).toBe(false);
    expect(existsSync(join(REPO, 'vercel.ts'))).toBe(false);
  });

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

  it('should keep Dependabot branches from deploying the web project', () => {
    expect(readConfig('web')?.git?.deploymentEnabled?.['dependabot/**']).toBe(false);
  });
});
