/**
 * The refresh PR body must list EVERY stale memo figure (PENDING_ALL 5.467).
 *
 * The fixture lines are the real shape of the CI log (run 36560910679, PR #674):
 * a timestamped `AssertionError:` line per locale, each carrying an orphan list
 * whose items are themselves `field: value`. The old colon-limited grep turned
 * that into `detailed: 118.21 | detailed` — one figure of thirty-nine.
 */
import { describe, expect, it } from 'vitest';
import { extractOrphans } from '../../../../scripts/market-refresh/lib/memo-orphans.mjs';

const line = (items: string[]) =>
  `quality\tRun pnpm test\t2026-09-29T11:20:44.4328132Z AssertionError: figures with no engine value ` +
  `behind them (stale or invented) — ${items.join(' | ')}: expected [ '${items[0]}', …(${items.length - 1}) ] to deeply equal []`;

describe('extractOrphans — the full list, not the first colon (5.467)', () => {
  it('should return every orphan when there are several, including indexed list fields', () => {
    const out = extractOrphans(
      line(['detailed: 118.21', 'detailed: 119.24', 'key_supportive_factors[2]: 0.87'])
    );
    expect(out).toEqual([
      'detailed: 118.21',
      'detailed: 119.24',
      'key_supportive_factors[2]: 0.87',
    ]);
  });

  it('should de-duplicate across locales and repeated log lines, keeping first-seen order', () => {
    const en = line(['detailed: 118.21', 'detailed: 4.96']);
    const de = line(['detailed: 118.21', 'detailed: 26.523']);
    const out = extractOrphans([en, de, en].join('\n'));
    expect(out).toEqual(['detailed: 118.21', 'detailed: 4.96', 'detailed: 26.523']);
  });

  it('should return nothing when the gate passed or failed for another reason', () => {
    expect(extractOrphans('Tests  4 passed (4)')).toEqual([]);
    expect(extractOrphans('Error: Cannot find module x')).toEqual([]);
  });

  it('should not stop at the colon inside an orphan (the defect it replaces)', () => {
    const out = extractOrphans(line(['detailed: 17.5', 'detailed: 15.99']));
    expect(out).toHaveLength(2);
    expect(out).not.toContain('detailed');
  });

  it('should also surface the latest-ETF-week finding (5.469), once per locale', () => {
    const etf = (loc: string) =>
      `AssertionError: latest spot-ETF week missing — ${loc}: quotes +$548M but not the latest ` +
      `week (-$236M): expected 'quotes +$548M but not the latest week…' to be null`;
    const out = extractOrphans(
      [etf('en'), etf('de'), etf('en'), line(['detailed: 17.5'])].join('\n')
    );
    expect(out).toEqual([
      'detailed: 17.5',
      'latest spot-ETF week (en): quotes +$548M but not the latest week (-$236M)',
      'latest spot-ETF week (de): quotes +$548M but not the latest week (-$236M)',
    ]);
  });
});
