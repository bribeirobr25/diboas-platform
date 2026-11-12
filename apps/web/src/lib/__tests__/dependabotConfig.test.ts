/**
 * What Dependabot will do, read from the PARSED `.github/dependabot.yml`.
 *
 * - One npm entry, at the workspace root (5.736): a per-folder entry cannot update the root
 *   lockfile, so every PR it opened failed `pnpm install --frozen-lockfile` (#784–#792).
 * - Packages that only work at the same version move together, majors included, and come before
 *   the general group: an update takes the FIRST group that matches (5.895: vitest 5 arrived
 *   without @vitest/coverage-v8 5, @eslint/js 10 without eslint 10).
 * - The general dev group takes only patches and minors, so a major is its own PR and its own
 *   increment (5.737), and leaves out every 0.x dev dependency, whose "minor" can break like a
 *   major (5.895: @lhci/cli 0.16). The 0.x list is derived from the package files.
 * - postcss and tailwindcss are bumped by hand (pinned with `next` / by a root override);
 *   `next` is never ignored beyond majors: a failing `next` PR is the signal to bump it by hand.
 * - Enough PR slots for that signal to open (5.895: ten majors filled all ten).
 *
 * Fourteenth audit (5.896): the previous guard read the file as TEXT and passed ten edits that
 * change Dependabot's behaviour (a first group taking majors, `next` ignored through all three
 * update types, `applies-to: security-updates`, a limit of 0, …). This one parses the YAML.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (text: string) => unknown };

const REPO = path.resolve(__dirname, '../../../../..');

interface Group {
  'dependency-type'?: string;
  'update-types'?: string[];
  patterns?: string[];
  'exclude-patterns'?: string[];
  'applies-to'?: string;
}
interface Ignore {
  'dependency-name': string;
  'update-types'?: string[];
  versions?: string[];
}
interface Entry {
  'package-ecosystem': string;
  directory?: string;
  directories?: string[];
  'open-pull-requests-limit'?: number;
  groups?: Record<string, Group>;
  ignore?: Ignore[];
  allow?: unknown[];
  cooldown?: unknown;
}

const PARTNERS: Record<string, string[]> = {
  vitest: ['vitest', '@vitest/coverage-v8'],
  eslint: ['eslint', '@eslint/js'],
  storybook: ['storybook', '@storybook/react', 'eslint-plugin-storybook'],
};
const HAND_BUMPED = ['postcss', 'tailwindcss', '@formatjs/icu-messageformat-parser'];
/** Ignored for majors only: they follow something else's major (the Node runtime). */
const MAJORS_BY_HAND = ['@types/node', 'js-yaml'];
const MIN_LIMIT = 15;

