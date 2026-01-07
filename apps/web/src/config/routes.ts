/**
 * Routes Configuration
 *
 * Configuration Management: Centralized route definitions for the entire application
 * DRY Principles: Single source of truth for all URLs and paths
 * No Hardcoded Values: All routes defined as constants for reusability
 * Type Safety: Type-safe route definitions with readonly constraints
 */

/**
 * Main Marketing Routes
 */
export const ROUTES = {
  // Home & Core
  HOME: '/',
  WHY_DIBOAS: '/why-diboas',

  // Interactive Features
  DREAM_MODE: '/dream-mode',
  CALCULATOR: '/#calculator',
  STRATEGIES: '/strategies',
  FUTURE_YOU: '/future-you',

  // Landing Page Links
  BUSINESS_LANDING: '/business',

  // Personal Products
  PERSONAL: {
    ACCOUNT: '/personal/account',
    BANKING: '/personal/banking',
    CREDIT: '/personal/credit',
    CRYPTOCURRENCY: '/personal/cryptocurrency',
    DEFI_STRATEGIES: '/personal/defi-strategies',
    INVESTING: '/personal/investing',
  },

  // Learning Center
  LEARN: {
    OVERVIEW: '/learn/overview',
    FINANCIAL_BASICS: '/learn/financial-basics',
    MONEY_MANAGEMENT: '/learn/money-management',
    INVESTMENT_GUIDE: '/learn/investment-guide',
    CRYPTOCURRENCY_GUIDE: '/learn/cryptocurrency-guide',
    DEFI_EXPLAINED: '/learn/defi-explained',
    SPECIAL_CONTENT: '/learn/special-content',
  },

  // Business Solutions
  BUSINESS: {
    ADVANTAGES: '/business/advantages',
    ACCOUNT: '/business/account',
    BANKING: '/business/banking',
    PAYMENTS: '/business/payments',
    TREASURY: '/business/treasury',
    YIELD_STRATEGIES: '/business/yield-strategies',
    CREDIT_SOLUTIONS: '/business/credit-solutions',
  },

  // Rewards & Programs
  REWARDS: {
    OVERVIEW: '/rewards/overview',
    AI_GUIDES: '/rewards/ai-guides',
    REFERRAL_PROGRAM: '/rewards/referral-program',
    POINTS_SYSTEM: '/rewards/points-system',
    BADGES_LEADERBOARD: '/rewards/badges-leaderboard',
    CAMPAIGNS: '/rewards/campaigns',
    TOKEN_AIRDROP: '/rewards/token-airdrop',
  },

  // Security & Support
  SECURITY: {
    PROTECTION: '/security/protection',
    AUDIT_REPORTS: '/security/audit-reports',
    SAFETY_GUIDE: '/security/safety-guide',
  },

  HELP: {
    FAQ: '/help/faq',
    CONTACT: '/help/contact',
    GETTING_STARTED: '/help/getting-started',
    TROUBLESHOOTING: '/help/troubleshooting',
    SUPPORT: '/help/support',
  },

  // About & Legal
  ABOUT: '/about',
  PROTOCOLS: '/protocols',
  CAREERS: '/careers',
  DOCS: '/docs',
  INVESTORS: '/investors',
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
  // Flatten the routes object for lookup
  const flatRoutes: Record<string, string> = {};

  const flatten = (obj: any, prefix = ''): void => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        flatRoutes[prefix + key] = value;
      } else if (typeof value === 'object') {
        flatten(value, `${prefix}${key}_`);
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
