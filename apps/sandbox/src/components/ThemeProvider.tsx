'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sb-theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/* --- External theme store (localStorage + OS preference) -------------------
 * Theme is external state, so it's read with useSyncExternalStore rather than
 * mirrored into an effect. `override` holds an explicit in-session choice; with
 * none, the OS preference wins. A live OS change re-renders via the media query
 * subscription. The pre-paint ThemeScript already stamped <html data-theme>, so
 * there's no flash before this hydrates. */
let override: Theme | null = null;
const listeners = new Set<() => void>();

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  return override ?? storedTheme() ?? systemTheme();
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', emit);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener('change', emit);
  };
}

/** Test-only: reset the module-level store between cases (mirrors the auth
 *  factory's `__resetAuthProvider`). Not used by app code. */
export function __resetThemeStore() {
  override = null;
  listeners.clear();
}

function chooseTheme(next: Theme) {
  override = next;
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode / storage disabled — the in-memory override still holds. */
  }
  emit();
}

/**
 * Two-design chooser (founder 2026-08-14): light (default warm) vs dark (ink).
 * The OS preference is the baseline; the toggle persists an explicit override.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    currentTheme,
    () => 'light' as Theme // server snapshot: matches the un-stamped SSR default
  );

  const toggle = useCallback(() => {
    chooseTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
