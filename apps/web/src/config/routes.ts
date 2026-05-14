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
  /**
   * @deprecated 2026-05-13 — renamed to `MARKET` (`/market`). Kept only so
   * any in-flight branches can finish their merges without a constant-undefined
   * compile error. The `next.config.js` 301 redirect catches user traffic.
   * Slated for deletion in iteration 4 of the `/market` integration plan
   * (`docs/audit/MARKET_INTEGRATION_PLAN_2026-05-13.md`).
   */
  DAILY_MARKET: '/daily-market',

  // Landing Page Links
  BUSINESS_LANDING: '/business',

  // About & Info
  ABOUT: '/about',
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
export type RoutePath = typeof ROUTES[keyof typeof ROUTES] | string;
