/**
 * @vitest-environment happy-dom
 *
 * The export-key dialog sits inside the demo, whose own Escape handler exits the whole demo.
 * Fifteenth audit: one Escape closed the dialog AND exited the demo.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportKeyModal } from '../ExportKeyModal';

describe('ExportKeyModal inside the demo', () => {
  it('should close on Escape without letting it reach the demo', () => {
    const onClose = vi.fn();
    const exitDemo = vi.fn();
    render(
      <div
        onKeyDown={(e) => {
          if (e.key === 'Escape') exitDemo();
        }}
      >
        <ExportKeyModal onClose={onClose} t={(k) => k} />
      </div>
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(exitDemo).not.toHaveBeenCalled();
  });
});
