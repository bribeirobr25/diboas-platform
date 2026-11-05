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
 *   checks/<run start, UTC>.json                    every cross-source comparison
 *                                                   of one run (20261104T231117Z)
 *   revisions.jsonl                                 any stored day a later fetch
 *                                                   disagreed with, logged once
 *
 * APPEND-ONLY. A stored day is never rewritten. If a later fetch returns a
 * different value for a day already stored, the difference is written to
 * `revisions.jsonl` and the stored value stays. For a series marked
 * `revisable` (M2, which the Fed revises) the revision is accepted as the new
 * value AND logged, because the published figure IS the revised one; for
 * every other series a revision stops the update so a person looks at it
 * (a split, a corrected print, or a source fault are all possible). The person
 * resolves it in `checks/accepted-exceptions.json` with `kind: "revision"`,
 * `decision: "keep"`, the stored and fetched values and a reason: the stored
 * value stays and the series moves on. There is no "take" decision: replacing
 * a stored day is a reviewed change to the data, made outside the collector.
 *
 * Nothing here decides whether a series may be written: `plan*` compute,
 * `write*` write, and collect.mjs writes only after every check has passed.
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

/**
 * Two stored values are the same when they differ by float noise only,
 * relative to the larger of the two. Zero is a real value for an interest
 * rate (TR was 0 for months; German deposit rates touched 0 in 2020): 0
 * against 0 is the same value, never a division by zero (2026-11-05).
 */
export const sameValue = (a, b) =>
  a === b || Math.abs(a - b) <= SAME_VALUE * Math.max(Math.abs(a), Math.abs(b));

export function createStore(root) {
  const p = (...xs) => path.join(root, ...xs);
  const mkdir = (f) => fs.mkdirSync(path.dirname(f), { recursive: true });

  /** Keep one response body exactly as received (`bytes` is the raw Buffer). */
  function saveRaw({ provider, series, url, status, bytes, fetchedAt, ext }) {
    const stamp = fetchedAt.replace(/[:.]/g, '-');
    const rel = path.join(
      'raw',
      provider,
      series,
      `${stamp}-${crypto.randomUUID().slice(0, 8)}.${ext}.gz`
    );
    const file = p(rel);
    mkdir(file);
    const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(String(bytes ?? ''), 'utf8');
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

  function readEvents(series) {
    return readCsv(p('events', `${series}.distributions.csv`));
  }

  /**
   * Plan a merge of freshly fetched rows into a series; writes NOTHING (the
   * caller writes only once every check for the series has passed).
   * `keep` holds dates whose changed value a reviewed exception resolved by
   * keeping the stored value. Returns the full planned series.
   */
  function planDaily(series, rows, { source, revisable = false, runAt, keep = new Set() }) {
    const stored = readDaily(series);
    const byDate = new Map(stored.map((r) => [r.date, r]));
    let added = 0;
    const revisions = [];
    for (const r of rows) {
      const old = byDate.get(r.date);
      if (!old) {
        byDate.set(r.date, {
          date: r.date,
          open: r.open ?? '',
          high: r.high ?? '',
          low: r.low ?? '',
          close: r.close,
          source,
        });
        added += 1;
        continue;
      }
      const a = Number(old.close);
      if (sameValue(r.close, a)) continue;
      const resolved = keep.has(r.date);
      revisions.push({
        series,
        date: r.date,
        stored: a,
        fetched: r.close,
        source,
        detected_at: runAt,
        accepted: revisable,
        kept_by_review: resolved,
      });
      if (revisable && !resolved) byDate.set(r.date, { ...old, close: r.close, source });
    }
    const blocked = revisions.some((x) => !x.accepted && !x.kept_by_review);
    return { all: sortByDate([...byDate.values()]), added, revisions, blocked };
  }

  /** Distributions plan like days: a stored ex-date's amount never changes. Writes nothing. */
  function planEvents(series, events, { runAt }) {
    const byDate = new Map(readEvents(series).map((r) => [r.date, r]));
    let added = 0;
    const revisions = [];
    for (const e of events) {
      const old = byDate.get(e.date);
      if (!old) {
        byDate.set(e.date, { date: e.date, amount: e.amount, sources: e.sources.join('+') });
        added += 1;
      } else if (!sameValue(e.amount, Number(old.amount))) {
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
    return {
      all: sortByDate([...byDate.values()]),
      added,
      revisions,
      blocked: revisions.length > 0,
    };
  }

  /** Append revisions not already logged (the same change is detected again on every overlapping run). */
  function logRevisions(revisions) {
    if (!revisions.length) return 0;
    const file = p('revisions.jsonl');
    const key = (r) => `${r.series}|${r.date}|${r.stored}|${r.fetched}`;
    const seen = new Set(
      fs.existsSync(file)
        ? fs
            .readFileSync(file, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((l) => key(JSON.parse(l)))
        : []
    );
    let n = 0;
    for (const r of revisions) {
      if (seen.has(key(r))) continue;
      mkdir(file);
      appendJsonlLine(file, JSON.stringify(r));
      seen.add(key(r));
      n += 1;
    }
    return n;
  }

  function writeDaily(series, all) {
    const file = p('daily', `${series}.csv`);
    mkdir(file);
    writeFileAtomic(file, toCsv(all, PRICE_COLS));
  }

  function writeEvents(series, all) {
    const file = p('events', `${series}.distributions.csv`);
    mkdir(file);
    writeFileAtomic(file, toCsv(all, EVENT_COLS));
  }

  /** One report per run, named by its UTC start so the files sort in run order. */
  function writeChecks(runAt, report) {
    const name = `${runAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}.json`; // 20261104T231117Z.json
    const file = p('checks', name);
    mkdir(file);
    writeFileAtomic(file, `${JSON.stringify(report, null, 2)}\n`);
    return path.relative(root, file);
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
    readEvents,
    planDaily,
    planEvents,
    logRevisions,
    writeDaily,
    writeEvents,
    writeChecks,
    writeDerived,
  };
}

const sortByDate = (rows) => rows.sort((x, y) => x.date.localeCompare(y.date));

export function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const [head, ...lines] = text.trim().split('\n');
  // An existing file that reads as empty is damage, not "nothing stored yet":
  // treating it as empty would re-fetch from the start and skip every
  // revision check.
  if (!head) throw new Error(`STORE: ${file} exists but is empty`);
  const cols = head.split(',');
  return lines
    .filter(Boolean)
    .map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])));
}

export function toCsv(rows, cols) {
  return `${cols.join(',')}\n${rows.map((r) => cols.map((c) => r[c] ?? '').join(',')).join('\n')}\n`;
}
