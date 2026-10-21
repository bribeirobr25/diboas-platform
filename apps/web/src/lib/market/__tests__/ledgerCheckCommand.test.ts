/**
 * The weekly PR's ledger check, run as a COMMAND in a throw-away Git
 * repository (2026-10-21, Codex audit of #738).
 *
 * The pure comparison is tested in `market-data/__tests__/ledgerAppendCheck.test.ts`.
 * This file runs the real `check-ledgers.mjs` against real Git state, including
 * failures of Git itself, and then the workflow's own `run:` scripts with bash:
 * the check step, then the PR-body step, plus the PR title expression. It shows
 * the three outcomes stay distinct all the way to the PR:
 *   ok       complete rows appended, verified;
 *   damaged  existing bytes changed, or a fragment appended (observed);
 *   error    the check could not run, so integrity is UNVERIFIED (not damage).
 *
 * No real ledger is read, repaired or deleted: every ledger here is synthetic.
 * Lives outside the weekly workflow's blocking directories: it tests code.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = path.join(__dirname, '../../../../../..');
const SCRIPTS = path.join(REPO_ROOT, 'apps/web/scripts/market-refresh');
const WORKFLOW = fs.readFileSync(
  path.join(REPO_ROOT, '.github/workflows/market-refresh-weekly.yml'),
  'utf8'
);
const SHARED = 'apps/web/data/market/shared';
const ROW = '{"anchor":"2026-10-09"}\n';
const NEXT = '{"anchor":"2026-10-16"}\n';
const TIMEOUT = 30_000;

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** A repo with the scripts and two committed ledgers (unless `commit` is false). */
function repo({ commit = true } = {}): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-check-')));
  roots.push(root);
  fs.cpSync(SCRIPTS, path.join(root, 'apps/web/scripts/market-refresh'), { recursive: true });
  fs.mkdirSync(path.join(root, SHARED), { recursive: true });
  fs.writeFileSync(path.join(root, SHARED, 'etf-shares-weekly.jsonl'), ROW);
  fs.writeFileSync(path.join(root, SHARED, 'run-archive.jsonl'), ROW + ROW);
  git(root, 'init', '-q');
  if (commit) {
    git(root, 'add', '-A');
    git(root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
  }
  return root;
}

const ledger = (root: string, name: string) => path.join(root, SHARED, name);

/** Run the real checker command; returns its status file, note file and exit code. */
function check(root: string) {
  const out = path.join(root, '.out');
  fs.mkdirSync(out, { recursive: true });
  const r = spawnSync(
    process.execPath,
    [
      'apps/web/scripts/market-refresh/check-ledgers.mjs',
      '--status',
      path.join(out, 'status'),
      '--note',
      path.join(out, 'note'),
    ],
    { cwd: root, encoding: 'utf8', timeout: TIMEOUT }
  );
  const read = (f: string) =>
    fs.existsSync(path.join(out, f)) ? fs.readFileSync(path.join(out, f), 'utf8').trim() : null;
  return { code: r.status, status: read('status'), note: read('note') ?? '' };
}

/** Delete the Git object that holds a committed ledger, so `git show` fails. */
function breakBaseline(root: string, name: string) {
  const blob = git(root, 'rev-parse', `HEAD:${SHARED}/${name}`).trim();
  fs.rmSync(path.join(root, '.git/objects', blob.slice(0, 2), blob.slice(2)));
}

describe('ledger check command — real Git, real failures', () => {
  it(
    'should verify an ordinary append of complete rows',
    () => {
      const root = repo();
      fs.appendFileSync(ledger(root, 'etf-shares-weekly.jsonl'), NEXT);
      const r = check(root);
      expect(r).toMatchObject({ code: 0, status: 'ok' });
      expect(r.note).toContain('etf-shares-weekly.jsonl`: 1 complete row(s) appended');
    },
    TIMEOUT
  );

  it(
    'should report an edited or a truncated existing ledger as damaged',
    () => {
      const edited = repo();
      fs.writeFileSync(ledger(edited, 'etf-shares-weekly.jsonl'), NEXT);
      expect(check(edited).status).toBe('damaged');
      const truncated = repo();
      fs.writeFileSync(ledger(truncated, 'run-archive.jsonl'), ROW);
      const r = check(truncated);
      expect(r.status).toBe('damaged');
      expect(r.note.startsWith('This run did not only append complete rows')).toBe(true);
    },
    TIMEOUT
  );

  it(
    'should treat a genuinely new, untracked ledger with complete rows as verified',
    () => {
      const root = repo();
      fs.writeFileSync(ledger(root, 'etf-snapshot-attempts.jsonl'), ROW + NEXT);
      const r = check(root);
      expect(r.status).toBe('ok');
      expect(r.note).toContain('etf-snapshot-attempts.jsonl`: 2 complete row(s) appended');
    },
    TIMEOUT
  );

  it(
    'should report UNVERIFIED, not a new ledger, when a committed baseline cannot be read',
    () => {
      const root = repo();
      breakBaseline(root, 'run-archive.jsonl');
      // The inventory and the working file are still readable.
      expect(git(root, 'ls-tree', '-r', '--name-only', 'HEAD', SHARED)).toContain(
        'run-archive.jsonl'
      );
      expect(fs.readFileSync(ledger(root, 'run-archive.jsonl'), 'utf8')).toBe(ROW + ROW);
      const r = check(root);
      expect(r.status).toBe('error');
      expect(r.note).toContain('UNVERIFIED');
      expect(r.note).toContain('no damage was found, and none was ruled out');
      expect(r.note).not.toContain('did not only append');
      expect(r.note).not.toContain('complete row(s) appended');
    },
    TIMEOUT
  );

  it(
    'should report UNVERIFIED when the HEAD inventory itself cannot be read',
    () => {
      const root = repo({ commit: false }); // no HEAD at all
      const r = check(root);
      expect(r.status).toBe('error');
      expect(r.note).toContain('UNVERIFIED');
    },
    TIMEOUT
  );
});

