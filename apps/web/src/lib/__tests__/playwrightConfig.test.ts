/**
 * WITHDRAW-1 (wiring) · the withdrawal spec runs only as its own project (market clean-up W-D1,
 * spec §4). The root `playwright.config.ts` is imported fresh with and without `E2E_WITHDRAWAL`:
 * without it there is no `withdrawal` project; with it, that project reads only its folder, and
 * the default `chromium` project ignores that folder either way.
 */
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface Project {
  name: string;
  testDir?: string;
  testIgnore?: string[];
}
const CONFIG = resolve(__dirname, '../../../../../playwright.config.ts');
const load = async (withdrawal: boolean): Promise<{ testDir: string; projects: Project[] }> => {
  vi.resetModules();
  if (withdrawal) vi.stubEnv('E2E_WITHDRAWAL', '1');
  else vi.stubEnv('E2E_WITHDRAWAL', '');
  return (await import(CONFIG)).default;
};

afterEach(() => vi.unstubAllEnvs());

describe('the withdrawal Playwright project', () => {
  it('should not exist without E2E_WITHDRAWAL, and chromium should ignore its folder', async () => {
    const config = await load(false);
    expect(config.projects.map((p) => p.name)).toEqual(['chromium']);
    expect(config.projects[0].testIgnore).toEqual(['**/withdrawal/**']);
    expect(config.testDir).toBe('./tests/e2e');
  });

  it('should read only its own folder when E2E_WITHDRAWAL is set', async () => {
    const config = await load(true);
    expect(config.projects.map((p) => p.name)).toEqual(['chromium', 'withdrawal']);
    expect(config.projects[1].testDir).toBe('./tests/e2e/withdrawal');
    expect(config.projects[0].testIgnore).toEqual(['**/withdrawal/**']);
  });
});
