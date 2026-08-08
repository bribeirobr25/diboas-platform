// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from '../BottomSheet';

const MESSAGES = { 'test.sheet.title': 'Review your move' };

function renderSheet(props: Partial<Parameters<typeof BottomSheet>[0]> = {}) {
  return render(
    <IntlProvider locale="en" messages={MESSAGES}>
      <BottomSheet titleId="test.sheet.title" onClose={props.onClose ?? vi.fn()} {...props}>
        <p>sheet body</p>
      </BottomSheet>
    </IntlProvider>
  );
}

describe('BottomSheet (harness proof — the first sandbox DOM render test)', () => {
  it('should render an aria-modal dialog with the resolved title', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    // Harness-proof note: this assertion was first written deliberately wrong
    // and CONFIRMED TO FAIL (2026-08-08) — the render path genuinely executes.
    expect(screen.getByText('Review your move')).toBeTruthy();
    expect(screen.getByText('sheet body')).toBeTruthy();
  });

  it('should hide the close button when not dismissible (UX-14)', () => {
    renderSheet({ dismissible: false });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
