#!/usr/bin/env node

/**
 * Reorganize marketing.json sections
 *
 * Reorders top-level sections to match the landing page display sequence.
 * This improves content organization and makes the file easier to navigate.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

/**
 * Desired section order matching landing page display sequence:
 * 1. pages (contains hero and page-specific content - home page first)
 * 2. productCarousel
 * 3. featureShowcase
 * 4. appFeatures
 * 5. oneFeature
 * 6. stickyFeaturesNav
 * 7. faq
 * 8. benefitsCards
 * 9. bgHighlight
 * 10. stepGuide
 * 11. benefits (separate benefits section)
 */
const DESIRED_ORDER = [
  'pages',
  'productCarousel',
  'featureShowcase',
  'appFeatures',
  'oneFeature',
  'stickyFeaturesNav',
  'faq',
  'benefitsCards',
  'bgHighlight',
  'stepGuide',
  'benefits'
];

function reorganizeMarketingJson(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Create new object with desired order
  const reordered = {};

  // Add sections in desired order
  DESIRED_ORDER.forEach(section => {
    if (data.hasOwnProperty(section)) {
      reordered[section] = data[section];
    }
  });

  // Add any remaining sections that weren't in the desired order
  Object.keys(data).forEach(key => {
    if (!reordered.hasOwnProperty(key)) {
      console.log(`   ⚠️  Found unexpected section: "${key}" - adding to end`);
      reordered[key] = data[key];
    }
  });

  // Write back to file with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(reordered, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Reorganized successfully`);
  console.log(`   📊 Sections: ${Object.keys(reordered).length}`);

  return true;
}

function main() {
  console.log('🚀 Reorganizing marketing.json files...\n');
  console.log('Target order:');
  DESIRED_ORDER.forEach((section, index) => {
    console.log(`   ${index + 1}. ${section}`);
  });

  let successCount = 0;
  let errorCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      reorganizeMarketingJson(locale);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
      errorCount++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Reorganization complete!`);
  console.log(`   ✅ Success: ${successCount}/${LANGUAGES.length}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(50) + '\n');
}

main();
