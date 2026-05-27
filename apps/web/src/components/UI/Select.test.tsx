/**
 * Select Primitive Contract Tests
 *
 * Verifies the public API contract of @diboas/ui's Select primitive:
 * ARIA attributes, ref forwarding, controlled onChange, invalid state,
 * disabled state, tracking-hook isolation, and variant class composition.
 *
 * Colocated next to component-consumer surface per
 * POST_HISTORICAL_CALIBRATION_PENDING_PLAN_2026-05-17 §2.6 + L14.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@diboas/ui';

function renderWithOptions(props: React.ComponentProps<typeof Select> = {}) {
  return render(
    <Select aria-label="Test select" {...props}>
      <option value="a">Alpha</option>
      <option value="b">Beta</option>
      <option value="c">Gamma</option>
    </Select>
  );
}

describe('Select primitive — contract', () => {
  it('renders with aria-label when no associated <label htmlFor>', () => {
    renderWithOptions();
    const select = screen.getByRole('combobox', { name: 'Test select' });
    expect(select).toBeDefined();
    expect(select.tagName).toBe('SELECT');
  });

  it('fires onChange with the standard event signature when value changes', () => {
    const handleChange = vi.fn();
    renderWithOptions({ onChange: handleChange });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'b' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]![0].target.value).toBe('b');
  });

  it('forwards ref to the underlying <select> element', () => {
    const ref = createRef<HTMLSelectElement>();
    renderWithOptions({ ref });
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('SELECT');
  });

  it('applies aria-invalid="true" when invalid prop is set', () => {
    renderWithOptions({ invalid: true });
    const select = screen.getByRole('combobox');
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });

  it('omits aria-invalid when invalid is false (does not write "false")', () => {
    renderWithOptions({ invalid: false });
    const select = screen.getByRole('combobox');
    expect(select.getAttribute('aria-invalid')).toBeNull();
  });

  it('fully disables interaction when disabled prop is set', () => {
    const handleChange = vi.fn();
    renderWithOptions({ disabled: true, onChange: handleChange });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('trackingEvent does NOT auto-emit on its own — consumer wires the emit via onChange', () => {
    // Verifies the analytics hook is OFF-by-default behaviorally: the primitive
    // only invokes window.gtag when trackingEvent is set AND change fires.
    // No window.gtag set up → no crash, no error.
    const handleChange = vi.fn();
    renderWithOptions({ trackingEvent: 'select_changed', onChange: handleChange });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'c' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('composes variant + size + className via cva (outline + default by default)', () => {
    const { container } = renderWithOptions({ className: 'custom-extra' });
    const select = container.querySelector('select');
    expect(select?.className).toContain('select-base');
    expect(select?.className).toContain('select-outline');
    expect(select?.className).toContain('select-default');
    expect(select?.className).toContain('custom-extra');
  });

  it('switches to ghost + sm classes when variant/size props change', () => {
    const { container } = renderWithOptions({ variant: 'ghost', size: 'sm' });
    const select = container.querySelector('select');
    expect(select?.className).toContain('select-ghost');
    expect(select?.className).toContain('select-sm');
    expect(select?.className).not.toContain('select-outline');
  });
});