describe('ledger check command — review-gate fixes (2026-10-21)', () => {
  const commit = (root: string, msg: string) => {
    git(root, 'add', '-A');
    git(root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', msg);
  };

  it(
    'should report UNVERIFIED, not ok, when a ledger the pipeline writes is not at HEAD',
    () => {
      const root = repo();
      fs.rmSync(ledger(root, 'run-archive.jsonl'));
      commit(root, 'archive moved away');
      const r = check(root);
      expect(r.status).toBe('error');
      expect(r.note).toContain('required ledger(s) not found at HEAD');
      expect(r.note).toContain('run-archive.jsonl');
    },
    TIMEOUT
  );

  it(
    'should see a rewrite of a ledger whose name is not ASCII',
    () => {
      const root = repo();
      fs.writeFileSync(ledger(root, 'ledgér.jsonl'), ROW + ROW);
      commit(root, 'non-ascii ledger');
      fs.writeFileSync(ledger(root, 'ledgér.jsonl'), NEXT);
      const r = check(root);
      expect(r.status).toBe('damaged');
      expect(r.note).toContain('existing content was changed or removed');
    },
    TIMEOUT
  );

  it(
    'should compare BYTES: a rewrite inside invalid UTF-8 is not hidden by decoding',
    () => {
      const root = repo();
      fs.writeFileSync(ledger(root, 'bytes.jsonl'), Buffer.from('{"a":"\xff"}\n', 'latin1'));
      commit(root, 'invalid utf-8 byte');
      fs.writeFileSync(
        ledger(root, 'bytes.jsonl'),
        Buffer.concat([Buffer.from('{"a":"\xfe"}\n', 'latin1'), Buffer.from(NEXT)])
      );
      const r = check(root);
      expect(r.status).toBe('damaged');
      expect(r.note).toContain('existing content was changed or removed');
    },
    TIMEOUT
  );

  it(
    'should refuse appended bytes that are not valid UTF-8',
    () => {
      const root = repo();
      fs.appendFileSync(ledger(root, 'run-archive.jsonl'), Buffer.from('{"a":"\xff"}\n', 'latin1'));
      const r = check(root);
      expect(r.status).toBe('damaged');
      expect(r.note).toContain('the added bytes are not valid UTF-8');
    },
    TIMEOUT
  );
});

// ── The workflow's own scripts ────────────────────────────────────────────

/** The `run: |` block of a named step, dedented. */
function runScript(name: string): string {
  const start = WORKFLOW.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = WORKFLOW.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  const lines = (next === -1 ? rest : rest.slice(0, next + 1)).split('\n');
  const at = lines.findIndex((l) => /^\s*run: \|\s*$/.test(l));
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

function bash(script: string, cwd: string, env: Record<string, string>) {
  return spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
    cwd,
    encoding: 'utf8',
    env: {
      NODE_ENV: 'test',
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      ...env,
    } as NodeJS.ProcessEnv,
    timeout: TIMEOUT,
  });
}

/** Run the check step as GitHub would; returns the `status` output ('' when none). */
function checkStep(root: string): { code: number | null; status: string; runnerTemp: string } {
  const runnerTemp = fs.mkdtempSync(path.join(root, '.runner-'));
  const output = path.join(runnerTemp, 'github-output');
  fs.writeFileSync(output, '');
  const r = bash(runScript('Ledger append check (reported)'), root, {
    RUNNER_TEMP: runnerTemp,
    GITHUB_OUTPUT: output,
  });
  const m = /^status=(.*)$/m.exec(fs.readFileSync(output, 'utf8'));
  return { code: r.status, status: m ? m[1] : '', runnerTemp };
}

