/**
 * LEDGER-APPEND-1: an append can never be swallowed by a torn tail (K01/N01, 2026-10-20).
 *
 * The weekly job appends to `etf-shares-weekly.jsonl`, `etf-snapshot-attempts.jsonl`
 * and `run-archive.jsonl` and can be killed mid-write. The tolerant reader skips a
 * torn line, but a row appended straight after a tail with no newline fused with
 * it and was skipped too: the NEW, valid row was lost. `appendJsonlLine` starts a
 * fresh line first, never edits existing bytes, and throws on any write failure.
 *
 * Rules only: throw-away files in a temp directory; no committed data is read or
 * written. Limits (stated, not tested): no repair of a damaged row, no durability
 * or concurrent-writer guarantee.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  appendJsonlLine,
  readJsonlTolerant,
} from '../../../../scripts/market-refresh/lib/jsonl.mjs';
import {
  readAttempts,
  readSnapshots,
  recordEtfSnapshot,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';
import { publishRun } from '../../../../scripts/market-refresh/lib/archive.mjs';
import { failureHeadline } from '../../../../scripts/market-refresh/run.mjs';

const dirs: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonl-append-'));
  dirs.push(dir);
  return dir;
}
function tempFile(content: string | null, name = 'ledger.jsonl'): string {
  const file = path.join(tempDir(), name);
  if (content !== null) fs.writeFileSync(file, content);
  return file;
}
const text = (file: string) => fs.readFileSync(file, 'utf8');
const rows = (file: string) => readJsonlTolerant(text(file));

const FUNDS = ['IBIT', 'FBTC'];
const snapshot = (anchor: string, shares: number | null = 1_000_000) => ({
  anchor,
  funds: Object.fromEntries(FUNDS.map((t) => [t, { shares, price: 40, lastUpdated: null }])),
});
const io = (dir: string) => ({
  attemptedAt: '2026-10-26T06:20:00Z',
  source: 'synthetic',
  ledgerPath: path.join(dir, 'etf-shares-weekly.jsonl'),
  attemptsPath: path.join(dir, 'etf-snapshot-attempts.jsonl'),
});

describe('appendJsonlLine: the file shapes an append can meet', () => {
  it('should keep the new row and the old bytes when the file ends in a torn row', () => {
    const before = '{"anchor":"2026-10-09"}\n{"anchor":"2026-10-1';
    const file = tempFile(before);
    appendJsonlLine(file, JSON.stringify({ anchor: '2026-10-23' }));
    expect(text(file).startsWith(before)).toBe(true); // damaged evidence untouched
    expect(rows(file)).toEqual([{ anchor: '2026-10-09' }, { anchor: '2026-10-23' }]);
  });

  it('should keep both rows when the last row is valid but has no newline', () => {
    const file = tempFile('{"a":1}');
    appendJsonlLine(file, '{"a":2}');
    expect(text(file)).toBe('{"a":1}\n{"a":2}\n');
    expect(rows(file)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('should add no blank line when the file already ends in a newline', () => {
    const file = tempFile('{"a":1}\n');
    appendJsonlLine(file, '{"a":2}\n');
    expect(text(file)).toBe('{"a":1}\n{"a":2}\n');
  });

  it('should write no leading newline into an empty file', () => {
    const file = tempFile('');
    appendJsonlLine(file, '{"a":1}');
    expect(text(file)).toBe('{"a":1}\n');
  });

  it('should create the file when it does not exist yet', () => {
    const file = tempFile(null);
    appendJsonlLine(file, '{"a":1}');
    expect(text(file)).toBe('{"a":1}\n');
  });

  it('should throw, and leave the file unchanged, when the write fails', () => {
    const before = '{"a":1}\n';
    const file = tempFile(before);
    vi.spyOn(fs, 'appendFileSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('synthetic EIO'), { code: 'EIO' });
    });
    expect(() => appendJsonlLine(file, '{"a":2}')).toThrow('synthetic EIO');
    expect(text(file)).toBe(before);
  });

  it('should throw a tail-check failure other than a missing file instead of appending blind', () => {
    // Only the tail read fails; the append itself would succeed. Swallowing the
    // error would append without knowing whether a newline is needed.
    const before = '{"a":1}';
    const file = tempFile(before);
    vi.spyOn(fs, 'openSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('synthetic EIO on tail read'), { code: 'EIO' });
    });
    expect(() => appendJsonlLine(file, '{"a":2}')).toThrow('synthetic EIO on tail read');
    expect(text(file)).toBe(before);
  });
});

describe('the ETF ledger and its refusal evidence use it (K01, N01)', () => {
  it('K01: a complete week recorded after a torn ledger tail is readable, and a retry is idempotent', () => {
    const dir = tempDir();
    const p = io(dir);
    fs.writeFileSync(p.ledgerPath, `${JSON.stringify(snapshot('2026-10-09'))}\n{"anchor":`);
    const before = text(p.ledgerPath);

    expect(recordEtfSnapshot(snapshot('2026-10-23'), p).outcome).toBe('recorded');
    expect(text(p.ledgerPath).startsWith(before)).toBe(true);
    expect(readSnapshots(p.ledgerPath).map((r: { anchor: string }) => r.anchor)).toEqual([
      '2026-10-09',
      '2026-10-23',
    ]);

    const afterFirst = text(p.ledgerPath);
    expect(recordEtfSnapshot(snapshot('2026-10-23'), p).outcome).toBe('already-recorded');
    expect(text(p.ledgerPath)).toBe(afterFirst);
  });

  it('N01: refusal evidence written after a torn attempts tail is readable, and the ledger is untouched', () => {
    const dir = tempDir();
    const p = io(dir);
    fs.writeFileSync(p.ledgerPath, `${JSON.stringify(snapshot('2026-10-09'))}\n`);
    fs.writeFileSync(p.attemptsPath, '{"anchor":');
    const ledgerBefore = text(p.ledgerPath);

    expect(recordEtfSnapshot(snapshot('2026-10-23', null), p).outcome).toBe('refused');
    expect(text(p.attemptsPath).startsWith('{"anchor":')).toBe(true);
    const attempts = readAttempts(p.attemptsPath);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ anchor: '2026-10-23', outcome: 'refused-incomplete' });
    expect(text(p.ledgerPath)).toBe(ledgerBefore);
  });

  it('should never report "recorded" when the ledger append fails', () => {
    const p = io(tempDir());
    fs.writeFileSync(p.ledgerPath, `${JSON.stringify(snapshot('2026-10-09'))}\n`);
    const before = text(p.ledgerPath);
    vi.spyOn(fs, 'appendFileSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('synthetic ENOSPC'), { code: 'ENOSPC' });
    });
    expect(() => recordEtfSnapshot(snapshot('2026-10-23'), p)).toThrow('synthetic ENOSPC');
    expect(text(p.ledgerPath)).toBe(before);
  });

  it('should never report "refused" (evidence kept) when the evidence append fails', () => {
    const p = io(tempDir());
    vi.spyOn(fs, 'appendFileSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('synthetic EACCES'), { code: 'EACCES' });
    });
    expect(() => recordEtfSnapshot(snapshot('2026-10-23', null), p)).toThrow('synthetic EACCES');
    expect(fs.existsSync(p.attemptsPath)).toBe(false);
  });
});

describe('the run archive uses it through publishRun', () => {
  it('should append the archive line after a torn tail without doubling its newline, computed first', () => {
    const dir = tempDir();
    const computedPath = path.join(dir, 'computed.json');
    const archivePath = path.join(dir, 'run-archive.jsonl');
    fs.writeFileSync(archivePath, '{"run_at":"2026-10-12"}\n{"run_at":"2026-10-1');
    const order: string[] = [];
    publishRun({
      computedPath,
      computedText: '{"score":10}\n',
      archivePath,
      archiveText: '{"run_at":"2026-10-26"}\n',
      writeFile: (p: string, t: string) => {
        order.push('computed');
        fs.writeFileSync(p, t);
      },
      appendFile: (p: string, t: string) => {
        order.push('archive');
        appendJsonlLine(p, t);
      },
    });
    expect(order).toEqual(['computed', 'archive']);
    expect(text(archivePath).endsWith('\n{"run_at":"2026-10-26"}\n')).toBe(true);
    expect(text(archivePath)).not.toContain('\n\n');
    expect(rows(archivePath)).toEqual([{ run_at: '2026-10-12' }, { run_at: '2026-10-26' }]);
  });
});

describe('every pipeline append goes through appendJsonlLine', () => {
  // No exemption: the simulator appends to the real data files during a
  // rehearsal, so a torn tail there must not swallow its rows either.
  const SCRIPTS = path.join(__dirname, '../../../../scripts');
  const ALLOWED = new Set(['market-refresh/lib/jsonl.mjs']);
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? files(p) : p.endsWith('.mjs') ? [p] : [];
    });

  it('should find no raw appendFileSync in a pipeline script', () => {
    const offenders = files(SCRIPTS)
      .map((f) => path.relative(SCRIPTS, f).split(path.sep).join('/'))
      .filter((rel) => !ALLOWED.has(rel))
      .filter((rel) =>
        /\bappendFileSync\s*\(/.test(fs.readFileSync(path.join(SCRIPTS, rel), 'utf8'))
      );
    expect(offenders).toEqual([]);
  });

  it('should wire the run archive, the manual --archive and the simulator to the helper', () => {
    const read = (rel: string) => fs.readFileSync(path.join(SCRIPTS, rel), 'utf8');
    expect(read('market-refresh/run.mjs')).toMatch(
      /appendFile: \(p, t\) => \{\s*appendJsonlLine\(p, t\);/
    );
    expect(read('data-fetchers/compute-regime.mjs')).toMatch(/appendJsonlLine\(ARCHIVE_PATH,/);
    const sim = read('market-refresh/simulate-next-week.mjs');
    expect(sim).toMatch(/appendJsonlLine\(p\('run-archive\.jsonl'\),/);
    // and it reads the archive tolerantly (a torn line must not crash the rehearsal)
    expect(sim).not.toMatch(/run-archive\.jsonl'\), 'utf8'\)\.trim\(\)\.split/);
    expect(sim).toMatch(
      /readJsonlTolerant\(fs\.readFileSync\(path\.join\(SHARED, 'run-archive\.jsonl'\)/
    );
  });
});

describe('a failed run reports what it already wrote (honest failure headline)', () => {
  const base = { notRecorded: false, etfWeekRecorded: false };

  it('should say nothing was written only when nothing was', () => {
    expect(failureHeadline({ ...base, written: [] })).toBe(
      'market-refresh failed closed — nothing written beyond the log'
    );
  });

  it('should name the BTC candle and computed.json when they were written before the failure', () => {
    const head = failureHeadline({
      ...base,
      written: ['monthlyPrices.json (BTC 2026-10 candle)', 'computed.json'],
    });
    expect(head).not.toContain('nothing written');
    expect(head).toContain('monthlyPrices.json (BTC 2026-10 candle)');
    expect(head).toContain('computed.json');
  });

  it('should keep the recorded-week wording exactly when nothing else was written', () => {
    expect(failureHeadline({ ...base, etfWeekRecorded: true, written: [] })).toBe(
      'market-refresh failed closed AFTER this week’s ETF snapshot was recorded — the ledger line stands'
    );
  });

  it('should never end in a period (the caller appends ":" and the error)', () => {
    for (const state of [
      { ...base, written: [] },
      { ...base, written: ['a.json'] },
      { ...base, etfWeekRecorded: true, written: ['a.json'] },
    ]) {
      expect(failureHeadline(state).endsWith('.')).toBe(false);
    }
  });

  it('should keep the recorded-week statement and add the written files', () => {
    const head = failureHeadline({ ...base, etfWeekRecorded: true, written: ['x.json'] });
    expect(head).toContain('ETF snapshot was recorded');
    expect(head).toContain('x.json');
  });

  it('should keep the ETF refusal wording unchanged', () => {
    expect(failureHeadline({ ...base, notRecorded: true, kind: 'refused', written: [] })).toBe(
      'ETF snapshot NOT added to the ledger — only the attempt evidence was written'
    );
    expect(
      failureHeadline({ ...base, notRecorded: true, kind: 'incompleteRecord', written: [] })
    ).toBe('ETF snapshot NOT added to the ledger — nothing written beyond the log');
  });

  it('should record every write run.mjs makes (BTC append, computed.json, archive)', () => {
    const run = fs.readFileSync(
      path.join(__dirname, '../../../../scripts/market-refresh/run.mjs'),
      'utf8'
    );
    expect(run).toMatch(/appendBtcMonth\(bar\);\s*\n\s*written\.push\(/);
    expect(run).toMatch(/writeFileAtomic\(p, t\);\s*\n\s*written\.push\(/);
    expect(run).toMatch(/appendJsonlLine\(p, t\);\s*\n\s*written\.push\(/);
    // and the failure handler passes that list (not an empty or new one)
    expect(run).toMatch(
      /failureHeadline\(\{ notRecorded, kind: e\.kind, etfWeekRecorded, written \}\)/
    );
    expect(run).toMatch(/written\.push\(`\$\{path\.relative\(REPO_ROOT, MONTHLY_PRICES_PATH\)\}/);
  });
});
