#!/usr/bin/env node

/**
 * Move Home Page Sections into pages.home
 *
 * Moves all landing page sections into pages.home for better organization.
 * Based on the sections used in apps/web/src/app/[locale]/(marketing)/page.tsx
 *
 * Sections to move:
 * - productCarousel
 * - featureShowcase
 * - appFeatures
 * - oneFeature
 * - stickyFeaturesNav
 * - benefitsCards
 * - bgHighlight
 * - stepGuide
 *
 * NOTE: 'faq' stays at top-level as it's a shared resource (registry pattern)
 * NOTE: 'benefits' stays at top-level (used on /benefits page, not home)
 *
 * DRY Principles: Single script for all language files
 * Code Reusability: Consistent structure across all pages
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

// Sections used on the home/landing page that should be moved into pages.home
const HOME_SECTIONS = [
  'productCarousel',
  'featureShowcase',
  'appFeatures',
  'oneFeature',
  'stickyFeaturesNav',
  'benefitsCards',
  'bgHighlight',
  'stepGuide'
];

/**
 * Move home sections into pages.home for a specific language
 */
function moveHomeSections(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read current structure
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Check if pages.home exists
  if (!data.pages || !data.pages.home) {
    console.error(`   ❌ Error: pages.home not found!`);
    return false;
  }

  // Extract sections to move
  const sectionsToMove = {};
  let movedCount = 0;

  HOME_SECTIONS.forEach(section => {
    if (data.hasOwnProperty(section)) {
      sectionsToMove[section] = data[section];
      movedCount++;
      console.log(`   ✓ Found ${section} - will move to pages.home`);
    } else {
      console.log(`   ⚠️  ${section} not found at top level`);
    }
  });

  if (movedCount === 0) {
    console.log(`   ℹ️  No sections to move (already organized?)`);
    return false;
  }

  // Build new structure
  const newData = {
    pages: {
      ...data.pages,
      home: {
        ...data.pages.home,
        ...sectionsToMove  // Add all home sections
      }
    },
    faq: data.faq,  // Keep FAQ at top level (shared resource)
    benefits: data.benefits  // Keep benefits at top level (used on /benefits page)
  };

  // Add any other pages
  Object.keys(data.pages).forEach(page => {
    if (page !== 'home') {
      newData.pages[page] = data.pages[page];
    }
  });

  // Add any other top-level keys we might have missed
  Object.keys(data).forEach(key => {
    if (!newData.hasOwnProperty(key) && !HOME_SECTIONS.includes(key)) {
      console.log(`   ℹ️  Preserving top-level key: ${key}`);
      newData[key] = data[key];
    }
  });

  // Verify structure
  const homeKeys = Object.keys(newData.pages.home);
  console.log(`   📊 pages.home now has ${homeKeys.length} sections`);

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Moved ${movedCount} sections into pages.home`);

  return true;
}

function main() {
  console.log('🔄 MOVING HOME PAGE SECTIONS INTO pages.home\n');
  console.log('='.repeat(70));
  console.log('\nSections to move into pages.home:');
  HOME_SECTIONS.forEach((section, i) => {
    console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${section}`);
  });
  console.log('\nSections staying at top level:');
  console.log('   - faq (shared resource - registry pattern)');
  console.log('   - benefits (used on /benefits page)');
  console.log('\n' + '='.repeat(70));

  let successCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (moveHomeSections(locale)) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Migration complete!`);
  console.log(`   📦 Languages processed: ${successCount}/${LANGUAGES.length}`);
  console.log(`   📋 Structure: All home sections now in pages.home`);
  console.log('\n' + '='.repeat(70) + '\n');

  console.log('📊 NEW STRUCTURE:');
  console.log('   pages/');
  console.log('     home/');
  console.log('       hero/              (HeroSection)');
  console.log('       productCarousel/   (ProductCarousel)');
  console.log('       featureShowcase/   (FeatureShowcase)');
  console.log('       appFeatures/       (AppFeaturesCarousel)');
  console.log('       oneFeature/        (OneFeature)');
  console.log('       stickyFeaturesNav/ (StickyFeaturesNav)');
  console.log('       benefitsCards/     (BenefitsCards)');
  console.log('       bgHighlight/       (BgHighlight)');
  console.log('       stepGuide/         (StepGuide)');
  console.log('     benefits/');
  console.log('     account/');
  console.log('     ... (other pages)');
  console.log('   faq/                   (Shared FAQ registry)');
  console.log('   benefits/              (Benefits carousel for /benefits page)\n');

  console.log('✅ BENEFITS:');
  console.log('   • All home content in one place (pages.home)');
  console.log('   • Consistent with other pages structure');
  console.log('   • Easier to maintain and navigate');
  console.log('   • Clear separation: page-specific vs shared resources\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Update config files to reference new paths');
  console.log('   2. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   3. Verify application: pnpm run dev:web\n');
}

main();
