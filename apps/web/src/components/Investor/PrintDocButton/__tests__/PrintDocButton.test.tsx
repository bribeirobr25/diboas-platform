/**
 * PrintDocButton — behavior contract.
 *
 * A native button that opens the browser print dialog. We assert it renders the
 * label and invokes window.print() on click (SSR-safe via a feature check).
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrintDocButton } from '../PrintDocButton';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PrintDocButton', () => {
  it('should render the label as a button', () => {
    render(<PrintDocButton label="Download PDF" />);
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeTruthy();
  });

  it('should call window.print() when clicked', () => {
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    render(<PrintDocButton label="Download PDF" />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
