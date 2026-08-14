// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, __resetThemeStore, useTheme } from '../ThemeProvider';

/** A tiny consumer that surfaces the effective theme + the toggle. */
function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} data-testid="probe">
      {theme}
    </button>
  );
}

/** Stub matchMedia so the OS-preference branch is controllable per test. */
function setSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: dark,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList
  );
}

beforeEach(() => {
  __resetThemeStore();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  setSystemDark(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeProvider — the light/dark chooser store', () => {
  it('should default to the OS preference when nothing is stored (light)', () => {
    setSystemDark(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('light');
  });

  it('should default to dark when the OS prefers dark and nothing is stored', () => {
    setSystemDark(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('dark');
  });

  it('should honor an explicit stored choice over the OS preference', () => {
    setSystemDark(true); // OS says dark...
    localStorage.setItem('sb-theme', 'light'); // ...but the user chose light
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('light');
  });

  it('should toggle, persist the choice, and stamp <html data-theme>', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('light');

    fireEvent.click(screen.getByTestId('probe'));

    expect(screen.getByTestId('probe').textContent).toBe('dark');
    expect(localStorage.getItem('sb-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should ignore a malformed stored value and fall back to the OS preference', () => {
    localStorage.setItem('sb-theme', 'chartreuse');
    setSystemDark(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('probe').textContent).toBe('dark');
  });
});
