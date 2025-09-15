import { NavigationConfig } from '@/types/navigation';

export const navigationConfig: NavigationConfig = {
  mainMenu: [
    {
      id: 'diboas',
      label: 'diBoaS',
      banner: '/assets/navigation/diboas-banner.avif',
      description: 'Complete financial ecosystem with banking, investing, and DeFi in one platform',
      subItems: [
        { id: 'know-diboas', label: 'Know diBoaS', href: '/know-diboas' },
        { id: 'account', label: 'diBoaS Account', href: '/account' },
        { id: 'banking', label: 'Banking', href: '/banking' },
        { id: 'investing', label: 'Investing', href: '/investing' },
        { id: 'crypto', label: 'Crypto', href: '/crypto' },
        { id: 'strategies', label: 'Strategies (DeFi)', href: '/strategies' },
        { id: 'credit', label: 'Credit', href: '/credit' }
      ]
    },
    {
      id: 'learn',
      label: 'Learn Center',
      banner: '/assets/navigation/learn-banner.avif',
      description: 'Master your finances with expert guides and educational content',
      subItems: [
        { id: 'learn-center', label: 'The Learn Center', href: '/learn' },
        { id: 'financial-basics', label: 'Financial Basics', href: '/learn/financial-basics' },
        { id: 'money-management', label: 'Money Management', href: '/learn/money-management' },
        { id: 'investment-guide', label: 'Investment Guide', href: '/learn/investment-guide' },
        { id: 'crypto-az', label: 'Crypto A-Z', href: '/learn/crypto' },
        { id: 'defi-explained', label: 'DeFi Explained', href: '/learn/defi' },
        { id: 'special-content', label: 'Special Content', href: '/learn/special' }
      ]
    },
    {
      id: 'business',
      label: 'diBoaS Business',
      banner: '/assets/navigation/business-banner.avif',
      description: 'Complete financial solutions for modern businesses',
      subItems: [
        { id: 'know-business', label: 'Know diBoaS Business', href: '/business' },
        { id: 'business-account', label: 'Business Account', href: '/business/account' },
        { id: 'business-bank', label: 'Business Bank', href: '/business/banking' },
        { id: 'payments', label: 'Payments', href: '/business/payments' },
        { id: 'treasury', label: 'Treasury', href: '/business/treasury' },
        { id: 'cash-flow-yield', label: 'Cash Flow Yield', href: '/business/yield' },
        { id: 'p2p-credit', label: 'P2P Credit', href: '/business/credit' }
      ]
    },
    {
      id: 'rewards',
      label: 'Rewards',
      banner: '/assets/navigation/rewards-banner.avif',
      description: 'Earn rewards and learn with AI-powered mascot guides',
      subItems: [
        { id: 'diboas-rewards', label: 'diBoaS Rewards', href: '/rewards' },
        { id: 'ai-mascot', label: 'AI Mascot Guides', href: '/rewards/mascot-guides' },
        { id: 'referral', label: 'Referral', href: '/rewards/referral' },
        { id: 'earn-points', label: 'Earn Points', href: '/rewards/points' },
        { id: 'badges-leaderboard', label: 'Badges & Leaderboard', href: '/rewards/leaderboard' },
        { id: 'campaigns', label: 'Campaigns', href: '/rewards/campaigns' },
        { id: 'token-airdrop', label: 'Token & Airdrop', href: '/rewards/token' }
      ]
    },
    {
      id: 'security',
      label: 'Security',
      banner: '/assets/navigation/security-banner.avif',
      description: 'Your security is our top priority',
      subItems: [
        { id: 'protection', label: 'diBoaS Protection', href: '/security' },
        { id: 'audit-reports', label: 'Audit & Reports', href: '/security/audits' },
        { id: 'stay-safe', label: 'Stay Safe', href: '/security/safety-tips' },
        { id: 'faq', label: 'FAQ', href: '/security/faq' }
      ]
    },
    {
      id: 'about',
      label: 'About',
      banner: '/assets/navigation/about-banner.avif',
      description: 'Learn more about diBoaS and our mission',
      subItems: [
        { id: 'about-diboas', label: 'More About diBoaS', href: '/about' },
        { id: 'careers', label: 'Join our Team', href: '/careers' },
        { id: 'documentation', label: 'Documentation', href: '/docs' },
        { id: 'investors', label: 'Investors', href: '/investors' },
        { id: 'compliance', label: 'Compliance', href: '/compliance' }
      ]
    }
  ],

  mobileHighlights: [
    { id: 'benefits', label: 'diBoaS Benefits', href: '/benefits' },
    { id: 'learn', label: 'Learn Center', href: '/learn' },
    { id: 'rewards', label: 'Rewards', href: '/rewards' }
  ],

  mobileSections: [
    {
      title: 'For You',
      items: [
        { id: 'diboas', label: 'diBoaS', href: '#' },
        { id: 'learn', label: 'Learn Center', href: '#' },
        { id: 'rewards', label: 'Rewards', href: '#' }
      ]
    },
    {
      title: 'For Business',
      items: [
        { id: 'business', label: 'diBoaS Business', href: '#' }
      ]
    }
  ],

  actions: {
    primary: {
      label: 'Get Started',
      href: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      variant: 'primary'
    },
    secondary: {
      label: 'Business Login',
      href: process.env.NEXT_PUBLIC_BUSINESS_URL || 'http://localhost:3002',
      variant: 'secondary'
    }
  }
};