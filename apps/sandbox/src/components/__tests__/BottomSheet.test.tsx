// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from '../BottomSheet';

// `common.cancel` added 2026-10-19 (test cleanup): the sheet's close control renders it.
const MESSAGES = { 'test.sheet.title': 'Review your move', 'common.cancel': 'Cancel' };

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

/**
 * `5.566` — the sheet renders into the app frame when one is present (`[data-sheet-root]`),
 * and inline when not (a screen rendered on its own, as in these tests). Its a11y contract
 * holds either way: focus moves into it, Escape dismisses it.
 */
describe('BottomSheet — portals into the frame (5.566)', () => {
  it('should render inside [data-sheet-root] when the frame exists, with focus moved in', () => {
    const frame = document.createElement('div');
    frame.setAttribute('data-sheet-root', '');
    document.body.appendChild(frame);
    const onClose = vi.fn();
    try {
      const { container } = renderSheet({ onClose });
      const dialog = screen.getByRole('dialog');
      expect(frame.contains(dialog)).toBe(true);
      expect(container.contains(dialog)).toBe(false);
      expect(dialog.contains(document.activeElement)).toBe(true);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      frame.remove();
    }
  });

  it('should render inline when no frame exists (unchanged behaviour)', () => {
    const { container } = renderSheet();
    expect(container.contains(screen.getByRole('dialog'))).toBe(true);
  });

  it('should rely on a frame that positions and clips the overlay', () => {
    // happy-dom computes no layout: the two rules that make `inset: 0` mean "the frame"
    // are read from the stylesheets. The browser walk measures the hit-test.
    const shell = readFileSync(join(__dirname, '../shell/AppShell.module.css'), 'utf8');
    const canvas = shell.slice(
      shell.indexOf('.canvas {'),
      shell.indexOf('}', shell.indexOf('.canvas {'))
    );
    expect(canvas).toMatch(/position:\s*relative/);
    expect(canvas).toMatch(/overflow:\s*hidden/);
    const sheet = readFileSync(join(__dirname, '../BottomSheet.module.css'), 'utf8');
    const overlay = sheet.slice(
      sheet.indexOf('.overlay {'),
      sheet.indexOf('}', sheet.indexOf('.overlay {'))
    );
    expect(overlay).toMatch(/position:\s*absolute/);
    expect(overlay).toMatch(/inset:\s*0/);
  });
});

/**
 * The other half of the a11y contract (CLAUDE.md: modals return focus): closing a sheet
 * puts focus back on the control that opened it — inline AND portaled, and after the
 * inline→frame move (final review 2026-10-19), when the trap re-runs but the opener must
 * not be re-captured.
 */
describe('BottomSheet — returns focus to its opener', () => {
  const openFrom = (withFrame: boolean) => {
    const frame = document.createElement('div');
    if (withFrame) {
      frame.setAttribute('data-sheet-root', '');
      document.body.appendChild(frame);
    }
    const opener = document.createElement('button');
    opener.textContent = 'open';
    document.body.appendChild(opener);
    opener.focus();
    const view = renderSheet();
    return {
      opener,
      view,
      cleanup: () => {
        frame.remove();
        opener.remove();
      },
    };
  };

  for (const withFrame of [false, true]) {
    it(`should restore focus to the opener on close (${withFrame ? 'in the frame' : 'inline'})`, () => {
      const { opener, view, cleanup } = openFrom(withFrame);
      try {
        expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
        view.unmount();
        expect(document.activeElement).toBe(opener);
      } finally {
        cleanup();
      }
    });
  }
});
