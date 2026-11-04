/**
 * store.mjs — the market data store in the diboas-analytics repository
 * (founder decisions 2026-11-04: market data lives in that private repo,
 * daily data commits go to its `main` under `market/` only, append-only).
 *
 * Layout (relative to the store root, normally `<analytics checkout>/market`):
 *
 *   raw/<provider>/<series>/<fetched-at>.<ext>.gz   every response body, exactly
 *                                                   as received, gzipped
 *   raw/manifest.jsonl                              one row per request: url,
 *                                                   status, sha256, bytes, time
 *   daily/<series>.csv                              the stored values (primary
 *                                                   source), one row per day
 *   events/<series>.distributions.csv               ex-date, amount, sources
 *   checks/<run-date>.json                          every cross-source comparison
 *   revisions.jsonl                                 any stored day a later fetch
 *                                                   disagreed with
 *
 * APPEND-ONLY. A stored day is never rewritten. If a later fetch returns a
 * different value for a day already stored, the difference is written to
 * `revisions.jsonl` and the stored value stays. For a series marked
 * `revisable` (M2, which the Fed revises) the revision is accepted as the new
 * value AND logged, because the published figure IS the revised one; for
 * every other series a revision stops the update so a person looks at it
 * (a split, a corrected print, or a source fault are all possible).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { writeFileAtomic } from '../market-refresh/lib/atomic.mjs';
import { appendJsonlLine } from '../market-refresh/lib/jsonl.mjs';

const PRICE_COLS = ['date', 'open', 'high', 'low', 'close', 'source'];
const EVENT_COLS = ['date', 'amount', 'sources'];

/** Relative difference that counts as "the same value" (float noise only). */
export const SAME_VALUE = 1e-9;

export function createStore(root) {
  const p = (...xs) => path.join(root, ...xs);
  const mkdir = (f) => fs.mkdirSync(path.dirname(f), { recursive: true });

  function saveRaw({ provider, series, url, status, body, fetchedAt, ext }) {
    const stamp = fetchedAt.replace(/[:.]/g, '-');
    const rel = path.join(
      'raw',
      provider,
      series,
      `${stamp}-${crypto.randomUUID().slice(0, 8)}.${ext}.gz`
    );
    const file = p(rel);
    mkdir(file);
    const buf = Buffer.from(body ?? '', 'utf8');
    fs.writeFileSync(file, zlib.gzipSync(buf, { level: 9 }), { flag: 'wx' });
    const row = {
      fetched_at: fetchedAt,
      provider,
      series,
      url,
      status,
      bytes: buf.length,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      saved_as: rel,
    };
    mkdir(p('raw', 'manifest.jsonl'));
    appendJsonlLine(p('raw', 'manifest.jsonl'), JSON.stringify(row));
    return row;
  }

  function readDaily(series) {
    return readCsv(p('daily', `${series}.csv`));
  }

  /**
   * Merge freshly fetched rows into a series. Returns what happened; writes
   * only when nothing blocks. `rows` are already cut at the last complete day.
   */
  function mergeDaily(series, rows, { source, revisable = false, runAt }) {
    const file = p('daily', `${series}.csv`);
    const stored = readCsv(file);
    const byDate = new Map(stored.map((r) => [r.date, r]));
    const added = [];
    const revisions = [];
    for (const r of rows) {
      const old = byDate.get(r.date);
      if (!old) {
        const row = {
          date: r.date,
          open: r.open ?? '',
          high: r.high ?? '',
          low: r.low ?? '',
          close: r.close,
          source,
        };
        byDate.set(r.date, row);
        added.push(row);
        continue;
      }
      const a = Number(old.close);
      if (Math.abs(r.close / a - 1) > SAME_VALUE) {
        revisions.push({
          series,
          date: r.date,
          stored: a,
          fetched: r.close,
          source,
          detected_at: runAt,
          accepted: revisable,
        });
        if (revisable) byDate.set(r.date, { ...old, close: r.close, source });
      }
    }
    const blocked = revisions.some((x) => !x.accepted);
    for (const rev of revisions) {
      mkdir(p('revisions.jsonl'));
      appendJsonlLine(p('revisions.jsonl'), JSON.stringify(rev));
    }
    if (!blocked && (added.length || revisions.length)) {
      const all = [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date));
      mkdir(file);
      writeFileAtomic(file, toCsv(all, PRICE_COLS));
    }
    return { added: added.length, revisions, blocked, total: byDate.size };
  }

  function readEvents(series) {
    return readCsv(p('events', `${series}.distributions.csv`));
  }

  /** Distributions are merged like days: a stored ex-date's amount never changes. */
  function mergeEvents(series, events, { runAt }) {
    const file = p('events', `${series}.distributions.csv`);
    const stored = readCsv(file);
    const byDate = new Map(stored.map((r) => [r.date, r]));
    const revisions = [];
    let added = 0;
    for (const e of events) {
      const old = byDate.get(e.date);
      if (!old) {
        byDate.set(e.date, { date: e.date, amount: e.amount, sources: e.sources.join('+') });
        added += 1;
      } else if (Math.abs(e.amount / Number(old.amount) - 1) > SAME_VALUE) {
        revisions.push({
          series: `${series}.distributions`,
          date: e.date,
          stored: Number(old.amount),
          fetched: e.amount,
          source: e.sources.join('+'),
          detected_at: runAt,
          accepted: false,
        });
      }
    }
    for (const rev of revisions) appendJsonlLine(p('revisions.jsonl'), JSON.stringify(rev));
    const blocked = revisions.length > 0;
    if (!blocked && added) {
      mkdir(file);
      writeFileAtomic(
        file,
        toCsv(
          [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date)),
          EVENT_COLS
        )
      );
    }
    return { added, revisions, blocked, total: byDate.size };
  }

  function writeChecks(runDate, report) {
    const file = p('checks', `${runDate}.json`);
    mkdir(file);
    // A second run on the same day keeps both reports.
    const target = fs.existsSync(file) ? p('checks', `${runDate}-${Date.now()}.json`) : file;
    writeFileAtomic(target, `${JSON.stringify(report, null, 2)}\n`);
    return path.relative(root, target);
  }

  function writeDerived(rel, text) {
    const file = p('derived', rel);
    mkdir(file);
    writeFileAtomic(file, text);
  }

  return {
    root,
    saveRaw,
    readDaily,
    mergeDaily,
    readEvents,
    mergeEvents,
    writeChecks,
    writeDerived,
  };
}

export function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const [head, ...lines] = fs.readFileSync(file, 'utf8').trim().split('\n');
  if (!head) return [];
  const cols = head.split(',');
  return lines
    .filter(Boolean)
    .map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
}

export function toCsv(rows, cols) {
  return `${cols.join(',')}\n${rows.map((r) => cols.map((c) => r[c] ?? '').join(',')).join('\n')}\n`;
}
