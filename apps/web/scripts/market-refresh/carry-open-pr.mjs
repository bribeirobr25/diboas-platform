/**
 * carry-open-pr.mjs — never lose an unmerged week (C1a, 5.632; plan rev 5 §6,
 * founder-approved 2026-10-21).
 *
 * WHY. `create-pull-request` rebuilds `editorial/market-refresh-auto` from
 * `main` on every run. Until now a run refused to start while the previous
 * refresh PR was open (5.464), so one unmerged week cost the next week's run,
 * its ETF collection included. Design P: check out `main`, lay the files the
 * open PR changed in the DATA paths on top, run, and publish. The PR then
 * carries both weeks, and the founder's memo edits ride along because the memo
 * lives in `regime.json`.
 *
 * It refuses, naming the reason and the remedy, when carrying would lose or
 * misstate something:
 *   1. `main` changed, since the PR's merge base, a data file the PR also
 *      changed (laying the PR's copy on top would revert main's change). A main
 *      change to a data file the PR does not touch is kept and carried;
 *   2. the PR branch changed anything outside the data paths, renames included
 *      (the rebuild would drop it: the 5.464 harm);
 *   3. the PR head moved during the run (a memo pushed, or the PR merged), so
 *      what was carried is no longer what is on the branch (`verify`);
 *   4. a ledger on the PR branch is not a clean append of the merge base (the
 *      LEDGER CHECK FAILED case, decided from the ledgers themselves, so it
 *      clears once the fix is on the branch, whatever the PR's title says);
 *   plus: more than one refresh PR open, and a run started from a ref other
 *   than `main`. PRs from forks are ignored (the repo is public).
 * The workflow acts on a refusal only AFTER the ETF leg, so that week's
 * collection is kept as the run artifact (ETF-WEEK-KEEP-1). No remedy ever
 * says to close the PR unmerged: that loses its week.
 *
 *   GITHUB_REF=refs/heads/main \
 *   OPEN_PR_JSON='[{"number":1,"url":"…","title":"…","headRefOid":"…","isCrossRepository":false}]' \
 *   NOTE_PATH="$RUNNER_TEMP/carry-note.md" \
 *     node apps/web/scripts/market-refresh/carry-open-pr.mjs prepare >> "$GITHUB_OUTPUT"
 *
 *   OPEN_PR_JSON=… DECISION=carry|fresh START_HEAD=<sha or empty> PR_NUMBER=<n> \
 *     node apps/web/scripts/market-refresh/carry-open-pr.mjs verify
 *
 * `prepare` prints `key=value` lines (decision, reason, remedy, start_head,
 * pr_number, pr_url, pr_head, carried) and exits 0 for every decision, refusal
 * included. It exits 1 only when it cannot tell (git failed): fail-closed,
 * before the ETF leg, the position the 5.464 guard held. `verify` exits 1 on a
 * refusal, with `::error::` lines stating the reason and the remedy.
 *
 * Git reads go through `origin` anonymously (the checkout keeps no credentials),
 * which works because the repository is public; a private repository would need
 * the token passed to these calls.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { checkLedgerAppend } from './check-ledgers.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';

export const REFRESH_BRANCH = 'editorial/market-refresh-auto';
export const MAIN_REF = 'refs/heads/main';

/** The only paths the weekly run writes (and so the only ones it may carry). */
export const DATA_PATHS = ['apps/web/data/market', 'apps/web/src/lib/market-data/data'];

const RUN_ARCHIVE = 'apps/web/data/market/shared/run-archive.jsonl';
const ETF_LEDGER = 'apps/web/data/market/shared/etf-shares-weekly.jsonl';
const NEVER_CLOSE = 'Never close an open refresh PR unmerged: that loses its week.';

const isDataPath = (p) => DATA_PATHS.some((d) => p === d || p.startsWith(`${d}/`));

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
}

const names = (out) => out.split('\0').filter(Boolean);
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ');

/** The refresh branch's head on the remote, or '' when the branch does not exist. */
export function remoteHead(cwd, remote = 'origin') {
  const out = git(cwd, ['ls-remote', '--heads', remote, `refs/heads/${REFRESH_BRANCH}`]).trim();
  return out ? out.split(/\s+/)[0] : '';
}

/**
 * Parse `gh pr list --json number,url,title,headRefOid,isCrossRepository`.
 * Anything but an array is an error. PRs from forks are dropped: anyone can open
 * one from a branch with this name, and none of them is the bot's.
 */
export function parseOpenPrs(json) {
  const list = JSON.parse(json || '[]');
  if (!Array.isArray(list)) throw new Error('OPEN_PR_JSON is not a JSON array');
  return list.filter((p) => p?.isCrossRepository !== true);
}

/** A file's text at a commit; `null` when it does not exist there. Errors propagate. */
function showAt(cwd, ref, file) {
  const listed = git(cwd, ['ls-tree', '--name-only', ref, '--', file]).trim();
  if (!listed) return null;
  return git(cwd, ['show', `${ref}:${file}`]);
}

