/**
 * StickyFeaturesNav Page Configurations
 *
 * Centralized configuration for all page-specific sticky features navigation
 * Each entry defines content, items, and settings for a specific page
 *
 * Architecture: Configuration-driven approach following DRY principles
 * - Content keys: References to i18n translation strings
 * - Images: Landscape format images from assets folder
 * - Variant: Always 'default' for consistency
 */

import type { FeatureItem, StickyFeaturesNavVariantConfig } from './stickyFeaturesNav';
import { DEFAULT_STICKY_FEATURES_NAV_SETTINGS } from './stickyFeaturesNav';
import { ROUTES } from './routes';
import { getSocialRealAsset } from './assets';

/**
 * Landscape images pool for card backgrounds
 * Assigned sequentially to provide visual variety
 */
const LANDSCAPE_IMAGES = [
  getSocialRealAsset('REWARDS_GROUP'),
  getSocialRealAsset('BUSINESS_PAYMENT'),
  getSocialRealAsset('INVESTOR_MARKET'),
  getSocialRealAsset('LEARN_GUIDES'),
  getSocialRealAsset('LIFE_GROUP_OFFICE'),
  getSocialRealAsset('REFER_FRIEND'),
  getSocialRealAsset('LIFE_FAMILY_BIKE'),
  getSocialRealAsset('BUSINESS_CHARTS'),
  getSocialRealAsset('ACCOUNT_BALANCE'),
  getSocialRealAsset('CRYPTO'),
  getSocialRealAsset('DEFI'),
  getSocialRealAsset('BUSINESS_ACCOUNT'),
  getSocialRealAsset('COFFEE_SHOP'),
  getSocialRealAsset('REWARDS_HAPPY'),
  getSocialRealAsset('BUSINESS_CASHFLOW'),
  getSocialRealAsset('LIFE_TRAVEL'),
  getSocialRealAsset('LIFE_GROUP_MYSTIC'),
  getSocialRealAsset('SECURITY_MODERN'),
  getSocialRealAsset('AI_GUIDES'),
  getSocialRealAsset('LEARN_MASTERCLASS')
] as const;

/**
 * Helper function to create feature items from translation keys
 */
function createFeatureItems(
  pageKey: string,
  cardKeys: readonly string[],
  ctaLink: string,
  startImageIndex: number
): readonly FeatureItem[] {
  return cardKeys.map((cardKey, index) => ({
    id: `${pageKey}-${cardKey}`,
    image: LANDSCAPE_IMAGES[(startImageIndex + index) % LANDSCAPE_IMAGES.length],
    imageAlt: `marketing.pages.${pageKey}.stickyFeaturesNav.cards.${cardKey}.imageAlt`,
    heading: `marketing.pages.${pageKey}.stickyFeaturesNav.cards.${cardKey}.title`,
    description: `marketing.pages.${pageKey}.stickyFeaturesNav.cards.${cardKey}.description`,
    ctaText: 'common.buttons.learnMore',
    ctaLink,
    ctaTarget: '_self'
  }));
}

/**
 * Helper function to create page configuration
 * Returns Partial config following Hero/BenefitsCards pattern
 */
function createPageConfig(
  pageKey: string,
  cardKeys: readonly string[],
  ctaLink: string,
  imageStartIndex: number = 0
): Partial<StickyFeaturesNavVariantConfig> {
  return {
    mainTitle: `marketing.pages.${pageKey}.stickyFeaturesNav.title`,
    categories: [
      {
        id: `${pageKey}-features`,
        name: `marketing.pages.${pageKey}.stickyFeaturesNav.title`,
        items: createFeatureItems(pageKey, cardKeys, ctaLink, imageStartIndex)
      }
    ],
    analytics: {
      trackingPrefix: `sticky_nav_${pageKey}`,
      enabled: true
    }
  };
}

/**
 * Page-specific StickyFeaturesNav Configurations
 * Organized by section for better maintainability
 * Following Hero pattern: Partial configs that merge with Factory defaults
 */
