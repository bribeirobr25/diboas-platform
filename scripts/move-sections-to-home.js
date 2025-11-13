#!/usr/bin/env node

/**
 * Move Landing Page Sections into Home Page
 *
 * Moves top-level landing page sections (productCarousel, featureShowcase, etc.)
 * to be nested inside pages.home for better organization.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

/**
 * Sections that should be moved from top-level into pages.home
 * These are all sections used on the landing page
 */
const LANDING_PAGE_SECTIONS = [
  'productCarousel',
  'featureShowcase',
  'appFeatures',
  'oneFeature',
  'stickyFeaturesNav',
  'faq',
  'benefitsCards',
  'bgHighlight',
  'stepGuide'
];

function moveSectionsToHome(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Extract sections to move
  const sectionsToMove = {};
  LANDING_PAGE_SECTIONS.forEach(section => {
    if (data.hasOwnProperty(section)) {
      sectionsToMove[section] = data[section];
      console.log(`   ✓ Found section: ${section}`);
    }
  });

  // Create new structure
  const newData = {
    pages: {
      home: {
        // Keep existing home metadata and hero
        title: data.pages.home.title,
        description: data.pages.home.description,
        hero: data.pages.home.hero,
        // Add landing page sections
        ...sectionsToMove
      },
      // Keep all other pages
      ...Object.keys(data.pages)
        .filter(key => key !== 'home')
        .reduce((acc, key) => {
          acc[key] = data.pages[key];
          return acc;
        }, {})
    },
    // Keep remaining top-level sections (like benefits)
    ...Object.keys(data)
      .filter(key => key !== 'pages' && !LANDING_PAGE_SECTIONS.includes(key))
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {})
  };

  // Write back to file with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Reorganized successfully`);
  console.log(`   📦 Moved ${Object.keys(sectionsToMove).length} sections into pages.home`);

  return true;
}

function main() {
  console.log('🚀 Moving landing page sections into pages.home...\n');
  console.log('Sections to move:');
  LANDING_PAGE_SECTIONS.forEach((section, index) => {
    console.log(`   ${index + 1}. ${section}`);
  });

  let successCount = 0;
  let errorCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      moveSectionsToHome(locale);
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