/** Run the PR-body step with that status; returns the body. */
function prBody(root: string, runnerTemp: string, ledgerStatus: string): string {
  const script = runScript('Compose PR body').replace(
    /\$\{\{\s*([^}]+?)\s*\}\}/g,
    (_: string, e: string) => (e === 'steps.memo.outputs.status' ? 'ok' : '')
  );
  const r = bash(script, root, {
    RUNNER_TEMP: runnerTemp,
    LEDGER_STATUS: ledgerStatus,
    ETF_STATUS: 'ok',
  });
  expect(r.status, r.stderr).toBe(0);
  return fs.readFileSync(path.join(runnerTemp, 'pr-body.md'), 'utf8');
}

/**
 * Evaluate the PR title expression for a ledger and memo status. The
 * expression has the shape `cond && 'title' || cond && 'title' || 'title'`;
 * anything else fails the parse, so a reshaped expression cannot pass silently.
 */
function title(ledgerStatus: string, memoStatus = 'ok'): string {
  const expr = (/title: >-\n\s*\$\{\{([\s\S]*?)\}\}/.exec(WORKFLOW)?.[1] ?? '').replace(
    /\s+/g,
    ' '
  );
  const values: Record<string, string> = { ledgers: ledgerStatus, memo: memoStatus };
  for (const clause of expr.split('||').map((c) => c.trim())) {
    const conditional = /^steps\.(\w+)\.outputs\.status (!=|==) '([^']*)' && '([^']+)'$/.exec(
      clause
    );
    if (conditional) {
      const [, step, op, value, text] = conditional;
      if (op === '!=' ? values[step] !== value : values[step] === value) return text;
      continue;
    }
    const fallback = /^'([^']+)'$/.exec(clause);
    if (fallback) return fallback[1];
    throw new Error(`unexpected title clause: ${clause}`);
  }
  throw new Error('title expression has no fallback');
}

describe('ledger check → PR title and body (workflow wiring, executed)', () => {
  it(
    'should carry ok, damaged and error through the step to distinct PR bodies and titles',
    () => {
      const ok = repo();
      const okStep = checkStep(ok);
      expect(okStep).toMatchObject({ code: 0, status: 'ok' });
      expect(prBody(ok, okStep.runnerTemp, okStep.status)).toContain(
        'Ledger append check: only complete rows were appended'
      );
      expect(title(okStep.status)).toBe('data(market): weekly refresh — review before merge');

      const damaged = repo();
      fs.writeFileSync(ledger(damaged, 'run-archive.jsonl'), ROW);
      const dStep = checkStep(damaged);
      expect(dStep.status).toBe('damaged');
      const dBody = prBody(damaged, dStep.runnerTemp, dStep.status);
      expect(dBody).toContain('Ledger check did not pass: do not merge as is');
      expect(dBody).toContain('This run did not only append complete rows');

      const unverified = repo();
      breakBaseline(unverified, 'etf-shares-weekly.jsonl');
      const eStep = checkStep(unverified);
      expect(eStep.status).toBe('error');
      const eBody = prBody(unverified, eStep.runnerTemp, eStep.status);
      expect(eBody).toContain('integrity of the append-only');
      expect(eBody).toContain('UNVERIFIED');
      expect(eBody).not.toContain('This run did not only append complete rows');
      for (const s of ['damaged', 'error']) {
        expect(title(s)).toBe(
          'data(market): weekly refresh — LEDGER CHECK FAILED, do not merge as is'
        );
      }
    },
    TIMEOUT
  );

  it(
    'should keep the warning when the check step dies before writing a status (empty status)',
    () => {
      const root = repo();
      fs.rmSync(path.join(root, 'apps/web/scripts/market-refresh/check-ledgers.mjs'));
      const step = checkStep(root);
      expect(step.code).not.toBe(0); // continue-on-error lets the job go on
      expect(step.status).toBe('');
      const body = prBody(root, step.runnerTemp, step.status);
      expect(body).toContain('Ledger check did not pass: do not merge as is');
      expect(body).toContain('the ledgers are unverified');
      expect(title('')).toBe(
        'data(market): weekly refresh — LEDGER CHECK FAILED, do not merge as is'
      );
      expect(title('', 'stale')).toBe(
        'data(market): weekly refresh — LEDGER CHECK FAILED, do not merge as is'
      );
    },
    TIMEOUT
  );
});

describe('ledger check command — a byte-order mark is not a complete row (2026-10-21 final audit)', () => {
  it(
    'should refuse an appended row that starts with a BOM, which readers cannot parse',
    () => {
      const root = repo();
      fs.appendFileSync(
        ledger(root, 'run-archive.jsonl'),
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(NEXT)])
      );
      const r = check(root);
      expect(r.status).toBe('damaged');
      expect(r.note).toContain('not a complete JSON row');
    },
    TIMEOUT
  );
});
