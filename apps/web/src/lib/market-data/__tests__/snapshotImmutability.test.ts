/**
 * SNAP-IMMUT-1 · a published history point never changes after the run that produced it.
 *
 * Requirement: historical snapshots are immutable; a score is never recalculated
 * retroactively (the published-history rule behind 5.127, where commit 37b23b20 flipped a
 * published 2026-07-27 score from 3 to 5). Before this guard, the chart-provenance test
 * proved each snapshot DATE maps to a real run day, and the reconciliation test proved the
 * CURRENT files agree; nothing proved that a PAST snapshot still carries what its run
 * recorded, so a hand edit to an old point passed every gate (5.180).
 *
 * Rule: for every snapshot in `historical.json`, the archive's LAST run on that day (a
 * same-day re-run is a correction, `runDayIndex`) carries the same score and regime code.
 * Exemptions, stated: none today. The 44 pre-engine seed points were pruned on 2026-08-24
 * and `synthetic_seed` is false; if seed points ever return, they carry no run day and must
 * be excluded by their flag, never by weakening this check. The 52-point cap only removes
 * the OLDEST points, so it never changes a point that remains.
 *
 * Why this lives in the weekly gate (WEEKLY-GATE class): the weekly run appends a snapshot
 * and an archive line together, so a mismatch is a pipeline defect that must stop the run.
 *
 * The archive must also be in time order (`archiveOrderProblems`): otherwise a back-dated
 * line appended at the end would become "the last run of its day" and re-score a week.
 *
 * When it fails: restore the published value from git history. Never edit
 * `historical.json` or append a back-dated archive line to make the two agree; if the
 * archive line itself is wrong, that is a founder decision recorded in the register.
 * A manual `run.mjs --no-archive` followed by `generate.mjs` also fails it ("no run that
 * day"), which is correct: that snapshot has no run behind it.
 *
 * Scope limit: it cannot see an archive line and a snapshot that were both written wrong
 * in the same run (that is DATA-STORE-1's and the paired check's job).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readArchiveRows, runDayIndex } from '../../../../scripts/market-refresh/lib/archive.mjs';

const MARKET_DIR = join(__dirname, '../../../../data/market/shared');

type Snapshot = { date: string; score: number; regime_code: string };
type ArchiveRow = { run_at: string; computed?: { score?: number; regime_code?: string } };

export function snapshotMismatches(
  historical: { synthetic_seed?: boolean; snapshots: Snapshot[] },
  archiveText: string
): string[] {
  const byDay = runDayIndex(readArchiveRows(archiveText)) as Map<string, ArchiveRow>;
  const problems: string[] = [];
  for (const s of historical.snapshots) {
    const day = s.date.slice(0, 10);
    const run = byDay.get(day);
    if (!run) {
      problems.push(`${day}: no run that day`);
      continue;
    }
    if (run.computed?.score !== s.score || run.computed?.regime_code !== s.regime_code) {
      problems.push(
        `${day}: snapshot ${s.score} ${s.regime_code} vs run ${run.computed?.score} ${run.computed?.regime_code}`
      );
    }
  }
  return problems;
}

/**
 * The archive is in time order. "The last run of a day wins" is only safe if a later
 * line cannot be a back-dated one: without this, appending a 2026-08-10 line after the
 * 2026-11-09 run would re-score a published week and pass (found by the MP-1b audit).
 */
export function archiveOrderProblems(archiveText: string): string[] {
  const problems: string[] = [];
  let latest = '';
  for (const { row } of readArchiveRows(archiveText) as { row: ArchiveRow }[]) {
    if (row.run_at < latest) problems.push(`${row.run_at} appended after ${latest}`);
    if (row.run_at > latest) latest = row.run_at;
  }
  return problems;
}

describe('SNAP-IMMUT-1: published history matches the runs that produced it (5.180)', () => {
  const historical = JSON.parse(readFileSync(join(MARKET_DIR, 'historical.json'), 'utf8'));
  const archive = readFileSync(join(MARKET_DIR, 'run-archive.jsonl'), 'utf8');

  it('should find every published snapshot equal to the last run of its day when the committed files are read', () => {
    expect(historical.synthetic_seed).toBe(false);
    expect(historical.snapshots.length).toBeGreaterThan(0);
    expect(snapshotMismatches(historical, archive)).toEqual([]);
  });

  it('should find the archive in time order when the committed file is read', () => {
    expect(archiveOrderProblems(archive)).toEqual([]);
  });

  it('should report a back-dated line appended to re-score a published week', () => {
    const backdated = `${archive.trimEnd()}\n${JSON.stringify({
      run_at: '2026-08-10T23:59:00Z',
      computed: { score: 7, regime_code: 'NEUTRAL_MIXED' },
    })}\n`;
    expect(archiveOrderProblems(backdated)).toHaveLength(1);
  });

  it('should report a published score that was changed after its run', () => {
    const edited = {
      ...historical,
      snapshots: historical.snapshots.map((s: Snapshot, i: number) =>
        i === 0 ? { ...s, score: s.score + 1 } : s
      ),
    };
    expect(snapshotMismatches(edited, archive)).toHaveLength(1);
  });

  it('should judge a re-run day by its last run, not its first, when a day has two runs', () => {
    const lines = [
      JSON.stringify({
        run_at: '2030-01-07T10:00:00Z',
        computed: { score: 3, regime_code: 'DEFENSIVE' },
      }),
      JSON.stringify({
        run_at: '2030-01-07T15:00:00Z',
        computed: { score: 5, regime_code: 'DEFENSIVE' },
      }),
    ].join('\n');
    const hist = {
      synthetic_seed: false,
      snapshots: [{ date: '2030-01-07T00:00:00Z', score: 5, regime_code: 'DEFENSIVE' }],
    };
    expect(snapshotMismatches(hist, lines)).toEqual([]);
    expect(
      snapshotMismatches({ ...hist, snapshots: [{ ...hist.snapshots[0], score: 3 }] }, lines)
    ).toHaveLength(1);
  });
});
