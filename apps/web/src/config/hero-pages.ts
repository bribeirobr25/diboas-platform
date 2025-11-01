/**
 * Hero Pages Configuration
 *
 * Centralized configuration for all page-specific hero sections
 * Each entry defines content, assets, and analytics for a specific page
 *
 * Architecture: Configuration-driven approach following DRY principles
 * - Variant selection: 'default' (with visual assets) or 'fullBackground' (with background image)
 * - Content keys: References to i18n translation strings
 * - Assets: Background images or visual elements
 * - Analytics: Tracking configuration per page
 */

import { DEFAULT_VISUAL_ASSETS } from './hero';
import type { HeroVariantConfig } from './hero';

/**
 * Page-specific Hero Configurations
 * Organized by section for better maintainability
 */
export const HERO_PAGE_CONFIGS: Record<string, Partial<HeroVariantConfig>> = {
  // ============================================================================
  // KNOW DIBOAS SECTION
  // ============================================================================

  'benefits': {
    content: {
      title: 'marketing.pages.benefits.hero.title',
      ctaText: 'marketing.pages.benefits.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/family-trip.avif',
      backgroundImageMobile: '/assets/socials/real/family-trip.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Benefits - Your Complete Financial Journey',
      imageAlt: {
        background: 'Family enjoying trip representing financial freedom and benefits'
      }
    },
    analytics: {
      trackingPrefix: 'hero_benefits',
      enabled: true
    }
  },

  'account': {
    content: {
      title: 'marketing.pages.account.hero.title',
      ctaText: 'marketing.pages.account.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/balance-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/balance-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Account - Free Account with 100% CDI',
      imageAlt: {
        background: 'Financial balance and account management'
      }
    },
    analytics: {
      trackingPrefix: 'hero_account',
      enabled: true
    }
  },

  'banking-services': {
    content: {
      title: 'marketing.pages.bankingServices.hero.title',
      ctaText: 'marketing.pages.bankingServices.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/banking-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/banking-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Banking - Money Without Borders',
      imageAlt: {
        background: 'Global banking services illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_banking',
      enabled: true
    }
  },

  'investing': {
    content: {
      title: 'marketing.pages.investing.hero.title',
      ctaText: 'marketing.pages.investing.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/investing-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/investing-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Investing - Start with Just $10',
      imageAlt: {
        background: 'Investment growth and opportunities'
      }
    },
    analytics: {
      trackingPrefix: 'hero_investing',
      enabled: true
    }
  },

  'cryptocurrency': {
    content: {
      title: 'marketing.pages.cryptocurrency.hero.title',
      ctaText: 'marketing.pages.cryptocurrency.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/crypto-half.avif',
      backgroundImageMobile: '/assets/socials/real/crypto-half.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Crypto - Digital Assets Made Simple',
      imageAlt: {
        background: 'Cryptocurrency and digital assets'
      }
    },
    analytics: {
      trackingPrefix: 'hero_crypto',
      enabled: true
    }
  },

  'defi-strategies': {
    content: {
      title: 'marketing.pages.defiStrategies.hero.title',
      ctaText: 'marketing.pages.defiStrategies.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/strategy-with-text.avif',
      backgroundImageMobile: '/assets/socials/real/strategy-with-text.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS DeFi Strategies - Professional Investment Strategies',
      imageAlt: {
        background: 'DeFi investment strategies illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_defi',
      enabled: true
    }
  },

  'credit': {
    content: {
      title: 'marketing.pages.credit.hero.title',
      ctaText: 'marketing.pages.credit.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/money-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/money-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Credit - Fair and Transparent Credit',
      imageAlt: {
        background: 'Fair credit services illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_credit',
      enabled: true
    }
  },

  // ============================================================================
  // THE LEARN CENTER SECTION
  // ============================================================================

  'learn-benefits': {
    content: {
      title: 'marketing.pages.learnBenefits.hero.title',
      ctaText: 'marketing.pages.learnBenefits.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/learn-banner.avif',
      backgroundImageMobile: '/assets/socials/real/learn-banner.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Learn Center - Financial Education for Everyone',
      imageAlt: {
        background: 'Learning and education illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_learn',
      enabled: true
    }
  },

  'learn-financial-basics': {
    content: {
      title: 'marketing.pages.learnFinancialBasics.hero.title',
      ctaText: 'marketing.pages.learnFinancialBasics.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Financial Basics - Build Your Foundation',
      imageAlt: {
        phone: 'diBoaS mobile application showing financial basics',
        mascot: 'Acqua mascot teaching financial basics',
        background: 'Financial education foundation'
      }
    },
    analytics: {
      trackingPrefix: 'hero_financial_basics',
      enabled: true
    }
  },

  'learn-money-management': {
    content: {
      title: 'marketing.pages.learnMoneyManagement.hero.title',
      ctaText: 'marketing.pages.learnMoneyManagement.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Money Management - Manage Like a Pro',
      imageAlt: {
        phone: 'diBoaS mobile application showing money management tools',
        mascot: 'Acqua mascot guiding money management',
        background: 'Money management illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_money_mgmt',
      enabled: true
    }
  },

  'learn-investment-guide': {
    content: {
      title: 'marketing.pages.learnInvestmentGuide.hero.title',
      ctaText: 'marketing.pages.learnInvestmentGuide.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Investment Guide - Invest with Confidence',
      imageAlt: {
        phone: 'diBoaS mobile application showing investment guide',
        mascot: 'Acqua mascot teaching investment strategies',
        background: 'Investment education illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_invest_guide',
      enabled: true
    }
  },

  'learn-cryptocurrency-guide': {
    content: {
      title: 'marketing.pages.learnCryptocurrencyGuide.hero.title',
      ctaText: 'marketing.pages.learnCryptocurrencyGuide.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Crypto Guide - A to Z on Cryptocurrency',
      imageAlt: {
        phone: 'diBoaS mobile application showing cryptocurrency guide',
        mascot: 'Acqua mascot explaining cryptocurrency',
        background: 'Cryptocurrency education illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_crypto_guide',
      enabled: true
    }
  },

  'learn-defi-explained': {
    content: {
      title: 'marketing.pages.learnDefiExplained.hero.title',
      ctaText: 'marketing.pages.learnDefiExplained.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS DeFi Explained - Decentralized Finance Made Simple',
      imageAlt: {
        phone: 'diBoaS mobile application showing DeFi explanations',
        mascot: 'Acqua mascot explaining DeFi concepts',
        background: 'DeFi education illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_defi_explained',
      enabled: true
    }
  },

  'learn-special-content': {
    content: {
      title: 'marketing.pages.learnSpecialContent.hero.title',
      ctaText: 'marketing.pages.learnSpecialContent.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Special Content - Exclusive Learning Content',
      imageAlt: {
        phone: 'diBoaS mobile application showing special content',
        mascot: 'Acqua mascot presenting exclusive content',
        background: 'Special educational content illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_special_content',
      enabled: true
    }
  },

  // ============================================================================
  // KNOW DIBOAS BUSINESS SECTION
  // ============================================================================

  'business-benefits': {
    content: {
      title: 'marketing.pages.businessBenefits.hero.title',
      ctaText: 'marketing.pages.businessBenefits.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/business-half.avif',
      backgroundImageMobile: '/assets/socials/real/business-half.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Business - Simple and Efficient Business Finances',
      imageAlt: {
        background: 'Business finance illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business',
      enabled: true
    }
  },

  'business-account': {
    content: {
      title: 'marketing.pages.businessAccount.hero.title',
      ctaText: 'marketing.pages.businessAccount.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/growth-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/growth-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Business Account - Free Business Account That Earns',
      imageAlt: {
        background: 'Business growth and account illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_account',
      enabled: true
    }
  },

  'business-banking': {
    content: {
      title: 'marketing.pages.businessBanking.hero.title',
      ctaText: 'marketing.pages.businessBanking.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/operations-half.avif',
      backgroundImageMobile: '/assets/socials/real/operations-half.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Business Banking - Complete Business Banking in Your App',
      imageAlt: {
        background: 'Business operations and banking illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_banking',
      enabled: true
    }
  },

  'business-payments': {
    content: {
      title: 'marketing.pages.businessPayments.hero.title',
      ctaText: 'marketing.pages.businessPayments.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/payment-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/payment-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Business Payments - Simple Billing, Fast Payments',
      imageAlt: {
        background: 'Business payments illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_payments',
      enabled: true
    }
  },

  'business-treasury': {
    content: {
      title: 'marketing.pages.businessTreasury.hero.title',
      ctaText: 'marketing.pages.businessTreasury.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/portfolio-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/portfolio-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Business Treasury - Smart Treasury Management',
      imageAlt: {
        background: 'Business treasury management illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_treasury',
      enabled: true
    }
  },

  'business-yield-strategies': {
    content: {
      title: 'marketing.pages.businessYieldStrategies.hero.title',
      ctaText: 'marketing.pages.businessYieldStrategies.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/growth-with-icon2.avif',
      backgroundImageMobile: '/assets/socials/real/growth-with-icon2.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Cash Flow Yield - Turn Idle Capital into Revenue',
      imageAlt: {
        background: 'Cash flow and yield strategies illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_yield',
      enabled: true
    }
  },

  'business-credit-solutions': {
    content: {
      title: 'marketing.pages.businessCreditSolutions.hero.title',
      ctaText: 'marketing.pages.businessCreditSolutions.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/money-with-icon2.avif',
      backgroundImageMobile: '/assets/socials/real/money-with-icon2.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS P2P Credit - Direct Business-to-Business Credit',
      imageAlt: {
        background: 'P2P business credit illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_business_credit',
      enabled: true
    }
  },

  // ============================================================================
  // DIBOAS REWARDS SECTION
  // ============================================================================

  'rewards-benefits': {
    content: {
      title: 'marketing.pages.rewardsBenefits.hero.title',
      ctaText: 'marketing.pages.rewardsBenefits.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/rewards-banner.avif',
      backgroundImageMobile: '/assets/socials/real/rewards-banner.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Rewards - Rewards That Actually Matter',
      imageAlt: {
        background: 'Rewards and recognition illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_rewards',
      enabled: true
    }
  },

  'rewards-ai-guides': {
    content: {
      title: 'marketing.pages.rewardsAiGuides.hero.title',
      ctaText: 'marketing.pages.rewardsAiGuides.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/friends.avif',
      backgroundImageMobile: '/assets/socials/real/friends.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS AI Guides - Your Personal Financial Guides',
      imageAlt: {
        background: 'AI mascot guides illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_ai_guides',
      enabled: true
    }
  },

  'rewards-referral-program': {
    content: {
      title: 'marketing.pages.rewardsReferralProgram.hero.title',
      ctaText: 'marketing.pages.rewardsReferralProgram.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/sharing.avif',
      backgroundImageMobile: '/assets/socials/real/sharing.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Referral Program - Share Knowledge, Earn Rewards',
      imageAlt: {
        background: 'Referral and sharing illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_referral',
      enabled: true
    }
  },

  'rewards-points-system': {
    content: {
      title: 'marketing.pages.rewardsPointsSystem.hero.title',
      ctaText: 'marketing.pages.rewardsPointsSystem.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/rewards-with-icon.avif',
      backgroundImageMobile: '/assets/socials/real/rewards-with-icon.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Points System - Every Action Earns Points',
      imageAlt: {
        background: 'Points and rewards system illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_points',
      enabled: true
    }
  },

  'rewards-badges-leaderboard': {
    content: {
      title: 'marketing.pages.rewardsBadgesLeaderboard.hero.title',
      ctaText: 'marketing.pages.rewardsBadgesLeaderboard.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/rewards-half.avif',
      backgroundImageMobile: '/assets/socials/real/rewards-half.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Badges & Leaderboard - Earn Badges, Climb the Ranks',
      imageAlt: {
        background: 'Badges and leaderboard illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_badges',
      enabled: true
    }
  },

  'rewards-campaigns': {
    content: {
      title: 'marketing.pages.rewardsCampaigns.hero.title',
      ctaText: 'marketing.pages.rewardsCampaigns.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/group.avif',
      backgroundImageMobile: '/assets/socials/real/group.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Campaigns - Challenges That Teach',
      imageAlt: {
        background: 'Campaign challenges illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_campaigns',
      enabled: true
    }
  },

  'rewards-token-airdrop': {
    content: {
      title: 'marketing.pages.rewardsTokenAirdrop.hero.title',
      ctaText: 'marketing.pages.rewardsTokenAirdrop.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/growth-with-icon3.avif',
      backgroundImageMobile: '/assets/socials/real/growth-with-icon3.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Token & Airdrop - Be an Early Adopter',
      imageAlt: {
        background: 'Token airdrop and early adoption illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_token',
      enabled: true
    }
  },

  // ============================================================================
  // DIBOAS PROTECTION SECTION
  // ============================================================================

  'security-benefits': {
    content: {
      title: 'marketing.pages.securityBenefits.hero.title',
      ctaText: 'marketing.pages.securityBenefits.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/security-half.avif',
      backgroundImageMobile: '/assets/socials/real/security-half.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Protection - Military-Grade Security',
      imageAlt: {
        background: 'Security and protection illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_security',
      enabled: true
    }
  },

  'security-audit-reports': {
    content: {
      title: 'marketing.pages.securityAuditReports.hero.title',
      ctaText: 'marketing.pages.securityAuditReports.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Audit & Reports - Complete Transparency',
      imageAlt: {
        phone: 'diBoaS mobile application showing audit reports',
        mascot: 'Acqua mascot presenting security audits',
        background: 'Security audit and transparency illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_audits',
      enabled: true
    }
  },

  'security-safety-guide': {
    content: {
      title: 'marketing.pages.securitySafetyGuide.hero.title',
      ctaText: 'marketing.pages.securitySafetyGuide.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Safety Guide - Learn to Protect Yourself',
      imageAlt: {
        phone: 'diBoaS mobile application showing safety guide',
        mascot: 'Acqua mascot teaching safety tips',
        background: 'Financial safety and protection illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_safety',
      enabled: true
    }
  },

  'help-faq': {
    content: {
      title: 'marketing.pages.helpFaq.hero.title',
      ctaText: 'marketing.pages.helpFaq.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS FAQ - Your Questions, Our Answers',
      imageAlt: {
        phone: 'diBoaS mobile application showing FAQ',
        mascot: 'Acqua mascot helping with questions',
        background: 'Help and support illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_faq',
      enabled: true
    }
  },

  // ============================================================================
  // MORE ABOUT DIBOAS SECTION
  // ============================================================================

  'about': {
    content: {
      title: 'marketing.pages.about.hero.title',
      ctaText: 'marketing.pages.about.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/diboas-banner.avif',
      backgroundImageMobile: '/assets/socials/real/diboas-banner.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'About diBoaS - The World\'s First OneFi Platform',
      imageAlt: {
        background: 'diBoaS platform overview illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_about',
      enabled: true
    }
  },

  'careers': {
    content: {
      title: 'marketing.pages.careers.hero.title',
      ctaText: 'marketing.pages.careers.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/group.avif',
      backgroundImageMobile: '/assets/socials/real/group.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'Careers at diBoaS - Build the Future of Finance',
      imageAlt: {
        background: 'Team and careers illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_careers',
      enabled: true
    }
  },

  'docs': {
    content: {
      title: 'marketing.pages.docs.hero.title',
      ctaText: 'marketing.pages.docs.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Documentation - For Developers, By Developers',
      imageAlt: {
        phone: 'diBoaS mobile application showing documentation',
        mascot: 'Acqua mascot presenting technical documentation',
        background: 'Technical documentation illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_docs',
      enabled: true
    }
  },

  'investors': {
    content: {
      title: 'marketing.pages.investors.hero.title',
      ctaText: 'marketing.pages.investors.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    backgroundAssets: {
      backgroundImage: '/assets/socials/real/growth-with-icon3.avif',
      backgroundImageMobile: '/assets/socials/real/growth-with-icon3.avif',
      overlayOpacity: 0.4
    },
    seo: {
      titleTag: 'diBoaS Investors - A $400 Billion Opportunity',
      imageAlt: {
        background: 'Investment opportunity and growth illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_investors',
      enabled: true
    }
  },

  // ============================================================================
  // LEGAL/FOOTER SECTION
  // ============================================================================

  'legal-terms': {
    content: {
      title: 'marketing.pages.legalTerms.hero.title',
      ctaText: 'marketing.pages.legalTerms.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Terms of Service - Clear Rules, Serious Commitments',
      imageAlt: {
        phone: 'diBoaS mobile application showing terms of service',
        mascot: 'Acqua mascot presenting terms and policies',
        background: 'Legal terms and compliance illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_terms',
      enabled: true
    }
  },

  'legal-privacy': {
    content: {
      title: 'marketing.pages.legalPrivacy.hero.title',
      ctaText: 'marketing.pages.legalPrivacy.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Privacy Policy - Your Data is Yours',
      imageAlt: {
        phone: 'diBoaS mobile application showing privacy policy',
        mascot: 'Acqua mascot explaining privacy protections',
        background: 'Privacy and data protection illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_privacy',
      enabled: true
    }
  },

  'legal-cookies': {
    content: {
      title: 'marketing.pages.legalCookies.hero.title',
      ctaText: 'marketing.pages.legalCookies.hero.cta',
      ctaHref: process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
      ctaTarget: '_blank'
    },
    visualAssets: DEFAULT_VISUAL_ASSETS,
    seo: {
      titleTag: 'diBoaS Cookie Policy - Cookies Explained Simply',
      imageAlt: {
        phone: 'diBoaS mobile application showing cookie policy',
        mascot: 'Acqua mascot explaining cookie usage',
        background: 'Cookie policy illustration'
      }
    },
    analytics: {
      trackingPrefix: 'hero_cookies',
      enabled: true
    }
  }
} as const;

/**
 * Helper function to determine the variant for a page config
 * Based on whether the config has backgroundAssets or visualAssets
 */
export function getVariantForPageConfig(pageKey: string): 'default' | 'fullBackground' {
  const config = HERO_PAGE_CONFIGS[pageKey];
  if (!config) return 'fullBackground';

  // If has backgroundAssets, use fullBackground variant
  if (config.backgroundAssets) return 'fullBackground';

  // If has visualAssets, use default variant
  if (config.visualAssets) return 'default';

  // Default to fullBackground
  return 'fullBackground';
}
