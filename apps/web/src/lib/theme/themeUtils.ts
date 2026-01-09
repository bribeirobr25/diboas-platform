/**
 * Theme Utility Functions
 *
 * Helper functions for theme management
 */

import { Logger } from '@/lib/monitoring/Logger';
import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME_CONFIG,
  AVAILABLE_THEMES,
  type ThemeConfig,
  type ThemeVariant,
  type SystemPreferences
} from './themeTypes';

/**
 * Resolve theme variant based on preferences
 */
export function resolveTheme(
  userPreferences: ThemeConfig,
  systemPreferences: SystemPreferences
): ThemeVariant {
  let baseTheme: 'light' | 'dark';

  // Determine base theme
  if (userPreferences.mode === 'auto') {
    baseTheme = systemPreferences.colorScheme;
  } else {
    baseTheme = userPreferences.mode === 'dark' ? 'dark' : 'light';
  }

  // Apply contrast preference
  const contrastMode = userPreferences.contrast === 'high' ? 'high' :
                      systemPreferences.contrast === 'high' ? 'high' : 'normal';

  // Combine base theme and contrast
  if (baseTheme === 'dark' && contrastMode === 'high') {
    return 'dark-high-contrast';
  } else if (baseTheme === 'light' && contrastMode === 'high') {
    return 'high-contrast';
  } else if (baseTheme === 'dark') {
    return 'dark';
  } else {
    return 'light';
  }
}

/**
 * Detect system preferences
 */
export function detectSystemPreferences(): SystemPreferences {
  if (typeof window === 'undefined') {
    return {
      colorScheme: 'light',
      contrast: 'normal',
      reducedMotion: false
    };
  }

  return {
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    contrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' : 'normal',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

/**
 * Load stored preferences from localStorage
 */
export function loadStoredPreferences(): Partial<ThemeConfig> | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    Logger.warn('Failed to load stored preferences', { error });
    return null;
  }
}

/**
 * Persist preferences to localStorage
 */
export function persistPreferences(preferences: ThemeConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    Logger.warn('Failed to persist preferences', { error });
  }
}

/**
 * Clear stored preferences
 */
export function clearStoredPreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    Logger.warn('Failed to clear stored preferences', { error });
  }
}

/**
 * Create default theme state
 */
export function createDefaultThemeState(): {
  currentTheme: ThemeVariant;
  systemPreferences: SystemPreferences;
  userPreferences: ThemeConfig;
  availableThemes: ThemeVariant[];
} {
  const systemPreferences = detectSystemPreferences();
  const storedPreferences = loadStoredPreferences();

  const userPreferences: ThemeConfig = {
    mode: storedPreferences?.mode || DEFAULT_THEME_CONFIG.mode,
    contrast: storedPreferences?.contrast || DEFAULT_THEME_CONFIG.contrast,
    enableTransitions: storedPreferences?.enableTransitions ?? !systemPreferences.reducedMotion,
    persist: storedPreferences?.persist ?? DEFAULT_THEME_CONFIG.persist,
    customProperties: storedPreferences?.customProperties || {}
  };

  const currentTheme = resolveTheme(userPreferences, systemPreferences);

  return {
    currentTheme,
    systemPreferences,
    userPreferences,
    availableThemes: [...AVAILABLE_THEMES]
  };
}

/**
 * Apply theme to DOM
 */
export function applyThemeToDOM(theme: ThemeVariant): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Apply custom CSS properties to DOM
 */
export function applyCustomPropertiesToDOM(properties: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  Object.entries(properties).forEach(([property, value]) => {
    if (property.startsWith('--')) {
      document.documentElement.style.setProperty(property, value);
    }
  });
}

/**
 * Remove custom CSS properties from DOM
 */
export function removeCustomPropertiesFromDOM(properties: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  Object.keys(properties).forEach(property => {
    if (property.startsWith('--')) {
      document.documentElement.style.removeProperty(property);
    }
  });
}

/**
 * Update transition settings in DOM
 */
export function updateTransitionsInDOM(enable: boolean): void {
  if (typeof document === 'undefined') return;

  if (enable) {
    document.documentElement.classList.remove('no-transitions');
  } else {
    document.documentElement.classList.add('no-transitions');
  }
}
