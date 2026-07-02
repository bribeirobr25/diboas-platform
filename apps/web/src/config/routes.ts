/**
 * Routes Configuration
 *
 * Centralized route definitions for the application.
 * Marketing page routes removed 2026-04-04 (marketing pages deleted).
 * Only landing-group pages remain.
 */

export const ROUTES = {
  // Home & Core
  HOME: '/',

  // Interactive Features
  DEMO: '/demo',
  DREAM_MODE: '/dream-mode',
  CALCULATOR: '/#calculator',
  STRATEGIES: '/strategies',
  MARKET: '/market',
  TOOLS: '/tools',

  // Landing Page Links
  BUSINESS_LANDING: '/business',

  // About & Info
  ABOUT: '/about',
  INVESTORS: '/investors',
  PROTOCOLS: '/protocols',
  SECURITY: '/security',
  HELP: '/help',
  SHARE: '/share',

  // Learn Center
  LEARN: '/learn',
  LEARN_COMPOUND_INTEREST: '/learn/compound-interest',

  // Legal
  LEGAL: {
    TERMS: '/legal/terms',
    PRIVACY: '/legal/privacy',
    COOKIES: '/legal/cookies',
  },
} as const;

/**
 * Helper function to get route by path
 * Useful for reverse lookups and route matching
 */
export const getRouteById = (id: string): string | undefined => {
  const flatRoutes: Record<string, string> = {};

  const flatten = (obj: Record<string, unknown>, prefix = ''): void => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        flatRoutes[prefix + key] = value;
      } else if (value && typeof value === 'object') {
        flatten(value as Record<string, unknown>, `${prefix}${key}_`);
      }
    });
  };

  flatten(ROUTES);
  return flatRoutes[id];
};

/**
 * Type for route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES] | string;
