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
 * WHAT IT CHECKS, for every `*.jsonl` in the pipeline's shared data folder
 * against `HEAD` of the checked-out ref (`main` for the scheduled run; a file
 * absent at `HEAD` counts as empty):
 *   * the run archive and the ETF ledger are present at `HEAD` (otherwise the
 *     check is looking in the wrong place and reports `error`);
 *   * the file at `HEAD` is a BYTE prefix of the file now (compared before any
 *     decoding): nothing was rewritten, truncated or deleted;
 *   * the added bytes are valid UTF-8;
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
import { REPO_ROOT, RUN_ARCHIVE_PATH, SHARED_DIR } from './providers/inrepo.mjs';
import { ETF_SHARES_ARCHIVE } from './lib/etf-flows.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';

/**
 * Where the ledgers live, and which must exist, come from the pipeline's own
 * constants (2026-10-21 review gate): a hand-typed folder that drifted from
 * the pipeline would make the check find nothing and report "ok".
 */
const LEDGER_DIR = path.relative(REPO_ROOT, SHARED_DIR);
const REQUIRED_LEDGERS = [ETF_SHARES_ARCHIVE, RUN_ARCHIVE_PATH].map((p) =>
  path.relative(REPO_ROOT, p)
);
const utf8 = new TextDecoder('utf-8', { fatal: true });

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
function headBytes(relPath) {
  return execFileSync('git', ['show', `HEAD:${relPath}`], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** The ledgers in HEAD; `-z` keeps non-ASCII names unquoted and unescaped. */
function ledgersAtHead() {
  const out = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD', LEDGER_DIR], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return out.split('\0').filter((p) => p.endsWith('.jsonl'));
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
  // A required ledger missing from HEAD means the check is not looking where
  // the pipeline writes: that is unverified, never "nothing to check".
  const absent = REQUIRED_LEDGERS.filter((rel) => !atHead.has(rel));
  if (absent.length) throw new Error(`required ledger(s) not found at HEAD: ${absent.join(', ')}`);
  const files = [...new Set([...atHead, ...ledgersNow()])].sort();
  return files.map((rel) => {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) {
      return { file: rel, ok: false, rowsAdded: 0, problems: ['the ledger was deleted'] };
    }
    // Bytes first: decoding before comparing would turn every invalid byte
    // into the same replacement character and hide a rewrite.
    const now = fs.readFileSync(abs);
    const before = atHead.has(rel) ? headBytes(rel) : Buffer.alloc(0); // empty ONLY when absent from HEAD
    if (now.length < before.length || !now.subarray(0, before.length).equals(before)) {
      return {
        file: rel,
        ok: false,
        rowsAdded: 0,
        problems: ['existing content was changed or removed (only appends are allowed)'],
      };
    }
    let added;
    try {
      added = utf8.decode(now.subarray(before.length));
    } catch {
      return {
        file: rel,
        ok: false,
        rowsAdded: 0,
        problems: ['the added bytes are not valid UTF-8'],
      };
    }
    // The prefix is byte-identical, so the text comparison sees only the addition.
    const head = before.toString('latin1');
    return { file: rel, ...checkLedgerAppend(head, head + added) };
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
