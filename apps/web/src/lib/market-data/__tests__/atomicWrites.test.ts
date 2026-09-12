/**
 * Pipeline writes must never be observed half-written (PENDING_ALL 5.302).
 *
 * Every market write site used a bare `fs.writeFileSync`, which truncates the
 * target and then streams the new bytes. A crash mid-write leaves a TRUNCATED
 * file — for `computed.json` not even valid JSON — and the failure surfaces on
 * the NEXT weekly run, a week later, when nobody is watching.
 *
 * The failure paths below are exercised for real, not asserted about. R-13:
 * a rollback that has never run does not exist.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  writeFileAtomic,
  writeJsonAtomic,
} from '../../../../scripts/market-refresh/lib/atomic.mjs';
import { readArchiveRows, runDayIndex } from '../../../../scripts/market-refresh/lib/archive.mjs';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-'));
});
afterEach(() => {
  try {
    fs.chmodSync(dir, 0o755);
  } catch {
    /* already writable */
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

const temps = () => fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'));

describe('writeFileAtomic — the happy path', () => {
  it('should write the exact bytes and leave no temp file behind', () => {
    const p = path.join(dir, 'computed.json');
    writeFileAtomic(p, '{"score":13}\n');
    expect(fs.readFileSync(p, 'utf8')).toBe('{"score":13}\n');
    expect(temps()).toEqual([]);
  });

  it('should replace existing content wholesale, never merge into it', () => {
    const p = path.join(dir, 'computed.json');
    fs.writeFileSync(p, 'x'.repeat(5000));
    writeFileAtomic(p, 'short\n');
    expect(fs.readFileSync(p, 'utf8')).toBe('short\n');
  });

  it('should stage the temp file in the TARGET directory, not os.tmpdir()', () => {
    // rename(2) across filesystems is not atomic — it throws EXDEV. A temp in
    // os.tmpdir() is very often a different mount, which is how the naive
    // version of this helper breaks on exactly the machines it matters on.
    const p = path.join(dir, 'computed.json');
    const seen: string[] = [];
    const realOpen = fs.openSync;
    (fs as { openSync: typeof fs.openSync }).openSync = ((f: string, ...rest: unknown[]) => {
      seen.push(String(f));
      return (realOpen as (...a: unknown[]) => number)(f, ...rest);
    }) as typeof fs.openSync;
    try {
      writeFileAtomic(p, 'ok\n');
    } finally {
      (fs as { openSync: typeof fs.openSync }).openSync = realOpen;
    }
    expect(seen.length).toBeGreaterThan(0);
    expect(path.dirname(seen[0])).toBe(path.dirname(p));
  });
});

describe('writeFileAtomic — the failure paths, actually executed', () => {
  it('should leave the ORIGINAL file intact when the write cannot start', () => {
    const p = path.join(dir, 'computed.json');
    fs.writeFileSync(p, '{"score":13}\n');
    fs.chmodSync(dir, 0o555); // no new files may be created here

    expect(() => writeFileAtomic(p, '{"score":99}\n')).toThrow();

    fs.chmodSync(dir, 0o755);
    // The old run is still fully readable — this is the whole point.
    expect(fs.readFileSync(p, 'utf8')).toBe('{"score":13}\n');
    expect(JSON.parse(fs.readFileSync(p, 'utf8')).score).toBe(13);
    expect(temps()).toEqual([]);
  });

  it('should clean up the temp file when the RENAME fails', () => {
    // The interesting half: the temp is fully written and fsynced, and the
    // commit is what fails. Without the catch, a .tmp would be left in a data
    // directory forever. Renaming onto a non-empty directory fails reliably.
    const target = path.join(dir, 'occupied');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'child'), 'keep me');

    expect(() => writeFileAtomic(target, 'nope\n')).toThrow();

    expect(fs.existsSync(path.join(target, 'child'))).toBe(true);
    expect(temps()).toEqual([]);
  });

  it('should propagate the original error, not a cleanup error', () => {
    const p = path.join(dir, 'computed.json');
    fs.chmodSync(dir, 0o555);
    let err: NodeJS.ErrnoException | undefined;
    try {
      writeFileAtomic(p, 'x');
    } catch (e) {
      err = e as NodeJS.ErrnoException;
    } finally {
      fs.chmodSync(dir, 0o755);
    }
    // EACCES from the open — not ENOENT from the unlink that follows it.
    expect(err?.code).toBe('EACCES');
  });
});

