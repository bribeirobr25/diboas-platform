/**
 * Theme Performance Hook
 * 
 * Domain-Driven Design: Business logic for theme switching performance
 * Service Agnostic Abstraction: Works with any theme system
 * Performance & SEO Optimization: Monitors theme switch performance
 * Monitoring & Observability: Tracks theme system efficiency
 */

import { useCallback } from 'react';
import { useTheme } from '@/lib/theme/theme-manager';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';

export function useThemePerformance() {
  const theme = useTheme();
  const { recordCustomMetric } = usePerformanceMonitoring();

  const setThemeModeWithMonitoring = useCallback((mode: Parameters<typeof theme.setThemeMode>[0]) => {
    const startTime = performance.now();
    const fromTheme = theme.currentTheme;
    
    theme.setThemeMode(mode);
    
    // Record performance after theme change
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      recordCustomMetric('theme_switch_time', switchTime, {
        from_theme: fromTheme,
        to_theme: theme.currentTheme,
        mode: mode
      });
    });
  }, [theme, recordCustomMetric]);

  const toggleThemeWithMonitoring = useCallback(() => {
    const startTime = performance.now();
    const fromTheme = theme.currentTheme;
    
    theme.toggleTheme();
    
    // Record performance after theme toggle
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const switchTime = endTime - startTime;
      
      recordCustomMetric('theme_toggle_time', switchTime, {
        from_theme: fromTheme,
        to_theme: theme.currentTheme
      });
    });
  }, [theme, recordCustomMetric]);

  return {
    ...theme,
    setThemeMode: setThemeModeWithMonitoring,
    toggleTheme: toggleThemeWithMonitoring,
  };
}