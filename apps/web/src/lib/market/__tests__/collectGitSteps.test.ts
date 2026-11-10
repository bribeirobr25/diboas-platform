/**
 * The collection's git steps, as run on Actions (plan MP-3b; TOPUP-1 and R-7).
 *
 * 1. Every git call in the clone and commit steps is authenticated. A partial clone
 *    (`--filter=blob:none`) fetches file contents on demand during `checkout` and `rebase`; with a
 *    per-command wrapper those calls went out without the header (review of MP-3b, 2026-11-10).
 *    A stand-in `git` refuses any call without it, as the private store would.
 * 2. R-7: two collections write the same store; the second push is rejected, rebased and pushed
 *    with real git against a local bare repository, and both collections' files survive.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO = path.resolve(__dirname, '../../../../../..');
const WF = fs.readFileSync(path.join(REPO, '.github/workflows/market-data-collect.yml'), 'utf8');
const TIMEOUT = 30_000;
const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

function stepScript(name: string): string {
  const start = WF.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = WF.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  const lines = (next === -1 ? rest : rest.slice(0, next + 1)).split('\n');
  const at = lines.findIndex((l) => /^\s*run: \|/.test(l));
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

/** A workspace laid out like the Actions checkout: apps/web/scripts linked in. */
function workspace(): string {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'collect-git-'));
  roots.push(ws);
  fs.mkdirSync(path.join(ws, 'apps/web'), { recursive: true });
  fs.symlinkSync(path.join(REPO, 'apps/web/scripts'), path.join(ws, 'apps/web/scripts'));
  return ws;
}

const TOKEN = 'wt-stand-in'; // a stand-in: real tokens are far longer

describe('every git call in the collection is authenticated (plan MP-3b)', () => {
  /** A stand-in git and node: log each call; refuse a git call without the header. */
  function stubs(ws: string, { pushFailsOnce = false } = {}) {
    const bin = path.join(ws, '.bin');
    fs.mkdirSync(bin);
    const log = path.join(ws, '.calls.log');
    const flag = path.join(ws, '.pushed-once');
    fs.writeFileSync(
      path.join(bin, 'git'),
      `#!/bin/bash
printf 'git %s AUTH:%s\\n' "$*" "\${GIT_CONFIG_VALUE_0:+yes}" >> "${log}"
case "\${GIT_CONFIG_VALUE_0:-}" in "AUTHORIZATION: basic "*) ;; *) echo "fatal: could not read Username" >&2; exit 128 ;; esac
case "$1" in
  clone) mkdir -p "\${@: -1}/market/checks"; touch "\${@: -1}/market/checks/accepted-exceptions.json" ;;
  diff) exit 1 ;;
  rev-parse) echo 0123456 ;;
  push) ${pushFailsOnce ? `if [ ! -f "${flag}" ]; then touch "${flag}"; exit 1; fi` : 'exit 0'} ;;
esac
exit 0
`,
      { mode: 0o755 }
    );
    fs.writeFileSync(
      path.join(bin, 'node'),
      `#!/bin/bash
printf 'node %s AUTH:%s\\n' "$*" "\${GIT_CONFIG_VALUE_0:+yes}" >> "${log}"
case "\${GIT_CONFIG_VALUE_0:-}" in "AUTHORIZATION: basic "*) exit 0 ;; *) exit 128 ;; esac
`,
      { mode: 0o755 }
    );
    return { bin, log };
  }

  const run = (ws: string, bin: string, script: string, env: Record<string, string>) =>
    spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      cwd: ws,
      encoding: 'utf8',
      env: {
        NODE_ENV: 'test',
        PATH: `${bin}:${process.env.PATH}`,
        TOKEN,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'o/r',
        GITHUB_RUN_ID: '1',
        MODE: 'top-up',
        ...env,
      } as NodeJS.ProcessEnv,
    });

  it(
    'should check out an existing branch with every call authenticated, the token in no argument',
    () => {
      const ws = workspace();
      const { bin, log } = stubs(ws);
      const r = run(ws, bin, stepScript('Check out diboas-analytics'), { BRANCH: 'data/review' });
      expect(r.stderr).not.toMatch(/could not read Username/);
      expect(r.status).toBe(0);
      const calls = fs.readFileSync(log, 'utf8');
      expect(calls).toMatch(/^git clone .*AUTH:yes$/m);
      expect(calls).toMatch(/^git checkout --quiet data\/review AUTH:yes$/m);
      expect(calls).not.toContain(TOKEN);
    },
    TIMEOUT
  );

  it(
    'should authenticate the rejected-push path: fetch, rebase, the guard and the second push',
    () => {
      const ws = workspace();
      fs.mkdirSync(path.join(ws, 'analytics'));
      const { bin, log } = stubs(ws, { pushFailsOnce: true });
      const r = run(ws, bin, stepScript('Commit under market/ only'), { BRANCH: 'main' });
      expect(r.stderr).not.toMatch(/could not read Username/);
      expect(r.status).toBe(0);
      const calls = fs.readFileSync(log, 'utf8');
      for (const re of [
        /^git fetch .*AUTH:yes$/m,
        /^git rebase .*AUTH:yes$/m,
        /^node .*commit-guard\.mjs --range .*AUTH:yes$/m,
      ])
        expect(calls).toMatch(re);
      expect(calls.match(/^git push .*AUTH:yes$/gm)).toHaveLength(2);
      expect(calls).not.toMatch(/AUTH:$/m);
    },
    TIMEOUT
  );
});

