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

import React from 'react';
import { Logger } from '@/lib/monitoring/Logger';

// Type definitions for Service Agnostic Abstraction
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

export interface ThemeState {
  /**
   * Current active theme variant
   */
  currentTheme: ThemeVariant;
  
  /**
   * System preferences
   */
  systemPreferences: {
    colorScheme: 'light' | 'dark';
    contrast: 'normal' | 'high';
    reducedMotion: boolean;
  };
  
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
 * Theme Manager Service
 * 
 * Provides comprehensive theme management with system integration
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentState: ThemeState;
  private listeners: Set<(event: ThemeChangeEvent) => void> = new Set();
  private mediaQueries: { [key: string]: MediaQueryList } = {};
  private storageKey = 'diboas-theme-preferences';
  
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
   * Error Handling & System Recovery: Safe initialization with fallbacks
   */
  private initializeState(): ThemeState {
    try {
      // Detect system preferences
      const systemPreferences = {
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' as const : 'light' as const,
        contrast: window.matchMedia('(prefers-contrast: high)').matches ? 'high' as const : 'normal' as const,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
      
      // Load user preferences
      const storedPreferences = this.loadStoredPreferences();
      const userPreferences: ThemeConfig = {
        mode: storedPreferences?.mode || 'auto',
        contrast: storedPreferences?.contrast || 'normal',
        enableTransitions: storedPreferences?.enableTransitions ?? !systemPreferences.reducedMotion,
        persist: storedPreferences?.persist ?? true,
        customProperties: storedPreferences?.customProperties || {}
      };
      
      // Determine current theme
      const currentTheme = this.resolveTheme(userPreferences, systemPreferences);
      
      return {
        currentTheme,
        systemPreferences,
        userPreferences,
        availableThemes: ['light', 'dark', 'high-contrast', 'dark-high-contrast']
      };
    } catch (error) {
      Logger.error('Failed to initialize theme state', { error });
      
      // Fallback state
      return {
        currentTheme: 'light',
        systemPreferences: {
          colorScheme: 'light',
          contrast: 'normal',
          reducedMotion: false
        },
        userPreferences: {
          mode: 'light',
          contrast: 'normal',
          enableTransitions: true,
          persist: true
        },
        availableThemes: ['light', 'dark', 'high-contrast', 'dark-high-contrast']
      };
    }
  }
  
  /**
   * Setup media query listeners for system preference changes
   * Performance & SEO Optimization: Efficient system preference tracking
   */
  private setupMediaQueryListeners(): void {
    try {
      // Color scheme preference
      this.mediaQueries.colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueries.colorScheme.addEventListener('change', this.handleSystemPreferenceChange.bind(this));
      
      // Contrast preference
      this.mediaQueries.contrast = window.matchMedia('(prefers-contrast: high)');
      this.mediaQueries.contrast.addEventListener('change', this.handleSystemPreferenceChange.bind(this));
      
      // Motion preference
      this.mediaQueries.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueries.reducedMotion.addEventListener('change', this.handleSystemPreferenceChange.bind(this));
      
    } catch (error) {
      Logger.warn('Failed to setup media query listeners', { error });
    }
  }
  
  /**
   * Handle system preference changes
   * Monitoring & Observability: Track system preference changes
   */
  private handleSystemPreferenceChange(): void {
    try {
      const newSystemPreferences = {
        colorScheme: this.mediaQueries.colorScheme?.matches ? 'dark' as const : 'light' as const,
        contrast: this.mediaQueries.contrast?.matches ? 'high' as const : 'normal' as const,
        reducedMotion: this.mediaQueries.reducedMotion?.matches
      };
      
      const previousTheme = this.currentState.currentTheme;
      this.currentState.systemPreferences = newSystemPreferences;
      
      // Update transitions based on motion preference
      if (newSystemPreferences.reducedMotion !== this.currentState.userPreferences.enableTransitions) {
        this.updateTransitions(!newSystemPreferences.reducedMotion);
      }
      
      // Resolve new theme if in auto mode
      if (this.currentState.userPreferences.mode === 'auto') {
        const newTheme = this.resolveTheme(this.currentState.userPreferences, newSystemPreferences);
        
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
   * Resolve theme variant based on preferences
   * Domain-Driven Design: Clear theme resolution logic
   */
  private resolveTheme(userPreferences: ThemeConfig, systemPreferences: typeof this.currentState.systemPreferences): ThemeVariant {
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
   * Apply initial theme on startup
   * Performance & SEO Optimization: Prevent flash of unstyled content
   */
  private applyInitialTheme(): void {
    try {
      this.applyTheme(this.currentState.currentTheme, 'auto');
      
      // Apply custom properties if any
      if (this.currentState.userPreferences.customProperties) {
        this.applyCustomProperties(this.currentState.userPreferences.customProperties);
      }
      
      // Setup transitions
      this.updateTransitions(this.currentState.userPreferences.enableTransitions);
      
    } catch (error) {
      Logger.error('Failed to apply initial theme', { error });
    }
  }
  
  /**
   * Apply theme to DOM
   * Service Agnostic Abstraction: Theme application independent of implementation
   */
  private applyTheme(theme: ThemeVariant, trigger: 'user' | 'system' | 'auto'): void {
    try {
      const previousTheme = this.currentState.currentTheme;
      
      // Update DOM attribute
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update state
      this.currentState.currentTheme = theme;
      
      // Create change event
      const changeEvent: ThemeChangeEvent = {
        previousTheme,
        currentTheme: theme,
        trigger,
        timestamp: new Date().toISOString()
      };
      
      // Notify listeners
      this.notifyListeners(changeEvent);
      
      // Persist if enabled
      if (this.currentState.userPreferences.persist) {
        this.persistPreferences();
      }
      
      Logger.info('Theme applied', {
        theme,
        trigger,
        previousTheme
      });
      
    } catch (error) {
      Logger.error('Failed to apply theme', { error, theme, trigger });
    }
  }
  
  /**
   * Apply custom CSS properties
   * No Hard coded values: Dynamic property application
   */
  private applyCustomProperties(properties: Record<string, string>): void {
    try {
      Object.entries(properties).forEach(([property, value]) => {
        if (property.startsWith('--')) {
          document.documentElement.style.setProperty(property, value);
        }
      });
      
      Logger.info('Custom properties applied', { count: Object.keys(properties).length });
      
    } catch (error) {
      Logger.error('Failed to apply custom properties', { error, properties });
    }
  }
  
  /**
   * Update transition settings
   * Performance & SEO Optimization: Respect motion preferences
   */
  private updateTransitions(enable: boolean): void {
    try {
      if (enable) {
        document.documentElement.classList.remove('no-transitions');
      } else {
        document.documentElement.classList.add('no-transitions');
      }
      
      this.currentState.userPreferences.enableTransitions = enable;
      
    } catch (error) {
      Logger.error('Failed to update transitions', { error, enable });
    }
  }
  
  /**
   * Load stored preferences from localStorage
   * Error Handling & System Recovery: Safe preference loading
   */
  private loadStoredPreferences(): Partial<ThemeConfig> | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      Logger.warn('Failed to load stored preferences', { error });
      return null;
    }
  }
  
  /**
   * Persist current preferences to localStorage
   * Service Agnostic Abstraction: Storage implementation details hidden
   */
  private persistPreferences(): void {
    try {
      if (this.currentState.userPreferences.persist) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentState.userPreferences));
      }
    } catch (error) {
      Logger.warn('Failed to persist preferences', { error });
    }
  }
  
