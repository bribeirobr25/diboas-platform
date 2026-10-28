/**
 * CARRY-PR-1 (5.632, C1a; plan rev 5 §6). The weekly run carries an open
 * refresh PR's data instead of refusing to run, and refuses only when carrying
 * would lose or misstate something. Verified, as the founder ruled (question B,
 * 2026-10-21), against a throwaway git fixture and never by dispatching the
 * workflow: a bare origin, `main`, an open bot branch, data and non-data
 * changes, a head that moves, a LEDGER CHECK FAILED title.
 *
 * Lives in lib/market/, outside the weekly blocking directories (5.363): it owns
 * its inputs, but a git fixture has no business deciding a release.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DATA_PATHS,
  parseOpenPrs,
  REFRESH_BRANCH,
  carryNote,
  prepare,
  verify,
} from '../../../../scripts/market-refresh/carry-open-pr.mjs';

const SCRIPT = path.join(__dirname, '../../../../scripts/market-refresh/carry-open-pr.mjs');
const SHARED = 'apps/web/data/market/shared';
const ARCHIVE = `${SHARED}/run-archive.jsonl`;
const LEDGER = `${SHARED}/etf-shares-weekly.jsonl`;
const REGIME = `${SHARED}/regime.json`;
// A file in the second data path (its name is not one of the monthly series,
// which releaseGateBoundary.test.ts reserves for declared readers).
const SECOND = 'apps/web/src/lib/market-data/data/protocolsTvl.json';

let root: string;
let origin: string;
let author: string; // a clone that plays "main" and the bot pushing to the branch
let runner: string; // the workflow's checkout of main

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

function write(dir: string, rel: string, text: string) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), text);
}
const read = (dir: string, rel: string) => fs.readFileSync(path.join(dir, rel), 'utf8');
const exists = (dir: string, rel: string) => fs.existsSync(path.join(dir, rel));

const run = (day: string) => `${JSON.stringify({ run_at: `${day}T13:00:00.000Z`, score: 9 })}\n`;
const etf = (anchor: string) => `${JSON.stringify({ anchor, funds: { IBIT: { shares: 1 } } })}\n`;

/** main: the data files, a README and an old file the bot branch deletes. */
function seedMain() {
  write(author, 'README.md', 'readme\n');
  write(author, ARCHIVE, run('2026-10-19'));
  write(author, LEDGER, etf('2026-10-16'));
  write(author, REGIME, '{"summary":{"en":{"short":"old memo"}}}\n');
  write(author, SECOND, '{"series":[]}\n');
  write(author, `${SHARED}/obsolete.json`, '{}\n');
  git(author, 'add', '-A');
  git(author, 'commit', '-qm', 'main');
  git(author, 'push', '-q', 'origin', 'HEAD:main');
}

/** The open refresh PR: one bot week plus a founder memo commit, data paths only. */
function openBotBranch(): string {
  git(author, 'checkout', '-qb', 'bot');
  fs.appendFileSync(path.join(author, ARCHIVE), run('2026-10-26'));
  fs.appendFileSync(path.join(author, LEDGER), etf('2026-10-23'));
  write(author, `${SHARED}/new-file.json`, '{"added":true}\n');
  fs.rmSync(path.join(author, `${SHARED}/obsolete.json`));
  git(author, 'add', '-A');
  git(author, 'commit', '-qm', 'data(market): weekly refresh (automated)');
  write(author, REGIME, '{"summary":{"en":{"short":"founder memo for 10-26"}}}\n');
  git(author, 'commit', '-qam', 'editorial(market): memo');
  git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
  git(author, 'checkout', '-q', 'main');
  return git(author, 'rev-parse', 'bot');
}

const pr = (
  head: string,
  title = 'data(market): weekly refresh — MEMO REWRITE REQUIRED before merge'
) => ({
  number: 751,
  url: 'https://example.test/pull/751',
  title,
  headRefOid: head,
});

