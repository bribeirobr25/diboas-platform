/**
 * Dependabot may open npm PRs from the workspace root only (register 5.736).
 *
 * The repository is one pnpm workspace with one lockfile at the root. A
 * per-folder npm entry ('/apps/web', '/packages/i18n', …) bumps that folder's
 * package.json but cannot touch the root pnpm-lock.yaml, so every PR it opened
 * failed `pnpm install --frozen-lockfile` before a single check ran — nine such
 * PRs on 2026-11-03 (#784–#792), two of them duplicates of root PRs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = path.resolve(__dirname, '../../../../..');

/** Every `directory:` of every npm update entry, in file order. */
function npmUpdateDirectories(yml: string): string[] {
  const entries = yml.split(/^\s*-\s+package-ecosystem:/m).slice(1);
  return entries
    .filter((entry) => /^\s*['"]?npm['"]?\s*$/m.test(entry.split('\n')[0] ?? ''))
    .map((entry) => {
      const dir = entry.match(/^\s*director(?:y|ies):\s*(.+)$/m)?.[1]?.trim() ?? '';
      return dir.replace(/^['"]|['"]$/g, '');
    });
}

describe('dependabot npm entries', () => {
  it('should declare exactly one npm entry, at the workspace root', () => {
    const yml = fs.readFileSync(path.join(REPO, '.github/dependabot.yml'), 'utf8');
    expect(npmUpdateDirectories(yml)).toEqual(['/']);
  });

  it('should keep the lockfile at the root, which is what makes the root entry sufficient', () => {
    expect(fs.existsSync(path.join(REPO, 'pnpm-lock.yaml'))).toBe(true);
    const nested = ['apps', 'packages'].flatMap((top) =>
      fs
        .readdirSync(path.join(REPO, top))
        .filter((name) => fs.existsSync(path.join(REPO, top, name, 'pnpm-lock.yaml')))
        .map((name) => `${top}/${name}`)
    );
    expect(nested).toEqual([]);
  });

  it('should see a per-folder entry and a plural directories list (the reader is not blind)', () => {
    const planted = [
      'version: 2',
      'updates:',
      "  - package-ecosystem: 'npm'",
      "    directory: '/'",
      '  - package-ecosystem: npm',
      '    directory: "/apps/web"',
      "  - package-ecosystem: 'github-actions'",
      "    directory: '/'",
      "  - package-ecosystem: 'npm'",
      "    directories: ['/packages/*']",
    ].join('\n');
    expect(npmUpdateDirectories(planted)).toEqual(['/', '/apps/web', "['/packages/*']"]);
  });
});
