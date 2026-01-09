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

import { DEFAULT_FEATURE_SHOWCASE_SETTINGS, type FeatureShowcaseSlide, type FeatureShowcaseVariantConfig } from './featureShowcase';
import { ROUTES } from './routes';
import { getSocialRealAsset } from './assets';

/**
 * Themed image pools for semantic matching (1:1 and 2:3 images)
 * Each theme contains 3 images for the 3 slides per page
 */
const IMAGE_THEMES = {
  account: [
    getSocialRealAsset('ACCOUNT_WOMAN'),
    getSocialRealAsset('ACCOUNT_MAN'),
    getSocialRealAsset('BUSINESS_BALANCE')
  ],
  banking: [
    getSocialRealAsset('BUSINESS_SENDING'),
    getSocialRealAsset('BUSINESS_PAYMENT_CARD'),
    getSocialRealAsset('TRANSFER')
  ],
  investing: [
    getSocialRealAsset('INVESTING_WOMAN'),
    getSocialRealAsset('INVESTING_MAN'),
    getSocialRealAsset('INVESTMENT_MAN_TATTOO')
  ],
  crypto: [
    getSocialRealAsset('BUSINESS_STRATEGY'),
    getSocialRealAsset('STRATEGY'),
    getSocialRealAsset('STRATEGY_MAN_OFFICE')
  ],
  business: [
    getSocialRealAsset('BUSINESS_ACCOUNT_MAN'),
    getSocialRealAsset('BUSINESS_ACCOUNT_WOMAN'),
    getSocialRealAsset('BUSINESS_INVESTING')
  ],
  businessAccount: [
    getSocialRealAsset('BUSINESS_AQUA'),
    getSocialRealAsset('BUSINESS_ACCOUNT_MAN'),
    getSocialRealAsset('BUSINESS_BALANCE')
  ],
  businessPayments: [
    getSocialRealAsset('BUSINESS_P2P'),
    getSocialRealAsset('BUSINESS_SENDING'),
    getSocialRealAsset('BUSINESS_PAYMENT_CARD')
  ],
  learn: [
    getSocialRealAsset('LEARN_MAN'),
    getSocialRealAsset('LEARN_WOMAN2'),
    getSocialRealAsset('LEARN_WOMAN3')
  ],
  learnAlt: [
    getSocialRealAsset('LEARN_MAN2'),
    getSocialRealAsset('LEARN_MAN3'),
    getSocialRealAsset('LEARN_MAN')
  ],
  rewards: [
    getSocialRealAsset('REWARDS_WOMAN'),
    getSocialRealAsset('REWARDS_MAN'),
    getSocialRealAsset('REFFERRAL')
  ],
  lifestyle: [
    getSocialRealAsset('LIFE_HAPPY_JUMPING'),
    getSocialRealAsset('LIFE_FUN'),
    getSocialRealAsset('LIFE_SHARING')
  ],
  family: [
    getSocialRealAsset('LIFE_FAMILY_HOME'),
    getSocialRealAsset('LIFE_FAMILY_PICNIC'),
    getSocialRealAsset('LIFE_COUPLE')
  ],
  travel: [
    getSocialRealAsset('LIFE_TRAVEL_WOMAN'),
    getSocialRealAsset('LIFE_TRAVEL_BEACH'),
    getSocialRealAsset('LIFE_TRAVEL_BRAZIL')
  ],
  investors: [
    getSocialRealAsset('INVESTORS_MAN'),
    getSocialRealAsset('INVESTOR_WOMAN'),
    getSocialRealAsset('INVESTORS_WOMAN2')
  ],
  community: [
    getSocialRealAsset('LIFE_GROUP'),
    getSocialRealAsset('LIFE_JOIN'),
    getSocialRealAsset('LIFE_WALKING')
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
  'whyDiboas': createPageConfig(
    'whyDiboas',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'lifestyle'
  ),

  'personalAccount': createPageConfig(
    'personalAccount',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'account'
  ),

  'personalBanking': createPageConfig(
    'personalBanking',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'banking'
  ),

  'personalInvesting': createPageConfig(
    'personalInvesting',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'investing'
  ),

  'personalCryptocurrency': createPageConfig(
    'personalCryptocurrency',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'crypto'
  ),

  'personalDefiStrategies': createPageConfig(
    'personalDefiStrategies',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'crypto'
  ),

  'personalCredit': createPageConfig(
    'personalCredit',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    'banking'
  ),

  'learnOverview': createPageConfig(
    'learnOverview',
    ROUTES.LEARN.OVERVIEW,
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

  'businessAdvantages': createPageConfig(
    'businessAdvantages',
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

  'rewardsOverview': createPageConfig(
    'rewardsOverview',
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

  'securityProtection': createPageConfig(
    'securityProtection',
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
