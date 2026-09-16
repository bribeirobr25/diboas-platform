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
import {
  readArchiveRows,
  runDayIndex,
  publishRun,
} from '../../../../scripts/market-refresh/lib/archive.mjs';
import { readSnapshots } from '../../../../scripts/market-refresh/lib/etf-flows.mjs';

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

  it('should collapse the committed ledger by DAY, whatever size it has grown to', () => {
    // NO LITERAL COUNT. The first version asserted `toBe(10)` and the weekly
    // refresh appended day 11 on 2026-09-14, failing the blocking gate and
    // stopping that cycle from publishing. The ledger is append-only: any test
    // pinning its size is a dated claim about a growing file.
    //
    // The requirement is the collapse RULE, so the expectation is derived the
    // other way — from the same text, independently of `runDayIndex` — and the
    // two derivations must agree at any ledger size.
    const text = fs.readFileSync(
      path.join(__dirname, '../../../../data/market/shared/run-archive.jsonl'),
      'utf8'
    );
    const rows = readArchiveRows(text);
    const daysIndependently = new Set(
      text
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l).run_at?.slice(0, 10))
        .filter(Boolean)
    );
    expect(runDayIndex(rows).size).toBe(daysIndependently.size);
    // The 2026-07-11 same-day double is baked into an append-only file, so
    // lines strictly exceed days forever — a relationship, not a count.
    expect(rows.length).toBeGreaterThan(runDayIndex(rows).size);
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
    // Called directly OR injected — `run.mjs` passes `writeFile: writeFileAtomic`
    // into `publishRun` (5.328a), which is the same guarantee expressed
    // differently. The requirement is "the atomic helper does the writing", not
    // "the call appears at this exact syntax".
    expect(src, `${rel} does not use the atomic helper`).toMatch(
      /write(File|Json)Atomic\s*[(,]|:\s*write(File|Json)Atomic\b/
    );
  });
});

describe('both append-only ledgers survive a torn tail, not just one', () => {
  // The pipeline appends to run-archive.jsonl AND etf-shares-weekly.jsonl, and
  // only the first one tolerated a half-written last line. The second is the
  // ledger ETF-01's two points are scored from, so a torn tail there threw a
  // bare SyntaxError out of the middle of the weekly run.
  it('should skip a torn final line in the ETF shares ledger', () => {
    const real = path.join(__dirname, '../../../../data/market/shared/etf-shares-weekly.jsonl');
    const intact = fs.readFileSync(real, 'utf8');
    const torn = path.join(dir, 'etf-shares-weekly.jsonl');
    fs.writeFileSync(torn, `${intact}{"anchor":"2026-09-1`);

    const rows = readSnapshots(torn);
    expect(rows).toHaveLength(readSnapshots(real).length);
    expect(rows.every((r: { anchor?: string }) => typeof r.anchor === 'string')).toBe(true);
  });

  it('should return [] for an absent ledger rather than throwing', () => {
    expect(readSnapshots(path.join(dir, 'does-not-exist.jsonl'))).toEqual([]);
  });
});

describe('publishRun — the window BETWEEN the two writes (5.302 proof, 5.328a)', () => {
  /**
   * Wave 2.3 asked for "a crash-injection test between writes leaving no
   * inconsistent set". What shipped tested each write ALONE; the window between
   * them was argued about in a comment and never exercised. This exercises it.
   *
   * The asymmetry is the point. Losing the archive row for a run that DID
   * publish is recoverable — the next run appends and the reconciliation gate
   * reports the mismatch. Gaining a row for a run that did NOT publish is a
   * phantom run day (5.137), which `realSnapshotCount` and the chart's
   * provenance gate both read as real history.
   */
  const io = () => {
    const calls: string[] = [];
    return {
      calls,
      writeFile: (p: string) => void calls.push(`write:${p}`),
      appendFile: (p: string) => void calls.push(`append:${p}`),
    };
  };
  const args = (o: ReturnType<typeof io>) => ({
    computedPath: 'computed.json',
    computedText: '{}\n',
    archivePath: 'archive.jsonl',
    archiveText: '{"run_at":"x"}\n',
    writeFile: o.writeFile,
    appendFile: o.appendFile,
  });

  it('should write computed.json BEFORE appending the archive', () => {
    const o = io();
    publishRun(args(o));
    expect(o.calls).toEqual(['write:computed.json', 'append:archive.jsonl']);
  });

  it('should NOT append a provenance row when the computed write fails', () => {
    // The crash injected exactly in the window. A row here would be a run day
    // the chart treats as measured history for data that never landed.
    const o = io();
    const boom = {
      ...args(o),
      writeFile: () => {
        throw new Error('ENOSPC');
      },
    };
    expect(() => publishRun(boom)).toThrow(/ENOSPC/);
    expect(o.calls, 'the archive gained a row for data that was never published').toEqual([]);
  });

  it('should surface an archive failure rather than swallowing it', () => {
    // The tolerable direction: computed.json is published, the row is missing,
    // and the caller learns about it. Silence here is how a run day goes absent
    // without anyone noticing.
    const o = io();
    const boom = {
      ...args(o),
      appendFile: () => {
        throw new Error('EROFS');
      },
    };
    expect(() => publishRun(boom)).toThrow(/EROFS/);
    expect(o.calls).toEqual(['write:computed.json']);
  });

  it('should publish without touching the archive under --no-archive', () => {
    const o = io();
    publishRun({ ...args(o), archiveText: null });
    expect(o.calls).toEqual(['write:computed.json']);
  });
});
