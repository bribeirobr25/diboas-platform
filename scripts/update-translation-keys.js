#!/usr/bin/env node

/**
 * Update Translation Keys
 *
 * Updates all translation key references from:
 *   marketing.sectionName -> marketing.pages.home.sectionName
 *
 * For landing page sections that were moved into pages.home
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_DIR = path.join(__dirname, '../apps/web/src/config');

const SECTION_MAPPINGS = {
  'marketing.productCarousel': 'marketing.pages.home.productCarousel',
  'marketing.featureShowcase': 'marketing.pages.home.featureShowcase',
  'marketing.appFeatures': 'marketing.pages.home.appFeatures',
  'marketing.oneFeature': 'marketing.pages.home.oneFeature',
  'marketing.stickyFeaturesNav': 'marketing.pages.home.stickyFeaturesNav',
  'marketing.benefitsCards': 'marketing.pages.home.benefitsCards',
  'marketing.bgHighlight': 'marketing.pages.home.bgHighlight',
  'marketing.stepGuide': 'marketing.pages.home.stepGuide',
  'marketing.faq': 'marketing.pages.home.faq'
};

function updateFile(filePath) {
  console.log(`\n📝 Processing ${path.basename(filePath)}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  Object.entries(SECTION_MAPPINGS).forEach(([oldKey, newKey]) => {
    const regex = new RegExp(oldKey.replace('.', '\\.'), 'g');
    const matches = content.match(regex);

    if (matches) {
      console.log(`   ✓ Replacing "${oldKey}" -> "${newKey}" (${matches.length} occurrences)`);
      content = content.replace(regex, newKey);
      changeCount += matches.length;
    }
  });

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Updated ${changeCount} references`);
    return true;
  } else {
    console.log(`   ⏭️  No changes needed`);
    return false;
  }
}

function main() {
  console.log('🚀 Updating translation key references...\n');
  console.log('Mappings:');
  Object.entries(SECTION_MAPPINGS).forEach(([oldKey, newKey]) => {
    console.log(`   ${oldKey}`);
    console.log(`   → ${newKey}`);
  });

  const configFiles = [
    'productCarousel.ts',
    'featureShowcase.ts',
    'appFeaturesCarousel.ts',
    'oneFeature.ts',
    'stickyFeaturesNav.ts',
    'benefitsCards.ts',
    'bgHighlight.ts',
    'stepGuide.ts',
    'faqAccordion.ts'
  ];

  let updatedCount = 0;
  let errorCount = 0;

  configFiles.forEach(fileName => {
    const filePath = path.join(CONFIG_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠️  File not found: ${fileName}`);
      return;
    }

    try {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`\n❌ Error processing ${fileName}: ${error.message}`);
      errorCount++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Translation key update complete!`);
  console.log(`   ✅ Updated: ${updatedCount} files`);
  console.log(`   ⏭️  Skipped: ${configFiles.length - updatedCount - errorCount} files (no changes)`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(50) + '\n');
}

main();
