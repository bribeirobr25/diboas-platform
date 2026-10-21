// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from '../Toggle';

describe('Toggle (A3 primitive — accessible switch)', () => {
  it('should expose role=switch with aria-checked reflecting state', () => {
    const { rerender } = render(<Toggle checked={false} onChange={vi.fn()} labelledBy="x" />);
    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    rerender(<Toggle checked onChange={vi.fn()} labelledBy="x" />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('should call onChange with the toggled value', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} labelledBy="x" />);
    screen.getByRole('switch').click();
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

/**
 * REQUIREMENT (handoff §6.6, `5.234`: touch targets >= 44x44; 2026-10-18 lane audit):
 * the switch's hit area reaches the governed floor. The track stays 1.6rem tall (the
 * look); a transparent ::after sized from the tap TOKEN carries the 44px height.
 * Read from the stylesheet, as `SegmentedToggle.test.tsx` does — happy-dom computes
 * no layout.
 */
describe('Toggle hit area (44x44)', () => {
  const css = readFileSync(join(process.cwd(), 'src/components/Toggle.module.css'), 'utf8');
  it('should extend the hit area to the tap token with a transparent ::after', () => {
    const after = css.slice(css.indexOf('.track::after {'));
    const block = after.slice(0, after.indexOf('}'));
    expect(css.indexOf('.track::after {')).toBeGreaterThan(-1);
    expect(block).toMatch(/height:\s*var\(--sb-tap\)/);
    expect(block).toMatch(/width:\s*100%/);
    expect(block).not.toMatch(/background/);
  });
  it('should keep the track itself positioned, so the ::after is anchored to it', () => {
    const track = css.slice(css.indexOf('.track {'));
    expect(track.slice(0, track.indexOf('}'))).toMatch(/position:\s*relative/);
  });
});
