#!/usr/bin/env node

/**
 * Move Benefits Carousel into pages.benefits
 *
 * Moves the top-level "benefits" carousel content into pages.benefits.carousel
 * This content is used by the /benefits page FeatureShowcase section.
 *
 * Changes:
 * - benefits.* → pages.benefits.carousel.*
 *
 * DRY Principles: Single script for all language files
 * Code Reusability: Consistent page structure pattern
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

/**
 * Move benefits carousel into pages.benefits for a specific language
 */
function moveBenefitsCarousel(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read current structure
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Check if top-level benefits exists
  if (!data.benefits) {
    console.log(`   ℹ️  No top-level benefits found (already moved?)`);
    return false;
  }

  // Check if pages.benefits exists
  if (!data.pages || !data.pages.benefits) {
    console.error(`   ❌ Error: pages.benefits not found!`);
    return false;
  }

  console.log(`   ✓ Found top-level benefits carousel`);

  // Move benefits carousel into pages.benefits.carousel
  const newData = {
    pages: {
      ...data.pages,
      benefits: {
        ...data.pages.benefits,
        carousel: data.benefits  // Move carousel content here
      }
    },
    faq: data.faq  // Keep FAQ at top level
  };

  // Add any other top-level keys
  Object.keys(data).forEach(key => {
    if (key !== 'pages' && key !== 'faq' && key !== 'benefits') {
      console.log(`   ℹ️  Preserving top-level key: ${key}`);
      newData[key] = data[key];
    }
  });

  // Verify structure
  console.log(`   📊 pages.benefits now has carousel section`);

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Moved benefits carousel to pages.benefits.carousel`);

  return true;
}

function main() {
  console.log('🔄 MOVING BENEFITS CAROUSEL INTO pages.benefits\n');
  console.log('='.repeat(70));
  console.log('\nChange:');
  console.log('   benefits.* → pages.benefits.carousel.*');
  console.log('\nUsed by: /benefits page (FeatureShowcase section)');
  console.log('\n' + '='.repeat(70));

  let successCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (moveBenefitsCarousel(locale)) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Migration complete!`);
  console.log(`   📦 Languages processed: ${successCount}/${LANGUAGES.length}`);
  console.log(`   📋 Structure: Benefits carousel now in pages.benefits.carousel`);
  console.log('\n' + '='.repeat(70) + '\n');

  console.log('📊 NEW STRUCTURE:');
  console.log('   pages/');
  console.log('     home/');
  console.log('       ... (9 sections)');
  console.log('     benefits/');
  console.log('       title/');
  console.log('       description/');
  console.log('       hero/');
  console.log('       carousel/          ← Benefits showcase carousel');
  console.log('         exclusiveRewards/');
  console.log('         financialFreedom/');
  console.log('         smartInvesting/');
  console.log('         secureBanking/');
  console.log('       benefitsCards/');
  console.log('       stickyFeaturesNav/');
  console.log('       faqAccordion/');
  console.log('     ... (other pages)');
  console.log('   faq/                   (Shared FAQ registry)\n');

  console.log('✅ BENEFITS:');
  console.log('   • Benefits carousel properly organized in pages.benefits');
  console.log('   • Consistent with other page sections structure');
  console.log('   • Easier to maintain and navigate');
  console.log('   • Only shared resources at top level (faq)\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Update config file: apps/web/src/config/benefitsCarousel.ts');
  console.log('   2. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   3. Verify application: pnpm run dev:web\n');
}

main();
