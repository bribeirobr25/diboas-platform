/**
 * check-ledgers.mjs — before the weekly PR is opened, prove the run only
 * APPENDED whole rows to the append-only JSONL ledgers (2026-10-20).
 *
 * WHY. `appendJsonlLine` can fail part-way and leave a fragment of a row on
 * disk. The ETF leg is fail-open, so the core refresh carries on and
 * `create-pull-request` commits every changed file: without this check a
 * fragment would reach the weekly PR silently, and merging it would make it a
 * permanent line of a public append-only ledger. Removing it afterwards would
 * mean editing that ledger, which the 5.302 rules forbid.
 *
 * WHAT IT CHECKS, for every `*.jsonl` under `apps/web/data/market` against
 * `HEAD` (a file absent at `HEAD` counts as empty):
 *   * the file at `HEAD` is a byte prefix of the file now: nothing was
 *     rewritten, truncated or deleted;
 *   * every line the run added parses as a JSON object;
 *   * the added text ends with a newline (a fragment never does);
 *   * the first added row did not fuse with an old torn tail.
 *
 * A ledger listed in HEAD whose committed text cannot be read is an ERROR
 * (unverified), never a new file: only a ledger absent from the HEAD inventory
 * is compared with an empty baseline.
 *
 * WHAT IT DOES. It never edits a ledger. It writes `ok|damaged|error` to the
 * `--status` file and a plain note to the `--note` file; the workflow puts that
 * status in the PR title and the note in its body, and the owner decides. It
 * exits 0 for all three, so the week's other data still reaches review; an
 * `error` (git or the filesystem failing the check itself) is reported as
 * unverified, never as ok.
 *
 *   node apps/web/scripts/market-refresh/check-ledgers.mjs [--status <file>] [--note <file>]
 *
 * Both are written whole (never appended): the raw-append guard in
 * jsonlAppend.test.ts allows no exception, and none is needed.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './providers/inrepo.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';

const LEDGER_DIR = 'apps/web/data/market';

/**
 * Compare a ledger's committed text with its text now.
 *
 * @param {string} before — the file at HEAD ('' if absent)
 * @param {string} after — the file now ('' if absent)
 * @returns {{ok: boolean, rowsAdded: number, problems: string[]}}
 */
export function checkLedgerAppend(before, after) {
  if (after === before) return { ok: true, rowsAdded: 0, problems: [] };
  if (!after.startsWith(before)) {
    return {
      ok: false,
      rowsAdded: 0,
      problems: ['existing content was changed or removed (only appends are allowed)'],
    };
  }
  const problems = [];
  let added = after.slice(before.length);
  // An old torn tail (no final newline at HEAD) must be closed by a newline
  // before the first new row; otherwise that row fused with it.
  if (before.length > 0 && !before.endsWith('\n')) {
    if (!added.startsWith('\n')) {
      problems.push('the first new row was joined to an earlier incomplete line');
    }
    const nl = added.indexOf('\n');
    added = nl === -1 ? '' : added.slice(nl + 1);
  }
  const rows = added.split('\n');
  const tail = rows.pop(); // '' when the addition ends with a newline
  if (tail !== '') problems.push(`the file ends in a partial line: ${preview(tail)}`);
  let rowsAdded = 0;
  for (const row of rows) {
    if (row === '') continue;
    try {
      const value = JSON.parse(row);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      rowsAdded += 1;
    } catch {
      problems.push(`an added line is not a complete JSON row: ${preview(row)}`);
    }
  }
  return { ok: problems.length === 0, rowsAdded, problems };
}

function preview(text) {
  return JSON.stringify(text.length > 60 ? `${text.slice(0, 60)}…` : text);
}

/**
 * The committed text of a ledger the HEAD inventory LISTS. A failed read
 * throws: only a file proven absent from HEAD may be compared with an empty
 * baseline (2026-10-21, Codex audit: a catch-all here turned an unreadable
 * baseline into "a new ledger", and every existing row into a valid append).
 */
function headText(relPath) {
  return execFileSync('git', ['show', `HEAD:${relPath}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function ledgersAtHead() {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', LEDGER_DIR], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return out.split('\n').filter((p) => p.endsWith('.jsonl'));
}

function ledgersNow() {
  const found = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.jsonl')) found.push(path.relative(REPO_ROOT, p));
    }
  };
  walk(path.join(REPO_ROOT, LEDGER_DIR));
  return found;
}

/** Check every ledger; returns the report the CLI prints and records. */
export function checkAllLedgers() {
  const atHead = new Set(ledgersAtHead()); // throws when HEAD cannot be listed
  const files = [...new Set([...atHead, ...ledgersNow()])].sort();
  return files.map((rel) => {
    const abs = path.join(REPO_ROOT, rel);
    const now = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (now === null) {
      return { file: rel, ok: false, rowsAdded: 0, problems: ['the ledger was deleted'] };
    }
    const before = atHead.has(rel) ? headText(rel) : ''; // empty ONLY when absent from HEAD
    return { file: rel, ...checkLedgerAppend(before, now) };
  });
}

function main() {
  const arg = (flag) => {
    const at = process.argv.indexOf(flag);
    return at > -1 ? process.argv[at + 1] : null;
  };
  const notePath = arg('--note');
  const statusPath = arg('--status');
  let status;
  let lines;
  try {
    const report = checkAllLedgers();
    const bad = report.filter((r) => !r.ok);
    status = bad.length ? 'damaged' : 'ok';
    lines = report.map((r) =>
      r.ok
        ? `- \`${r.file}\`: ${r.rowsAdded} complete row(s) appended`
        : `- \`${r.file}\`: ${r.problems.join('; ')}`
    );
  } catch (err) {
    status = 'error';
    lines = [`- the check itself failed: ${String(err.message).split('\n')[0]}`];
  }
  const lead = {
    ok: [],
    damaged: [
      'This run did not only append complete rows to the append-only ledgers.',
      'Nothing was removed or repaired automatically. Do not merge as is: decide',
      'what to do with the affected ledger first.',
      '',
    ],
    // A failed check proves nothing either way: say so, never "damaged".
    error: [
      'The ledger check could not be completed, so the integrity of the append-only',
      'ledgers is UNVERIFIED: no damage was found, and none was ruled out. Do not',
      'merge as is: have the ledgers checked first.',
      '',
    ],
  }[status];
  const note = [...lead, ...lines].join('\n');
  console.log(`[ledgers] status=${status}\n${note}`);
  if (statusPath) fs.writeFileSync(statusPath, `${status}\n`);
  if (notePath) fs.writeFileSync(notePath, `${note}\n`);
}

if (isDirectInvocation(import.meta.url)) main();