  /**
   * Notify all listeners of theme change
   * Monitoring & Observability: Event notification system
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
   * Domain-Driven Design: Clear public API for theme management
   */
  public setThemeMode(mode: ThemeMode): void {
    const previousMode = this.currentState.userPreferences.mode;
    this.currentState.userPreferences.mode = mode;
    
    const newTheme = this.resolveTheme(this.currentState.userPreferences, this.currentState.systemPreferences);
    
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
    
    const newTheme = this.resolveTheme(this.currentState.userPreferences, this.currentState.systemPreferences);
    
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
    
    this.applyCustomProperties(properties);
    
    if (this.currentState.userPreferences.persist) {
      this.persistPreferences();
    }
  }
  
  /**
   * Toggle between light and dark modes
   */
  public toggleTheme(): void {
    const currentMode = this.currentState.userPreferences.mode;
    let newMode: ThemeMode;
    
    if (currentMode === 'auto') {
      // If auto, switch to opposite of system preference
      newMode = this.currentState.systemPreferences.colorScheme === 'dark' ? 'light' : 'dark';
    } else {
      // Toggle between light and dark
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
      this.persistPreferences();
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
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
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
    
    // Clear custom properties
    if (this.currentState.userPreferences.customProperties) {
      Object.keys(this.currentState.userPreferences.customProperties).forEach(property => {
        if (property.startsWith('--')) {
          document.documentElement.style.removeProperty(property);
        }
      });
      
      this.currentState.userPreferences.customProperties = {};
    }
    
    // Enable transitions based on system preference
    this.setTransitions(!this.currentState.systemPreferences.reducedMotion);
    
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
      // Remove media query listeners
      Object.values(this.mediaQueries).forEach(mq => {
        mq.removeEventListener('change', this.handleSystemPreferenceChange.bind(this));
      });
      
      // Clear listeners
      this.listeners.clear();
      
      Logger.info('Theme manager destroyed');
      
    } catch (error) {
      Logger.error('Failed to destroy theme manager', { error });
    }
  }
}

// Export singleton instance for service agnostic access
export const themeManager = ThemeManager.getInstance();

/**
 * React hook for theme integration
 * Service Agnostic Abstraction: Clean React integration
 */
export function useTheme() {
  const [state, setState] = React.useState(themeManager.getState());
  
  React.useEffect(() => {
    const unsubscribe = themeManager.addListener(() => {
      setState(themeManager.getState());
    });
    
    return unsubscribe;
  }, []);
  
  return {
    ...state,
    setThemeMode: themeManager.setThemeMode.bind(themeManager),
    setContrastMode: themeManager.setContrastMode.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager),
    setTransitions: themeManager.setTransitions.bind(themeManager),
    setCustomProperties: themeManager.setCustomProperties.bind(themeManager),
    resetToSystem: themeManager.resetToSystem.bind(themeManager),
    isDarkMode: themeManager.isDarkMode.bind(themeManager),
    isHighContrast: themeManager.isHighContrast.bind(themeManager)
  };
}