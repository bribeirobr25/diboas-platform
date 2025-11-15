/**
 * FAQ Accordion Page Configurations
 *
 * Domain-Driven Design: Page-specific FAQ configurations following DDD patterns
 * Service Agnostic Abstraction: Decoupled from presentation layer
 * Configuration Management: Centralized FAQ content per page
 * No Hardcoded Values: All content via translation keys
 * DRY Principles: Reusable helper functions, centralized ROUTES
 * Code Reusability: Shared configuration builder pattern
 */

import { ROUTES } from './routes';
import {
  DEFAULT_FAQ_ACCORDION_SETTINGS,
  type FAQAccordionVariantConfig,
  type FAQItem
} from './faqAccordion';

/**
 * Page key type for type safety
 */
export type FAQAccordionPageKey =
  | 'why-diboas'
  | 'personalAccount'
  | 'personalBanking'
  | 'personalInvesting'
  | 'personalCryptocurrency'
  | 'personalDefiStrategies'
  | 'personalCredit'
  | 'learnOverview'
  | 'learnFinancialBasics'
  | 'learnMoneyManagement'
  | 'learnInvestmentGuide'
  | 'learnCryptocurrencyGuide'
  | 'learnDefiExplained'
  | 'learnSpecialContent'
  | 'businessAdvantages'
  | 'businessAccount'
  | 'businessBanking'
  | 'businessPayments'
  | 'businessTreasury'
  | 'businessYieldStrategies'
  | 'businessCreditSolutions'
  | 'rewardsOverview'
  | 'rewardsAiGuides'
  | 'rewardsReferralProgram'
  | 'rewardsPointsSystem'
  | 'rewardsBadgesLeaderboard'
  | 'rewardsCampaigns'
  | 'rewardsTokenAirdrop'
  | 'securityProtection'
  | 'securityAuditReports'
  | 'securitySafetyGuide'
  | 'helpFaq'
  | 'about'
  | 'careers'
  | 'investors'
  | 'legalTerms'
  | 'legalPrivacy'
  | 'legalCookies';

/**
 * Create page-specific FAQ configuration using registry pattern
 * Returns full FAQAccordionVariantConfig with all required fields
 *
 * Now uses questionIds to reference centralized FAQ registry instead of duplicating content
 * The translation key marketing.pages.{pageKey}.faqAccordion.questionIds contains the array of IDs
 */
function createPageConfig(pageKey: string, _questionCount?: number): FAQAccordionVariantConfig {
  return {
    variant: 'default' as const,
    content: {
      title: `marketing.pages.${pageKey}.faqAccordion.sectionTitle`,
      description: `marketing.pages.${pageKey}.faqAccordion.subtitle`,
      ctaText: `marketing.pages.${pageKey}.faqAccordion.ctaText`,
      ctaHref: ROUTES.HELP.FAQ,
      ctaTarget: '_self' as const,
      // Use questionIds to reference centralized registry
      // The component will resolve these IDs from marketing.faq.registry at runtime
      questionIds: `marketing.pages.${pageKey}.faqAccordion.questionIds` as any
    },
    settings: DEFAULT_FAQ_ACCORDION_SETTINGS,
    seo: {
      ariaLabel: 'Frequently asked questions section',
      region: 'faq'
    },
    analytics: {
      trackingPrefix: `faq_accordion_${pageKey}`,
      enabled: true
    }
  };
}

/**
 * FAQ Accordion configurations for all pages
 * Each page has 3-4 questions tailored to its content
 */
export const FAQ_ACCORDION_PAGE_CONFIGS: Record<FAQAccordionPageKey, FAQAccordionVariantConfig> = {
  // Main Menu
  'why-diboas': createPageConfig('why-diboas', 3),
  personalAccount: createPageConfig('personal.account', 3),
  personalBanking: createPageConfig('personal.banking', 3),
  personalInvesting: createPageConfig('personal.investing', 3),
  personalCryptocurrency: createPageConfig('personal.cryptocurrency', 3),
  personalDefiStrategies: createPageConfig('personal.defiStrategies', 3),
  personalCredit: createPageConfig('personal.credit', 3),

  // The Learn Center
  learnOverview: createPageConfig('learn.overview', 3),
  learnFinancialBasics: createPageConfig('learnFinancialBasics', 3),
  learnMoneyManagement: createPageConfig('learnMoneyManagement', 3),
  learnInvestmentGuide: createPageConfig('learnInvestmentGuide', 3),
  learnCryptocurrencyGuide: createPageConfig('learnCryptocurrencyGuide', 3),
  learnDefiExplained: createPageConfig('learnDefiExplained', 3),
  learnSpecialContent: createPageConfig('learnSpecialContent', 3),

  // diBoaS Business
  businessAdvantages: createPageConfig('business.advantages', 3),
  businessAccount: createPageConfig('businessAccount', 3),
  businessBanking: createPageConfig('businessBanking', 3),
  businessPayments: createPageConfig('businessPayments', 3),
  businessTreasury: createPageConfig('businessTreasury', 3),
  businessYieldStrategies: createPageConfig('businessYieldStrategies', 3),
  businessCreditSolutions: createPageConfig('businessCreditSolutions', 3),

  // diBoaS Rewards
  rewardsOverview: createPageConfig('rewards.overview', 3),
  rewardsAiGuides: createPageConfig('rewardsAiGuides', 3),
  rewardsReferralProgram: createPageConfig('rewardsReferralProgram', 3),
  rewardsPointsSystem: createPageConfig('rewardsPointsSystem', 3),
  rewardsBadgesLeaderboard: createPageConfig('rewardsBadgesLeaderboard', 3),
  rewardsCampaigns: createPageConfig('rewardsCampaigns', 3),
  rewardsTokenAirdrop: createPageConfig('rewardsTokenAirdrop', 3),

  // diBoaS Protection
  securityProtection: createPageConfig('security.protection', 3),
  securityAuditReports: createPageConfig('securityAuditReports', 3),
  securitySafetyGuide: createPageConfig('securitySafetyGuide', 3),

  // More About diBoaS
  helpFaq: createPageConfig('helpFaq', 120),
  about: createPageConfig('about', 3),
  careers: createPageConfig('careers', 3),
  investors: createPageConfig('investors', 3),

  // Footer
  legalTerms: createPageConfig('legalTerms', 3),
  legalPrivacy: createPageConfig('legalPrivacy', 3),
  legalCookies: createPageConfig('legalCookies', 3)
};

/**
 * Helper function to get FAQ accordion config for a specific page
 * Returns undefined if page key doesn't exist (defensive programming)
 */
export function getFAQAccordionConfig(pageKey: string): FAQAccordionVariantConfig | undefined {
  return FAQ_ACCORDION_PAGE_CONFIGS[pageKey as FAQAccordionPageKey];
}

/**
 * Get all page keys that have FAQ accordion configurations
 */
export function getAllFAQAccordionPageKeys(): readonly FAQAccordionPageKey[] {
  return Object.keys(FAQ_ACCORDION_PAGE_CONFIGS) as FAQAccordionPageKey[];
}

/**
 * Type guard to check if a string is a valid FAQ accordion page key
 */
export function isFAQAccordionPageKey(key: string): key is FAQAccordionPageKey {
  return key in FAQ_ACCORDION_PAGE_CONFIGS;
}
