import { NavigationConfig } from '@/types/navigation';
import { ASSET_PATHS } from '@/config/assets';
import { APP_URL, BUSINESS_URL } from '@/config/environment';

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
        { id: 'know-diboas', label: 'common.navigation.diboas.subItems.know', href: createUrl('/benefits') },
        { id: 'account', label: 'common.navigation.diboas.subItems.account', href: createUrl('/account') },
        { id: 'banking', label: 'common.navigation.diboas.subItems.banking', href: createUrl('/banking-services') },
        { id: 'investing', label: 'common.navigation.diboas.subItems.investing', href: createUrl('/investing') },
        { id: 'crypto', label: 'common.navigation.diboas.subItems.crypto', href: createUrl('/cryptocurrency') },
        { id: 'strategies', label: 'common.navigation.diboas.subItems.strategies', href: createUrl('/defi-strategies') },
        { id: 'credit', label: 'common.navigation.diboas.subItems.credit', href: createUrl('/credit') }
      ]
    },
    {
      id: 'learn',
      label: 'common.navigation.learn.label',
      banner: ASSET_PATHS.NAVIGATION.LEARN_BANNER,
      description: 'common.navigation.learn.description',
      subItems: [
        { id: 'learn-center', label: 'common.navigation.learn.subItems.center', href: createUrl('/learn/benefits') },
        { id: 'financial-basics', label: 'common.navigation.learn.subItems.basics', href: createUrl('/learn/financial-basics') },
        { id: 'money-management', label: 'common.navigation.learn.subItems.management', href: createUrl('/learn/money-management') },
        { id: 'investment-guide', label: 'common.navigation.learn.subItems.investing', href: createUrl('/learn/investment-guide') },
        { id: 'crypto-az', label: 'common.navigation.learn.subItems.crypto', href: createUrl('/learn/cryptocurrency-guide') },
        { id: 'defi-explained', label: 'common.navigation.learn.subItems.defi', href: createUrl('/learn/defi-explained') },
        { id: 'special-content', label: 'common.navigation.learn.subItems.special', href: createUrl('/learn/special-content') }
      ]
    },
    {
      id: 'business',
      label: 'common.navigation.business.label',
      banner: ASSET_PATHS.NAVIGATION.BUSINESS_BANNER,
      description: 'common.navigation.business.description',
      subItems: [
        { id: 'know-business', label: 'common.navigation.business.subItems.know', href: createUrl('/business/benefits') },
        { id: 'business-account', label: 'common.navigation.business.subItems.account', href: createUrl('/business/account') },
        { id: 'business-bank', label: 'common.navigation.business.subItems.bank', href: createUrl('/business/banking') },
        { id: 'payments', label: 'common.navigation.business.subItems.payments', href: createUrl('/business/payments') },
        { id: 'treasury', label: 'common.navigation.business.subItems.treasury', href: createUrl('/business/treasury') },
        { id: 'cash-flow-yield', label: 'common.navigation.business.subItems.yield', href: createUrl('/business/yield-strategies') },
        { id: 'p2p-credit', label: 'common.navigation.business.subItems.credit', href: createUrl('/business/credit-solutions') }
      ]
    },
    {
      id: 'rewards',
      label: 'common.navigation.rewards.label',
      banner: ASSET_PATHS.NAVIGATION.REWARDS_BANNER,
      description: 'common.navigation.rewards.description',
      subItems: [
        { id: 'diboas-rewards', label: 'common.navigation.rewards.subItems.program', href: createUrl('/rewards/benefits') },
        { id: 'ai-mascot', label: 'common.navigation.rewards.subItems.mascots', href: createUrl('/rewards/ai-guides') },
        { id: 'referral', label: 'common.navigation.rewards.subItems.referral', href: createUrl('/rewards/referral-program') },
        { id: 'earn-points', label: 'common.navigation.rewards.subItems.points', href: createUrl('/rewards/points-system') },
        { id: 'badges-leaderboard', label: 'common.navigation.rewards.subItems.badges', href: createUrl('/rewards/badges-leaderboard') },
        { id: 'campaigns', label: 'common.navigation.rewards.subItems.campaigns', href: createUrl('/rewards/campaigns') },
        { id: 'token-airdrop', label: 'common.navigation.rewards.subItems.token', href: createUrl('/rewards/token-airdrop') }
      ]
    },
    {
      id: 'security',
      label: 'common.navigation.security.label',
      banner: ASSET_PATHS.NAVIGATION.SECURITY_BANNER,
      description: 'common.navigation.security.description',
      subItems: [
        { id: 'protection', label: 'common.navigation.security.subItems.protection', href: createUrl('/security/benefits') },
        { id: 'audit-reports', label: 'common.navigation.security.subItems.audits', href: createUrl('/security/audit-reports') },
        { id: 'stay-safe', label: 'common.navigation.security.subItems.safe', href: createUrl('/security/safety-guide') },
        { id: 'faq', label: 'common.navigation.security.subItems.faq', href: createUrl('/help/faq') }
      ]
    },
    {
      id: 'about',
      label: 'common.navigation.aboutMenu.label',
      banner: ASSET_PATHS.NAVIGATION.ABOUT_BANNER,
      description: 'common.navigation.aboutMenu.description',
      subItems: [
        { id: 'about-diboas', label: 'common.navigation.aboutMenu.subItems.about', href: createUrl('/about') },
        { id: 'careers', label: 'common.navigation.aboutMenu.subItems.careers', href: createUrl('/careers') },
        { id: 'documentation', label: 'common.navigation.aboutMenu.subItems.documentation', href: createUrl('/docs') },
        { id: 'investors', label: 'common.navigation.aboutMenu.subItems.investors', href: createUrl('/investors') },
        { id: 'compliance', label: 'common.navigation.aboutMenu.subItems.compliance', href: createUrl('/legal/terms') }
      ]
    }
  ],

  mobileHighlights: [
    { id: 'benefits', label: 'common.navigation.mobile.highlights.benefits', href: createUrl('/benefits') },
    { id: 'learn', label: 'common.navigation.mobile.highlights.learn', href: createUrl('/learn/benefits') },
    { id: 'rewards', label: 'common.navigation.mobile.highlights.rewards', href: createUrl('/rewards/benefits') }
  ],

  mobileSections: [
    {
      title: 'common.navigation.mobile.sections.forYou',
      items: [
        { id: 'diboas', label: 'common.navigation.diboas.label', href: createUrl('/benefits') },
        { id: 'learn', label: 'common.navigation.learn.label', href: createUrl('/learn/benefits') },
        { id: 'rewards', label: 'common.navigation.rewards.label', href: createUrl('/rewards/benefits') }
      ]
    },
    {
      title: 'common.navigation.mobile.sections.forBusiness',
      items: [
        { id: 'business', label: 'common.navigation.business.label', href: createUrl('/business/benefits') }
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