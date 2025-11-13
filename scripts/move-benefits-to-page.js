#!/usr/bin/env node

/**
 * Move Benefits Section into Benefits Page
 *
 * Moves top-level benefits section (used by benefits page FeatureShowcase)
 * into pages.benefits to maintain consistent organization.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

function moveBenefitsToPage(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Check if top-level benefits exists
  if (!data.benefits) {
    console.log(`   ⚠️  No top-level benefits section found`);
    return false;
  }

  // Check if pages.benefits exists
  if (!data.pages || !data.pages.benefits) {
    console.log(`   ⚠️  pages.benefits section not found`);
    return false;
  }

  console.log(`   ✓ Found top-level benefits section`);

  // Move benefits content into pages.benefits as "carousel"
  // This matches the usage in benefitsCarousel.ts config
  data.pages.benefits.carousel = data.benefits;

  // Remove top-level benefits
  delete data.benefits;

  // Write back to file with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Moved benefits into pages.benefits.carousel`);
  console.log(`   📦 Benefits items: ${Object.keys(data.pages.benefits.carousel).length}`);

  return true;
}

function main() {
  console.log('🚀 Moving top-level benefits into pages.benefits...\n');

  let successCount = 0;
  let errorCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (moveBenefitsToPage(locale)) {
        successCount++;
      }
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
