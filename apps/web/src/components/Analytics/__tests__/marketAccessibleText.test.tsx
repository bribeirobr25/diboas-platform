/**
 * What assistive tech hears on /market (2026-10-18 compliance pass).
 *
 * The chart's data table read ISO dates and raw band codes ("VERY_FAVORABLE"),
 * and the gauge's `role="img"` label was a caption with no number, because the
 * role hides the visible "10 / 14" readout.
 *
 * @vitest-environment happy-dom
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoricalRegimeChart } from '../HistoricalRegimeChart';
import { RegimeScore } from '../RegimeScore';
import type { HistoricalRegimes, RegimeCode } from '@/lib/analytics-sdk/types';
import { historicalDateLabels } from '@/lib/market/presentationState';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const RANGES = [
  ['3M', 13],
  ['6M', 26],
  ['1Y', 52],
] as const;
const CODES: RegimeCode[] = [
  'VERY_FAVORABLE',
  'CONSTRUCTIVE',
  'NEUTRAL_MIXED',
  'DEFENSIVE',
  'HOSTILE',
];

/** The approved band labels, read from each locale's catalogue. */
function bandLabels(locale: string): Record<RegimeCode, string> {
  const file = path.join(
    __dirname,
    `../../../../../../packages/i18n/translations/${locale}/market.json`
  );
  return JSON.parse(fs.readFileSync(file, 'utf8')).dashboard.regimeLabels;
}

/** 60 weekly snapshots ending on the 2026-10-12 run, cycling every band. */
const HISTORY = {
  snapshots: Array.from({ length: 60 }, (_, i) => {
    const day = new Date(Date.UTC(2026, 9, 12) - (59 - i) * 7 * 86_400_000);
    return {
      date: `${day.toISOString().slice(0, 10)}T06:17:00Z`,
      score: i % 15,
      regime_code: CODES[i % CODES.length],
    };
  }),
} as unknown as HistoricalRegimes;

function renderTable(
  locale: string,
  range: '3M' | '6M' | '1Y',
  dateLabels: Record<string, string>
) {
  const { container } = render(
    <HistoricalRegimeChart
      data={HISTORY}
      range={range}
      ariaLabel="history"
      tableLabels={{ date: 'd', score: 's', regime: 'r' }}
      regimeLabels={bandLabels(locale)}
      dateLabels={dateLabels}
    />
  );
  return container.querySelector('table')!;
}

describe('HistoricalRegimeChart data table', () => {
  for (const locale of LOCALES) {
    for (const [range, rows] of RANGES) {
      it(`should show translated bands and server-formatted dates for ${locale} at ${range}`, () => {
        const labels = historicalDateLabels(HISTORY.snapshots, locale);
        const table = renderTable(locale, range, labels);
        const bodyRows = [...table.querySelectorAll('tbody tr')];
        expect(bodyRows).toHaveLength(rows);
        const shown = HISTORY.snapshots.slice(-rows);
        const bands = bandLabels(locale);
        bodyRows.forEach((row, i) => {
          const day = shown[i].date.slice(0, 10);
          const time = row.querySelector('time')!;
          expect(time.getAttribute('dateTime')).toBe(day);
          expect(time.textContent).toBe(labels[day]);
          expect(time.textContent).not.toBe(day);
          expect(row.lastElementChild?.textContent).toBe(bands[shown[i].regime_code]);
        });
        expect(table.textContent).not.toMatch(/VERY_FAVORABLE|NEUTRAL_MIXED|HOSTILE/);
      });
    }
  }

  it('should render the date text it is given, never re-format it in the browser', () => {
    // Sentinel labels: a chart that formatted dates itself would not show these.
    const sentinels = Object.fromEntries(
      HISTORY.snapshots.map((s) => [s.date.slice(0, 10), `server:${s.date.slice(0, 10)}`])
    );
    const table = renderTable('de', '3M', sentinels);
    for (const time of table.querySelectorAll('time')) {
      expect(time.textContent).toBe(`server:${time.getAttribute('dateTime')}`);
    }
  });
});

describe('historicalDateLabels', () => {
  it('should label every snapshot day in each locale, in UTC, never as an ISO date', () => {
    // Run off-UTC: CI's clock is UTC, where a formatter that forgot `timeZone:
    // 'UTC'` would still pass. West of UTC it would show the 11th.
    const previousTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expectUtcLabels();
    } finally {
      if (previousTz === undefined) delete process.env.TZ;
      else process.env.TZ = previousTz;
    }
  });
});

function expectUtcLabels() {
  for (const locale of LOCALES) {
    const labels = historicalDateLabels(
      [{ date: '2026-10-12T23:30:00Z' }, { date: '2026-01-01T00:00:00Z' }],
      locale
    );
    expect(Object.keys(labels)).toEqual(['2026-10-12', '2026-01-01']);
    // UTC: the 12th stays the 12th and New Year stays in 2026 in every locale.
    expect(labels['2026-10-12']).toMatch(/12/);
    expect(labels['2026-01-01']).toMatch(/2026/);
    expect(labels['2026-10-12']).not.toBe('2026-10-12');
  }
  expect(historicalDateLabels([{ date: '2026-10-12T06:17:00Z' }], 'de')['2026-10-12']).toBe(
    '12.10.2026'
  );
}

describe('RegimeScore gauge label', () => {
  it('should carry the final score in its accessible name', () => {
    render(
      <RegimeScore
        data={{ score: 10, max_score: 14, regime_code: 'CONSTRUCTIVE' }}
        ariaLabel="Aktueller Wert"
      />
    );
    expect(screen.getByRole('img', { name: 'Aktueller Wert: 10/14' })).toBeTruthy();
  });
});
