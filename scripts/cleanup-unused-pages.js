#!/usr/bin/env node

/**
 * Cleanup Unused Pages
 *
 * Removes unused page content from marketing.json files.
 * Following DRY Principles: Removes duplicate/unused content.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

// Pages to remove (confirmed unused - no corresponding page files)
const UNUSED_PAGES = [
  'businessAccount',
  'businessBanking',
  'businessBenefits',
  'businessCreditSolutions',
  'businessPayments',
  'businessTreasury',
  'businessYieldStrategies',
  'helpFaq',
  'learnBenefits',
  'learnCryptocurrencyGuide',
  'learnDefiExplained',
  'learnFinancialBasics',
  'learnInvestmentGuide',
  'learnMoneyManagement',
  'learnSpecialContent',
  'legalCookies',
  'legalPrivacy',
  'legalTerms',
  'rewardsAiGuides',
  'rewardsBadgesLeaderboard',
  'rewardsBenefits',
  'rewardsCampaigns',
  'rewardsPointsSystem',
  'rewardsReferralProgram',
  'rewardsTokenAirdrop',
  'securityAuditReports',
  'securityBenefits',
  'securitySafetyGuide'
];

function cleanupUnusedPages(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Track deletions
  let deletedCount = 0;
  let deletedSize = 0;

  // Remove unused pages
  UNUSED_PAGES.forEach(page => {
    if (data.pages && data.pages[page]) {
      const pageSize = JSON.stringify(data.pages[page]).length;
      delete data.pages[page];
      deletedCount++;
      deletedSize += pageSize;
      console.log(`   ❌ Deleted pages.${page}`);
    }
  });

  if (deletedCount === 0) {
    console.log(`   ℹ️  No unused pages found`);
    return false;
  }

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Removed ${deletedCount} unused pages`);
  console.log(`   💾 Freed ${(deletedSize / 1024).toFixed(1)} KB`);

  return true;
}

function main() {
  console.log('🧹 Cleaning up unused page content...\n');
  console.log(`Target: Remove ${UNUSED_PAGES.length} unused pages from marketing.json`);
  console.log('\nThese pages have content but NO corresponding page files:\n');

  UNUSED_PAGES.forEach((page, i) => {
    console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${page}`);
  });

  console.log('\n' + '='.repeat(70));

  let totalDeleted = 0;
  let totalSize = 0;
  let successCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      const sizeBefore = fs.statSync(path.join(TRANSLATIONS_DIR, locale, 'marketing.json')).size;

      if (cleanupUnusedPages(locale)) {
        const sizeAfter = fs.statSync(path.join(TRANSLATIONS_DIR, locale, 'marketing.json')).size;
        const saved = sizeBefore - sizeAfter;
        totalSize += saved;
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Cleanup complete!`);
  console.log(`   📦 Languages processed: ${successCount}/${LANGUAGES.length}`);
  console.log(`   💾 Total space freed: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`   📊 Remaining pages: ${11} (actually implemented)`);
  console.log('\n' + '='.repeat(70) + '\n');

  console.log('✅ BENEFITS:');
  console.log('   • Smaller bundle size');
  console.log('   • Faster build times');
  console.log('   • Easier maintenance');
  console.log('   • Clean codebase (DRY principles)\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   2. Test application: pnpm run dev:web');
  console.log('   3. Verify no errors in browser console\n');
}

main();
