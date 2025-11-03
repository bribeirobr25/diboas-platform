/**
 * FeatureShowcase Page Configurations
 *
 * Centralized configuration for all page-specific feature showcase content
 * Each entry defines slides and settings for a specific page
 *
 * Architecture: Configuration-driven approach following DRY principles
 * - Content keys: References to i18n translation strings
 * - Images: Phone mockup images from assets folder
 * - Slides: 3 slides per page (unification, simplicity, rewards)
 */

import type { FeatureShowcaseSlide, FeatureShowcaseVariantConfig } from './featureShowcase';
import { DEFAULT_FEATURE_SHOWCASE_SETTINGS } from './featureShowcase';
import { ROUTES } from './routes';

/**
 * Themed image pools for semantic matching (1:1 and 2:3 images)
 * Each theme contains 3 images for the 3 slides per page
 */
const IMAGE_THEMES = {
  account: [
    '/assets/socials/real/account_woman.avif',
    '/assets/socials/real/account_man.avif',
    '/assets/socials/real/business_balance.avif'
  ],
  banking: [
    '/assets/socials/real/business_sending.avif',
    '/assets/socials/real/business_payment_card.avif',
    '/assets/socials/real/transfer.avif'
  ],
  investing: [
    '/assets/socials/real/investing_woman.avif',
    '/assets/socials/real/investing_man.avif',
    '/assets/socials/real/investment_man_tattoo.avif'
  ],
  crypto: [
    '/assets/socials/real/business_strategy.avif',
    '/assets/socials/real/strategy.avif',
    '/assets/socials/real/strategy_man_office.avif'
  ],
  business: [
    '/assets/socials/real/business_account_man.avif',
    '/assets/socials/real/business_account_woman.avif',
    '/assets/socials/real/business_investing.avif'
  ],
  businessAccount: [
    '/assets/socials/real/business_aqua.avif',
    '/assets/socials/real/business_account_man.avif',
    '/assets/socials/real/business_balance.avif'
  ],
  businessPayments: [
    '/assets/socials/real/business_p2p.avif',
    '/assets/socials/real/business_sending.avif',
    '/assets/socials/real/business_payment_card.avif'
  ],
  learn: [
    '/assets/socials/real/learn_man.avif',
    '/assets/socials/real/learn_woman2.avif',
    '/assets/socials/real/learn_woman3.avif'
  ],
  learnAlt: [
    '/assets/socials/real/learn_man2.avif',
    '/assets/socials/real/learn_man3.avif',
    '/assets/socials/real/learn_man.avif'
  ],
  rewards: [
    '/assets/socials/real/rewards_woman.avif',
    '/assets/socials/real/rewards_man.avif',
    '/assets/socials/real/refferral.avif'
  ],
  lifestyle: [
    '/assets/socials/real/life_happy_jumping.avif',
    '/assets/socials/real/life_fun.avif',
    '/assets/socials/real/life_sharing.avif'
  ],
  family: [
    '/assets/socials/real/life_family_home.avif',
    '/assets/socials/real/life_family_picnic.avif',
    '/assets/socials/real/life_couple.avif'
  ],
  travel: [
    '/assets/socials/real/life_travel_woman.avif',
    '/assets/socials/real/life_travel_beach.avif',
    '/assets/socials/real/life_travel_brazil.avif'
  ],
  investors: [
    '/assets/socials/real/investors_man.avif',
    '/assets/socials/real/investor_woman.avif',
    '/assets/socials/real/investors_woman2.avif'
  ],
  community: [
    '/assets/socials/real/life_group.avif',
    '/assets/socials/real/life_join.avif',
    '/assets/socials/real/life_walking.avif'
  ]
} as const;

type ImageTheme = keyof typeof IMAGE_THEMES;

/**
 * Slide keys - consistent across all pages
 */
const SLIDE_KEYS = ['unification', 'simplicity', 'rewards'] as const;

/**
 * Helper function to create feature showcase slides with themed images
 */
function createSlides(
  pageKey: string,
  ctaLink: string,
  theme: ImageTheme
): readonly FeatureShowcaseSlide[] {
  const themeImages = IMAGE_THEMES[theme];

  return SLIDE_KEYS.map((slideKey, index) => ({
    id: `${pageKey}-${slideKey}`,
    content: {
      title: `marketing.pages.${pageKey}.featureShowcase.slides.${slideKey}.title`,
      description: `marketing.pages.${pageKey}.featureShowcase.slides.${slideKey}.description`,
      ctaText: `marketing.pages.${pageKey}.featureShowcase.slides.${slideKey}.ctaText`,
      ctaHref: ctaLink,
      ctaTarget: '_blank' as const
    },
    assets: {
      primaryImage: themeImages[index]
    },
    seo: {
      imageAlt: `marketing.pages.${pageKey}.featureShowcase.slides.${slideKey}.imageAlt`
    }
  }));
}

/**
 * Helper function to create page configuration with semantic theme
 * Returns Partial config following Hero/BenefitsCards pattern
 */
