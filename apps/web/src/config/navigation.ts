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
      label: 'diBoaS',
      banner: ASSET_PATHS.NAVIGATION.DIBOAS_BANNER,
      description: 'Complete financial ecosystem with banking, investing, and DeFi in one platform',
      subItems: [
        { id: 'know-diboas', label: 'Know diBoaS', href: createUrl('/benefits') },
        { id: 'account', label: 'diBoaS Account', href: createUrl('/account') },
        { id: 'banking', label: 'Banking', href: createUrl('/banking-services') },
        { id: 'investing', label: 'Investing', href: createUrl('/investing') },
        { id: 'crypto', label: 'Crypto', href: createUrl('/cryptocurrency') },
        { id: 'strategies', label: 'Strategies (DeFi)', href: createUrl('/defi-strategies') },
        { id: 'credit', label: 'Credit', href: createUrl('/credit') }
      ]
    },
    {
      id: 'learn',
      label: 'Learn Center',
      banner: ASSET_PATHS.NAVIGATION.LEARN_BANNER,
      description: 'Master your finances with expert guides and educational content',
      subItems: [
        { id: 'learn-center', label: 'The Learn Center', href: createUrl('/learn/benefits') },
        { id: 'financial-basics', label: 'Financial Basics', href: createUrl('/learn/financial-basics') },
        { id: 'money-management', label: 'Money Management', href: createUrl('/learn/money-management') },
        { id: 'investment-guide', label: 'Investment Guide', href: createUrl('/learn/investment-guide') },
        { id: 'crypto-az', label: 'Crypto A-Z', href: createUrl('/learn/cryptocurrency-guide') },
        { id: 'defi-explained', label: 'DeFi Explained', href: createUrl('/learn/defi-explained') },
        { id: 'special-content', label: 'Special Content', href: createUrl('/learn/special-content') }
      ]
    },
    {
      id: 'business',
      label: 'diBoaS Business',
      banner: ASSET_PATHS.NAVIGATION.BUSINESS_BANNER,
      description: 'Complete financial solutions for modern businesses',
      subItems: [
        { id: 'know-business', label: 'Know diBoaS Business', href: createUrl('/business/benefits') },
        { id: 'business-account', label: 'Business Account', href: createUrl('/business/account') },
        { id: 'business-bank', label: 'Business Bank', href: createUrl('/business/banking') },
        { id: 'payments', label: 'Payments', href: createUrl('/business/payments') },
        { id: 'treasury', label: 'Treasury', href: createUrl('/business/treasury') },
        { id: 'cash-flow-yield', label: 'Cash Flow Yield', href: createUrl('/business/yield-strategies') },
        { id: 'p2p-credit', label: 'P2P Credit', href: createUrl('/business/credit-solutions') }
      ]
    },
    {
      id: 'rewards',
      label: 'Rewards',
      banner: ASSET_PATHS.NAVIGATION.REWARDS_BANNER,
      description: 'Earn rewards and learn with AI-powered mascot guides',
      subItems: [
        { id: 'diboas-rewards', label: 'diBoaS Rewards', href: createUrl('/rewards/benefits') },
        { id: 'ai-mascot', label: 'AI Mascot Guides', href: createUrl('/rewards/ai-guides') },
        { id: 'referral', label: 'Referral', href: createUrl('/rewards/referral-program') },
        { id: 'earn-points', label: 'Earn Points', href: createUrl('/rewards/points-system') },
        { id: 'badges-leaderboard', label: 'Badges & Learderboard', href: createUrl('/rewards/badges-leaderboard') },
        { id: 'campaigns', label: 'Campaigns', href: createUrl('/rewards/campaigns') },
        { id: 'token-airdrop', label: 'Token & Airdrop', href: createUrl('/rewards/token-airdrop') }
      ]
    },
    {
      id: 'security',
      label: 'Security',
      banner: ASSET_PATHS.NAVIGATION.SECURITY_BANNER,
      description: 'Your security is our top priority',
      subItems: [
        { id: 'protection', label: 'diBoaS Protection', href: createUrl('/security/benefits') },
        { id: 'audit-reports', label: 'Audit & Reports', href: createUrl('/security/audit-reports') },
        { id: 'stay-safe', label: 'Stay Safe', href: createUrl('/security/safety-guide') },
        { id: 'faq', label: 'FAQ', href: createUrl('/help/faq') }
      ]
    },
    {
      id: 'about',
      label: 'About',
      banner: ASSET_PATHS.NAVIGATION.ABOUT_BANNER,
      description: 'Learn more about diBoaS and our mission',
      subItems: [
        { id: 'about-diboas', label: 'More About diBoaS', href: createUrl('/about') },
        { id: 'careers', label: 'Join our Team', href: createUrl('/careers') },
        { id: 'documentation', label: 'Documentation', href: createUrl('/docs') },
        { id: 'investors', label: 'Investors', href: createUrl('/investors') },
        { id: 'compliance', label: 'Compliance', href: createUrl('/legal/terms') }
      ]
    }
  ],

  mobileHighlights: [
    { id: 'benefits', label: 'diBoaS Benefits', href: createUrl('/benefits') },
    { id: 'learn', label: 'Learn Center', href: createUrl('/learn/benefits') },
    { id: 'rewards', label: 'Rewards', href: createUrl('/rewards/benefits') }
  ],

  mobileSections: [
    {
      title: 'For You',
      items: [
        { id: 'diboas', label: 'diBoaS', href: createUrl('/benefits') },
        { id: 'learn', label: 'Learn Center', href: createUrl('/learn/benefits') },
        { id: 'rewards', label: 'Rewards', href: createUrl('/rewards/benefits') }
      ]
    },
    {
      title: 'For Business',
      items: [
        { id: 'business', label: 'diBoaS Business', href: createUrl('/business/benefits') }
      ]
    }
  ],

  actions: {
    primary: {
      label: 'Get Started',
      href: APP_URL,
      variant: 'primary'
    },
    secondary: {
      label: 'Business Login',
      href: BUSINESS_URL,
      variant: 'secondary'
    }
  }
};