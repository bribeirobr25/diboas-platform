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
  BENEFITS: '/benefits',
  ACCOUNT: '/account',

  // Banking & Finance
  BANKING_SERVICES: '/banking-services',
  INVESTING: '/investing',
  CRYPTOCURRENCY: '/cryptocurrency',
  DEFI_STRATEGIES: '/defi-strategies',
  CREDIT: '/credit',

  // Learning Center
  LEARN: {
    BENEFITS: '/learn/benefits',
    FINANCIAL_BASICS: '/learn/financial-basics',
    MONEY_MANAGEMENT: '/learn/money-management',
    INVESTMENT_GUIDE: '/learn/investment-guide',
    CRYPTOCURRENCY_GUIDE: '/learn/cryptocurrency-guide',
    DEFI_EXPLAINED: '/learn/defi-explained',
    SPECIAL_CONTENT: '/learn/special-content',
  },

  // Business Solutions
  BUSINESS: {
    BENEFITS: '/business/benefits',
    ACCOUNT: '/business/account',
    BANKING: '/business/banking',
    PAYMENTS: '/business/payments',
    TREASURY: '/business/treasury',
    YIELD_STRATEGIES: '/business/yield-strategies',
    CREDIT_SOLUTIONS: '/business/credit-solutions',
  },

  // Rewards & Programs
  REWARDS: {
    BENEFITS: '/rewards/benefits',
    AI_GUIDES: '/rewards/ai-guides',
    REFERRAL_PROGRAM: '/rewards/referral-program',
    POINTS_SYSTEM: '/rewards/points-system',
    BADGES_LEADERBOARD: '/rewards/badges-leaderboard',
    CAMPAIGNS: '/rewards/campaigns',
    TOKEN_AIRDROP: '/rewards/token-airdrop',
  },

  // Security & Support
  SECURITY: {
    BENEFITS: '/security/benefits',
    AUDIT_REPORTS: '/security/audit-reports',
    SAFETY_GUIDE: '/security/safety-guide',
  },

  HELP: {
    FAQ: '/help/faq',
  },

  // About & Legal
  ABOUT: '/about',
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
