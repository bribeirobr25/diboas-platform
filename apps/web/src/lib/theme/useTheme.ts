/**
 * Theme React Hook
 *
 * React integration for theme management
 */

import { useState, useEffect } from 'react';
import type { ThemeManager } from './theme-manager';

/**
 * React hook for theme integration
 */
export function createUseTheme(themeManager: ThemeManager) {
  return function useTheme() {
    const [state, setState] = useState(themeManager.getState());

    useEffect(() => {
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
  };
}
