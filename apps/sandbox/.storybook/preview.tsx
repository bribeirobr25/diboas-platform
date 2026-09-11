import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import type { Decorator, Preview } from '@storybook/react';
import { SANDBOX_LOCALES, type SandboxLocale } from '../src/i18n/config';
import { getMessages } from '../src/i18n/loadMessages';
import '../src/styles/tokens.css';
import '../src/styles/globals.css';

/**
 * The six themes and the four locales, as toolbar switches.
 *
 * Appearance × mode is the Minimum UI System §4.2 matrix (`neutral` /
 * `practice` / `real` × light / dark), and a story is only evidence if it can
 * be seen in each. Both are stamped on the story iframe's own
 * `documentElement`, which is exactly where the app stamps them — the token
 * roles are computed at `:root`, so stamping a wrapper div would re-point the
 * ramp without recomputing the roles that read it (`tokens.css` says so).
 *
 * `data-palette` carries the mode PALETTE and `data-mode` the mode TRUTH. Only
 * `data-palette` re-points the ramp — `tokens.css` keys its mode blocks off
 * that attribute and nothing else, so stating a mode paints nothing. The
 * separation exists because the practice/real values are provisional
 * calibration (register `5.282`): the truth ships, the re-tint waits for
 * Product. Here both follow the toolbar, which is the point of a calibration
 * surface: this is where the provisional values are meant to be seen.
 *
 * (For one commit the token file keyed the ramp off `data-mode` instead, so the
 * live app re-tinted the moment the shell stated its mode. A screenshot caught
 * it; the suite had asserted the attribute rather than the resolved colour.)
 */
const THEMES = ['light', 'dark'] as const;
const MODES = ['neutral', 'practice', 'real'] as const;

const withShellEnvironment: Decorator = (Story, context) => {
  const { theme, mode, locale } = context.globals as {
    theme: (typeof THEMES)[number];
    mode: (typeof MODES)[number];
    locale: SandboxLocale;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (mode === 'neutral') {
      root.removeAttribute('data-mode');
      root.removeAttribute('data-palette');
    } else {
      root.setAttribute('data-mode', mode);
      root.setAttribute('data-palette', mode);
    }
  }, [theme, mode]);

  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} onError={() => {}}>
      {/* The app canvas, so a shell story sits in the width it ships in. */}
      <div style={{ background: 'var(--sb-canvas-base)', minHeight: '100vh' }}>
        <Story />
      </div>
    </IntlProvider>
  );
};

const preview: Preview = {
  decorators: [withShellEnvironment],
  globalTypes: {
    theme: {
      description: 'Appearance',
      defaultValue: 'light',
      toolbar: { icon: 'circlehollow', items: [...THEMES], dynamicTitle: true },
    },
    mode: {
      description: 'Product mode (truth + provisional palette)',
      defaultValue: 'neutral',
      toolbar: { icon: 'paintbrush', items: [...MODES], dynamicTitle: true },
    },
    locale: {
      description: 'Locale',
      defaultValue: 'en',
      toolbar: { icon: 'globe', items: [...SANDBOX_LOCALES], dynamicTitle: true },
    },
  },
  parameters: {
    layout: 'fullscreen',
    // Contrast is asserted mechanically by `tokenArchitecture.test.ts` across
    // all six themes; the addon is here for the structural rules a token test
    // cannot see (names, roles, focus order) while a state is on screen.
    a11y: { test: 'error' },
  },
};

export default preview;