/** A Dependabot glob (`*` only) as a test. */
const glob = (pattern: string) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\/]/g, '\\$&').replace(/\*/g, '.*')}$`);
const matches = (patterns: string[] | undefined, name: string) =>
  (patterns ?? []).some((p) => glob(p).test(name));

/** Every 0.x dev dependency in the workspace's package files. */
function zeroMajorDevDependencies(): string[] {
  const files = [
    'package.json',
    ...['apps', 'packages'].flatMap((top) =>
      fs
        .readdirSync(path.join(REPO, top))
        .map((name) => path.join(top, name, 'package.json'))
        .filter((rel) => fs.existsSync(path.join(REPO, rel)))
    ),
  ];
  const names = new Set<string>();
  for (const rel of files) {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8')) as {
      devDependencies?: Record<string, string>;
    };
    for (const [name, range] of Object.entries(pkg.devDependencies ?? {}))
      if (/^[\^~]?0\./.test(range)) names.add(name);
  }
  return [...names].sort();
}

/**
 * The group Dependabot puts one update in: the first group whose dependency type, patterns,
 * exclude-patterns and update types all admit it (GitHub: "included in the first group that it
 * matches"); `undefined` means its own PR.
 */
function landingGroup(
  groups: [string, Group][],
  name: string,
  dependencyType: 'development' | 'production',
  updateType: 'major' | 'minor' | 'patch'
): string | undefined {
  for (const [groupName, g] of groups) {
    if (g['dependency-type'] && g['dependency-type'] !== dependencyType) continue;
    if (g.patterns && !matches(g.patterns, name)) continue;
    if (matches(g['exclude-patterns'], name)) continue;
    if (g['update-types'] && !g['update-types'].includes(updateType)) continue;
    return groupName;
  }
  return undefined;
}

/** Every way the npm side would misbehave. Empty means the config does what the header says. */
function violations(config: { updates?: Entry[] }, zeroMajor: string[]): string[] {
  const out: string[] = [];
  const npm = (config.updates ?? []).filter((u) => u['package-ecosystem'] === 'npm');
  if (npm.length !== 1) out.push(`npm entries: ${npm.length}, expected 1`);
  const entry = npm[0];
  if (!entry) return out;
  if (entry.directory !== '/' || entry.directories) out.push('npm entry is not the root alone');
  if (entry.allow) out.push('an `allow` list narrows what is updated');
  if ((entry['open-pull-requests-limit'] ?? 5) < MIN_LIMIT)
    out.push(`open-pull-requests-limit below ${MIN_LIMIT}`);

  const groups = Object.entries(entry.groups ?? {});
  const general = groups.findIndex(
    ([, g]) => !g.patterns && g['dependency-type'] === 'development'
  );
  if (general < 0) out.push('no general dev-dependency group');
  for (const [name, g] of groups) {
    if (g['applies-to']) out.push(`group ${name} sets applies-to`);
    if (!g.patterns && (g['update-types'] ?? ['major', 'minor', 'patch']).includes('major'))
      out.push(`group ${name} takes majors without naming its packages`);
    if (g.patterns?.some((p) => p === '*')) out.push(`group ${name} matches every package`);
  }
  if (general >= 0) {
    const g = groups[general][1];
    if ([...(g['update-types'] ?? [])].sort().join() !== 'minor,patch')
      out.push('the general group does not take exactly minor and patch');
    for (const name of zeroMajor)
      if (!matches(g['exclude-patterns'], name)) out.push(`0.x ${name} rides the general group`);
    if (g['exclude-patterns']?.some((p) => p === '*'))
      out.push('the general group excludes everything');
  }
  for (const [group, members] of Object.entries(PARTNERS)) {
    const at = groups.findIndex(([n]) => n === group);
    if (at < 0) {
      out.push(`no partner group ${group}`);
      continue;
    }
    if (general >= 0 && at > general)
      out.push(`partner group ${group} comes after the general group`);
    const g = groups[at][1];
    if (g['update-types']) out.push(`partner group ${group} limits its update types`);
    for (const member of members)
      if (!matches(g.patterns, member)) out.push(`partner group ${group} misses ${member}`);
  }

  /* Fifteenth audit (C-2): the checks above read the partner groups alone, so an earlier group
   * taking `vitest` for minors, an exclude-pattern, a production-only dependency type or an
   * ignore rule on one partner all passed. Dependabot puts an update in the FIRST group that
   * matches it (GitHub docs), so where each partner lands is simulated, per update type. */
  for (const [group, members] of Object.entries(PARTNERS))
    for (const updateType of ['major', 'minor', 'patch'] as const)
      for (const member of members) {
        const landed = landingGroup(groups, member, 'development', updateType);
        if (landed !== group)
          out.push(
            `partner ${member} lands in ${landed ?? 'no group'} for ${updateType} updates, not ${group}`
          );
      }
  const ignoresOf = entry.ignore ?? [];
  for (const members of Object.values(PARTNERS))
    for (const member of members)
      for (const rule of ignoresOf)
        if (glob(rule['dependency-name']).test(member))
          out.push(`partner ${member} has an ignore rule (it would move without its partners)`);

  const ignores = entry.ignore ?? [];
  const ignored = (name: string) => ignores.filter((i) => glob(i['dependency-name']).test(name));
  for (const name of HAND_BUMPED) {
    const full = ignored(name).some((i) => !i['update-types'] && !i.versions);
    if (!full) out.push(`${name} is not left to hand bumps`);
  }
  for (const name of MAJORS_BY_HAND) {
    const rules = ignored(name);
    const majorsOnly = rules.some(
      (i) => !i.versions && (i['update-types'] ?? []).join() === 'version-update:semver-major'
    );
    if (!majorsOnly || rules.some((i) => !i['update-types']))
      out.push(`${name} is not ignored for majors only`);
  }
  for (const rule of ignored('next')) {
    const types = rule['update-types'];
    if (rule.versions || !types || types.join() !== 'version-update:semver-major')
      out.push('next is ignored beyond majors (its PRs are the advisory signal)');
  }
  return out;
}

const read = () =>
  yaml.load(fs.readFileSync(path.join(REPO, '.github/dependabot.yml'), 'utf8')) as {
    updates?: Entry[];
  };

describe('dependabot.yml, parsed', () => {
  it('should configure the npm side exactly as its header says', () => {
    expect(violations(read(), zeroMajorDevDependencies())).toEqual([]);
  });

  it('should find the 0.x dev dependencies it has to exclude (the reader is not blind)', () => {
    expect(zeroMajorDevDependencies()).toEqual(
      expect.arrayContaining(['@lhci/cli', '@types/three'])
    );
  });

  it('should keep the GitHub Actions entry with a release-age cooldown', () => {
    const actions = (read().updates ?? []).find((u) => u['package-ecosystem'] === 'github-actions');
    expect(actions?.directory).toBe('/');
    expect(actions?.cooldown).toBeDefined();
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

  /* Each planted config is a change the fourteenth audit showed the text reader passed, or a
   * realistic mistake; each must produce its own violation. */
  const base = () => read();
  const npmOf = (c: { updates?: Entry[] }) =>
    (c.updates ?? []).find((u) => u['package-ecosystem'] === 'npm') as Entry;
  it.each<[string, (c: { updates?: Entry[] }) => void, RegExp]>([
    [
      'a per-folder npm entry',
      (c) => c.updates?.push({ 'package-ecosystem': 'npm', directory: '/apps/web' }),
      /npm entries: 2/,
    ],
    [
      'a first group taking majors',
      (c) => {
        const e = npmOf(c);
        e.groups = { everything: { 'dependency-type': 'development' }, ...e.groups };
      },
      /group everything takes majors/,
    ],
    [
      'majors in the general group',
      (c) => {
        npmOf(c).groups!['dev-dependencies']['update-types'] = ['major', 'minor', 'patch'];
      },
      /takes majors without naming|exactly minor and patch/,
    ],
    [
      'applies-to on a group',
      (c) => {
        npmOf(c).groups!['dev-dependencies']['applies-to'] = 'security-updates';
      },
      /applies-to/,
    ],
    [
      'a 0.x package riding the general group',
      (c) => {
        npmOf(c).groups!['dev-dependencies']['exclude-patterns'] = ['@types/three'];
      },
      /0\.x @lhci\/cli/,
    ],
    [
      'a partner group after the general group',
      (c) => {
        const e = npmOf(c);
        const { vitest, ...rest } = e.groups!;
        e.groups = { ...rest, vitest };
      },
      /vitest comes after/,
    ],
    [
      'a partner group missing its partner',
      (c) => {
        npmOf(c).groups!.vitest.patterns = ['vitest'];
      },
      /misses @vitest\/coverage-v8/,
    ],
    [
      'next ignored through every update type',
      (c) => {
        npmOf(c).ignore!.push({
          'dependency-name': 'next',
          'update-types': [
            'version-update:semver-major',
            'version-update:semver-minor',
            'version-update:semver-patch',
          ],
        });
      },
      /next is ignored beyond majors/,
    ],
    [
      'a wildcard that ignores next',
      (c) => {
        npmOf(c).ignore!.push({ 'dependency-name': 'nex*' });
      },
      /next is ignored beyond majors/,
    ],
    [
      'postcss ignored for one range only',
      (c) => {
        const e = npmOf(c);
        e.ignore = e.ignore!.map((i) =>
          i['dependency-name'] === 'postcss' ? { ...i, versions: ['8.x'] } : i
        );
      },
      /postcss is not left to hand bumps/,
    ],
    [
      'a limit too low for the signal to open',
      (c) => {
        npmOf(c)['open-pull-requests-limit'] = 0;
      },
      /open-pull-requests-limit/,
    ],
    [
      'an allow list',
      (c) => {
        npmOf(c).allow = [{ 'dependency-type': 'production' }];
      },
      /allow/,
    ],
    [
      'an earlier group taking vitest minors alone (fifteenth audit C-2)',
      (c) => {
        const e = npmOf(c);
        e.groups = {
          early: { patterns: ['vitest'], 'update-types': ['minor', 'patch'] },
          ...e.groups,
        };
      },
      /partner vitest lands in early for minor updates/,
    ],
    [
      'coverage-v8 excluded from the vitest group',
      (c) => {
        npmOf(c).groups!.vitest['exclude-patterns'] = ['@vitest/coverage-v8'];
      },
      /partner @vitest\/coverage-v8 lands in/,
    ],
    [
      'the vitest group limited to production dependencies',
      (c) => {
        npmOf(c).groups!.vitest['dependency-type'] = 'production';
      },
      /partner vitest lands in/,
    ],
    [
      'an ignore rule on coverage-v8 majors',
      (c) => {
        npmOf(c).ignore!.push({
          'dependency-name': '@vitest/coverage-v8',
          'update-types': ['version-update:semver-major'],
        });
      },
      /partner @vitest\/coverage-v8 has an ignore rule/,
    ],
    [
      'an ignore rule on @eslint/*',
      (c) => {
        npmOf(c).ignore!.push({ 'dependency-name': '@eslint/*' });
      },
      /partner @eslint\/js has an ignore rule/,
    ],
  ])('should report %s (the guard is not blind)', (_label, plant, expected) => {
    const config = base();
    plant(config);
    expect(violations(config, zeroMajorDevDependencies()).join('\n')).toMatch(expected);
  });

  it('should accept the same configuration written in a different YAML style', () => {
    const text = fs.readFileSync(path.join(REPO, '.github/dependabot.yml'), 'utf8');
    const roundTrip = yaml.load(JSON.stringify(yaml.load(text))) as { updates?: Entry[] };
    expect(violations(roundTrip, zeroMajorDevDependencies())).toEqual([]);
  });
});

/**
 * The partner groups above are what Dependabot is ASKED to do; on 2026-11-11 it still opened
 * vitest 5 without @vitest/coverage-v8 5 and eslint 10 without @eslint/js 10 (5.895, 5.918).
 * So the lockfile itself is checked: across every workspace, the partners resolve together —
 * vitest and Storybook at one exact version (coverage-v8 and the Storybook packages pin each
 * other exactly), eslint and @eslint/js at one major. A PR that splits them fails CI.
 */
type Importers = Record<string, Record<string, Record<string, { version?: string }> | undefined>>;
const INSTALLED_TOGETHER: Record<keyof typeof PARTNERS, 'exact' | 'major'> = {
  vitest: 'exact',
  eslint: 'major',
  storybook: 'exact',
};

/**
 * Every installed package of a partner group, found by the group's own patterns (fifteenth
 * audit C-1: a fixed list of three missed @storybook/nextjs and the three addons).
 */
const PARTNER_PATTERNS: Record<keyof typeof PARTNERS, string[]> = {
  vitest: ['vitest', '@vitest/*'],
  eslint: ['eslint', '@eslint/*'],
  storybook: ['storybook', '@storybook/*', 'eslint-plugin-storybook'],
};

function partnerSplits(importers: Importers): string[] {
  const out: string[] = [];
  for (const group of Object.keys(PARTNERS)) {
    const rule = INSTALLED_TOGETHER[group];
    const seen = new Map<string, Set<string>>();
    for (const [dir, importer] of Object.entries(importers)) {
      for (const field of ['dependencies', 'devDependencies'] as const) {
        for (const member of Object.keys(importer[field] ?? {})) {
          if (!matches(PARTNER_PATTERNS[group], member)) continue;
          const raw = importer[field]?.[member]?.version;
          if (!raw) continue;
          const version = raw.split('(')[0];
          const key = rule === 'exact' ? version : version.split('.')[0];
          if (!seen.has(key)) seen.set(key, new Set());
          seen.get(key)!.add(`${member}@${version} (${dir})`);
        }
      }
    }
    if (seen.size > 1) {
      const found = [...seen.values()].map((s) => [...s].join(', ')).join(' | ');
      out.push(`partners ${group} resolve apart (${rule}): ${found}`);
    }
    if (seen.size === 0) out.push(`partners ${group}: none installed (the guard would be vacuous)`);
  }
  return out;
}

describe('the lockfile installs partner packages together (5.895, 5.918)', () => {
  const lockImporters = () =>
    (
      yaml.load(fs.readFileSync(path.join(REPO, 'pnpm-lock.yaml'), 'utf8')) as {
        importers: Importers;
      }
    ).importers;

  it('should resolve every partner group together across the workspace', () => {
    expect(partnerSplits(lockImporters())).toEqual([]);
  });

  it.each<[string, (i: Importers) => void, RegExp]>([
    [
      'eslint 10 with @eslint/js 9 in another workspace',
      (i) => {
        i['apps/web'].devDependencies!['@eslint/js'] = { version: '9.39.5' };
      },
      /partners eslint resolve apart \(major\)/,
    ],
    [
      'vitest 5 with coverage-v8 4',
      (i) => {
        i['apps/web'].devDependencies!['@vitest/coverage-v8'] = {
          version: '4.1.10(vitest@4.1.10)',
        };
      },
      /partners vitest resolve apart \(exact\)/,
    ],
    [
      'Storybook packages one patch apart',
      (i) => {
        i['apps/web'].devDependencies!['@storybook/react'] = { version: '10.6.7(react@18.3.1)' };
      },
      /partners storybook resolve apart \(exact\)/,
    ],
    [
      '@storybook/nextjs drifting in the Practice app (fifteenth audit C-1)',
      (i) => {
        i['apps/sandbox'].devDependencies!['@storybook/nextjs'] = {
          version: '10.7.0(next@16.4.5)',
        };
      },
      /partners storybook resolve apart \(exact\)[^\n]*@storybook\/nextjs@10\.7\.0/,
    ],
    [
      'a Storybook addon one minor behind',
      (i) => {
        i['apps/web'].devDependencies!['@storybook/addon-docs'] = { version: '10.5.0' };
      },
      /partners storybook resolve apart \(exact\)[^\n]*@storybook\/addon-docs@10\.5\.0/,
    ],
    [
      'a partner group that is not installed anywhere',
      (i) => {
        for (const importer of Object.values(i))
          for (const name of Object.keys(importer.devDependencies ?? {}))
            if (matches(PARTNER_PATTERNS.storybook, name)) delete importer.devDependencies![name];
      },
      /storybook: none installed/,
    ],
  ])('should report %s (the guard is not blind)', (_label, plant, expected) => {
    const importers = lockImporters();
    plant(importers);
    expect(partnerSplits(importers).join('\n')).toMatch(expected);
  });

  it('should accept an eslint patch apart from @eslint/js within one major', () => {
    const importers = lockImporters();
    importers['apps/web'].devDependencies!['@eslint/js'] = { version: '10.9.9' };
    expect(partnerSplits(importers)).toEqual([]);
  });
});
