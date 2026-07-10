/**
 * SegmentedControl Contract Tests
 *
 * Verifies the public API contract of the UX-36 segmented control
 * (F7-F11 design review, 2026-07-10): aria-pressed toggle-button group,
 * group labelling, onChange semantics (no re-fire on the active segment,
 * no fire on disabled segments), and disabled rendering.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
] as const;

describe('SegmentedControl — contract', () => {
  it('should render a labelled group of real buttons when given options', () => {
    render(<SegmentedControl ariaLabel="Mode" options={OPTIONS} value="a" onChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Mode' });
    expect(group).toBeDefined();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b.tagName).toBe('BUTTON'));
  });

  it('should mark exactly the active segment with aria-pressed="true" when value is set', () => {
    render(<SegmentedControl ariaLabel="Mode" options={OPTIONS} value="b" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-pressed')).toBe(
      'false'
    );
    expect(screen.getByRole('button', { name: 'Beta' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('should fire onChange with the segment value when an inactive segment is clicked', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="a" onChange={handleChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('b');
  });

  it('should NOT fire onChange when the already-active segment is clicked', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="a" onChange={handleChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should disable the button and never fire onChange when an option is disabled', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="Mode"
        options={[OPTIONS[0], { value: 'b', label: 'Beta', disabled: true, title: 'Unavailable' }]}
        value="a"
        onChange={handleChange}
      />
    );
    const beta = screen.getByRole('button', { name: 'Beta' }) as HTMLButtonElement;
    expect(beta.disabled).toBe(true);
    expect(beta.getAttribute('title')).toBe('Unavailable');
    fireEvent.click(beta);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should associate the group with an external label when ariaLabelledby is used', () => {
    render(
      <>
        <span id="ext-label">Country</span>
        <SegmentedControl
          ariaLabelledby="ext-label"
          options={OPTIONS}
          value="a"
          onChange={() => {}}
        />
      </>
    );
    expect(screen.getByRole('group', { name: 'Country' })).toBeDefined();
  });
});
