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
import { analyticsService } from '@/lib/analytics';

vi.mock('@/lib/analytics', () => ({
  analyticsService: { track: vi.fn() },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(analyticsService.track).mockClear();
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

  it('should fire the investor_pdf_download event with the doc slug when clicked', () => {
    vi.stubGlobal('print', vi.fn());
    render(<PrintDocButton label="Download PDF" docSlug="business-plan" />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(analyticsService.track).toHaveBeenCalledWith({
      name: 'investor_pdf_download',
      parameters: { doc: 'business-plan' },
    });
  });

  it('should fire the event without parameters when no doc slug is provided', () => {
    vi.stubGlobal('print', vi.fn());
    render(<PrintDocButton label="Download PDF" />);
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(analyticsService.track).toHaveBeenCalledWith({ name: 'investor_pdf_download' });
  });
});