describe('writeJsonAtomic', () => {
  it('should write pretty JSON with the trailing newline the repo uses', () => {
    const p = path.join(dir, 'prices.json');
    writeJsonAtomic(p, { a: 1 });
    expect(fs.readFileSync(p, 'utf8')).toBe('{\n  "a": 1\n}\n');
  });
});

describe('readArchiveRows / runDayIndex — one rule, three former copies', () => {
  const line = (runAt: string, score: number) =>
    JSON.stringify({ run_at: runAt, computed: { score }, signals: [] });

  it('should skip a truncated final line instead of throwing', () => {
    // The archive is appended to by a job that can be killed mid-write. A
    // half-written tail must not take the next run down.
    const text = [line('2026-09-01T06:00:00Z', 10), '{"run_at":"2026-09-0'].join('\n');
    expect(() => readArchiveRows(text)).not.toThrow();
    expect(readArchiveRows(text)).toHaveLength(1);
  });

  it('should let the LATER line win for a repeated run day', () => {
    // A same-day re-run is a correction; the most recent one stands.
    const text = [line('2026-09-07T06:00:00Z', 10), line('2026-09-07T18:00:00Z', 13)].join('\n');
    const idx = runDayIndex(readArchiveRows(text));
    expect(idx.size).toBe(1);
    expect(idx.get('2026-09-07')?.computed.score).toBe(13);
  });

  it('should count run DAYS, not archive lines (5.127)', () => {
    const text = [
      line('2026-09-01T06:00:00Z', 8),
      line('2026-09-07T06:00:00Z', 10),
      line('2026-09-07T18:00:00Z', 13),
    ].join('\n');
    expect(readArchiveRows(text)).toHaveLength(3);
    expect(runDayIndex(readArchiveRows(text)).size).toBe(2);
  });

  it('should tolerate a row with no run_at rather than counting it as a day', () => {
    // The 2026-07-11 first line predates several fields.
    const text = [JSON.stringify({ signals: [] }), line('2026-09-07T06:00:00Z', 13)].join('\n');
    expect(runDayIndex(readArchiveRows(text)).size).toBe(1);
  });

  it('should return nothing for an absent archive', () => {
    expect(readArchiveRows('')).toEqual([]);
    expect(runDayIndex([]).size).toBe(0);
  });

  it('should agree with the committed ledger: 12 lines, 10 run days', () => {
    const text = fs.readFileSync(
      path.join(__dirname, '../../../../data/market/shared/run-archive.jsonl'),
      'utf8'
    );
    const rows = readArchiveRows(text);
    expect(rows.length).toBeGreaterThan(runDayIndex(rows).size); // same-day doubles exist
    expect(runDayIndex(rows).size).toBe(10);
  });
});

describe('no writer may go back to a bare writeFileSync (structural)', () => {
  const SCRIPTS = path.join(__dirname, '../../../../scripts');
  it.each([
    'market-refresh/run.mjs',
    'market-refresh/generate.mjs',
    'market-refresh/tools-monthlies.mjs',
    'market-refresh/providers/inrepo.mjs',
  ])('%s should publish through the atomic helper', (rel) => {
    const src = fs.readFileSync(path.join(SCRIPTS, rel), 'utf8');
    expect(src, `${rel} still calls fs.writeFileSync directly`).not.toMatch(/fs\.writeFileSync\(/);
    expect(src, `${rel} does not use the atomic helper`).toMatch(/write(File|Json)Atomic\(/);
  });
});
