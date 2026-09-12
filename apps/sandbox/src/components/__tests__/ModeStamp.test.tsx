// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ModeStamp } from '../ModeStamp';
import { ModeMarker } from '../ModeMarker';

/**
 * `ModeStamp` — the two attributes, and why they are two (I-1e).
 *
 * `data-mode` is the mode TRUTH from the shell-family registry. `data-palette`
 * is what `tokens.css` keys the provisional practice/real palette off, and it
 * is stamped ONLY when the `modePalette` capability is on. The separation is
 * the thing under test: with the capability off, a Practice surface must state
 * its mode and still render in the approved neutral palette, because the
 * practice values are unreviewed calibration (register `5.282`) and the app is
 * live.
 *
 * If these two ever collapse into one attribute, the next `data-mode` stamp
 * re-tints production. That is the regression this file exists to prevent.
 */

const root = () => document.documentElement;

describe('ModeStamp — mode truth ships, the re-tint waits', () => {
  afterEach(() => {
    root().removeAttribute('data-mode');
    root().removeAttribute('data-palette');
  });

  it.each(['practice', 'real'] as const)(
    'should state %s as the mode truth while the palette stays OFF',
    (mode) => {
      render(<ModeStamp mode={mode} palette={false} />);
      expect(root().getAttribute('data-mode')).toBe(mode);
      // The live app keeps the approved neutral palette until 5.282 is ruled.
      expect(root().hasAttribute('data-palette')).toBe(false);
    }
  );

  it('should stamp the palette too once the capability is cleared', () => {
    render(<ModeStamp mode="practice" palette />);
    expect(root().getAttribute('data-mode')).toBe('practice');
    expect(root().getAttribute('data-palette')).toBe('practice');
  });

  it('should CLEAR a stale mode on a neutral surface, not overwrite it with "neutral"', () => {
    // The S0 case: Welcome / Consent / Entry Readiness carry no financial mode
    // marker at all (P-QA4 / L-QA2). A leftover `practice` attribute from the
    // previous surface would be a false statement about the current one, and
    // `tokens.css` treats an ABSENT attribute as neutral — not the string.
    root().setAttribute('data-mode', 'practice');
    root().setAttribute('data-palette', 'practice');
    render(<ModeStamp mode="neutral" palette />);
    expect(root().hasAttribute('data-mode')).toBe(false);
    expect(root().hasAttribute('data-palette')).toBe(false);
  });

  it('should drop the palette when the capability goes off, keeping the truth', () => {
    const { rerender } = render(<ModeStamp mode="practice" palette />);
    expect(root().getAttribute('data-palette')).toBe('practice');
    rerender(<ModeStamp mode="practice" palette={false} />);
    expect(root().hasAttribute('data-palette')).toBe(false);
    expect(root().getAttribute('data-mode')).toBe('practice');
  });
});

describe('ModeMarker — mode survives without colour, and is never a control', () => {
  it('should state the mode in WORDS for each financial mode', () => {
    // §7.5: "explicit text required" — the label is the signal, colour is only
    // reinforcement. Both labels are the caller's, quoted from §7.1/§7.2.
    const { getByText } = render(<ModeMarker mode="practice" label="PRACTICE · SIMULATED" />);
    expect(getByText('PRACTICE · SIMULATED')).toBeTruthy();
  });

  it('should render NOTHING on a neutral surface (§7.3, P-QA4 / L-QA2)', () => {
    const { container } = render(<ModeMarker mode="neutral" label="PRACTICE · SIMULATED" />);
    expect(container.textContent).toBe('');
  });

  it('should never be interactive (SHELL-3: no unauthorized mode switch)', () => {
    // §10.2: "never implemented as an unauthorized global mode switch". A
    // button or a link here would be a mode-mutating path reachable from the
    // shell, which is what the gate refuses.
    const { container } = render(<ModeMarker mode="practice" label="PRACTICE · SIMULATED" />);
    expect(container.querySelector('button, a, [role="button"], [onclick]')).toBeNull();
    expect(container.firstElementChild?.tagName).toBe('SPAN');
  });

  it('should distinguish the two modes by text alone, so greyscale still works', () => {
    // The same assertion the greyscale story makes visually: strip colour and
    // the two markers still say different things.
    const practice = render(<ModeMarker mode="practice" label="PRACTICE · SIMULATED" />);
    const real = render(<ModeMarker mode="real" label="REAL MONEY" />);
    expect(practice.container.textContent).not.toBe(real.container.textContent);
  });
});
