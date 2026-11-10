import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 5.868 (twelfth audit) — EVERY ACTION IS PINNED, EVERY CHECKOUT DROPS ITS CREDENTIALS.
 *
 * A tag (`@v6`) can be moved to other code by whoever controls the action; a commit SHA cannot.
 * Third-party actions here receive secrets (gitleaks gets GITHUB_TOKEN, the Slack action a webhook).
 * `actions/checkout` leaves the job's token in `.git/config` unless told not to; no job here pushes
 * through git after checkout (the one that pushes uses its own token URL), so none keeps it.
 * Dependabot's `github-actions` entry bumps a SHA together with its `# vX.Y.Z` comment.
 *
 * Thirteenth audit: the first guard matched a pattern ANYWHERE on the line, so a flow-style
 * `- { uses: x@v6 }`, extra spaces after the dash, a pinned-looking comment after a tag, a
 * `persist-credentials` under `env:`, and a composite action under `.github/actions/` all
 * passed. It now reads the `uses:` VALUE itself, wherever the key sits, in every workflow and
 * every composite action, and requires `persist-credentials: false` under the step's `with:`.
 */

const REPO = resolve(__dirname, '../../../../..');
const ROOTS = ['.github/workflows', '.github/actions'];

/** Every `uses:` value on a line: block style, flow style (`{ uses: … }`), quoted or not. */
const USES = /(?:^|[\s{,-])uses:\s*['"]?([^\s'",}#]+)/g;
/** A value that cannot move: a full commit SHA, a local path, or a digest-pinned image. */
const IMMUTABLE =
  /^(?:[\w.-]+\/[\w./-]+@[0-9a-f]{40}|\.\/\S+|docker:\/\/[^@\s]+@sha256:[0-9a-f]{64})$/;
/** A SHA-pinned action must say which release it is. */
const VERSION_COMMENT = /#\s*v\d/;

function yamlFiles(): { file: string; text: string }[] {
  const walk = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
          d.isDirectory()
            ? walk(join(dir, d.name))
            : /\.ya?ml$/.test(d.name)
              ? [join(dir, d.name)]
              : []
        )
      : [];
  return ROOTS.flatMap((root) => walk(join(REPO, root))).map((f) => ({
    file: relative(REPO, f),
    text: readFileSync(f, 'utf8'),
  }));
}

/** Every `uses:` value with its line, in one file. */
function usesValues(text: string): { value: string; line: string; at: number }[] {
  return text
    .split('\n')
    .flatMap((line, i) =>
      line.trimStart().startsWith('#')
        ? []
        : [...line.split('#')[0].matchAll(USES)].map((m) => ({ value: m[1], line, at: i + 1 }))
    );
}

/** Does this checkout step put `persist-credentials: false` under its own `with:`? */
function dropsCredentials(lines: string[], start: number): boolean {
  const stepIndent = lines[start].length - lines[start].trimStart().length;
  for (let j = start + 1; j < lines.length; j += 1) {
    const l = lines[j];
    if (l.trim() === '' || l.trim().startsWith('#')) continue;
    const indent = l.length - l.trimStart().length;
    if (indent <= stepIndent) return false; // next step or job: no `with:` found
    if (/^\s*with:\s*$/.test(l)) {
      for (let k = j + 1; k < lines.length; k += 1) {
        const w = lines[k];
        if (w.trim() === '' || w.trim().startsWith('#')) continue;
        if (w.length - w.trimStart().length <= indent) return false;
        if (/^\s*persist-credentials:\s*false\s*$/.test(w)) return true;
      }
      return false;
    }
  }
  return false;
}

const files = yamlFiles();

describe('5.868 · workflow actions are pinned and checkouts keep no credentials', () => {
  it('should read every workflow (non-vacuity)', () => {
    expect(
      files.filter((f) => f.file.startsWith('.github/workflows/')).length
    ).toBeGreaterThanOrEqual(10);
    expect(files.flatMap((f) => usesValues(f.text)).length).toBeGreaterThanOrEqual(30);
  });

  it('should pin every action to a commit SHA (or a local path or image digest)', () => {
    const loose = files.flatMap((f) =>
      usesValues(f.text)
        .filter(({ value }) => !IMMUTABLE.test(value))
        .map(({ value, at }) => `${f.file}:${at} ${value}`)
    );
    expect(loose).toEqual([]);
  });

  it('should name the release of every SHA-pinned action', () => {
    const unnamed = files.flatMap((f) =>
      usesValues(f.text)
        .filter(({ value, line }) => /@[0-9a-f]{40}$/.test(value) && !VERSION_COMMENT.test(line))
        .map(({ at }) => `${f.file}:${at}`)
    );
    expect(unnamed).toEqual([]);
  });

  it('should set persist-credentials: false under the with: of every checkout', () => {
    const keeping = files.flatMap((f) => {
      const lines = f.text.split('\n');
      return lines.flatMap((line, i) =>
        /uses:\s*['"]?actions\/checkout@/.test(line) && !dropsCredentials(lines, i)
          ? [`${f.file}:${i + 1}`]
          : []
      );
    });
    expect(keeping).toEqual([]);
  });

  it('should let Dependabot keep the pins current, after the same 3-day wait as npm', () => {
    const yml = readFileSync(join(REPO, '.github/dependabot.yml'), 'utf8');
    const entry = yml.slice(yml.search(/package-ecosystem:\s*['"]?github-actions/));
    expect(entry).toMatch(/package-ecosystem:\s*['"]?github-actions/);
    expect(entry).toMatch(/cooldown:\s*\n\s+default-days:\s*3/);
  });

  it('should read the value, not the line (detector self-test)', () => {
    const v = (line: string) => usesValues(line).map((u) => u.value);
    expect(v('      - { uses: pnpm/action-setup@v6 }')).toEqual(['pnpm/action-setup@v6']);
    expect(v('      -   uses: pnpm/action-setup@v6')).toEqual(['pnpm/action-setup@v6']);
    expect(v(`      - uses: x/y@v6 # uses: a/b@${'a'.repeat(40)} # v6`)).toEqual(['x/y@v6']);
    expect(v(`      - uses: 'actions/checkout@${'b'.repeat(40)}' # v6.1.0`)).toEqual([
      `actions/checkout@${'b'.repeat(40)}`,
    ]);
    expect(IMMUTABLE.test('./.github/actions/setup')).toBe(true);
    expect(IMMUTABLE.test(`docker://alpine@sha256:${'c'.repeat(64)}`)).toBe(true);
    expect(IMMUTABLE.test('actions/checkout@v6')).toBe(false);
    const underEnv = [
      '      - uses: actions/checkout@x',
      '        env:',
      '          persist-credentials: false',
      '      - run: ls',
    ];
    const underWith = [
      '      - uses: actions/checkout@x',
      '        with:',
      '          persist-credentials: false',
      '      - run: ls',
    ];
    expect(dropsCredentials(underEnv, 0)).toBe(false);
    expect(dropsCredentials(underWith, 0)).toBe(true);
  });
});
