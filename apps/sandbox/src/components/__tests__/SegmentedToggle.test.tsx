// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
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
