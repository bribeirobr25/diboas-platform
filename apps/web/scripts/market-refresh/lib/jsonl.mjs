/**
 * jsonl.mjs — read an append-only ledger without letting its tail kill the run
 * (PENDING_ALL 5.302).
 *
 * The pipeline appends to two JSONL ledgers: `run-archive.jsonl` (provenance
 * for every published history point) and `etf-shares-weekly.jsonl` (the
 * warm-up ledger ETF-01's two points are scored from). Both are written by a
 * job that can be killed mid-append.
 *
 * They did not agree on what to do about that. The run archive skipped an
 * unparseable line — *"a truncated tail must not take the pipeline down"* —
 * while `readSnapshots` mapped `JSON.parse` over every line with no guard, so a
 * torn tail threw `SyntaxError: Unterminated string in JSON` out of the middle
 * of the weekly run. Proven by execution 2026-09-12, not by reading: appending
 * a partial line to a copy of the real ledger throws, where the same damage to
 * the run archive is absorbed.
 *
 * One rule, both ledgers. Skipping is the right behaviour rather than
 * repairing: the next run re-appends what it needs, and a reader must never
 * rewrite an append-only file it does not own.
 *
 * The WRITER half (2026-10-20, K01/N01): skipping alone was not enough. A row
 * appended straight after a torn tail (no final newline) fused with it into one
 * unparseable line, so the reader skipped the NEW, valid row as well. Every
 * pipeline append goes through `appendJsonlLine`, which starts a fresh line
 * first. It never edits or removes existing bytes, so a damaged row stays
 * exactly as it was (evidence), and it does not reconstruct it.
 */

import fs from 'node:fs';

/**
 * Parse JSONL, skipping blank lines and any line that does not parse.
 *
 * @param {string} text — raw file contents ('' if absent)
 * @returns {object[]} the rows that parsed, in file order
 */
export function readJsonlTolerant(text) {
  if (!text) return [];
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      continue; // torn tail, or a line some future writer mangled
    }
  }
  return rows;
}

/**
 * Append one JSONL row so that a torn tail cannot swallow it.
 *
 * If the file is non-empty and does not end in a newline (a killed append, or a
 * valid last row someone wrote without one), a newline is written before the
 * row, in the same write. Existing bytes are never changed. A missing file is
 * created. Any other failure (permissions, disk, a read error) is thrown to the
 * caller, so a failed write can never be reported as a success.
 *
 * A failed append can leave PART of the row on disk (2026-10-20): the error is
 * re-thrown with `partialAppend` = { path, bytesAdded }, where `bytesAdded` is
 * how much the file grew before the failure (0 = unchanged, null = its size
 * could not be read again). The caller reports it; nothing here truncates it,
 * because an append-only file is never edited, not even to undo our own bytes.
 *
 * Limits, stated rather than implied: this does not repair or recover a damaged
 * row, and it makes no durability (fsync/power-loss) or concurrent-writer claim.
 *
 * @param {string} filePath — the ledger (created if absent)
 * @param {string} text — one serialised row, with or without its trailing newline
 */
export function appendJsonlLine(filePath, text) {
  const line = text.endsWith('\n') ? text : `${text}\n`;
  let lead = '';
  let sizeBefore = 0;
  try {
    const { size } = fs.statSync(filePath);
    sizeBefore = size;
    if (size > 0) {
      const fd = fs.openSync(filePath, 'r');
      try {
        const last = Buffer.alloc(1);
        fs.readSync(fd, last, 0, 1, size - 1);
        if (last[0] !== 0x0a) lead = '\n';
      } finally {
        fs.closeSync(fd);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  try {
    fs.appendFileSync(filePath, lead + line);
  } catch (err) {
    err.partialAppend = { path: filePath, bytesAdded: bytesAddedSince(filePath, sizeBefore) };
    throw err;
  }
}

/** How much `filePath` grew past `sizeBefore`; null if its size cannot be read. */
function bytesAddedSince(filePath, sizeBefore) {
  try {
    return Math.max(0, fs.statSync(filePath).size - sizeBefore);
  } catch (err) {
    return err.code === 'ENOENT' && sizeBefore === 0 ? 0 : null;
  }
}
