/**
 * The two presentation rules added with the ETF-01 suspension (2026-10-18):
 * an UNAVAILABLE condition never borrows the restrictive word, and the
 * reduced-coverage notes appear exactly when `regime.coverage` names a
 * suspended signal, with every placeholder filled in every locale.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { conditionWordSuffix, coverageNotes, regimeLabelMap } from '../presentationState';

const I18N = join(__dirname, '../../../../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const market = (l: string) => JSON.parse(readFileSync(join(I18N, l, 'market.json'), 'utf8'));
const backdrop = (l: string) =>
  JSON.parse(readFileSync(join(I18N, l, 'market-backdrop.json'), 'utf8'));

describe('conditionWordSuffix', () => {
  it('should map ACTIVE, INACTIVE and UNAVAILABLE to three different words', () => {
    expect(conditionWordSuffix('ACTIVE')).toBe('active');
    expect(conditionWordSuffix('INACTIVE')).toBe('inactive');
    expect(conditionWordSuffix('UNAVAILABLE')).toBe('unavailable');
  });

  it('should treat a missing state as unavailable, never as the restrictive word', () => {
    expect(conditionWordSuffix(undefined)).toBe('unavailable');
  });

  it.each(['STALE', 'ERROR', 'SOMETHING_NEW'])(
    'should read %s as unavailable, because only ACTIVE and INACTIVE are assessed',
    (state) => {
      expect(conditionWordSuffix(state)).toBe('unavailable');
    }
  );

  it.each(LOCALES)('should have an unavailable word for every condition in %s', (l) => {
    expect(backdrop(l).conditions.unavailable).toBeTruthy();
    for (const k of ['dollar', 'rates', 'liquidity']) {
      const c = market(l).umbrella.conditions[k];
      expect(c.unavailable, `${l} umbrella ${k}`).toBeTruthy();
      expect(c.unavailable).not.toBe(c.inactive);
    }
  });
});

describe('coverageNotes', () => {
  const coverage = { suspended: [{ signal_id: 'ETF-01', points: 2, since: '2026-10-19' }] };

  it('should return no notes when nothing is suspended, or when the field is absent', () => {
    const t = { score: 'x {points}', chart: 'y {date}' };
    expect(coverageNotes({ suspended: [] }, 14, 'en', t)).toEqual({ score: null, chart: null });
    expect(coverageNotes(undefined, 14, 'en', t)).toEqual({ score: null, chart: null });
  });

  it.each(LOCALES)('should fill every placeholder in the %s sentences', (l) => {
    const d = market(l).dashboard;
    const notes = coverageNotes(coverage, 14, l, {
      score: d.coverageNote,
      chart: d.chartCoverageNote,
    });
    expect(notes.score).toContain('2');
    expect(notes.score).toContain('14');
    expect(notes.chart).toContain('2026');
    for (const n of [notes.score, notes.chart]) {
      expect(n).not.toMatch(/\{\w+\}/);
      expect(n).not.toContain('—');
    }
  });

  it('should date the chart note in the reader’s locale, from UTC', () => {
    const t = { score: '', chart: '{date}' };
    expect(coverageNotes(coverage, 14, 'en', t).chart).toBe('October 19, 2026');
    expect(coverageNotes(coverage, 14, 'de', t).chart).toBe('19. Oktober 2026');
  });
});

describe('coverageNotes — scoped to the ETF flow indicator (2026-10-18)', () => {
  it('should not lend the ETF sentences to another suspended signal', () => {
    const t = { score: 'x {points}', chart: 'y {date}' };
    const other = { suspended: [{ signal_id: 'MAC-03', points: 1, since: '2026-11-02' }] };
    expect(coverageNotes(other, 14, 'en', t)).toEqual({ score: null, chart: null });
  });

  it('should find the ETF-01 entry wherever it sits in the list', () => {
    const t = { score: 'x {points}', chart: 'y {date}' };
    const both = {
      suspended: [
        { signal_id: 'MAC-03', points: 1, since: '2026-11-02' },
        { signal_id: 'ETF-01', points: 2, since: '2026-10-19' },
      ],
    };
    expect(coverageNotes(both, 14, 'en', t).score).toBe('x 2');
  });
});

describe('regimeLabelMap', () => {
  it.each(LOCALES)('should translate every band in %s, never echoing the code', (l) => {
    const labels = market(l).dashboard.regimeLabels as Record<string, string>;
    const map = regimeLabelMap((key, fallback) => {
      const leaf = key.replace('dashboard.regimeLabels.', '');
      return labels[leaf] ?? fallback;
    });
    for (const [code, label] of Object.entries(map)) {
      expect(label, `${l} ${code}`).toBeTruthy();
      expect(label).not.toBe(code);
      expect(label).toBe(labels[code]);
    }
  });
});
