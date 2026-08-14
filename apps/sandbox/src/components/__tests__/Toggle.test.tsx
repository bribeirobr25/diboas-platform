// @vitest-environment happy-dom
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
