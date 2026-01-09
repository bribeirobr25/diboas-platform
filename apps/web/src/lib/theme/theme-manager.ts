/**
 * Theme Management Service
 *
 * Domain-Driven Design: Centralized theme management with clear interfaces
 * Service Agnostic Abstraction: Works with any theme system implementation
 * Performance & SEO Optimization: Efficient theme switching and persistence
 * Error Handling & System Recovery: Graceful fallbacks for theme issues
 * Monitoring & Observability: Theme analytics and performance tracking
 * No Hard coded values: All themes defined through design tokens
 */

import { Logger } from '@/lib/monitoring/Logger';

// Import from extracted modules
import {
  AVAILABLE_THEMES,
  DEFAULT_THEME_CONFIG,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ContrastMode,
  type ThemeVariant,
  type ThemeConfig,
  type ThemeState,
  type ThemeChangeEvent,
  type SystemPreferences
} from './themeTypes';

import {
  resolveTheme,
  detectSystemPreferences,
  loadStoredPreferences,
  persistPreferences,
  clearStoredPreferences,
  applyThemeToDOM,
  applyCustomPropertiesToDOM,
  removeCustomPropertiesFromDOM,
  updateTransitionsInDOM
} from './themeUtils';

import { createUseTheme } from './useTheme';

// Re-export types for backwards compatibility
export type {
  ThemeMode,
  ContrastMode,
  ThemeVariant,
  ThemeConfig,
  ThemeState,
  ThemeChangeEvent,
  SystemPreferences
};

export {
  AVAILABLE_THEMES,
  DEFAULT_THEME_CONFIG,
  THEME_STORAGE_KEY
};