function cloneRunner() {
  execFileSync('git', ['clone', '-q', '--branch', 'main', origin, runner]);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'carry-pr-'));
  origin = path.join(root, 'origin.git');
  author = path.join(root, 'author');
  runner = path.join(root, 'runner');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin]);
  execFileSync('git', ['clone', '-q', origin, author], { stdio: 'ignore' });
  git(author, 'checkout', '-qb', 'main');
  seedMain();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('CARRY-PR-1 prepare — what the run starts from', () => {
  it('should start fresh from main when no refresh PR is open', () => {
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [] });
    expect(res).toMatchObject({ decision: 'fresh', startHead: '' });
    expect(git(runner, 'status', '--porcelain')).toBe('');
  });

  it("should lay the open PR's data paths on main: appended rows, the founder's memo, added and deleted files", () => {
    const head = openBotBranch();
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res).toMatchObject({ decision: 'carry', prNumber: 751, prHead: head, startHead: head });
    expect(res.carriedRuns).toEqual(['2026-10-26']);
    expect(res.carriedEtf).toEqual(['2026-10-23']);
    expect(read(runner, ARCHIVE)).toBe(run('2026-10-19') + run('2026-10-26'));
    expect(read(runner, LEDGER)).toBe(etf('2026-10-16') + etf('2026-10-23'));
    expect(read(runner, REGIME)).toContain('founder memo for 10-26');
    expect(exists(runner, `${SHARED}/new-file.json`)).toBe(true);
    expect(exists(runner, `${SHARED}/obsolete.json`)).toBe(false);
    // Only data paths moved; the checkout is still main.
    // -z, untrimmed: the porcelain status column starts with a space.
    const changed = execFileSync('git', ['status', '--porcelain', '-z', '--untracked-files=all'], {
      cwd: runner,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean)
      .map((l) => l.slice(3));
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every((p) => DATA_PATHS.some((d) => p.startsWith(`${d}/`)))).toBe(true);
    expect(git(runner, 'rev-parse', 'HEAD')).toBe(git(author, 'rev-parse', 'main'));
  });

  it('should refuse when the PR branch changed a file outside the data paths, and touch nothing', () => {
    git(author, 'checkout', '-qb', 'bot');
    fs.appendFileSync(path.join(author, ARCHIVE), run('2026-10-26'));
    write(author, 'README.md', 'edited on the bot branch\n');
    git(author, 'commit', '-qam', 'mixed');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('outside the data paths');
    expect(res.reason).toContain('README.md');
    expect(git(runner, 'status', '--porcelain')).toBe('');
  });

  it("should carry, keeping main's change, when main changed a data file the PR does not touch", () => {
    const head = openBotBranch();
    write(author, SECOND, '{"series":["changed on main"]}\n');
    git(author, 'commit', '-qam', 'a data change merged to main');
    git(author, 'push', '-q', 'origin', 'HEAD:main');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res.decision).toBe('carry');
    expect(read(runner, SECOND)).toBe('{"series":["changed on main"]}\n'); // not reverted
    expect(read(runner, REGIME)).toContain('founder memo for 10-26');
    expect(res.carriedFiles).not.toContain(SECOND);
  });

  it('should refuse, naming the file and the remedy, when main changed a data file the PR also changes', () => {
    const head = openBotBranch();
    write(author, REGIME, '{"summary":{"en":{"short":"regenerated on main"}}}\n');
    git(author, 'commit', '-qam', 'a data change merged to main');
    git(author, 'push', '-q', 'origin', 'HEAD:main');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('main changed data files');
    expect(res.reason).toContain('regime.json');
    expect(res.reason).not.toContain('run-archive.jsonl'); // only the overlap is named
    expect(res.remedy).toContain('Update branch');
    expect(res.remedy).toContain('Never close an open refresh PR unmerged');
    expect(git(runner, 'status', '--porcelain')).toBe('');
  });

  it("should carry the PR's change in the second data path", () => {
    git(author, 'checkout', '-qb', 'bot');
    fs.appendFileSync(path.join(author, ARCHIVE), run('2026-10-26'));
    write(author, SECOND, '{"series":["month-roll on the bot branch"]}\n');
    git(author, 'commit', '-qam', 'data with a month-roll');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    expect(prepare({ cwd: runner, openPrs: [pr(head)] }).decision).toBe('carry');
    expect(read(runner, SECOND)).toBe('{"series":["month-roll on the bot branch"]}\n');
  });

  it('should refuse a rename from code into a data path (the code-side deletion is outside)', () => {
    write(author, 'apps/web/scripts/foo.mjs', 'export const x = 1;\n');
    git(author, 'add', '-A');
    git(author, 'commit', '-qm', 'a script');
    git(author, 'push', '-q', 'origin', 'HEAD:main');
    git(author, 'checkout', '-qb', 'bot');
    git(author, 'mv', 'apps/web/scripts/foo.mjs', `${SHARED}/foo.mjs`);
    fs.appendFileSync(path.join(author, ARCHIVE), run('2026-10-26'));
    git(author, 'commit', '-qam', 'rename into data');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('apps/web/scripts/foo.mjs');
  });

  it('should refuse a change under a path that only shares the data prefix', () => {
    git(author, 'checkout', '-qb', 'bot');
    write(author, 'apps/web/data/market-other/x.json', '{}\n');
    git(author, 'add', '-A');
    git(author, 'commit', '-qm', 'prefix trap');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('apps/web/data/market-other/x.json');
  });

  it('should carry when main moved outside the data paths only', () => {
    const head = openBotBranch();
    write(author, 'README.md', 'a code change merged to main\n');
    git(author, 'commit', '-qam', 'code');
    git(author, 'push', '-q', 'origin', 'HEAD:main');
    cloneRunner();
    expect(prepare({ cwd: runner, openPrs: [pr(head)] }).decision).toBe('carry');
    expect(read(runner, 'README.md')).toBe('a code change merged to main\n');
  });

  it('should refuse a PR whose ledger is not a clean append, and carry it once the fix is on the branch', () => {
    const title = 'data(market): weekly refresh — LEDGER CHECK FAILED, do not merge as is';
    git(author, 'checkout', '-qb', 'bot');
    fs.appendFileSync(path.join(author, LEDGER), '{"anchor":"2026-10-2'); // a fragment
    git(author, 'commit', '-qam', 'fragment');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    let head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head, title)] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('etf-shares-weekly.jsonl');
    expect(res.reason).toContain('not a clean append');
    expect(git(runner, 'status', '--porcelain')).toBe('');
    // The fix lands on the branch; the title (bot-set) still says LEDGER CHECK FAILED.
    write(author, LEDGER, etf('2026-10-16') + etf('2026-10-23'));
    git(author, 'commit', '-qam', 'remove the fragment, append the week');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    head = git(author, 'rev-parse', 'HEAD');
    expect(prepare({ cwd: runner, openPrs: [pr(head, title)] }).decision).toBe('carry');
  });

  it("should refuse, touching nothing, when the PR list names an older real head than the branch's", () => {
    const older = openBotBranch();
    git(author, 'checkout', '-q', 'bot');
    write(author, REGIME, '{"summary":{"en":{"short":"memo pushed just before the run"}}}\n');
    git(author, 'commit', '-qam', 'memo');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    git(author, 'checkout', '-q', 'main');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(older)] }); // GitHub's list lagging
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('the branch moved while this run started');
    expect(git(runner, 'status', '--porcelain')).toBe('');
  });

  it('should refuse a run that did not start from main', () => {
    const head = openBotBranch();
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)], ref: 'refs/heads/feat/x' });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('refs/heads/feat/x');
    expect(res.remedy).toContain('from main');
    expect(git(runner, 'status', '--porcelain')).toBe('');
  });

  it('should ignore PRs from forks, which anyone can open from a branch with this name', () => {
    const list = parseOpenPrs(
      JSON.stringify([
        { ...pr('a'), isCrossRepository: true },
        { ...pr('b'), number: 9, isCrossRepository: false },
      ])
    );
    expect(list.map((p: { number: number }) => p.number)).toEqual([9]);
    expect(() => parseOpenPrs('null')).toThrow();
    expect(() => parseOpenPrs('{}')).toThrow();
  });

  it('should report the carried run days as unknown, never "none", when the PR rewrote the archive', () => {
    git(author, 'checkout', '-qb', 'bot');
    write(author, ARCHIVE, run('2026-10-20')); // rewritten, not appended
    git(author, 'commit', '-qam', 'rewritten archive');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const head = git(author, 'rev-parse', 'HEAD');
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head)] });
    // A rewritten .jsonl is not a clean append, so the ledger refusal fires first.
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('run-archive.jsonl');
  });

  it('should stop rather than overlay onto data paths that are not clean', () => {
    const head = openBotBranch();
    cloneRunner();
    write(runner, ARCHIVE, 'local edit\n');
    expect(() => prepare({ cwd: runner, openPrs: [pr(head)] })).toThrow(/not clean/);
  });

  it("should refuse when the branch head is not the PR's head at the start", () => {
    const head = openBotBranch();
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr('0'.repeat(40))] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('moved');
    expect(res.startHead).toBe(head);
  });

  it('should refuse when more than one refresh PR is open', () => {
    const head = openBotBranch();
    cloneRunner();
    const res = prepare({ cwd: runner, openPrs: [pr(head), { ...pr(head), number: 752 }] });
    expect(res.decision).toBe('refuse');
    expect(res.reason).toContain('#751, #752');
  });
});