/** JSONL rows present at `to` and not at `from`; `null` when that cannot be told. */
function addedRows(cwd, file, from, to) {
  let before;
  let after;
  try {
    before = showAt(cwd, from, file) ?? '';
    after = showAt(cwd, to, file) ?? '';
  } catch {
    return null; // unreadable: unknown, never "none"
  }
  if (!after.startsWith(before)) return null; // not append-only: unknown
  return after
    .slice(before.length)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    });
}

/**
 * @typedef {{
 *   decision: 'fresh' | 'carry' | 'refuse',
 *   reason: string,
 *   remedy?: string,
 *   startHead?: string,
 *   prNumber?: number,
 *   prUrl?: string,
 *   prHead?: string,
 *   carriedFiles?: string[],
 *   carriedRuns?: string[] | null,
 *   carriedEtf?: string[] | null,
 * }} CarryDecision
 */

/** @returns {CarryDecision} */
const refuse = (reason, remedy, extra = {}) => ({
  decision: 'refuse',
  reason,
  remedy: `${remedy} ${NEVER_CLOSE}`,
  ...extra,
});

/**
 * Decide, and on `carry` lay the PR's changed data files onto the working tree.
 * @param {{ cwd: string, openPrs: any[], ref?: string, remote?: string }} io
 * @returns {CarryDecision}
 */
export function prepare({ cwd, openPrs, ref = MAIN_REF, remote = 'origin' }) {
  const startHead = remoteHead(cwd, remote);
  if (ref !== MAIN_REF) {
    return refuse(
      `the run started from ${ref || 'an unknown ref'}, not main: a refresh publishes main plus its data`,
      'Dispatch the workflow from main.',
      { startHead }
    );
  }
  if (openPrs.length === 0) {
    return { decision: 'fresh', reason: 'no refresh PR is open', startHead };
  }
  if (openPrs.length > 1) {
    return refuse(
      `more than one refresh PR is open (${openPrs.map((p) => `#${p.number}`).join(', ')})`,
      'Keep one refresh PR: merge the older one (rewrite its memo if required).',
      { startHead }
    );
  }
  const pr = openPrs[0];
  const ids = { startHead, prNumber: pr.number, prUrl: pr.url, prHead: pr.headRefOid };
  if (startHead !== pr.headRefOid) {
    return refuse(
      `the refresh branch head (${startHead || 'none'}) is not the open PR #${pr.number}'s head (${pr.headRefOid}): the branch moved while this run started`,
      'Run again (the Tuesday attempt or a manual dispatch from main).',
      ids
    );
  }

  git(cwd, [
    'fetch',
    '--no-tags',
    remote,
    `+refs/heads/${REFRESH_BRANCH}:refs/remotes/${remote}/${REFRESH_BRANCH}`,
  ]);
  const prHead = pr.headRefOid;
  const base = git(cwd, ['merge-base', 'HEAD', prHead]).trim();

  // --no-renames: a rename is a deletion plus an addition, so a file moved from
  // code into a data path still shows its code-side deletion here.
  const outside = names(
    git(cwd, ['diff', '--no-renames', '--name-only', '-z', base, prHead])
  ).filter((p) => !isDataPath(p));
  if (outside.length) {
    return refuse(
      `the open refresh PR #${pr.number} changes files outside the data paths, which a rebuild would drop: ${outside.join(', ')}`,
      'Move that change off the refresh branch into its own PR.',
      ids
    );
  }
  const prChanged = names(
    git(cwd, ['diff', '--no-renames', '--name-only', '-z', base, prHead, '--', ...DATA_PATHS])
  );
  const mainChanged = new Set(
    names(
      git(cwd, ['diff', '--no-renames', '--name-only', '-z', base, 'HEAD', '--', ...DATA_PATHS])
    )
  );
  const overlap = prChanged.filter((p) => mainChanged.has(p));
  if (overlap.length) {
    return refuse(
      `main changed data files since the open refresh PR #${pr.number} was opened, and that PR changes them too: ${overlap.join(', ')}`,
      'Update the refresh branch from main (GitHub: "Update branch"), so it holds main\'s change; the next run then carries it.',
      ids
    );
  }
  for (const file of prChanged.filter((p) => p.endsWith('.jsonl'))) {
    const check = checkLedgerAppend(showAt(cwd, base, file) ?? '', showAt(cwd, prHead, file) ?? '');
    if (!check.ok) {
      return refuse(
        `the open refresh PR #${pr.number}'s ledger ${file} is not a clean append (${check.problems[0]})`,
        'Fix the ledger on the refresh branch (market-editorial.md, "LEDGER CHECK FAILED"); the next run then carries it.',
        ids
      );
    }
  }

  const dirty = git(cwd, ['status', '--porcelain', '--', ...DATA_PATHS]).trim();
  if (dirty) throw new Error(`the data paths are not clean before the carry:\n${dirty}`);
  if (prChanged.length)
    git(cwd, ['restore', `--source=${prHead}`, '--worktree', '--', ...prChanged]);

  const runs = addedRows(cwd, RUN_ARCHIVE, base, prHead);
  const etf = addedRows(cwd, ETF_LEDGER, base, prHead);
  const day = (iso) => (typeof iso === 'string' ? iso.slice(0, 10) : 'unknown');
  return {
    decision: 'carry',
    reason: `carrying the open refresh PR #${pr.number}`,
    ...ids,
    carriedFiles: prChanged,
    carriedRuns: runs === null ? null : runs.map((r) => day(r?.run_at)),
    carriedEtf: etf === null ? null : etf.map((r) => (r?.anchor ? String(r.anchor) : 'unknown')),
  };
}