/**
 * Theme Manager Service
 *
 * Provides comprehensive theme management with system integration
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentState: ThemeState;
  private listeners: Set<(event: ThemeChangeEvent) => void> = new Set();
  private mediaQueries: { [key: string]: MediaQueryList } = {};

  private constructor() {
    this.currentState = this.initializeState();
    this.setupMediaQueryListeners();
    this.applyInitialTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Initialize theme state from system and stored preferences
   */
  private initializeState(): ThemeState {
    try {
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
    } catch (error) {
      Logger.error('Failed to initialize theme state', { error });

      return {
        currentTheme: 'light',
        systemPreferences: {
          colorScheme: 'light',
          contrast: 'normal',
          reducedMotion: false
        },
        userPreferences: { ...DEFAULT_THEME_CONFIG },
        availableThemes: [...AVAILABLE_THEMES]
      };
    }
  }

  /**
   * Setup media query listeners for system preference changes
   */
  private setupMediaQueryListeners(): void {
    if (typeof window === 'undefined') return;

    try {
      this.mediaQueries.colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueries.colorScheme.addEventListener('change', this.handleSystemPreferenceChange.bind(this));

      this.mediaQueries.contrast = window.matchMedia('(prefers-contrast: high)');
      this.mediaQueries.contrast.addEventListener('change', this.handleSystemPreferenceChange.bind(this));

      this.mediaQueries.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueries.reducedMotion.addEventListener('change', this.handleSystemPreferenceChange.bind(this));

    } catch (error) {
      Logger.warn('Failed to setup media query listeners', { error });
    }
  }

  /**
   * Handle system preference changes
   */
  private handleSystemPreferenceChange(): void {
    try {
      const newSystemPreferences: SystemPreferences = {
        colorScheme: this.mediaQueries.colorScheme?.matches ? 'dark' : 'light',
        contrast: this.mediaQueries.contrast?.matches ? 'high' : 'normal',
        reducedMotion: this.mediaQueries.reducedMotion?.matches ?? false
      };

      const previousTheme = this.currentState.currentTheme;
      this.currentState.systemPreferences = newSystemPreferences;

      if (newSystemPreferences.reducedMotion !== this.currentState.userPreferences.enableTransitions) {
        this.updateTransitions(!newSystemPreferences.reducedMotion);
      }

      if (this.currentState.userPreferences.mode === 'auto') {
        const newTheme = resolveTheme(this.currentState.userPreferences, newSystemPreferences);

        if (newTheme !== previousTheme) {
          this.applyTheme(newTheme, 'system');
        }
      }

      Logger.info('System preferences changed', {
        previousTheme,
        currentTheme: this.currentState.currentTheme,
        systemPreferences: newSystemPreferences
      });

    } catch (error) {
      Logger.error('Failed to handle system preference change', { error });
    }
  }

  /**
   * Apply initial theme on startup
   */
  private applyInitialTheme(): void {
    try {
      this.applyTheme(this.currentState.currentTheme, 'auto');

      if (this.currentState.userPreferences.customProperties) {
        applyCustomPropertiesToDOM(this.currentState.userPreferences.customProperties);
      }

      this.updateTransitions(this.currentState.userPreferences.enableTransitions);

    } catch (error) {
      Logger.error('Failed to apply initial theme', { error });
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: ThemeVariant, trigger: 'user' | 'system' | 'auto'): void {
    try {
      const previousTheme = this.currentState.currentTheme;

      applyThemeToDOM(theme);
      this.currentState.currentTheme = theme;

      const changeEvent: ThemeChangeEvent = {
        previousTheme,
        currentTheme: theme,
        trigger,
        timestamp: new Date().toISOString()
      };

      this.notifyListeners(changeEvent);

      if (this.currentState.userPreferences.persist) {
        persistPreferences(this.currentState.userPreferences);
      }

      Logger.info('Theme applied', { theme, trigger, previousTheme });

    } catch (error) {
      Logger.error('Failed to apply theme', { error, theme, trigger });
    }
  }

  /**
   * Update transition settings
   */
  private updateTransitions(enable: boolean): void {
    try {
      updateTransitionsInDOM(enable);
      this.currentState.userPreferences.enableTransitions = enable;
    } catch (error) {
      Logger.error('Failed to update transitions', { error, enable });
    }
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(event: ThemeChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        Logger.error('Theme listener error', { error });
      }
    });
  }

  // Public API

  /**
   * Set theme mode
   */
  public setThemeMode(mode: ThemeMode): void {
    const previousMode = this.currentState.userPreferences.mode;
    this.currentState.userPreferences.mode = mode;

    const newTheme = resolveTheme(this.currentState.userPreferences, this.currentState.systemPreferences);

    if (newTheme !== this.currentState.currentTheme) {
      this.applyTheme(newTheme, 'user');
    }

    Logger.info('Theme mode changed', { previousMode, newMode: mode, resultingTheme: newTheme });
  }

  /**
   * Set contrast mode
   */
  public setContrastMode(contrast: ContrastMode): void {
    const previousContrast = this.currentState.userPreferences.contrast;
    this.currentState.userPreferences.contrast = contrast;

    const newTheme = resolveTheme(this.currentState.userPreferences, this.currentState.systemPreferences);

    if (newTheme !== this.currentState.currentTheme) {
      this.applyTheme(newTheme, 'user');
    }

    Logger.info('Contrast mode changed', { previousContrast, newContrast: contrast, resultingTheme: newTheme });
  }

  /**
   * Set custom theme properties
   */
  public setCustomProperties(properties: Record<string, string>): void {
    this.currentState.userPreferences.customProperties = {
      ...this.currentState.userPreferences.customProperties,
      ...properties
    };

    applyCustomPropertiesToDOM(properties);

    if (this.currentState.userPreferences.persist) {
      persistPreferences(this.currentState.userPreferences);
    }
  }

  /**
   * Toggle between light and dark modes
   */
  public toggleTheme(): void {
    const currentMode = this.currentState.userPreferences.mode;
    let newMode: ThemeMode;

    if (currentMode === 'auto') {
      newMode = this.currentState.systemPreferences.colorScheme === 'dark' ? 'light' : 'dark';
    } else {
      newMode = currentMode === 'dark' ? 'light' : 'dark';
    }

    this.setThemeMode(newMode);
  }

  /**
   * Enable or disable theme transitions
   */
  public setTransitions(enable: boolean): void {
    this.updateTransitions(enable);

    if (this.currentState.userPreferences.persist) {
      persistPreferences(this.currentState.userPreferences);
    }
  }

  /**
   * Get current theme state
   */
  public getState(): Readonly<ThemeState> {
    return { ...this.currentState };
  }

  /**
   * Get current theme variant
   */
  public getCurrentTheme(): ThemeVariant {
    return this.currentState.currentTheme;
  }

  /**
   * Check if dark mode is active
   */
  public isDarkMode(): boolean {
    return this.currentState.currentTheme.includes('dark');
  }

  /**
   * Check if high contrast is active
   */
  public isHighContrast(): boolean {
    return this.currentState.currentTheme.includes('contrast');
  }

  /**
   * Add theme change listener
   */
  public addListener(listener: (event: ThemeChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove theme change listener
   */
  public removeListener(listener: (event: ThemeChangeEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Reset to system preferences
   */
  public resetToSystem(): void {
    this.setThemeMode('auto');
    this.setContrastMode('normal');

    if (this.currentState.userPreferences.customProperties) {
      removeCustomPropertiesFromDOM(this.currentState.userPreferences.customProperties);
      this.currentState.userPreferences.customProperties = {};
    }

    this.setTransitions(!this.currentState.systemPreferences.reducedMotion);
    clearStoredPreferences();

    Logger.info('Theme reset to system preferences');
  }

  /**
   * Get available themes
   */
  public getAvailableThemes(): ThemeVariant[] {
    return [...this.currentState.availableThemes];
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    try {
      Object.values(this.mediaQueries).forEach(mq => {
        mq.removeEventListener('change', this.handleSystemPreferenceChange.bind(this));
      });

      this.listeners.clear();
      Logger.info('Theme manager destroyed');

    } catch (error) {
      Logger.error('Failed to destroy theme manager', { error });
    }
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();

// Create and export React hook using factory
export const useTheme = createUseTheme(themeManager);
