/**
 * Fix StickyFeaturesNav Config Usage
 *
 * Changes from helper function pattern to direct config pattern:
 * - Remove: getStickyFeaturesNavConfig
 * - Add: STICKY_FEATURES_NAV_PAGE_CONFIGS
 * - Change: config={getStickyFeaturesNavConfig('key')}
 *   to: config={STICKY_FEATURES_NAV_PAGE_CONFIGS.key}
 */

const fs = require('fs');

const PAGES = [
  { key: 'benefits', path: 'apps/web/src/app/[locale]/(marketing)/benefits/page.tsx' },
  { key: 'account', path: 'apps/web/src/app/[locale]/(marketing)/account/page.tsx' },
  { key: 'bankingServices', path: 'apps/web/src/app/[locale]/(marketing)/banking-services/page.tsx' },
  { key: 'investing', path: 'apps/web/src/app/[locale]/(marketing)/investing/page.tsx' },
  { key: 'cryptocurrency', path: 'apps/web/src/app/[locale]/(marketing)/cryptocurrency/page.tsx' },
  { key: 'defiStrategies', path: 'apps/web/src/app/[locale]/(marketing)/defi-strategies/page.tsx' },
  { key: 'credit', path: 'apps/web/src/app/[locale]/(marketing)/credit/page.tsx' },
  { key: 'learnBenefits', path: 'apps/web/src/app/[locale]/(marketing)/learn/benefits/page.tsx' },
  { key: 'learnFinancialBasics', path: 'apps/web/src/app/[locale]/(marketing)/learn/financial-basics/page.tsx' },
  { key: 'learnMoneyManagement', path: 'apps/web/src/app/[locale]/(marketing)/learn/money-management/page.tsx' },
  { key: 'learnInvestmentGuide', path: 'apps/web/src/app/[locale]/(marketing)/learn/investment-guide/page.tsx' },
  { key: 'learnCryptocurrencyGuide', path: 'apps/web/src/app/[locale]/(marketing)/learn/cryptocurrency-guide/page.tsx' },
  { key: 'learnDefiExplained', path: 'apps/web/src/app/[locale]/(marketing)/learn/defi-explained/page.tsx' },
  { key: 'learnSpecialContent', path: 'apps/web/src/app/[locale]/(marketing)/learn/special-content/page.tsx' },
  { key: 'businessBenefits', path: 'apps/web/src/app/[locale]/(marketing)/business/benefits/page.tsx' },
  { key: 'businessAccount', path: 'apps/web/src/app/[locale]/(marketing)/business/account/page.tsx' },
  { key: 'businessBanking', path: 'apps/web/src/app/[locale]/(marketing)/business/banking/page.tsx' },
  { key: 'businessPayments', path: 'apps/web/src/app/[locale]/(marketing)/business/payments/page.tsx' },
  { key: 'businessTreasury', path: 'apps/web/src/app/[locale]/(marketing)/business/treasury/page.tsx' },
  { key: 'businessYieldStrategies', path: 'apps/web/src/app/[locale]/(marketing)/business/yield-strategies/page.tsx' },
  { key: 'businessCreditSolutions', path: 'apps/web/src/app/[locale]/(marketing)/business/credit-solutions/page.tsx' },
  { key: 'rewardsBenefits', path: 'apps/web/src/app/[locale]/(marketing)/rewards/benefits/page.tsx' },
  { key: 'rewardsAiGuides', path: 'apps/web/src/app/[locale]/(marketing)/rewards/ai-guides/page.tsx' },
  { key: 'rewardsReferralProgram', path: 'apps/web/src/app/[locale]/(marketing)/rewards/referral-program/page.tsx' },
  { key: 'rewardsPointsSystem', path: 'apps/web/src/app/[locale]/(marketing)/rewards/points-system/page.tsx' },
  { key: 'rewardsBadgesLeaderboard', path: 'apps/web/src/app/[locale]/(marketing)/rewards/badges-leaderboard/page.tsx' },
  { key: 'rewardsCampaigns', path: 'apps/web/src/app/[locale]/(marketing)/rewards/campaigns/page.tsx' },
  { key: 'rewardsTokenAirdrop', path: 'apps/web/src/app/[locale]/(marketing)/rewards/token-airdrop/page.tsx' },
  { key: 'securityBenefits', path: 'apps/web/src/app/[locale]/(marketing)/security/benefits/page.tsx' },
  { key: 'securityAuditReports', path: 'apps/web/src/app/[locale]/(marketing)/security/audit-reports/page.tsx' },
  { key: 'securitySafetyGuide', path: 'apps/web/src/app/[locale]/(marketing)/security/safety-guide/page.tsx' },
  { key: 'helpFaq', path: 'apps/web/src/app/[locale]/(marketing)/help/faq/page.tsx' },
  { key: 'about', path: 'apps/web/src/app/[locale]/(marketing)/about/page.tsx' },
  { key: 'careers', path: 'apps/web/src/app/[locale]/(marketing)/careers/page.tsx' },
  { key: 'investors', path: 'apps/web/src/app/[locale]/(marketing)/investors/page.tsx' },
  { key: 'legalTerms', path: 'apps/web/src/app/[locale]/(marketing)/legal/terms/page.tsx' },
  { key: 'legalPrivacy', path: 'apps/web/src/app/[locale]/(marketing)/legal/privacy/page.tsx' },
  { key: 'legalCookies', path: 'apps/web/src/app/[locale]/(marketing)/legal/cookies/page.tsx' }
];

function fixPage(page) {
  const { key, path: filePath } = page;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace import statement
    content = content.replace(
      /import\s*{\s*getStickyFeaturesNavConfig\s*}\s*from\s*['"]@\/config\/stickyFeaturesNav-pages['"]\s*;?\s*\n/g,
      `import { STICKY_FEATURES_NAV_PAGE_CONFIGS } from '@/config/stickyFeaturesNav-pages';\n`
    );

    // Replace config usage
    const configRegex = new RegExp(`config=\\{getStickyFeaturesNavConfig\\(['"\`]${key}['"\`]\\)\\}`, 'g');
    content = content.replace(configRegex, `config={STICKY_FEATURES_NAV_PAGE_CONFIGS.${key}}`);

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(`✅ Fixed ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${key}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing StickyFeaturesNav config usage in all pages...\n');

  let fixed = 0;
  let failed = 0;

  PAGES.forEach(page => {
    if (fixPage(page)) {
      fixed++;
    } else {
      failed++;
    }
  });

  console.log(`\n✨ Done!`);
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Failed: ${failed}`);
}

main();
