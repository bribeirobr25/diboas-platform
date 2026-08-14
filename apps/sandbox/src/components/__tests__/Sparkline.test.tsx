// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from '../Sparkline';

describe('Sparkline (Phase B — honest now-vs-past visual)', () => {
  it('should render an aria-hidden svg with a polyline over the series', () => {
    const { container } = render(<Sparkline series={[10, 12, 9, 14, 11, 15]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true'); // meaning lives in caller text
    expect(container.querySelector('polyline')).toBeTruthy();
  });

  it('should render nothing for a degenerate (<2 point) series', () => {
    const { container } = render(<Sparkline series={[5]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('should be deterministic — same series produces the same path (honesty/replay)', () => {
    const s = [100, 96, 103, 90, 108];
    const a = render(<Sparkline series={s} />)
      .container.querySelector('polyline')
      ?.getAttribute('points');
    const b = render(<Sparkline series={s} />)
      .container.querySelector('polyline')
      ?.getAttribute('points');
    expect(a).toBe(b);
    expect(a).toBeTruthy();
  });

  it('should place a lower value BELOW a higher one (honest orientation, shows dips)', () => {
    // series with a clear dip: index 1 is the lowest → should have the largest y (lowest on screen)
    const { container } = render(<Sparkline series={[100, 50, 100]} height={100} />);
    const pts = container.querySelector('polyline')!.getAttribute('points')!.split(' ');
    const ys = pts.map((p) => parseFloat(p.split(',')[1]));
    // the dip (index 1) sits lowest on screen (largest y); the peaks sit highest (smallest y)
    expect(ys[1]).toBeGreaterThan(ys[0]);
    expect(ys[1]).toBeGreaterThan(ys[2]);
  });
});
