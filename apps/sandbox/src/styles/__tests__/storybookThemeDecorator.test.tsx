// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import preview from '../../../.storybook/preview';

/**
 * The Storybook harness's one load-bearing behaviour (register `5.277`).
 *
 * Storybook is the EVIDENCE surface for I-1's shell components (Strategy Canon
 * §4.3: *"Storybook is the consumer"*), and its evidence is only worth
 * something if the theme it claims to show is the theme actually applied. Two
 * properties matter, and neither is visible in a screenshot:
 *
 * 1. The stamps land on the story iframe's own `documentElement`. The token
 *    roles are computed at `:root` (`tokens.css`), so stamping a wrapper div
 *    would re-point the mode ramp without recomputing the roles that read it —
 *    the story would show a half-applied theme and look like a token bug.
 * 2. **`neutral` CLEARS the stamps.** A decorator that only ever sets
 *    attributes would leave the previous mode stamped when the toolbar returns
 *    to neutral, so `neutral-light` would silently render practice-light — the
 *    one comparison the calibration review (`5.282`) depends on.
 *
 * `data-mode` (truth) and `data-palette` (the provisional palette) are asserted
 * separately because the app stamps them separately, and for a reason: the mode
 * truth can ship before the re-tint is approved.
 */

type Globals = { theme: 'light' | 'dark'; mode: 'neutral' | 'practice' | 'real'; locale: string };

/** `decorators` may be one function or an array — normalise, never cast. */
const decorators = preview.decorators
  ? Array.isArray(preview.decorators)
    ? preview.decorators
    : [preview.decorators]
  : [];
const decorator = decorators[0];

/** Render a story through the real decorator, exactly as Storybook calls it. */
function renderWithGlobals(globals: Globals) {
  if (typeof decorator !== 'function') throw new Error('preview exports no decorator');
  function Harness() {
    // The decorator is invoked during render, which is what makes its hooks
    // legal — the same contract Storybook relies on.
    return decorator(() => <p>story</p>, { globals } as never) as React.ReactElement;
  }
  return render(<Harness />);
}

const root = () => document.documentElement;

describe('the Storybook six-theme decorator', () => {
  afterEach(() => {
    root().removeAttribute('data-theme');
    root().removeAttribute('data-mode');
    root().removeAttribute('data-palette');
  });

  it.each(['light', 'dark'] as const)('should stamp appearance %s on the story root', (theme) => {
    renderWithGlobals({ theme, mode: 'neutral', locale: 'en' });
    expect(root().getAttribute('data-theme')).toBe(theme);
  });

  it.each(['practice', 'real'] as const)(
    'should stamp %s as BOTH the mode truth and the palette',
    (mode) => {
      renderWithGlobals({ theme: 'light', mode, locale: 'en' });
      expect(root().getAttribute('data-mode')).toBe(mode);
      expect(root().getAttribute('data-palette')).toBe(mode);
    }
  );

  it('should CLEAR both stamps when the toolbar returns to neutral', () => {
    // The regression this exists for: a mode left stamped makes neutral-light
    // render as practice-light, and the calibration review would be comparing
    // a theme against itself.
    root().setAttribute('data-mode', 'practice');
    root().setAttribute('data-palette', 'practice');
    renderWithGlobals({ theme: 'light', mode: 'neutral', locale: 'en' });
    expect(root().hasAttribute('data-mode')).toBe(false);
    expect(root().hasAttribute('data-palette')).toBe(false);
  });

  it('should render the story inside a provider, in the chosen locale', () => {
    // A story that throws on a missing translation is not evidence of anything;
    // the decorator owns the intl provider, so a locale switch must not break it.
    const { getByText } = renderWithGlobals({ theme: 'light', mode: 'practice', locale: 'de' });
    expect(getByText('story')).toBeTruthy();
  });
});
