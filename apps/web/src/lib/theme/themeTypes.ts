/**
 * Theme Type Definitions
 *
 * Type definitions for the theme management system
 */

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ContrastMode = 'normal' | 'high';
export type ThemeVariant = 'light' | 'dark' | 'high-contrast' | 'dark-high-contrast';

export interface ThemeConfig {
  /**
   * Current theme mode
   */
  mode: ThemeMode;

  /**
   * Contrast preference
   */
  contrast: ContrastMode;

  /**
   * Custom theme overrides
   */
  customProperties?: Record<string, string>;

  /**
   * Enable theme transitions
   */
  enableTransitions: boolean;

  /**
   * Persist theme preference
   */
  persist: boolean;
}

export interface SystemPreferences {
  colorScheme: 'light' | 'dark';
  contrast: 'normal' | 'high';
  reducedMotion: boolean;
}

export interface ThemeState {
  /**
   * Current active theme variant
   */
  currentTheme: ThemeVariant;

  /**
   * System preferences
   */
  systemPreferences: SystemPreferences;

  /**
   * User preferences
   */
  userPreferences: ThemeConfig;

  /**
   * Theme availability
   */
  availableThemes: ThemeVariant[];
}

export interface ThemeChangeEvent {
  previousTheme: ThemeVariant;
  currentTheme: ThemeVariant;
  trigger: 'user' | 'system' | 'auto';
  timestamp: string;
}

/**
 * Available theme variants
 */
export const AVAILABLE_THEMES: ThemeVariant[] = [
  'light',
  'dark',
  'high-contrast',
  'dark-high-contrast'
];

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'auto',
  contrast: 'normal',
  enableTransitions: true,
  persist: true
};

/**
 * Storage key for theme preferences
 */
export const THEME_STORAGE_KEY = 'diboas-theme-preferences';