describe('R-7: two collections write the same store (real git, local bare repository)', () => {
  const git = (cwd: string, ...a: string[]) =>
    execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: 'pipe' }).trim();

  it(
    'should rebase the second collection onto the first and keep both',
    () => {
      const root = workspace();
      const bare = path.join(root, 'store.git');
      execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
      const seed = path.join(root, 'seed');
      execFileSync('git', ['clone', '-q', bare, seed], { stdio: 'pipe' });
      const id = ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid'];
      fs.mkdirSync(path.join(seed, 'market/daily'), { recursive: true });
      fs.writeFileSync(path.join(seed, 'market/daily/btc.csv'), 'date,close\n2026-11-06,1\n');
      git(seed, 'add', '-A');
      git(seed, ...id, 'commit', '-q', '-m', 'seed');
      git(seed, 'push', '-q', 'origin', 'HEAD:main');
      // Saturday's collection and the top-up start from the same head
      const saturday = path.join(root, 'saturday');
      const analytics = path.join(root, 'analytics'); // the top-up, where the step runs
      execFileSync('git', ['clone', '-q', bare, saturday], { stdio: 'pipe' });
      execFileSync('git', ['clone', '-q', bare, analytics], { stdio: 'pipe' });
      // Saturday appends a day and pushes first
      fs.appendFileSync(path.join(saturday, 'market/daily/btc.csv'), '2026-11-07,2\n');
      git(saturday, 'add', '-A');
      git(saturday, ...id, 'commit', '-q', '-m', 'saturday');
      git(saturday, 'push', '-q', 'origin', 'HEAD:main');
      // a HOME that, like GitHub's runners, gives git no identity: without this, macOS invents
      // one and a missing identity in the step passed here and failed only on CI
      fs.writeFileSync(path.join(root, '.gitconfig'), '[user]\n\tuseConfigOnly = true\n');
      // the top-up adds its own evidence, then runs the real commit step
      fs.mkdirSync(path.join(analytics, 'market/checks'), { recursive: true });
      fs.writeFileSync(path.join(analytics, 'market/checks/20261110T070000Z.json'), '{}\n');
      const r = spawnSync(
        'bash',
        ['-e', '-o', 'pipefail', '-c', stepScript('Commit under market/ only')],
        {
          cwd: root,
          encoding: 'utf8',
          env: {
            NODE_ENV: 'test',
            PATH: process.env.PATH,
            HOME: root,
            TOKEN,
            BRANCH: 'main',
            MODE: 'top-up',
            GITHUB_SERVER_URL: 'https://github.com',
            GITHUB_REPOSITORY: 'o/r',
            GITHUB_RUN_ID: '1',
            GIT_CONFIG_NOSYSTEM: '1',
          } as NodeJS.ProcessEnv,
        }
      );
      expect(r.stdout + r.stderr).toMatch(/push rejected \(attempt 1\)/);
      expect(r.status, r.stdout + r.stderr).toBe(0);
      const check = path.join(root, 'check');
      execFileSync('git', ['clone', '-q', bare, check], { stdio: 'pipe' });
      expect(fs.readFileSync(path.join(check, 'market/daily/btc.csv'), 'utf8')).toContain(
        '2026-11-07,2'
      );
      expect(fs.existsSync(path.join(check, 'market/checks/20261110T070000Z.json'))).toBe(true);
      expect(git(check, 'log', '--format=%s', '-3').split('\n')[1]).toBe('saturday');
    },
    TIMEOUT
  );
});
