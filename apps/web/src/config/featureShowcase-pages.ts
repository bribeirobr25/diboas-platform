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
 * Phone mockup images pool for slides
 * Cycled through pages for visual variety
 */
const PHONE_IMAGES = [
  '/assets/socials/drawing/phone-activity-and-rewards.avif',
  '/assets/socials/drawing/phone-activities.avif',
  '/assets/socials/drawing/phone-rewards.avif',
  '/assets/socials/drawing/phone-crypto-defi.avif',
  '/assets/socials/drawing/phone-strategy-defi.avif',
] as const;

/**
 * Slide keys - consistent across all pages
 */
const SLIDE_KEYS = ['unification', 'simplicity', 'rewards'] as const;

/**
 * Helper function to create feature showcase slides
 */
function createSlides(
  pageKey: string,
  ctaLink: string,
  imageStartIndex: number = 0
): readonly FeatureShowcaseSlide[] {
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
      primaryImage: PHONE_IMAGES[(imageStartIndex + index) % PHONE_IMAGES.length]
    },
    seo: {
      imageAlt: `marketing.pages.${pageKey}.featureShowcase.slides.${slideKey}.imageAlt`
    }
  }));
}

/**
 * Helper function to create page configuration
 * Returns Partial config following Hero/BenefitsCards pattern
 */
function createPageConfig(
  pageKey: string,
  ctaLink: string,
  imageStartIndex: number = 0
): Partial<FeatureShowcaseVariantConfig> {
  return {
    slides: createSlides(pageKey, ctaLink, imageStartIndex),
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
    0
  ),

  'account': createPageConfig(
    'account',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    1
  ),

  'bankingServices': createPageConfig(
    'bankingServices',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    2
  ),

  'investing': createPageConfig(
    'investing',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    3
  ),

  'cryptocurrency': createPageConfig(
    'cryptocurrency',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    4
  ),

  'defiStrategies': createPageConfig(
    'defiStrategies',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    0
  ),

  'credit': createPageConfig(
    'credit',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    1
  ),

  'learnBenefits': createPageConfig(
    'learnBenefits',
    ROUTES.LEARN.BENEFITS,
    2
  ),

  'learnFinancialBasics': createPageConfig(
    'learnFinancialBasics',
    ROUTES.LEARN.FINANCIAL_BASICS,
    3
  ),

  'learnMoneyManagement': createPageConfig(
    'learnMoneyManagement',
    ROUTES.LEARN.MONEY_MANAGEMENT,
    4
  ),

  'learnInvestmentGuide': createPageConfig(
    'learnInvestmentGuide',
    ROUTES.LEARN.INVESTMENT_GUIDE,
    0
  ),

  'learnCryptocurrencyGuide': createPageConfig(
    'learnCryptocurrencyGuide',
    ROUTES.LEARN.CRYPTOCURRENCY_GUIDE,
    1
  ),

  'learnDefiExplained': createPageConfig(
    'learnDefiExplained',
    ROUTES.LEARN.DEFI_EXPLAINED,
    2
  ),

  'learnSpecialContent': createPageConfig(
    'learnSpecialContent',
    ROUTES.LEARN.SPECIAL_CONTENT,
    3
  ),

  'businessBenefits': createPageConfig(
    'businessBenefits',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    4
  ),

  'businessAccount': createPageConfig(
    'businessAccount',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    0
  ),

  'businessBanking': createPageConfig(
    'businessBanking',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    1
  ),

  'businessPayments': createPageConfig(
    'businessPayments',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    2
  ),

  'businessTreasury': createPageConfig(
    'businessTreasury',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    3
  ),

  'businessYieldStrategies': createPageConfig(
    'businessYieldStrategies',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    4
  ),

  'businessCreditSolutions': createPageConfig(
    'businessCreditSolutions',
    process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://business.diboas.com',
    0
  ),

  'rewardsBenefits': createPageConfig(
    'rewardsBenefits',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    1
  ),

  'rewardsAiGuides': createPageConfig(
    'rewardsAiGuides',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    2
  ),

  'rewardsReferralProgram': createPageConfig(
    'rewardsReferralProgram',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    3
  ),

  'rewardsPointsSystem': createPageConfig(
    'rewardsPointsSystem',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    4
  ),

  'rewardsBadgesLeaderboard': createPageConfig(
    'rewardsBadgesLeaderboard',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    0
  ),

  'rewardsCampaigns': createPageConfig(
    'rewardsCampaigns',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    1
  ),

  'rewardsTokenAirdrop': createPageConfig(
    'rewardsTokenAirdrop',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    2
  ),

  'securityBenefits': createPageConfig(
    'securityBenefits',
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.diboas.com',
    3
  ),

  'securityAuditReports': createPageConfig(
    'securityAuditReports',
    ROUTES.SECURITY.AUDIT_REPORTS,
    4
  ),

  'securitySafetyGuide': createPageConfig(
    'securitySafetyGuide',
    ROUTES.SECURITY.SAFETY_GUIDE,
    0
  ),

  'helpFaq': createPageConfig(
    'helpFaq',
    ROUTES.HELP.FAQ,
    1
  ),

  'about': createPageConfig(
    'about',
    ROUTES.ABOUT,
    2
  ),

  'careers': createPageConfig(
    'careers',
    ROUTES.CAREERS,
    3
  ),

  'docs': createPageConfig(
    'docs',
    ROUTES.DOCS,
    4
  ),

  'investors': createPageConfig(
    'investors',
    ROUTES.INVESTORS,
    0
  ),

  'legalTerms': createPageConfig(
    'legalTerms',
    ROUTES.LEGAL.TERMS,
    1
  ),

  'legalPrivacy': createPageConfig(
    'legalPrivacy',
    ROUTES.LEGAL.PRIVACY,
    2
  ),

  'legalCookies': createPageConfig(
    'legalCookies',
    ROUTES.LEGAL.COOKIES,
    3
  )
} as const;
