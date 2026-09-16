// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedToggle } from '../SegmentedToggle';

const SEGMENTS = [
  { id: 'simple', label: 'Simple' },
  { id: 'detailed', label: 'Detailed' },
] as const;

describe('SegmentedToggle (Phase B — Simple|Detailed switcher)', () => {
  it('should mark the active segment with aria-pressed', () => {
    render(
      <SegmentedToggle
        segments={SEGMENTS as never}
        value="simple"
        onChange={vi.fn()}
        ariaLabel="View"
      />
    );
    expect(screen.getByRole('button', { name: 'Simple' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(screen.getByRole('button', { name: 'Detailed' }).getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('should call onChange with the chosen segment id', () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle
        segments={SEGMENTS as never}
        value="simple"
        onChange={onChange}
        ariaLabel="View"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    expect(onChange).toHaveBeenCalledWith('detailed');
  });
});

describe('the governed touch-target floor (5.234 · Round-3 ruling §8)', () => {
  /**
   * `44 x 44` is controlling for governed Product interactive targets and the
   * legacy `>=24` is superseded. This control was the ONE hard-coded height
   * below the floor (`min-height: 2rem` = 32px), bypassing `--sb-tap` while 25
   * other files honoured it.
   *
   * Asserted against the stylesheet SOURCE, not `getComputedStyle`: happy-dom
   * does not apply CSS-module stylesheets, so a computed-style assertion here
   * would pass whatever the file said — the "assert the flag, not the value"
   * trap. Reading the declaration is the honest instrument available in jsdom.
   */
  // `join(process.cwd(), 'src')` is the idiom every source-reading test in this
  // app uses (tokenArchitecture.test.ts:22, scaffoldSurfacesGated.test.ts:31).
  // `new URL(..., import.meta.url)` threw "The URL must be of scheme file"
  // under vitest's transform and took the whole FILE down with it — the two
  // pre-existing tests here vanished from the total while everything else
  // stayed green (868 -> 866). A file that fails to LOAD is silent.
  const SRC = join(process.cwd(), 'src');
  const css = readFileSync(join(SRC, 'components/SegmentedToggle.module.css'), 'utf8');

  it('should size the segment from the tap token, never a hard-coded height', () => {
    const segment = css.slice(css.indexOf('.segment {'));
    const block = segment.slice(0, segment.indexOf('}'));
    expect(block).toMatch(/min-height:\s*var\(--sb-tap\)/);
    expect(block).not.toMatch(/min-height:\s*[\d.]+(rem|px|em)/);
  });

  it('should keep the tap token at the governed 44px floor', () => {
    const tokens = readFileSync(join(SRC, 'styles/tokens.css'), 'utf8');
    const tap = tokens.match(/--sb-tap:\s*([^;]+);/);
    expect(tap?.[1].trim()).toBe('44px');
  });
});
