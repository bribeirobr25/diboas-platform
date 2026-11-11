/**
 * Dependabot may open npm PRs from the workspace root only (register 5.736).
 *
 * The repository is one pnpm workspace with one lockfile at the root. A
 * per-folder npm entry ('/apps/web', '/packages/i18n', …) bumps that folder's
 * package.json but cannot touch the root pnpm-lock.yaml, so every PR it opened
 * failed `pnpm install --frozen-lockfile` before a single check ran — nine such
 * PRs on 2026-11-03 (#784–#792), two of them duplicates of root PRs.
 *
 * The same entry groups dev dependencies by patch and minor only (2026-11-11): the
 * group had grown to 24 updates with 12 majors in one PR (#846), against the rule that
 * a major is its own increment (register 5.737). postcss and tailwindcss are left to
 * hand bumps (postcss must equal the postcss inside `next`; tailwindcss is held by a
 * root override Dependabot cannot edit), while `next` keeps its PRs as the signal to
 * bump it by hand (5.867).
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

/** The text of the first npm update entry. */
function npmEntry(yml: string): string {
  const entries = yml.split(/^\s*-\s+package-ecosystem:/m).slice(1);
  return entries.find((e) => /^\s*['"]?npm['"]?\s*$/m.test(e.split('\n')[0] ?? '')) ?? '';
}

/** The `update-types` of the `dev-dependencies` group, or null when it has none. */
function devGroupUpdateTypes(entry: string): string[] | null {
  const group = entry.match(/^(\s+)dev-dependencies:\s*\n((?:\1\s+[^\n]*\n?)*)/m)?.[2] ?? '';
  const list = group.match(/^\s*update-types:\s*\[([^\]]*)\]/m)?.[1];
  return list === undefined
    ? null
    : list.split(',').map((t) => t.trim().replace(/^['"]|['"]$/g, ''));
}

/** Names ignored for EVERY update type (an ignore item with no `update-types`). */
function fullyIgnored(entry: string): string[] {
  const block = entry.split(/^\s*ignore:\s*$/m)[1] ?? '';
  return block
    .split(/^\s*-\s+dependency-name:\s*/m)
    .slice(1)
    .filter((item) => !/^\s*update-types:/m.test(item))
    .map((item) => (item.split('\n')[0] ?? '').trim().replace(/^['"]|['"]$/g, ''));
}

const DEPENDABOT_YML = () => fs.readFileSync(path.join(REPO, '.github/dependabot.yml'), 'utf8');

describe('dependabot npm grouping and hand-bumped packages', () => {
  it('should group only minor and patch dev updates when a major is due, so it opens its own PR', () => {
    expect(devGroupUpdateTypes(npmEntry(DEPENDABOT_YML()))?.sort()).toEqual(['minor', 'patch']);
  });

  it('should leave postcss and tailwindcss to hand bumps when they are pinned outside Dependabot', () => {
    expect(fullyIgnored(npmEntry(DEPENDABOT_YML()))).toEqual(
      expect.arrayContaining(['postcss', 'tailwindcss'])
    );
  });

  it('should keep next PRs coming when a minor or patch is released, as the signal to bump by hand', () => {
    expect(fullyIgnored(npmEntry(DEPENDABOT_YML()))).not.toContain('next');
  });

  it('should see a group without update types and a full ignore (the reader is not blind)', () => {
    const planted = [
      'version: 2',
      'updates:',
      "  - package-ecosystem: 'npm'",
      "    directory: '/'",
      '    groups:',
      '      dev-dependencies:',
      "        dependency-type: 'development'",
      '    ignore:',
      "      - dependency-name: 'next'",
      "      - dependency-name: 'react'",
      "        update-types: ['version-update:semver-major']",
    ].join('\n');
    expect(devGroupUpdateTypes(npmEntry(planted))).toBeNull();
    expect(fullyIgnored(npmEntry(planted))).toEqual(['next']);
  });
});

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