function createPageConfig(
  pageKey: string,
  ctaLink: string,
  theme: ImageTheme
): Partial<FeatureShowcaseVariantConfig> {
  return {
    slides: createSlides(pageKey, ctaLink, theme),
    settings: DEFAULT_FEATURE_SHOWCASE_SETTINGS,
    analytics: {
      trackingPrefix: `feature_showcase_${pageKey}`,
      enabled: true,
      eventSuffixes: {
        navigation: '_navigation',
        ctaClick: '_cta_click'
      }
    }
  };
}

/**
 * Page-specific FeatureShowcase Configurations
 * Organized by section for better maintainability
 * Following Hero pattern: Partial configs that merge with Factory defaults
 */
export const FEATURE_SHOWCASE_PAGE_CONFIGS: Record<string, Partial<FeatureShowcaseVariantConfig>> = {
  'benefits': createPageConfig(
    'benefits',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'lifestyle'
  ),

  'account': createPageConfig(
    'account',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'account'
  ),

  'bankingServices': createPageConfig(
    'bankingServices',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'banking'
  ),

  'investing': createPageConfig(
    'investing',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'investing'
  ),

  'cryptocurrency': createPageConfig(
    'cryptocurrency',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'crypto'
  ),

  'defiStrategies': createPageConfig(
    'defiStrategies',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'crypto'
  ),

  'credit': createPageConfig(
    'credit',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'banking'
  ),

  'learnBenefits': createPageConfig(
    'learnBenefits',
    ROUTES.LEARN.BENEFITS,
    'learn'
  ),

  'learnFinancialBasics': createPageConfig(
    'learnFinancialBasics',
    ROUTES.LEARN.FINANCIAL_BASICS,
    'learn'
  ),

  'learnMoneyManagement': createPageConfig(
    'learnMoneyManagement',
    ROUTES.LEARN.MONEY_MANAGEMENT,
    'learnAlt'
  ),

  'learnInvestmentGuide': createPageConfig(
    'learnInvestmentGuide',
    ROUTES.LEARN.INVESTMENT_GUIDE,
    'learnAlt'
  ),

  'learnCryptocurrencyGuide': createPageConfig(
    'learnCryptocurrencyGuide',
    ROUTES.LEARN.CRYPTOCURRENCY_GUIDE,
    'learn'
  ),

  'learnDefiExplained': createPageConfig(
    'learnDefiExplained',
    ROUTES.LEARN.DEFI_EXPLAINED,
    'learnAlt'
  ),

  'learnSpecialContent': createPageConfig(
    'learnSpecialContent',
    ROUTES.LEARN.SPECIAL_CONTENT,
    'learn'
  ),

  'businessBenefits': createPageConfig(
    'businessBenefits',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'business'
  ),

  'businessAccount': createPageConfig(
    'businessAccount',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'businessAccount'
  ),

  'businessBanking': createPageConfig(
    'businessBanking',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'business'
  ),

  'businessPayments': createPageConfig(
    'businessPayments',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'businessPayments'
  ),

  'businessTreasury': createPageConfig(
    'businessTreasury',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'business'
  ),

  'businessYieldStrategies': createPageConfig(
    'businessYieldStrategies',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'business'
  ),

  'businessCreditSolutions': createPageConfig(
    'businessCreditSolutions',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    'businessPayments'
  ),

  'rewardsBenefits': createPageConfig(
    'rewardsBenefits',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'rewards'
  ),

  'rewardsAiGuides': createPageConfig(
    'rewardsAiGuides',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'rewards'
  ),

  'rewardsReferralProgram': createPageConfig(
    'rewardsReferralProgram',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'rewards'
  ),

  'rewardsPointsSystem': createPageConfig(
    'rewardsPointsSystem',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'rewards'
  ),

  'rewardsBadgesLeaderboard': createPageConfig(
    'rewardsBadgesLeaderboard',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'rewards'
  ),

  'rewardsCampaigns': createPageConfig(
    'rewardsCampaigns',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'lifestyle'
  ),

  'rewardsTokenAirdrop': createPageConfig(
    'rewardsTokenAirdrop',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'crypto'
  ),

  'securityBenefits': createPageConfig(
    'securityBenefits',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'business'
  ),

  'securityAuditReports': createPageConfig(
    'securityAuditReports',
    ROUTES.SECURITY.AUDIT_REPORTS,
    'business'
  ),

  'securitySafetyGuide': createPageConfig(
    'securitySafetyGuide',
    ROUTES.SECURITY.SAFETY_GUIDE,
    'learn'
  ),

  'helpFaq': createPageConfig(
    'helpFaq',
    ROUTES.HELP.FAQ,
    'learn'
  ),

  'about': createPageConfig(
    'about',
    ROUTES.ABOUT,
    'community'
  ),

  'careers': createPageConfig(
    'careers',
    ROUTES.CAREERS,
    'community'
  ),

  'docs': createPageConfig(
    'docs',
    ROUTES.DOCS,
    'learn'
  ),

  'investors': createPageConfig(
    'investors',
    ROUTES.INVESTORS,
    'investors'
  ),

  'legalTerms': createPageConfig(
    'legalTerms',
    ROUTES.LEGAL.TERMS,
    'business'
  ),

  'legalPrivacy': createPageConfig(
    'legalPrivacy',
    ROUTES.LEGAL.PRIVACY,
    'business'
  ),

  'legalCookies': createPageConfig(
    'legalCookies',
    ROUTES.LEGAL.COOKIES,
    'business'
  )
} as const;
