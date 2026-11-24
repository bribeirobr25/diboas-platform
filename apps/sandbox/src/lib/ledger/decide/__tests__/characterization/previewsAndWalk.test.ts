// @vitest-environment happy-dom
/**
 * ⛑ LEDGER-CHAR-1 · the previews and the seeded random walk (plan P12 §4.1).
 */
import { expect, it, vi } from 'vitest';
import { characterize, type Golden, type Manifest } from './compare';
import { coreCases, previewCases, walkCases, WALK_ROWS, WALK_STEPS } from './cases/previewsAndWalk';
import coreGolden from './goldens/core.json';
import previewGolden from './goldens/previews.json';
import walkGolden from './goldens/walk.json';
import manifest from './goldens/manifest.json';

vi.mock('@/lib/ids', () => import('./mocks').then((m) => m.ids()));
vi.mock('@diboas/banking', (orig) => import('./mocks').then((m) => m.banking(orig as never)));

characterize('previews', previewCases, previewGolden as Golden, manifest as Manifest);
characterize('core', coreCases, coreGolden as Golden, manifest as Manifest);
/* 500 commands, six runs (two clocks × three zones): its own budget (`5.397`). */
characterize('walk', walkCases, walkGolden as Golden, manifest as Manifest, { timeoutMs: 120_000 });

/**
 * The count table a reviewer reads instead of the 500 hashes: every row ran, and the walk did
 * not slide into no-ops (each row that can emit did so more than once, once-per-ledger rows once).
 */
it('should exercise every row, mostly past its refusals, when the random walk runs', () => {
  const golden = walkGolden as Golden;
  if (!golden['random-walk-500']) return; // first recording
  const result = (
    golden['random-walk-500'].fixed as {
      result: { return: { counts: Record<string, Record<string, number>>; steps: string[] } };
    }
  ).result.return;
  expect(result.steps).toHaveLength(WALK_STEPS);
  expect(
    Object.keys(result.counts)
      .map(Number)
      .sort((a, b) => a - b)
  ).toEqual(WALK_ROWS);
  /* Once per ledger: the grant, the comparison credit, and the one live rule (W-19a; the walk
     never deletes it). */
  const ONCE = new Set([1, 13, 18]);
  const NEVER_APPENDS = new Set([16]);
  for (const row of WALK_ROWS) {
    const c = result.counts[row]!;
    if (NEVER_APPENDS.has(row)) expect(c.noop, `row ${row}`).toBeGreaterThan(0);
    else expect(c.emitted, `row ${row} emitted`).toBeGreaterThanOrEqual(ONCE.has(row) ? 1 : 2);
  }
});
