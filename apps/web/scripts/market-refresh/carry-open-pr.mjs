/**
 * carry-open-pr.mjs — never lose an unmerged week (C1a, 5.632; plan rev 5 §6,
 * founder-approved 2026-10-21).
 *
 * WHY. `create-pull-request` rebuilds `editorial/market-refresh-auto` from
 * `main` on every run. Until now a run refused to start while the previous
 * refresh PR was open (5.464), so one unmerged week cost the next week's run,
 * its ETF collection included. Design P: check out `main`, lay the open PR's
 * DATA paths on top, run, and publish. The PR then carries both weeks, and the
 * founder's memo edits ride along because the memo lives in `regime.json`.
 *
 * It refuses, naming the reason, when carrying would lose or misstate something:
 *   1. `main` changed a data path since the PR's merge base (the overlay would
 *      silently revert it);
 *   2. the PR branch changed anything outside the data paths (the rebuild would
 *      drop it: the 5.464 harm);
 *   3. the PR head moved during the run (a memo pushed, or the PR merged), so
 *      what was carried is no longer what is on the branch (`verify`);
 *   4. the open PR is titled LEDGER CHECK FAILED: under the founder's rule it is
 *      not merged as is, and carrying it would carry the fragment.
 * The workflow acts on a refusal only AFTER the ETF leg, so that week's
 * collection is kept as the run artifact (ETF-WEEK-KEEP-1).
 *
 *   OPEN_PR_JSON='[{"number":1,"url":"…","title":"…","headRefOid":"…"}]' \
 *   NOTE_PATH="$RUNNER_TEMP/carry-note.md" \
 *     node apps/web/scripts/market-refresh/carry-open-pr.mjs prepare >> "$GITHUB_OUTPUT"
 *
 *   OPEN_PR_JSON=… DECISION=carry|fresh START_HEAD=<sha or empty> PR_NUMBER=<n> \
 *     node apps/web/scripts/market-refresh/carry-open-pr.mjs verify
 *
 * `prepare` prints `key=value` lines (decision, reason, start_head, pr_number,
 * pr_url, pr_head, carried) and exits 0 for every decision, refusal included.
 * It exits 1 only when it cannot tell (git failed): fail-closed, before the ETF
 * leg, which is the same position the 5.464 guard held. `verify` exits 1 on
 * a refusal, with `::error::` lines that state the reason and the remedy.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { isDirectInvocation } from './lib/invocation.mjs';

export const REFRESH_BRANCH = 'editorial/market-refresh-auto';

/** The only paths the weekly run writes (and so the only ones it may carry). */
export const DATA_PATHS = ['apps/web/data/market', 'apps/web/src/lib/market-data/data'];

const RUN_ARCHIVE = 'apps/web/data/market/shared/run-archive.jsonl';
const ETF_LEDGER = 'apps/web/data/market/shared/etf-shares-weekly.jsonl';
const LEDGER_FAILED = 'LEDGER CHECK FAILED';

const isDataPath = (p) => DATA_PATHS.some((d) => p === d || p.startsWith(`${d}/`));

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const names = (out) => out.split('\0').filter(Boolean);

/** The refresh branch's head on the remote, or '' when the branch does not exist. */
export function remoteHead(cwd, remote = 'origin') {
  const out = git(cwd, ['ls-remote', '--heads', remote, `refs/heads/${REFRESH_BRANCH}`]).trim();
  return out ? out.split(/\s+/)[0] : '';
}

/** Parse `gh pr list --json number,url,title,headRefOid`; anything else is an error. */
export function parseOpenPrs(json) {
  const list = JSON.parse(json || '[]');
  if (!Array.isArray(list)) throw new Error('OPEN_PR_JSON is not a JSON array');
  return list;
}

