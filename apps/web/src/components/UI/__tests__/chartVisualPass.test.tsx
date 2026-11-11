/**
 * Chart guards from the 2026-11-11 visual pass (production, desktop + phone)
 * and its five-reviewer audit (PR #897). Gate rows: CHART-DRAW-1, CHART-AXIS-1,
 * CHART-PHONE-1 in docs/tech/engineering-gates.md.
 *
 *   * DivergenceChart (currency, asset-history and idle-cash results, the fee
 *     comparison): on a desktop the drawn lines stopped ~20% short of their end
 *     dots. The lines use `vector-effect: non-scaling-stroke`, so the dash is
 *     applied in screen space while `pathLength={1}` measures in viewBox units.
 *     The chart now keeps the dash at max(1, rendered/viewBox) from a
 *     ResizeObserver's content box.
 *   * CompoundChart (retirement, compound interest, goal savings, Learn talk 1):
 *     the year axis skipped 15; full currency figures were clipped; compact
 *     labels on maxValue/4 ticks printed wrong and repeated values. Ticks are
 *     now even years and round 1-2-5 values.
 *   * Phone labels (~5.5px) are enlarged by a max-width: 640px block.
 *
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DivergenceChart } from '../DivergenceChart';
import { CompoundChart } from '../CompoundChart/CompoundChart';
import { compoundXTicks, compoundYTicks } from '@/lib/compound-interest/chartAxis';
import { formatCurrency, type ScenarioSeries } from '@/lib/compound-interest';

afterEach(cleanup);

const css = (name: string) =>
  readFileSync(join(__dirname, `../${name}/${name}.module.css`), 'utf8');
const phoneBlock = (source: string) => {
  const at = source.indexOf('@media (max-width: 640px)');
  expect(at, 'the phone block').toBeGreaterThan(-1);
  return source.slice(at, source.indexOf('\n}\n', at));
};

describe('DivergenceChart draw length', () => {
  const originalObserver = globalThis.ResizeObserver;
  afterEach(() => {
    globalThis.ResizeObserver = originalObserver;
  });

  function stubObserver() {
    const state: { fire?: (width: number) => void; disconnected: boolean } = {
      disconnected: false,
    };
    globalThis.ResizeObserver = class {
      constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) {
        state.fire = (width) => cb([{ contentRect: { width } }]);
      }
      observe() {}
      disconnect() {
        state.disconnected = true;
      }
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    return state;
  }

  it('should set the dash to the rendered width over the viewBox width when the chart is wider than the viewBox', () => {
    const observer = stubObserver();
    const { container } = render(
      <DivergenceChart
        ariaLabel="chart"
        series={[{ id: 'a', label: 'A', values: [1, 2], variant: 'primary' }]}
      />
    );
    const svg = container.querySelector('svg')!;
    const dash = () => Number(svg.style.getPropertyValue('--dc-dash'));
    observer.fire!(798);
    expect(dash()).toBeCloseTo((798 / 640) * 1.02, 5);
    observer.fire!(293); // a phone: the dash never drops below one line length
    expect(dash()).toBeCloseTo(1.02, 5);
  });

  it('should keep the last dash when the observer reports a zero width', () => {
    const observer = stubObserver();
    const { container } = render(
      <DivergenceChart ariaLabel="chart" series={[{ id: 'a', label: 'A', values: [1, 2] }]} />
    );
    const svg = container.querySelector('svg')!;
    observer.fire!(900);
    const before = svg.style.getPropertyValue('--dc-dash');
    observer.fire!(0);
    expect(svg.style.getPropertyValue('--dc-dash')).toBe(before);
  });

  it('should disconnect the observer when the chart unmounts', () => {
    const observer = stubObserver();
    const { unmount } = render(
      <DivergenceChart ariaLabel="chart" series={[{ id: 'a', label: 'A', values: [1, 2] }]} />
    );
    expect(observer.disconnected).toBe(false);
    unmount();
    expect(observer.disconnected).toBe(true);
  });

  it('should render, with a fallback dash that covers the line, when ResizeObserver is missing', () => {
    // @ts-expect-error — simulating a browser that lacks the API
    globalThis.ResizeObserver = undefined;
    expect(() =>
      render(
        <DivergenceChart ariaLabel="chart" series={[{ id: 'a', label: 'A', values: [1, 2] }]} />
      )
    ).not.toThrow();
    const source = css('DivergenceChart');
    expect(source).toMatch(/stroke-dasharray:\s*var\(--dc-dash,\s*4\)/);
    expect(source).toMatch(/stroke-dashoffset:\s*var\(--dc-dash,\s*4\)/);
  });

  it('should draw the whole line and cancel the transition when the user prefers reduced motion', () => {
    const source = css('DivergenceChart');
    const reduced = source.slice(source.indexOf('prefers-reduced-motion'));
    // Both selectors: `.isDrawn .line` (0,2,0) would otherwise keep its transition.
    expect(reduced).toMatch(
      /\.line,\s*\.isDrawn \.line\s*\{[^}]*stroke-dasharray:\s*none[^}]*transition:\s*none/
    );
    const undrawn = source.match(/\n\.line\s*\{[^}]*\}/)![0];
    expect(undrawn).not.toMatch(/transition/);
    expect(source).toMatch(/\.isDrawn \.line\s*\{[^}]*transition:\s*stroke-dashoffset/);
  });

  it('should enlarge the end labels and captions with no tracking when the viewport is a phone', () => {
    const block = phoneBlock(css('DivergenceChart'));
    expect(block).toMatch(/\.endLabel,\s*\.caption\s*\{[^}]*font-size:\s*var\(--font-size-xl\)/);
    expect(block).toMatch(/letter-spacing:\s*0;/);
  });
});

describe('compoundXTicks', () => {
  it.each([
    [25, [0, 5, 10, 15, 20, 25]],
    [30, [0, 5, 10, 15, 20, 25, 30]],
    [40, [0, 10, 20, 30, 40]],
    [12, [0, 2, 4, 6, 8, 10, 12]],
    [7, [0, 2, 4, 6, 7]],
    [3, [0, 1, 2, 3]],
    [1, [0, 1]],
    [0, [0]],
  ])('should space the ticks evenly and end on the horizon when years = %i', (years, ticks) => {
    expect(compoundXTicks(years)).toEqual(ticks);
  });

  it('should drop a step tick when it sits closer to the horizon than half a step', () => {
    // 21 years, step 5: 20 sits one year from 21 and would collide with it.
    expect(compoundXTicks(21)).toEqual([0, 5, 10, 15, 21]);
  });
});

describe('compoundYTicks', () => {
  const maxima = Array.from({ length: 400 }, (_, i) => 10 ** (i / 40)); // 1 .. 1e10

  it('should cover the maximum with a round 1-2-5 step in at most four steps when given any maximum', () => {
    for (const max of maxima) {
      const { ticks, top } = compoundYTicks(max);
      const step = ticks[1]!;
      const mantissa = step / 10 ** Math.floor(Math.log10(step) + 1e-9);
      expect([1, 2, 5]).toContain(Number(mantissa.toFixed(6)));
      expect(top).toBeGreaterThanOrEqual(max - 1e-6);
      expect(ticks.length - 1).toBeLessThanOrEqual(4);
      expect(top - step).toBeLessThan(max);
    }
  });

  it.each(['en', 'pt-BR', 'es', 'de'] as const)(
    'should give every grid line a distinct, exact compact label when locale = %s',
    (locale) => {
      for (const max of maxima) {
        const labels = compoundYTicks(max).ticks.map((v) => {
          const compact = formatCurrency(v, locale, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          });
          const precise = formatCurrency(v, locale, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          });
          // One fraction digit loses nothing: the label is the tick's value.
          expect(compact, `${locale} ${max}`).toBe(precise);
          return compact;
        });
        expect(new Set(labels).size, `${locale} ${max}: ${labels.join(' | ')}`).toBe(labels.length);
      }
    }
  );

  it('should return a usable axis when the maximum is zero or not a number', () => {
    expect(compoundYTicks(0)).toEqual({ ticks: [0, 1], top: 1 });
    expect(compoundYTicks(Number.NaN)).toEqual({ ticks: [0, 1], top: 1 });
  });
});

describe('CompoundChart value labels', () => {
  const series = (max: number): ScenarioSeries[] =>
    (['bank', 'conservative', 'historical', 'optimistic'] as const).map((scenario, i) => ({
      scenario,
      rate: i,
      yearlyValues: Array.from({ length: 26 }, (_, y) => (max * y * (i + 1)) / 100),
      finalValue: max * (i + 1) * 0.25,
    }));
  const renderChart = (max: number, locale: 'en' | 'pt-BR' | 'es' | 'de') =>
    render(
      <CompoundChart
        series={series(max)}
        highlightedScenario="historical"
        locale={locale}
        ariaLabel="chart"
        tableLabels={{ scenario: 's', rate: 'r', total: 't' }}
        scenarioLabels={{ bank: 'b', conservative: 'c', historical: 'h', optimistic: 'o' }}
      />
    );
  const yLabels = (container: HTMLElement) =>
    [...container.querySelectorAll('svg text')]
      .filter((t) => /yLabel/.test(t.getAttribute('class') ?? ''))
      .map((t) => (t.textContent ?? '').replace(/\s/g, ' '));

  it.each([
    ['en', 1_159_589, ['$0', '$500K', '$1M', '$1.5M']],
    ['en', 2_400, ['$0', '$1K', '$2K', '$3K']],
    ['pt-BR', 1_159_589, ['R$ 0', 'R$ 500 mil', 'R$ 1 mi', 'R$ 1,5 mi']],
    ['de', 1_159_589, ['0 €', '500.000 €', '1 Mio. €', '1,5 Mio. €']],
  ] as const)(
    'should label the value axis on round compact values when locale = %s and the maximum is %i',
    (locale, max, expected) => {
      const { container } = renderChart(max, locale);
      expect(yLabels(container)).toEqual(expected);
    }
  );

  it('should keep the full figure in the table when the axis is compact', () => {
    const { container } = renderChart(1_159_589, 'en');
    expect(container.querySelector('table')!.textContent).toMatch(/1,159,589/);
  });

  it('should move the value labels inside the plot, with a halo, when the viewport is a phone', () => {
    const block = phoneBlock(css('CompoundChart'));
    expect(block).toMatch(/\.axisLabel\s*\{[^}]*font-size:\s*var\(--font-size-2xl\)/);
    expect(block).toMatch(/\.yLabel\s*\{[^}]*text-anchor:\s*start/);
    expect(block).toMatch(
      /\.yLabel\s*\{[^}]*paint-order:\s*stroke[^}]*stroke:\s*var\(--color-white\)/
    );
    expect(block).toMatch(/\.yLabelZero\s*\{[^}]*display:\s*none/);
  });
});
