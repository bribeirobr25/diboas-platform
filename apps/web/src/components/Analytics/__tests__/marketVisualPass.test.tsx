/**
 * /market and tool-CTA guards from the 2026-11-11 visual pass and its
 * five-reviewer audit (PR #897). Gate rows: MKT-AXIS-1, MKT-LAYOUT-1,
 * CTA-WAITLIST-1 in docs/tech/engineering-gates.md.
 *
 *   * The gauge needle ran from the centre and crossed the score readout for
 *     every mid-range score; it is now a pointer at the arc.
 *   * The history chart spaced run days evenly and showed no dates (5.176 (c));
 *     it is now date-scaled with month labels formatted on the server.
 *   * The view tabs sat in a narrower 48rem box, 120px right of the content.
 *   * "Join the waitlist" opened the top of the home page, not the form — on
 *     the market band and on four tool results.
 *   * The methodology note was a six-line 64px headline, and on the umbrella
 *     and the backdrop it claimed the page lists signals and their points.
 *
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));

import { RegimeScore } from '../RegimeScore';
import { HistoricalRegimeChart } from '../HistoricalRegimeChart/HistoricalRegimeChart';
import { historicalMonthLabels } from '@/lib/market/presentationState';
import { historicalMonthTicks, monthLabelGap } from '@/lib/market/historyAxis';
import { MarketCtaBand } from '@/components/Market/MarketCtaBand/MarketCtaBand';
import { MarketViewSwitcher } from '@/app/[locale]/(landing)/market/MarketViewSwitcher';
import type { HistoricalRegimes } from '@/lib/analytics-sdk/types';

afterEach(cleanup);

const SRC = join(__dirname, '../../..');
const MARKET_DIR = join(SRC, 'app/[locale]/(landing)/market');
const read = (path: string) => readFileSync(join(SRC, path), 'utf8');

describe('RegimeScore pointer', () => {
  it.each([0, 7, 14])(
    'should keep the pointer at the arc, clear of the score readout, when the score is %i',
    (score) => {
      const { container } = render(
        <RegimeScore data={{ score, max_score: 14, regime_code: 'NEUTRAL_MIXED' }} ariaLabel="s" />
      );
      const line = container.querySelector('svg g line')!;
      // Pivot (200, 200), arc radius 160, 22-unit track. The readout sits in the
      // bowl: the pointer's inner end stays at least 100 units from the pivot.
      const inner = 200 - Number(line.getAttribute('y1'));
      const outer = 200 - Number(line.getAttribute('y2'));
      expect(inner).toBeGreaterThanOrEqual(100);
      expect(outer).toBeGreaterThan(inner);
      expect(outer).toBeLessThan(160 - 11 + 1); // reaches, but stays inside, the track
      expect(container.querySelector('svg g circle')).toBeNull(); // no hub under the readout
    }
  );
});

describe('history chart time axis', () => {
  const snapshot = (date: string, score = 5) => ({
    date: `${date}T00:00:00Z`,
    score,
    regime_code: 'NEUTRAL_MIXED' as const,
  });
  const regimeLabels = {
    VERY_FAVORABLE: 'a',
    CONSTRUCTIVE: 'b',
    NEUTRAL_MIXED: 'c',
    DEFENSIVE: 'd',
    HOSTILE: 'e',
  };
  const renderChart = (snapshots: ReturnType<typeof snapshot>[]) => {
    const data = { snapshots } as Pick<HistoricalRegimes, 'snapshots'>;
    return render(
      <HistoricalRegimeChart
        data={data}
        range="1Y"
        ariaLabel="h"
        tableLabels={{ date: 'd', score: 's', regime: 'r' }}
        regimeLabels={regimeLabels}
        dateLabels={{}}
        monthLabels={historicalMonthLabels(snapshots, 'en')}
      />
    ).container;
  };
  const xs = (c: HTMLElement) =>
    [...c.querySelectorAll('circle')].map((n) => Number(n.getAttribute('cx')));
  const texts = (c: HTMLElement) =>
    [...c.querySelectorAll('svg text')].map((n) => n.textContent ?? '');
  const plot = { left: 40, right: 696 };

  it('should place points by date when runs are a day apart', () => {
    const c = renderChart([snapshot('2026-07-11'), snapshot('2026-07-12'), snapshot('2026-08-10')]);
    const [a, b, z] = xs(c);
    // 1 day of a 30-day span, not half the width (the index axis put it there).
    expect((b! - a!) / (z! - a!)).toBeCloseTo(1 / 30, 5);
    expect(texts(c)).toEqual(expect.arrayContaining(['Jul', 'Aug']));
  });

  it('should plot in date order when the snapshots arrive out of order', () => {
    const c = renderChart([snapshot('2026-07-11'), snapshot('2026-11-09'), snapshot('2026-11-02')]);
    const points = xs(c);
    expect([...points].sort((p, q) => p - q)).toEqual(points);
    expect(Math.max(...points)).toBeLessThanOrEqual(plot.right);
  });

  it('should centre the point and label its month when there is a single snapshot or one day', () => {
    for (const set of [
      [snapshot('2026-07-11')],
      [snapshot('2026-07-11'), snapshot('2026-07-11')],
    ]) {
      const c = renderChart(set);
      expect(new Set(xs(c))).toEqual(new Set([368]));
      expect(texts(c)).toContain('Jul');
    }
  });

  it('should label the last month when a short window crosses into a new month', () => {
    const c = renderChart([
      snapshot('2026-07-31'),
      snapshot('2026-08-07'),
      snapshot('2026-08-14'),
      snapshot('2026-08-28'),
    ]);
    expect(texts(c)).toContain('Aug');
  });

  it('should hide the 12 label on phones when it sits under 14', () => {
    const c = renderChart([snapshot('2026-07-11'), snapshot('2026-08-10')]);
    const crowded = [...c.querySelectorAll('svg text')]
      .filter((n) => /axisLabelCrowded/.test(n.getAttribute('class') ?? ''))
      .map((n) => n.textContent);
    expect(crowded).toEqual(['12']);
    const css = read('components/Analytics/HistoricalRegimeChart/HistoricalRegimeChart.module.css');
    const phone = css.slice(css.indexOf('@media (max-width: 640px)'));
    expect(phone).toMatch(/\.axisLabel\s*\{[^}]*font-size:\s*var\(--font-size-2xl\)/);
    expect(phone).toMatch(/\.axisLabelCrowded\s*\{[^}]*display:\s*none/);
  });

  it('should draw the line by its own length when it animates', () => {
    const c = renderChart([snapshot('2026-07-11'), snapshot('2026-08-10')]);
    expect(c.querySelector('path')!.getAttribute('pathLength')).toBe('1');
    const css = read('components/Analytics/HistoricalRegimeChart/HistoricalRegimeChart.module.css');
    expect(css).toMatch(/\.pathAnimated\s*\{[^}]*stroke-dasharray:\s*1;/);
  });

  it('should keep the first and last month and thin the rest to the gap when the window is long', () => {
    const dates = Array.from({ length: 40 }, (_, i) =>
      new Date(Date.UTC(2026, 6 + i, 15)).toISOString()
    );
    const start = Date.parse(dates[0]!);
    const span = Date.parse(dates[dates.length - 1]!) - start;
    const ticks = historicalMonthTicks(dates, (t) => 40 + ((t - start) / span) * 656, plot);
    expect(ticks[0]!.key).toBe('2026-07');
    expect(ticks[ticks.length - 1]!.key).toBe(dates[dates.length - 1]!.slice(0, 7));
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]!.x - ticks[i - 1]!.x).toBeGreaterThanOrEqual(64);
    }
    expect(ticks[ticks.length - 1]!.anchor).toBe('end');
  });

  it('should return no ticks, not loop, when a date cannot be read', () => {
    expect(historicalMonthTicks(['2026-07-11T00:00:00Z', 'not a date'], (t) => t, plot)).toEqual(
      []
    );
    expect(historicalMonthTicks(['2026-7-11', '2026-11-09'], (t) => t, plot)).toEqual([]);
  });

  it('should add the year to every label when the snapshots span twelve months', () => {
    const labels = historicalMonthLabels(
      [{ date: '2026-07-11T00:00:00Z' }, { date: '2027-07-05T00:00:00Z' }],
      'en'
    );
    expect(labels['2026-07']).toBe('Jul 26');
    expect(labels['2027-07']).toBe('Jul 27');
    expect(new Set(Object.values(labels)).size).toBe(Object.keys(labels).length);
    expect(monthLabelGap(labels)).toBeGreaterThan(64);
  });

  it('should format one label per month across a year boundary when the span is short', () => {
    const labels = historicalMonthLabels(
      [{ date: '2026-12-20T06:00:00Z' }, { date: '2027-02-02T06:00:00Z' }],
      'pt-BR'
    );
    expect(Object.keys(labels)).toEqual(['2026-12', '2027-01', '2027-02']);
    expect(labels['2027-01']).toMatch(/^jan/i);
  });
});

describe('market page layout and links', () => {
  it('should send "Join the waitlist" to the waitlist form when clicked on the market band', () => {
    const { container } = render(
      <MarketCtaBand
        locale="en"
        cadence="c"
        headline="h"
        body="b"
        waitlistLabel="Join the waitlist"
        shareLabel="s"
        shareCopied="sc"
        shareUrl="https://example.test"
        shareText="t"
        shareTitle="tt"
      />
    );
    const link = [...container.querySelectorAll('a')].find(
      (a) => a.textContent === 'Join the waitlist'
    )!;
    expect(link.getAttribute('href')).toMatch(/#waitlist$/);
  });

  it.each([
    'components/Sections/AssetHistoryCalculator/variants/Default/Default.tsx',
    'components/Sections/CurrencyDepreciationCalculator/CurrencyDepreciationCalculator.tsx',
    'components/Sections/IdleCashCalculator/IdleCashCalculator.tsx',
    'components/Sections/CardFeesCalculator/CardFeesCalculator.tsx',
  ])('should send the result CTA to the waitlist form when the tool is %s', (file) => {
    const hrefs = [...read(file).matchAll(/href: '(\/[^']*source=tool_[^']*)'/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/#waitlist$/);
  });

  it('should put the view tabs in the page column when rendered', () => {
    const { container } = render(
      <MarketViewSwitcher activeSlug="bitcoin" labelFor={(v) => v.slug} navLabel="views" />
    );
    const list = container.querySelector('ul')!;
    expect(list.parentElement!.tagName).not.toBe('NAV'); // wrapped in the page Container
    const css = readFileSync(join(MARKET_DIR, 'page.module.css'), 'utf8');
    const block = css.match(/\.viewSwitcherList\s*\{[^}]*\}/)![0];
    expect(block).not.toMatch(/max-width|margin:\s*0 auto/);
  });

  it('should show the methodology lead only on a scored view, as body text under a mono heading', () => {
    const shell = readFileSync(join(MARKET_DIR, 'MarketViewShell.tsx'), 'utf8');
    const umbrella = readFileSync(join(MARKET_DIR, 'UmbrellaView.tsx'), 'utf8');
    expect(umbrella).not.toMatch(/dashboard\.methodologyLead/);
    const at = shell.indexOf("'dashboard.methodologyLead'");
    expect(at).toBeGreaterThan(0);
    const before = shell.slice(Math.max(0, at - 300), at);
    expect(before).toMatch(/view\.grammar === 'scored'/);
    expect(before).toMatch(/className=\{styles\.methodLead\}/);
    for (const src of [shell, umbrella]) expect(src).toMatch(/styles\.methodTitle/);
    const css = readFileSync(join(MARKET_DIR, 'page.module.css'), 'utf8');
    expect(css).toMatch(
      /\.method h2\.methodTitle\s*\{[^}]*font-family:\s*var\(--font-ibm-plex-mono\)/
    );
    expect(css).toMatch(/\.method \.methodLead\s*\{[^}]*color:\s*var\(--editorial-paper\)/);
  });
});
