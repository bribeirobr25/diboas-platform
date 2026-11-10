import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 5.868 (twelfth audit) — EVERY WORKFLOW ACTION IS PINNED, EVERY CHECKOUT DROPS ITS CREDENTIALS.
 *
 * A tag (`@v6`) can be moved to other code by whoever controls the action; a commit SHA cannot.
 * Third-party actions here receive secrets (gitleaks gets GITHUB_TOKEN, the Slack action a webhook).
 * `actions/checkout` leaves the job's token in `.git/config` unless told not to; no job here pushes
 * through git after checkout (the one that pushes uses its own token URL), so none keeps it.
 * Dependabot's `github-actions` entry bumps a SHA together with its `# vN` comment.
 */

const REPO = resolve(__dirname, '../../../../..');
const DIR = join(REPO, '.github/workflows');
const PINNED = /uses:\s*[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s*v\d/;
const USES = /^\s*(?:- )?uses:\s*(\S+)/;

/** Each checkout step's lines: from its `uses:` to the next step at the same indent. */
function checkoutSteps(text: string): string[] {
  const lines = text.split('\n');
  const steps: string[] = [];
  lines.forEach((line, i) => {
    const m = line.match(/^(\s*)(- )?uses:\s*actions\/checkout@/);
    if (!m) return;
    const indent = m[1].length + (m[2] ? 2 : 0);
    const body = [line];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (next.trim() === '' || next.trim().startsWith('#')) continue;
      if (next.length - next.trimStart().length < indent || /^\s*- /.test(next)) {
        if (next.length - next.trimStart().length <= indent - 2 || /^\s*- /.test(next)) break;
      }
      body.push(next);
    }
    steps.push(body.join('\n'));
  });
  return steps;
}

const workflows = readdirSync(DIR)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ file: f, text: readFileSync(join(DIR, f), 'utf8') }));

describe('5.868 · workflow actions are pinned and checkouts keep no credentials', () => {
  it('should read every workflow (non-vacuity)', () => {
    expect(workflows.length).toBeGreaterThanOrEqual(10);
    expect(workflows.flatMap((w) => checkoutSteps(w.text)).length).toBeGreaterThanOrEqual(10);
  });

  it('should pin every action to a commit SHA with its version comment', () => {
    const loose = workflows.flatMap((w) =>
      w.text
        .split('\n')
        .map((line, i) => ({ line, at: `${w.file}:${i + 1}` }))
        .filter(({ line }) => USES.test(line) && !PINNED.test(line))
        .map(({ at, line }) => `${at} ${line.trim()}`)
    );
    expect(loose).toEqual([]);
  });

  it('should set persist-credentials: false on every checkout', () => {
    const keeping = workflows.flatMap((w) =>
      checkoutSteps(w.text)
        .filter((step) => !/^\s*persist-credentials:\s*false\s*$/m.test(step))
        .map((step) => `${w.file}: ${step.split('\n')[0].trim()}`)
    );
    expect(keeping).toEqual([]);
  });

  it('should let Dependabot keep the pins current', () => {
    const yml = readFileSync(join(REPO, '.github/dependabot.yml'), 'utf8');
    expect(yml).toMatch(/package-ecosystem:\s*['"]?github-actions['"]?/);
  });

  it('should tell a pinned action and a kept credential from their opposites (detector self-test)', () => {
    expect(
      PINNED.test('      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6')
    ).toBe(true);
    expect(PINNED.test('      - uses: actions/checkout@v6')).toBe(false);
    expect(
      PINNED.test('      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803')
    ).toBe(false);
    const kept =
      '    steps:\n      - uses: actions/checkout@x # v6\n        with:\n          fetch-depth: 0\n      - run: ls';
    const dropped =
      '    steps:\n      - uses: actions/checkout@x # v6\n        with:\n          persist-credentials: false\n      - run: ls';
    expect(checkoutSteps(kept)[0]).not.toMatch(/persist-credentials/);
    expect(checkoutSteps(dropped)[0]).toMatch(/persist-credentials: false/);
    expect(checkoutSteps(kept)[0]).not.toMatch(/run: ls/);
  });
});
