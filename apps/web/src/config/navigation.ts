import { NavigationConfig } from '@/types/navigation';
import { ASSET_PATHS } from '@/config/assets';
import { APP_URL, BUSINESS_URL } from '@/config/environment';
import { ROUTES } from '@/config/routes';

// Helper function to generate URLs that work in both dev and production
const createUrl = (path: string): string => {
  // In development, use relative paths
  // In production, Next.js will handle the proper domain
  return path;
};

export const navigationConfig: NavigationConfig = {
  mainMenu: [
    {
      id: 'diboas',
      label: 'common.navigation.diboas.label',
      banner: ASSET_PATHS.NAVIGATION.DIBOAS_BANNER,
      description: 'common.navigation.diboas.description',
      subItems: [
        { id: 'know-diboas', label: 'common.navigation.diboas.subItems.know', href: createUrl(ROUTES.WHY_DIBOAS) },
        { id: 'account', label: 'common.navigation.diboas.subItems.account', href: createUrl(ROUTES.PERSONAL.ACCOUNT) },
        { id: 'banking', label: 'common.navigation.diboas.subItems.banking', href: createUrl(ROUTES.PERSONAL.BANKING) },
        { id: 'investing', label: 'common.navigation.diboas.subItems.investing', href: createUrl(ROUTES.PERSONAL.INVESTING) },
        { id: 'crypto', label: 'common.navigation.diboas.subItems.crypto', href: createUrl(ROUTES.PERSONAL.CRYPTOCURRENCY) },
        { id: 'strategies', label: 'common.navigation.diboas.subItems.strategies', href: createUrl(ROUTES.PERSONAL.DEFI_STRATEGIES) },
        { id: 'credit', label: 'common.navigation.diboas.subItems.credit', href: createUrl(ROUTES.PERSONAL.CREDIT) }
      ]
    },
    {
      id: 'learn',
      label: 'common.navigation.learn.label',
      banner: ASSET_PATHS.NAVIGATION.LEARN_BANNER,
      description: 'common.navigation.learn.description',
      subItems: [
        { id: 'learn-center', label: 'common.navigation.learn.subItems.center', href: createUrl(ROUTES.LEARN.OVERVIEW) },
        { id: 'financial-basics', label: 'common.navigation.learn.subItems.basics', href: createUrl(ROUTES.LEARN.FINANCIAL_BASICS) },
        { id: 'money-management', label: 'common.navigation.learn.subItems.management', href: createUrl(ROUTES.LEARN.MONEY_MANAGEMENT) },
        { id: 'investment-guide', label: 'common.navigation.learn.subItems.investing', href: createUrl(ROUTES.LEARN.INVESTMENT_GUIDE) },
        { id: 'crypto-az', label: 'common.navigation.learn.subItems.crypto', href: createUrl(ROUTES.LEARN.CRYPTOCURRENCY_GUIDE) },
        { id: 'defi-explained', label: 'common.navigation.learn.subItems.defi', href: createUrl(ROUTES.LEARN.DEFI_EXPLAINED) },
        { id: 'special-content', label: 'common.navigation.learn.subItems.special', href: createUrl(ROUTES.LEARN.SPECIAL_CONTENT) }
      ]
    },
    {
      id: 'business',
      label: 'common.navigation.business.label',
      banner: ASSET_PATHS.NAVIGATION.BUSINESS_BANNER,
      description: 'common.navigation.business.description',
      subItems: [
        { id: 'know-business', label: 'common.navigation.business.subItems.know', href: createUrl(ROUTES.BUSINESS.ADVANTAGES) },
        { id: 'business-account', label: 'common.navigation.business.subItems.account', href: createUrl(ROUTES.BUSINESS.ACCOUNT) },
        { id: 'business-bank', label: 'common.navigation.business.subItems.bank', href: createUrl(ROUTES.BUSINESS.BANKING) },
        { id: 'payments', label: 'common.navigation.business.subItems.payments', href: createUrl(ROUTES.BUSINESS.PAYMENTS) },
        { id: 'treasury', label: 'common.navigation.business.subItems.treasury', href: createUrl(ROUTES.BUSINESS.TREASURY) },
        { id: 'cash-flow-yield', label: 'common.navigation.business.subItems.yield', href: createUrl(ROUTES.BUSINESS.YIELD_STRATEGIES) },
        { id: 'p2p-credit', label: 'common.navigation.business.subItems.credit', href: createUrl(ROUTES.BUSINESS.CREDIT_SOLUTIONS) }
      ]
    },
    {
      id: 'rewards',
      label: 'common.navigation.rewards.label',
      banner: ASSET_PATHS.NAVIGATION.REWARDS_BANNER,
      description: 'common.navigation.rewards.description',
      subItems: [
        { id: 'diboas-rewards', label: 'common.navigation.rewards.subItems.program', href: createUrl(ROUTES.REWARDS.OVERVIEW) },
        { id: 'ai-mascot', label: 'common.navigation.rewards.subItems.mascots', href: createUrl(ROUTES.REWARDS.AI_GUIDES) },
        { id: 'referral', label: 'common.navigation.rewards.subItems.referral', href: createUrl(ROUTES.REWARDS.REFERRAL_PROGRAM) },
        { id: 'earn-points', label: 'common.navigation.rewards.subItems.points', href: createUrl(ROUTES.REWARDS.POINTS_SYSTEM) },
        { id: 'badges-leaderboard', label: 'common.navigation.rewards.subItems.badges', href: createUrl(ROUTES.REWARDS.BADGES_LEADERBOARD) },
        { id: 'campaigns', label: 'common.navigation.rewards.subItems.campaigns', href: createUrl(ROUTES.REWARDS.CAMPAIGNS) },
        { id: 'token-airdrop', label: 'common.navigation.rewards.subItems.token', href: createUrl(ROUTES.REWARDS.TOKEN_AIRDROP) }
      ]
    },
    {
      id: 'security',
      label: 'common.navigation.security.label',
      banner: ASSET_PATHS.NAVIGATION.SECURITY_BANNER,
      description: 'common.navigation.security.description',
      subItems: [
        { id: 'protection', label: 'common.navigation.security.subItems.protection', href: createUrl(ROUTES.SECURITY.PROTECTION) },
        { id: 'audit-reports', label: 'common.navigation.security.subItems.audits', href: createUrl(ROUTES.SECURITY.AUDIT_REPORTS) },
        { id: 'stay-safe', label: 'common.navigation.security.subItems.safe', href: createUrl(ROUTES.SECURITY.SAFETY_GUIDE) },
        { id: 'faq', label: 'common.navigation.security.subItems.faq', href: createUrl(ROUTES.HELP.FAQ) }
      ]
    },
    {
      id: 'about',
      label: 'common.navigation.aboutMenu.label',
      banner: ASSET_PATHS.NAVIGATION.ABOUT_BANNER,
      description: 'common.navigation.aboutMenu.description',
      subItems: [
        { id: 'about-diboas', label: 'common.navigation.aboutMenu.subItems.about', href: createUrl(ROUTES.ABOUT) },
        { id: 'protocols', label: 'common.navigation.aboutMenu.subItems.protocols', href: createUrl(ROUTES.PROTOCOLS) },
        { id: 'careers', label: 'common.navigation.aboutMenu.subItems.careers', href: createUrl(ROUTES.CAREERS) },
        { id: 'documentation', label: 'common.navigation.aboutMenu.subItems.documentation', href: createUrl(ROUTES.DOCS) },
        { id: 'investors', label: 'common.navigation.aboutMenu.subItems.investors', href: createUrl(ROUTES.INVESTORS) },
        { id: 'compliance', label: 'common.navigation.aboutMenu.subItems.compliance', href: createUrl(ROUTES.LEGAL.TERMS) }
      ]
    }
  ],

  mobileHighlights: [
    { id: 'benefits', label: 'common.navigation.mobile.highlights.benefits', href: createUrl(ROUTES.WHY_DIBOAS) },
    { id: 'learn', label: 'common.navigation.mobile.highlights.learn', href: createUrl(ROUTES.LEARN.OVERVIEW) },
    { id: 'rewards', label: 'common.navigation.mobile.highlights.rewards', href: createUrl(ROUTES.REWARDS.OVERVIEW) }
  ],

  mobileSections: [
    {
      title: 'common.navigation.mobile.sections.forYou',
      items: [
        { id: 'diboas', label: 'common.navigation.diboas.label', href: createUrl(ROUTES.WHY_DIBOAS) },
        { id: 'learn', label: 'common.navigation.learn.label', href: createUrl(ROUTES.LEARN.OVERVIEW) },
        { id: 'rewards', label: 'common.navigation.rewards.label', href: createUrl(ROUTES.REWARDS.OVERVIEW) }
      ]
    },
    {
      title: 'common.navigation.mobile.sections.forBusiness',
      items: [
        { id: 'business', label: 'common.navigation.business.label', href: createUrl(ROUTES.BUSINESS.ADVANTAGES) }
      ]
    }
  ],

  actions: {
    primary: {
      label: 'common.navigation.actions.primary',
      href: APP_URL,
      variant: 'primary'
    },
    secondary: {
      label: 'common.navigation.actions.secondary',
      href: BUSINESS_URL,
      variant: 'secondary'
    }
  }
};