/** JSONL rows present at `to` and not at `from` (a ledger only ever grows). */
function addedRows(cwd, file, from, to) {
  const read = (ref) => {
    try {
      return git(cwd, ['show', `${ref}:${file}`]);
    } catch {
      return '';
    }
  };
  const before = read(from);
  const after = read(to);
  if (!after.startsWith(before)) return null; // not append-only: reported as unknown
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

/** @returns {CarryDecision} */
const refuse = (reason, extra = {}) => ({ decision: 'refuse', reason, ...extra });

/**
 * @typedef {{
 *   decision: 'fresh' | 'carry' | 'refuse',
 *   reason: string,
 *   startHead?: string,
 *   prNumber?: number,
 *   prUrl?: string,
 *   prHead?: string,
 *   carriedRuns?: string[] | null,
 *   carriedEtf?: string[] | null,
 * }} CarryDecision
 */

/**
 * Decide, and on `carry` lay the PR's data paths onto the working tree.
 * @param {{ cwd: string, openPrs: any[], remote?: string }} io
 * @returns {CarryDecision}
 */
export function prepare({ cwd, openPrs, remote = 'origin' }) {
  const startHead = remoteHead(cwd, remote);
  if (openPrs.length === 0) {
    return { decision: 'fresh', reason: 'no refresh PR is open', startHead };
  }
  if (openPrs.length > 1) {
    return refuse(
      `more than one refresh PR is open (${openPrs.map((p) => `#${p.number}`).join(', ')})`,
      { startHead }
    );
  }
  const pr = openPrs[0];
  const ids = { startHead, prNumber: pr.number, prUrl: pr.url, prHead: pr.headRefOid };
  if (String(pr.title).includes(LEDGER_FAILED)) {
    return refuse(
      `the open refresh PR #${pr.number} is titled ${LEDGER_FAILED}: it is not merged as is, so carrying it would carry the ledger problem`,
      ids
    );
  }
  if (startHead !== pr.headRefOid) {
    return refuse(
      `the refresh branch head (${startHead || 'none'}) is not the open PR #${pr.number}'s head (${pr.headRefOid}): it moved while this run started`,
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

  const outside = names(git(cwd, ['diff', '--name-only', '-z', base, prHead])).filter(
    (p) => !isDataPath(p)
  );
  if (outside.length) {
    return refuse(
      `the open refresh PR #${pr.number} changes files outside the data paths, which a rebuild would drop: ${outside.join(', ')}`,
      ids
    );
  }
  const mainMoved = names(
    git(cwd, ['diff', '--name-only', '-z', base, 'HEAD', '--', ...DATA_PATHS])
  );
  if (mainMoved.length) {
    return refuse(
      `main changed data the open refresh PR #${pr.number} also carries, since that PR was opened: ${mainMoved.join(', ')}`,
      ids
    );
  }

  const dirty = git(cwd, ['status', '--porcelain', '--', ...DATA_PATHS]).trim();
  if (dirty) throw new Error(`the data paths are not clean before the carry:\n${dirty}`);
  git(cwd, ['restore', `--source=${prHead}`, '--worktree', '--', ...DATA_PATHS]);

  const runs = addedRows(cwd, RUN_ARCHIVE, base, prHead);
  const etf = addedRows(cwd, ETF_LEDGER, base, prHead);
  const day = (iso) => (typeof iso === 'string' ? iso.slice(0, 10) : 'unknown');
  return {
    decision: 'carry',
    reason: `carrying the open refresh PR #${pr.number}`,
    ...ids,
    carriedRuns: runs === null ? null : runs.map((r) => day(r?.run_at)),
    carriedEtf: etf === null ? null : etf.map((r) => (r?.anchor ? String(r.anchor) : 'unknown')),
  };
}

/** The PR-body section for a carry or a refusal. Neutral where a state is unknown. */
export function carryNote(res) {
  if (res.decision === 'carry') {
    const runs =
      res.carriedRuns === null
        ? 'could not be listed (the run archive on that branch is not an append of main)'
        : res.carriedRuns.length
          ? res.carriedRuns.join(', ')
          : 'none';
    const etf =
      res.carriedEtf === null
        ? 'could not be listed'
        : res.carriedEtf.length
          ? res.carriedEtf.join(', ')
          : 'none';
    return [
      `## This PR carries an unmerged week (PR #${res.prNumber})`,
      '',
      `The previous refresh was still open, so this run started from \`main\` with that PR's data laid on top (head \`${String(res.prHead).slice(0, 8)}\`). Nothing was dropped: the branch changed only data paths.`,
      '',
      `- Run days carried from it: ${runs}`,
      `- ETF-01 snapshot weeks carried from it: ${etf}`,
      '- The memo fields were carried as they stood on that branch. They describe the earlier week: review and rewrite them for this week before merging.',
    ].join('\n');
  }
  if (res.decision === 'refuse') {
    return [
      '## The run refused to publish',
      '',
      `${res.reason}.`,
      '',
      "This week's ETF-01 collection, if any, is kept as the run artifact.",
    ].join('\n');
  }
  return '';
}

/**
 * Just before publishing: the branch must be exactly where `prepare` found it.
 * @param {{ cwd: string, openPrs: object[], decision: string, startHead: string, prNumber?: string|number, remote?: string }} io
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

const out = (k, v) => `${k}=${String(v ?? '').replace(/[\r\n]+/g, ' ')}`;

if (isDirectInvocation(import.meta.url)) {
  const cwd = process.cwd();
  const openPrs = parseOpenPrs(process.env.OPEN_PR_JSON);
  const cmd = process.argv[2];
  if (cmd === 'prepare') {
    const res = prepare({ cwd, openPrs });
    const lines = [
      out('decision', res.decision),
      out('reason', res.reason),
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
    console.error(`${res.decision}: ${res.reason}`);
  } else if (cmd === 'verify') {
    const res = verify({
      cwd,
      openPrs,
      decision: process.env.DECISION ?? '',
      startHead: process.env.START_HEAD ?? '',
      prNumber: process.env.PR_NUMBER,
    });
    if (!res.ok) {
      console.log(`::error::Refusing to publish: ${res.reason}.`);
      console.log(
        "::error::This week's ETF-01 collection, if any, is kept as the run artifact. Remedy: review the refresh PR as it now stands, merge or close it, then let the next scheduled run (or a manual dispatch) refresh."
      );
      process.exit(1);
    }
    console.log(`Publish check: ${res.reason}.`);
  } else {
    console.error('usage: carry-open-pr.mjs prepare|verify');
    process.exit(2);
  }
}
