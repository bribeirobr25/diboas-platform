#!/usr/bin/env node

/**
 * Reorganize Marketing.json - Landing Page Display Order
 *
 * Reorganizes marketing.json sections to match the landing page display sequence:
 * 1. pages (contains home.hero)
 * 2. productCarousel
 * 3. featureShowcase
 * 4. appFeatures
 * 5. oneFeature
 * 6. stickyFeaturesNav
 * 7. faq
 * 8. benefitsCards
 * 9. bgHighlight
 * 10. stepGuide
 * 11. benefits (benefits carousel, not on landing page)
 *
 * DRY Principles: Single script for all language files
 * No Hardcoded Values: Order defined as configuration
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

// Desired order: landing page sections first, then other content
const DESIRED_ORDER = [
  'pages',              // Contains home.hero (HeroSection)
  'productCarousel',    // 1st carousel on landing
  'featureShowcase',    // 2nd section
  'appFeatures',        // 3rd section (AppFeaturesCarousel)
  'oneFeature',         // 4th section
  'stickyFeaturesNav',  // 5th section
  'faq',                // 6th section (FAQAccordion)
  'benefitsCards',      // 7th section
  'bgHighlight',        // 8th section
  'stepGuide',          // 9th section
  'benefits'            // Benefits carousel (used on /benefits page, not landing)
];

/**
 * Reorganize marketing.json for a specific language
 */
function reorganizeMarketingJson(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read current structure
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Get current keys
  const currentKeys = Object.keys(data);
  console.log(`   Current order: ${currentKeys.join(', ')}`);

  // Build new object in desired order
  const reordered = {};

  // First, add keys in desired order
  DESIRED_ORDER.forEach(key => {
    if (data.hasOwnProperty(key)) {
      reordered[key] = data[key];
    }
  });

  // Then, add any remaining keys that weren't in DESIRED_ORDER
  // (in case there are extra keys we didn't account for)
  currentKeys.forEach(key => {
    if (!reordered.hasOwnProperty(key)) {
      console.log(`   ⚠️  Found unexpected key: ${key} (adding at end)`);
      reordered[key] = data[key];
    }
  });

  // Verify we have the same keys
  const reorderedKeys = Object.keys(reordered);
  if (reorderedKeys.length !== currentKeys.length) {
    console.error(`   ❌ Error: Key count mismatch!`);
    console.error(`      Before: ${currentKeys.length} keys`);
    console.error(`      After: ${reorderedKeys.length} keys`);
    return false;
  }

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(reordered, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Reorganized to: ${reorderedKeys.slice(0, 5).join(', ')}, ...`);
  console.log(`   📊 Keys: ${reorderedKeys.length} (unchanged)`);

  return true;
}

function main() {
  console.log('🔄 REORGANIZING MARKETING.JSON - LANDING PAGE ORDER\n');
  console.log('='.repeat(70));
  console.log('\nDesired order (landing page sections first):');
  DESIRED_ORDER.forEach((key, i) => {
    const note = i === 0 ? '(contains home.hero)' :
                 i === 10 ? '(benefits page, not landing)' : '';
    console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${key} ${note}`);
  });
  console.log('\n' + '='.repeat(70));

  let successCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (reorganizeMarketingJson(locale)) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Reorganization complete!`);
  console.log(`   📦 Languages processed: ${successCount}/${LANGUAGES.length}`);
  console.log(`   📋 Order: Landing page sections → Other content`);
  console.log('\n' + '='.repeat(70) + '\n');

  console.log('✅ BENEFITS:');
  console.log('   • Content matches landing page display order');
  console.log('   • Easier to navigate and maintain');
  console.log('   • Consistent structure across all languages\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   2. Verify application: pnpm run dev:web');
  console.log('   3. Check no errors in browser console\n');
}

main();