/** The PR-body section for a carry or a refusal. Neutral where a state is unknown. */
export function carryNote(res) {
  if (res.decision === 'carry') {
    const list = (v) =>
      v === null || v === undefined
        ? 'could not be listed (that ledger on the PR branch is not a plain append of main)'
        : v.length
          ? v.join(', ')
          : 'none';
    return [
      `## This PR carries an unmerged week (PR #${res.prNumber})`,
      '',
      `The previous refresh was still open, so this run started from \`main\` with the data files that PR changed laid on top (head \`${String(res.prHead).slice(0, 8)}\`). Nothing was dropped: the branch changed only data paths, and no file it changed was also changed on \`main\`.`,
      '',
      `- Run days carried from it: ${list(res.carriedRuns)}`,
      `- ETF-01 snapshot weeks carried from it: ${list(res.carriedEtf)}`,
      '- The memo fields were carried as they stood on that branch. They describe the earlier week: review and rewrite them for this week before merging.',
    ].join('\n');
  }
  if (res.decision === 'refuse') {
    return [
      '## The run refused to publish',
      '',
      `${res.reason}.`,
      '',
      res.remedy ?? NEVER_CLOSE,
      '',
      "This week's ETF-01 collection, if any, is kept as the run artifact.",
    ].join('\n');
  }
  return '';
}

/**
 * Just before publishing: the branch must be exactly where `prepare` found it.
 * @param {{ cwd: string, openPrs: any[], decision: string, startHead: string, prNumber?: string|number, remote?: string }} io
 */
export function verify({ cwd, openPrs, decision, startHead, prNumber, remote = 'origin' }) {
  const head = remoteHead(cwd, remote);
  if (decision === 'carry') {
    const pr = openPrs.find((p) => String(p.number) === String(prNumber));
    if (!pr) {
      return {
        ok: false,
        reason: `the carried PR #${prNumber} is no longer open (merged or closed during the run)`,
      };
    }
    if (head !== startHead || pr.headRefOid !== startHead) {
      return {
        ok: false,
        reason: `the carried PR #${prNumber}'s head moved during the run (${startHead.slice(0, 8)} → ${(head || 'none').slice(0, 8)}): publishing would overwrite what was pushed`,
      };
    }
    return { ok: true, reason: `PR #${prNumber} unchanged since the carry` };
  }
  if (decision === 'fresh') {
    if (openPrs.length) {
      return {
        ok: false,
        reason: `a refresh PR (#${openPrs[0].number}) was opened during the run`,
      };
    }
    if (head !== startHead) {
      return {
        ok: false,
        reason: `the refresh branch moved during the run (${startHead || 'none'} → ${head || 'none'})`,
      };
    }
    return { ok: true, reason: 'no refresh PR open and the branch unchanged' };
  }
  return { ok: false, reason: `nothing to publish after the decision "${decision}"` };
}

const out = (k, v) => `${k}=${oneLine(v)}`;

if (isDirectInvocation(import.meta.url)) {
  const cwd = process.cwd();
  const openPrs = parseOpenPrs(process.env.OPEN_PR_JSON);
  const cmd = process.argv[2];
  if (cmd === 'prepare') {
    const res = prepare({ cwd, openPrs, ref: process.env.GITHUB_REF ?? '' });
    const lines = [
      out('decision', res.decision),
      out('reason', res.reason),
      out('remedy', res.remedy),
      out('start_head', res.startHead),
      out('pr_number', res.prNumber),
      out('pr_url', res.prUrl),
      out('pr_head', res.prHead),
      out(
        'carried',
        res.carriedRuns === undefined ? '' : (res.carriedRuns ?? ['unknown']).join(',')
      ),
    ];
    console.log(lines.join('\n'));
    if (process.env.NOTE_PATH) fs.writeFileSync(process.env.NOTE_PATH, carryNote(res));
    console.error(oneLine(`${res.decision}: ${res.reason}`));
  } else if (cmd === 'verify') {
    const res = verify({
      cwd,
      openPrs,
      decision: process.env.DECISION ?? '',
      startHead: process.env.START_HEAD ?? '',
      prNumber: process.env.PR_NUMBER,
    });
    if (!res.ok) {
      console.log(`::error::Refusing to publish: ${oneLine(res.reason)}.`);
      console.log(
        `::error::This week's ETF-01 collection, if any, is kept as the run artifact. Remedy: review the refresh PR as it now stands and run again (the Tuesday attempt or a manual dispatch from main). ${NEVER_CLOSE}`
      );
      process.exit(1);
    }
    console.log(`Publish check: ${res.reason}.`);
  } else {
    console.error('usage: carry-open-pr.mjs prepare|verify');
    process.exit(2);
  }
}
