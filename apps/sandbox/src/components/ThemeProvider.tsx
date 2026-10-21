'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { THEME_STORAGE_KEY } from './ThemeScript';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = THEME_STORAGE_KEY;

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
  // R-9: `matchMedia` is absent in some embedded webviews; the warm default then holds.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
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
  /* Z13 (lane audit 2026-10-21): another tab's toggle writes the stored theme, which this
     tab's snapshot reads, but only a toggle or the first load paints `data-theme`, so the
     control described one theme while the page showed another. With no in-session choice
     here, follow the stored one and repaint. */
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    if (override === null) document.documentElement.setAttribute('data-theme', currentTheme());
    onChange();
  };
  window.addEventListener('storage', onStorage);
  // Each subscriber owns its OS-preference listener, so unsubscribing one never
  // detaches another's (correct even if more than one provider ever mounts).
  const mq =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
  const onSystemChange = () => onChange();
  mq?.addEventListener('change', onSystemChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
    mq?.removeEventListener('change', onSystemChange);
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