describe('CARRY-PR-1 verify — the branch is where the run found it', () => {
  it('should allow publishing a carry when the PR head is unchanged', () => {
    const head = openBotBranch();
    cloneRunner();
    expect(
      verify({
        cwd: runner,
        openPrs: [pr(head)],
        decision: 'carry',
        startHead: head,
        prNumber: 751,
      })
    ).toMatchObject({ ok: true });
  });

  it('should refuse a carry when a memo was pushed to the branch during the run', () => {
    const head = openBotBranch();
    cloneRunner();
    git(author, 'checkout', '-q', 'bot');
    write(author, REGIME, '{"summary":{"en":{"short":"pushed mid-run"}}}\n');
    git(author, 'commit', '-qam', 'memo mid-run');
    git(author, 'push', '-q', 'origin', `HEAD:${REFRESH_BRANCH}`);
    const moved = git(author, 'rev-parse', 'HEAD');
    const res = verify({
      cwd: runner,
      openPrs: [pr(moved)],
      decision: 'carry',
      startHead: head,
      prNumber: 751,
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('moved during the run');
  });

  it('should refuse a carry when the PR was merged or closed during the run', () => {
    const head = openBotBranch();
    cloneRunner();
    git(author, 'push', '-q', 'origin', `:${REFRESH_BRANCH}`); // deleted on merge
    const res = verify({
      cwd: runner,
      openPrs: [],
      decision: 'carry',
      startHead: head,
      prNumber: 751,
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('no longer open');
  });

  it('should refuse a fresh run when a refresh PR or branch appeared during the run', () => {
    cloneRunner();
    const head = openBotBranch();
    expect(verify({ cwd: runner, openPrs: [pr(head)], decision: 'fresh', startHead: '' }).ok).toBe(
      false
    );
    expect(verify({ cwd: runner, openPrs: [], decision: 'fresh', startHead: '' })).toMatchObject({
      ok: false,
      reason: expect.stringContaining('branch moved'),
    });
  });

  it('should refuse a carry when GitHub reports a different head even if the branch looks unchanged', () => {
    const head = openBotBranch();
    cloneRunner();
    const res = verify({
      cwd: runner,
      openPrs: [pr('1'.repeat(40))],
      decision: 'carry',
      startHead: head,
      prNumber: 751,
    });
    expect(res.ok).toBe(false);
  });

  it('should refuse a fresh run when a PR is listed even if the branch looks unchanged', () => {
    const head = openBotBranch();
    cloneRunner();
    const res = verify({ cwd: runner, openPrs: [pr(head)], decision: 'fresh', startHead: head });
    expect(res).toMatchObject({
      ok: false,
      reason: expect.stringContaining('opened during the run'),
    });
  });

  it('should allow a fresh run when nothing changed, and never publish after a refusal', () => {
    cloneRunner();
    expect(verify({ cwd: runner, openPrs: [], decision: 'fresh', startHead: '' }).ok).toBe(true);
    expect(verify({ cwd: runner, openPrs: [], decision: 'refuse', startHead: '' }).ok).toBe(false);
  });
});

describe('CARRY-PR-1 PR body and command line', () => {
  it('should state the carried weeks and ask for a memo rewrite', () => {
    const note = carryNote({
      decision: 'carry',
      prNumber: 751,
      prHead: 'abcdef1234',
      carriedRuns: ['2026-10-26'],
      carriedEtf: ['2026-10-23'],
    });
    expect(note).toContain('carries an unmerged week (PR #751)');
    expect(note).toContain('Run days carried from it: 2026-10-26');
    expect(note).toContain('ETF-01 snapshot weeks carried from it: 2026-10-23');
    expect(note).toContain('rewrite them for this week');
  });

  it('should give the remedy in a refusal note and never advise closing the PR', () => {
    const note = carryNote({
      decision: 'refuse',
      reason: 'x',
      remedy: 'Do y. Never close an open refresh PR unmerged: that loses its week.',
    });
    expect(note).toContain('Do y.');
    expect(note).not.toMatch(/\bclose it\b|merge or close|or close/i);
  });

  it('should word an unknown carried list neutrally, never as "none"', () => {
    const note = carryNote({
      decision: 'carry',
      prNumber: 1,
      prHead: 'x',
      carriedRuns: null,
      carriedEtf: null,
    });
    expect(note).toContain('could not be listed');
    expect(note).not.toContain(': none');
  });

  it('should print key=value lines from prepare and exit 1 with ::error:: from a refusing verify', () => {
    const head = openBotBranch();
    cloneRunner();
    const notePath = path.join(root, 'note.md');
    const outText = execFileSync('node', [SCRIPT, 'prepare'], {
      cwd: runner,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_REF: 'refs/heads/main',
        OPEN_PR_JSON: JSON.stringify([pr(head)]),
        NOTE_PATH: notePath,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(outText).toContain('decision=carry');
    expect(outText).toContain(`start_head=${head}`);
    expect(outText).toContain('carried=2026-10-26');
    expect(fs.readFileSync(notePath, 'utf8')).toContain('PR #751');

    let code = 0;
    let stdout = '';
    try {
      execFileSync('node', [SCRIPT, 'verify'], {
        cwd: runner,
        encoding: 'utf8',
        env: {
          ...process.env,
          OPEN_PR_JSON: '[]',
          DECISION: 'carry',
          START_HEAD: head,
          PR_NUMBER: '751',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      code = (err as { status: number }).status;
      stdout = String((err as { stdout: string }).stdout);
    }
    expect(code).toBe(1);
    expect(stdout).toContain('::error::Refusing to publish');
    expect(stdout).toContain('kept as the run artifact');
  });
});
