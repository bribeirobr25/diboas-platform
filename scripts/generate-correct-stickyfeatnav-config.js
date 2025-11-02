/**
 * Generate Correct StickyFeaturesNav Config from Translations
 *
 * This script reads the actual translation files to generate
 * the correct config with matching card keys
 */

const fs = require('fs');
const path = require('path');

// Read English translations to get correct keys
const translationsPath = 'packages/i18n/translations/en/marketing.json';
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));

// Route mapping
const ROUTES = {
  BENEFITS: '/benefits',
  ACCOUNT: '/account',
  BANKING_SERVICES: '/banking-services',
  INVESTING: '/investing',
  CRYPTOCURRENCY: '/cryptocurrency',
  DEFI_STRATEGIES: '/defi-strategies',
  CREDIT: '/credit',
  LEARN: {
    BENEFITS: '/learn/benefits',
    FINANCIAL_BASICS: '/learn/financial-basics',
    MONEY_MANAGEMENT: '/learn/money-management',
    INVESTMENT_GUIDE: '/learn/investment-guide',
    CRYPTOCURRENCY_GUIDE: '/learn/cryptocurrency-guide',
    DEFI_EXPLAINED: '/learn/defi-explained',
    SPECIAL_CONTENT: '/learn/special-content'
  },
  BUSINESS: {
    BENEFITS: '/business/benefits',
    ACCOUNT: '/business/account',
    BANKING: '/business/banking',
    PAYMENTS: '/business/payments',
    TREASURY: '/business/treasury',
    YIELD_STRATEGIES: '/business/yield-strategies',
    CREDIT_SOLUTIONS: '/business/credit-solutions'
  },
  REWARDS: {
    BENEFITS: '/rewards/benefits',
    AI_GUIDES: '/rewards/ai-guides',
    REFERRAL_PROGRAM: '/rewards/referral-program',
    POINTS_SYSTEM: '/rewards/points-system',
    BADGES_LEADERBOARD: '/rewards/badges-leaderboard',
    CAMPAIGNS: '/rewards/campaigns',
    TOKEN_AIRDROP: '/rewards/token-airdrop'
  },
  SECURITY: {
    BENEFITS: '/security/benefits',
    AUDIT_REPORTS: '/security/audit-reports',
    SAFETY_GUIDE: '/security/safety-guide'
  },
  HELP: {
    FAQ: '/help/faq'
  },
  ABOUT: '/about',
  CAREERS: '/careers',
  DOCS: '/docs',
  INVESTORS: '/investors',
  LEGAL: {
    TERMS: '/legal/terms',
    PRIVACY: '/legal/privacy',
    COOKIES: '/legal/cookies'
  }
};

// Route mapping for pages
const PAGE_TO_ROUTE = {
  benefits: 'ROUTES.BENEFITS',
  account: 'ROUTES.ACCOUNT',
  bankingServices: 'ROUTES.BANKING_SERVICES',
  investing: 'ROUTES.INVESTING',
  cryptocurrency: 'ROUTES.CRYPTOCURRENCY',
  defiStrategies: 'ROUTES.DEFI_STRATEGIES',
  credit: 'ROUTES.CREDIT',
  learnBenefits: 'ROUTES.LEARN.BENEFITS',
  learnFinancialBasics: 'ROUTES.LEARN.FINANCIAL_BASICS',
  learnMoneyManagement: 'ROUTES.LEARN.MONEY_MANAGEMENT',
  learnInvestmentGuide: 'ROUTES.LEARN.INVESTMENT_GUIDE',
  learnCryptocurrencyGuide: 'ROUTES.LEARN.CRYPTOCURRENCY_GUIDE',
  learnDefiExplained: 'ROUTES.LEARN.DEFI_EXPLAINED',
  learnSpecialContent: 'ROUTES.LEARN.SPECIAL_CONTENT',
  businessBenefits: 'ROUTES.BUSINESS.BENEFITS',
  businessAccount: 'ROUTES.BUSINESS.ACCOUNT',
  businessBanking: 'ROUTES.BUSINESS.BANKING',
  businessPayments: 'ROUTES.BUSINESS.PAYMENTS',
  businessTreasury: 'ROUTES.BUSINESS.TREASURY',
  businessYieldStrategies: 'ROUTES.BUSINESS.YIELD_STRATEGIES',
  businessCreditSolutions: 'ROUTES.BUSINESS.CREDIT_SOLUTIONS',
  rewardsBenefits: 'ROUTES.REWARDS.BENEFITS',
  rewardsAiGuides: 'ROUTES.REWARDS.AI_GUIDES',
  rewardsReferralProgram: 'ROUTES.REWARDS.REFERRAL_PROGRAM',
  rewardsPointsSystem: 'ROUTES.REWARDS.POINTS_SYSTEM',
  rewardsBadgesLeaderboard: 'ROUTES.REWARDS.BADGES_LEADERBOARD',
  rewardsCampaigns: 'ROUTES.REWARDS.CAMPAIGNS',
  rewardsTokenAirdrop: 'ROUTES.REWARDS.TOKEN_AIRDROP',
  securityBenefits: 'ROUTES.SECURITY.BENEFITS',
  securityAuditReports: 'ROUTES.SECURITY.AUDIT_REPORTS',
  securitySafetyGuide: 'ROUTES.SECURITY.SAFETY_GUIDE',
  helpFaq: 'ROUTES.HELP.FAQ',
  about: 'ROUTES.ABOUT',
  careers: 'ROUTES.CAREERS',
  docs: 'ROUTES.DOCS',
  investors: 'ROUTES.INVESTORS',
  legalTerms: 'ROUTES.LEGAL.TERMS',
  legalPrivacy: 'ROUTES.LEGAL.PRIVACY',
  legalCookies: 'ROUTES.LEGAL.COOKIES'
};

// Get all pages with stickyFeaturesNav
const pages = translations.pages;
const pageKeys = Object.keys(pages).filter(key =>
  pages[key].stickyFeaturesNav && pages[key].stickyFeaturesNav.cards
);

console.log(`Found ${pageKeys.length} pages with StickyFeaturesNav content\n`);

// Generate config entries
const configEntries = [];
let imageIndex = 0;

pageKeys.forEach((pageKey, index) => {
  const cardKeys = Object.keys(pages[pageKey].stickyFeaturesNav.cards);
  const route = PAGE_TO_ROUTE[pageKey];

  if (!route) {
    console.warn(`⚠️  No route mapping for page: ${pageKey}`);
    return;
  }

  const cardKeysString = cardKeys.map(k => `'${k}'`).join(', ');

  configEntries.push(
    `  '${pageKey}': createPageConfig(\n` +
    `    '${pageKey}',\n` +
    `    [${cardKeysString}] as const,\n` +
    `    ${route},\n` +
    `    ${imageIndex}\n` +
    `  )`
  );

  console.log(`✅ ${pageKey}: ${cardKeys.length} cards`);

  // Increment image index for variety
  imageIndex = (imageIndex + cardKeys.length) % 20;
});

console.log(`\n📝 Generated config for ${configEntries.length} pages\n`);
console.log('Copy and paste this into the config file:\n');
console.log('=' .repeat(80));
console.log('\nexport const STICKY_FEATURES_NAV_PAGE_CONFIGS: Record<string, Partial<StickyFeaturesNavVariantConfig>> = {');
console.log(configEntries.join(',\n\n'));
console.log('} as const;\n');
console.log('=' .repeat(80));
