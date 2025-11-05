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
  | 'benefits'
  | 'account'
  | 'bankingServices'
  | 'investing'
  | 'cryptocurrency'
  | 'defiStrategies'
  | 'credit'
  | 'learnBenefits'
  | 'learnFinancialBasics'
  | 'learnMoneyManagement'
  | 'learnInvestmentGuide'
  | 'learnCryptocurrencyGuide'
  | 'learnDefiExplained'
  | 'learnSpecialContent'
  | 'businessBenefits'
  | 'businessAccount'
  | 'businessBanking'
  | 'businessPayments'
  | 'businessTreasury'
  | 'businessYieldStrategies'
  | 'businessCreditSolutions'
  | 'rewardsBenefits'
  | 'rewardsAiGuides'
  | 'rewardsReferralProgram'
  | 'rewardsPointsSystem'
  | 'rewardsBadgesLeaderboard'
  | 'rewardsCampaigns'
  | 'rewardsTokenAirdrop'
  | 'securityBenefits'
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
 * Create FAQ items for a specific page
 * All questions use translation keys from marketing.pages.{pageKey}.faqAccordion
 */
function createFAQItems(pageKey: string, questionCount: number = 4): readonly FAQItem[] {
  const items: FAQItem[] = [];

  for (let i = 1; i <= questionCount; i++) {
    const qKey = `q${i}`;
    items.push({
      id: `${pageKey}-faq-${qKey}`,
      question: `marketing.pages.${pageKey}.faqAccordion.questions.${qKey}.question`,
      answer: `marketing.pages.${pageKey}.faqAccordion.questions.${qKey}.answer`,
      category: 'getting-started' as const
    });
  }

  return items;
}

/**
 * Create page-specific FAQ configuration
 * Returns full FAQAccordionVariantConfig with all required fields
 */
function createPageConfig(pageKey: string, questionCount: number = 4): FAQAccordionVariantConfig {
  return {
    variant: 'default' as const,
    content: {
      title: `marketing.pages.${pageKey}.faqAccordion.sectionTitle`,
      description: `marketing.pages.${pageKey}.faqAccordion.subtitle`,
      ctaText: `marketing.pages.${pageKey}.faqAccordion.ctaText`,
      ctaHref: ROUTES.HELP.FAQ,
      ctaTarget: '_self' as const,
      items: createFAQItems(pageKey, questionCount)
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
  benefits: createPageConfig('benefits', 4),
  account: createPageConfig('account', 4),
  bankingServices: createPageConfig('bankingServices', 3),
  investing: createPageConfig('investing', 4),
  cryptocurrency: createPageConfig('cryptocurrency', 4),
  defiStrategies: createPageConfig('defiStrategies', 4),
  credit: createPageConfig('credit', 3),

  // The Learn Center
  learnBenefits: createPageConfig('learnBenefits', 3),
  learnFinancialBasics: createPageConfig('learnFinancialBasics', 3),
  learnMoneyManagement: createPageConfig('learnMoneyManagement', 3),
  learnInvestmentGuide: createPageConfig('learnInvestmentGuide', 3),
  learnCryptocurrencyGuide: createPageConfig('learnCryptocurrencyGuide', 3),
  learnDefiExplained: createPageConfig('learnDefiExplained', 3),
  learnSpecialContent: createPageConfig('learnSpecialContent', 3),

  // diBoaS Business
  businessBenefits: createPageConfig('businessBenefits', 3),
  businessAccount: createPageConfig('businessAccount', 3),
  businessBanking: createPageConfig('businessBanking', 3),
  businessPayments: createPageConfig('businessPayments', 3),
  businessTreasury: createPageConfig('businessTreasury', 3),
  businessYieldStrategies: createPageConfig('businessYieldStrategies', 3),
  businessCreditSolutions: createPageConfig('businessCreditSolutions', 3),

  // diBoaS Rewards
  rewardsBenefits: createPageConfig('rewardsBenefits', 3),
  rewardsAiGuides: createPageConfig('rewardsAiGuides', 3),
  rewardsReferralProgram: createPageConfig('rewardsReferralProgram', 3),
  rewardsPointsSystem: createPageConfig('rewardsPointsSystem', 3),
  rewardsBadgesLeaderboard: createPageConfig('rewardsBadgesLeaderboard', 3),
  rewardsCampaigns: createPageConfig('rewardsCampaigns', 3),
  rewardsTokenAirdrop: createPageConfig('rewardsTokenAirdrop', 3),

  // diBoaS Protection
  securityBenefits: createPageConfig('securityBenefits', 3),
  securityAuditReports: createPageConfig('securityAuditReports', 3),
  securitySafetyGuide: createPageConfig('securitySafetyGuide', 3),

  // More About diBoaS
  helpFaq: createPageConfig('helpFaq', 4),
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