export const STICKY_FEATURES_NAV_PAGE_CONFIGS: Record<string, Partial<StickyFeaturesNavVariantConfig>> = {
  'whyDiboas': createPageConfig(
    'benefits',
    ['stopJugglingApps', 'youReInCharge', 'yourMoneyAlwaysWorks', 'investingStopsBeingScary', 'useMoreEarnMore'] as const,
    ROUTES.WHY_DIBOAS,
    0
  ),

  'personalAccount': createPageConfig(
    'account',
    ['earnsWhileYouSleep', 'actuallyFree', 'yourMoneyAtTheRightSpeed', 'securityYouControl'] as const,
    ROUTES.PERSONAL.ACCOUNT,
    5
  ),

  'personalBanking': createPageConfig(
    'bankingServices',
    ['borderlessTransfers', 'oneClickPayments', 'historyThatMakesSense', 'realTimeControl'] as const,
    ROUTES.PERSONAL.BANKING,
    9
  ),

  'personalInvesting': createPageConfig(
    'investing',
    ['startSmall', 'diversifyInOneClick', 'learnByInvesting', 'feesThatMakeSense'] as const,
    ROUTES.PERSONAL.INVESTING,
    13
  ),

  'personalCryptocurrency': createPageConfig(
    'cryptocurrency',
    ['oneClickToGetIn', 'securityYouUnderstand', 'fromZeroToAdvanced', 'cryptoTraditionalComplete'] as const,
    ROUTES.PERSONAL.CRYPTOCURRENCY,
    17
  ),

  'defiStrategies': createPageConfig(
    'defiStrategies',
    ['yieldsWorthYourTime', 'readyMadeStrategies', 'riskUnderControl', 'stopWheneverYouWant'] as const,
    ROUTES.PERSONAL.DEFI_STRATEGIES,
    1
  ),

  'personalCredit': createPageConfig(
    'credit',
    ['totalTransparency', 'fairApproval', 'youDecideHowMuch', 'payWhenYouCan'] as const,
    ROUTES.PERSONAL.CREDIT,
    5
  ),

  'learnOverview': createPageConfig(
    'learnBenefits',
    ['fromBasicsToAdvanced', 'learnByDoing', 'communityThatTeaches', 'guidesThatEvolveWithYou'] as const,
    ROUTES.LEARN.OVERVIEW,
    9
  ),

  'learnFinancialBasics': createPageConfig(
    'learnFinancialBasics',
    ['understandYourMoney', 'jargonBecomesClarity', 'habitsThatTransform'] as const,
    ROUTES.LEARN.FINANCIAL_BASICS,
    13
  ),

  'learnMoneyManagement': createPageConfig(
    'learnMoneyManagement',
    ['planYourFuture', 'controlYourSpending', 'increaseYourIncome'] as const,
    ROUTES.LEARN.MONEY_MANAGEMENT,
    16
  ),

  'learnInvestmentGuide': createPageConfig(
    'learnInvestmentGuide',
    ['typesOfInvestments', 'buildYourPortfolio', 'strategiesThatWork', 'mistakesToAvoid'] as const,
    ROUTES.LEARN.INVESTMENT_GUIDE,
    19
  ),

  'learnCryptocurrencyGuide': createPageConfig(
    'learnCryptocurrencyGuide',
    ['whatIsBlockchain', 'bitcoinEthereumAndBeyond', 'walletsAndSecurity', 'howToBuyAndSell'] as const,
    ROUTES.LEARN.CRYPTOCURRENCY_GUIDE,
    3
  ),

  'learnDefiExplained': createPageConfig(
    'learnDefiExplained',
    ['whatIsDefi', 'stakingAndYielding', 'liquidityPools', 'risksAndRewards'] as const,
    ROUTES.LEARN.DEFI_EXPLAINED,
    7
  ),

  'learnSpecialContent': createPageConfig(
    'learnSpecialContent',
    ['expertTalks', 'successStories', 'marketTrends', 'webinarsAndWorkshops'] as const,
    ROUTES.LEARN.SPECIAL_CONTENT,
    11
  ),

  'businessAdvantages': createPageConfig(
    'businessBenefits',
    ['completeBusinessBanking', 'capitalWorkingTwentyFourSeven', 'creditToGrow', 'simplifiedManagement'] as const,
    ROUTES.BUSINESS.ADVANTAGES,
    15
  ),

  'businessAccount': createPageConfig(
    'businessAccount',
    ['zeroMonthlyFees', 'earnsAutomatically', 'multipleUsers', 'accountingIntegration'] as const,
    ROUTES.BUSINESS.ACCOUNT,
    19
  ),

  'businessBanking': createPageConfig(
    'businessBanking',
    ['bulkPayments', 'simplifiedReceivables', 'corporateCard', 'automaticReconciliation'] as const,
    ROUTES.BUSINESS.BANKING,
    3
  ),

  'businessPayments': createPageConfig(
    'businessPayments',
    ['paymentLinks', 'smartBills', 'recurringMadeEasy', 'paymentSplit'] as const,
    ROUTES.BUSINESS.PAYMENTS,
    7
  ),

  'businessTreasury': createPageConfig(
    'businessTreasury',
    ['overnightReturns', 'corporateInvestments', 'cashFlowForecast', 'executiveReports'] as const,
    ROUTES.BUSINESS.TREASURY,
    11
  ),

  'businessYieldStrategies': createPageConfig(
    'businessYieldStrategies',
    ['yieldOnReceivables', 'corporateDefiStrategies', 'currencyProtection'] as const,
    ROUTES.BUSINESS.YIELD_STRATEGIES,
    15
  ),

  'businessCreditSolutions': createPageConfig(
    'businessCreditSolutions',
    ['lowerRates', 'fastApproval', 'flexibleTerms', 'diversifySources'] as const,
    ROUTES.BUSINESS.CREDIT_SOLUTIONS,
    18
  ),

  'rewardsOverview': createPageConfig(
    'rewardsBenefits',
    ['pointsForEverything', 'realCashback', 'vipAccess', 'gamificationThatTeaches'] as const,
    ROUTES.REWARDS.OVERVIEW,
    2
  ),

  'rewardsAiGuides': createPageConfig(
    'rewardsAiGuides',
    ['aquaYourFirstStep', 'mysticSmartGrowth', 'coralHighYields', 'aiThatKnowsYou'] as const,
    ROUTES.REWARDS.AI_GUIDES,
    6
  ),

  'rewardsReferralProgram': createPageConfig(
    'rewardsReferralProgram',
    ['bonusForBoth', 'lifetimeCommission', 'referralTiers', 'completeDashboard'] as const,
    ROUTES.REWARDS.REFERRAL_PROGRAM,
    10
  ),

  'rewardsPointsSystem': createPageConfig(
    'rewardsPointsSystem',
    ['pointsForInvesting', 'pointsForLearning', 'pointsForEngaging', 'redeemForBenefits'] as const,
    ROUTES.REWARDS.POINTS_SYSTEM,
    14
  ),

  'rewardsBadgesLeaderboard': createPageConfig(
    'rewardsBadgesLeaderboard',
    ['achievementBadges', 'weeklyRankings', 'verifiedProfile', 'positionRewards'] as const,
    ROUTES.REWARDS.BADGES_LEADERBOARD,
    18
  ),

  'rewardsCampaigns': createPageConfig(
    'rewardsCampaigns',
    ['monthlyChallenges', 'themedCampaigns', 'exclusivePartnerships', 'earlyAdopterRewards'] as const,
    ROUTES.REWARDS.CAMPAIGNS,
    2
  ),

  'rewardsTokenAirdrop': createPageConfig(
    'rewardsTokenAirdrop',
    ['airdropForEarlyUsers', 'realGovernance', 'tokenStaking', 'appreciationTogether'] as const,
    ROUTES.REWARDS.TOKEN_AIRDROP,
    6
  ),

  'securityProtection': createPageConfig(
    'securityBenefits',
    ['militaryGradeEncryption', 'youReTheOwner', 'multiJurisdictionCompliant', 'twentyFourSevenSupport'] as const,
    ROUTES.SECURITY.PROTECTION,
    10
  ),

  'securityAuditReports': createPageConfig(
    'securityAuditReports',
    ['independentAudits', 'publicReports', 'bugBountyProgram', 'complianceReports'] as const,
    ROUTES.SECURITY.AUDIT_REPORTS,
    14
  ),

  'securitySafetyGuide': createPageConfig(
    'securitySafetyGuide',
    ['antiScamGuide', 'mandatoryTwoFa', 'smartAlerts', 'safeMode'] as const,
    ROUTES.SECURITY.SAFETY_GUIDE,
    18
  ),

  'helpFaq': createPageConfig(
    'helpFaq',
    ['completeKnowledgeBase', 'videoTutorials', 'twentyFourSevenChat', 'communityHelps'] as const,
    ROUTES.HELP.FAQ,
    2
  ),

  'about': createPageConfig(
    'about',
    ['ourMission', 'howItStarted', 'globalTeam', 'guidingValues'] as const,
    ROUTES.ABOUT,
    6
  ),

  'careers': createPageConfig(
    'careers',
    ['realImpact', 'firstClassTeam', 'innovationCulture', 'uniqueBenefits'] as const,
    ROUTES.CAREERS,
    10
  ),

  'docs': createPageConfig(
    'docs',
    ['restfulApis', 'officialSdks', 'webhooks', 'sandboxEnvironment'] as const,
    ROUTES.DOCS,
    14
  ),

  'investors': createPageConfig(
    'investors',
    ['quarterlyReports', 'executivePresentations', 'eventsCalendar', 'corporateGovernance'] as const,
    ROUTES.INVESTORS,
    18
  ),

  'legalTerms': createPageConfig(
    'legalTerms',
    ['termsOfUse', 'multiJurisdiction', 'rigorousKycAml', 'disputeResolution'] as const,
    ROUTES.LEGAL.TERMS,
    2
  ),

  'legalPrivacy': createPageConfig(
    'legalPrivacy',
    ['yourDataIsYours', 'endToEndEncryption', 'rightToBeForgotten', 'dataTransparency'] as const,
    ROUTES.LEGAL.PRIVACY,
    6
  ),

  'legalCookies': createPageConfig(
    'legalCookies',
    ['essentialVsOptional', 'noIntrusiveTracking', 'manageYourPreferences'] as const,
    ROUTES.LEGAL.COOKIES,
    10
  )
} as const;
