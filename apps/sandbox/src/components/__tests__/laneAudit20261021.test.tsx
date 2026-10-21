// @vitest-environment happy-dom
import { act, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { getMessages } from '@/i18n/loadMessages';
import AppLoading from '@/app/[locale]/(app)/loading';
import WelcomePage from '@/app/[locale]/welcome/page';
import ConsentPage from '@/app/[locale]/consent/page';
import ClaimPage from '@/app/[locale]/claim/page';
import { ModeStamp } from '../ModeStamp';
import { Settlement } from '../Settlement';
import { ThemeProvider, useTheme, __resetThemeStore } from '../ThemeProvider';
import { THEME_STORAGE_KEY } from '../ThemeScript';
import { recurringAmountBooks } from '@/view/home';

/**
 * Lane audit 2026-10-21 — the component-side fixes, each pinned to the requirement it
 * restores (R3 WCAG 4.1.3, R2 WCAG 1.3.1, C4 the stamp invariant, Z12/Z13 R-9 and one
 * painted truth, Z2 a confirm that books what it says).
 */
const M = getMessages('en');
const withIntl = (ui: ReactElement) =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      {ui}
    </IntlProvider>
  );

describe('the loading state is announced, not silent (R3)', () => {
  it('should put the approved "Loading" words inside the status region', () => {
    withIntl(<AppLoading />);
    expect(screen.getByRole('status').textContent).toContain(M['common.loading']);
  });
});

describe('the public pages have a main landmark (R2)', () => {
  it.each([
    ['welcome', WelcomePage],
    ['consent', ConsentPage],
    ['claim', ClaimPage],
  ] as const)('should render the %s page inside <main>', async (_name, Page) => {
    const element = (await Page({ params: Promise.resolve({ locale: 'en' }) })) as ReactElement;
    expect(element.type).toBe('main');
  });
});

describe('the mode stamp leaves with the shell (C4)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-mode');
    document.documentElement.removeAttribute('data-palette');
  });

  it('should remove data-mode and data-palette when it unmounts', () => {
    const { unmount } = render(<ModeStamp mode="practice" palette />);
    expect(document.documentElement.getAttribute('data-mode')).toBe('practice');
    unmount();
    expect(document.documentElement.hasAttribute('data-mode')).toBe(false);
    expect(document.documentElement.hasAttribute('data-palette')).toBe(false);
  });
});

describe('a missing matchMedia does not break the entry flow or the theme (Z12)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    __resetThemeStore();
  });

  it('should run the settlement and render the theme without matchMedia', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', undefined);
    const done = vi.fn();
    expect(() =>
      withIntl(
        <ThemeProvider>
          <Settlement onComplete={done} />
        </ThemeProvider>
      )
    ).not.toThrow();
  });
});

describe('another tab’s theme choice repaints this tab (Z13)', () => {
  afterEach(() => {
    __resetThemeStore();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  function Probe() {
    return <span data-testid="theme">{useTheme().theme}</span>;
  }

  it('should follow a stored change from another tab, in state and on <html>', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    });
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('recurring Confirm books what it offers (Z2)', () => {
  it('should refuse an amount that books 0.00 and accept one that books a cent', () => {
    expect(recurringAmountBooks('0.004')).toBe(false);
    expect(recurringAmountBooks('0')).toBe(false);
    expect(recurringAmountBooks('')).toBe(false);
    expect(recurringAmountBooks('abc')).toBe(false);
    expect(recurringAmountBooks('0.005')).toBe(true);
    expect(recurringAmountBooks('200')).toBe(true);
  });
});
