#!/usr/bin/env node

/**
 * Fix FAQ Structure
 *
 * Problem: FAQ registry is inside pages.home but needs to be accessed by all pages
 * Solution: Extract FAQ registry to top-level, keep page-specific configs in pages
 *
 * Following DRY Principles: Single source of truth for FAQ registry
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

function fixFAQStructure(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');

  console.log(`\n📝 Processing ${locale}/marketing.json...`);

  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Check if FAQ registry is in pages.home
  if (!data.pages?.home?.faq?.registry) {
    console.log(`   ⚠️  FAQ registry not found in pages.home.faq`);
    return false;
  }

  console.log(`   ✓ Found FAQ registry in pages.home.faq`);

  // Extract FAQ registry and metadata to top-level
  const faqRegistry = data.pages.home.faq.registry;
  const faqMetadata = {
    title: data.pages.home.faq.title,
    description: data.pages.home.faq.description,
    ctaText: data.pages.home.faq.ctaText
  };

  // Keep only page-specific FAQ config in pages.home
  const homeFAQConfig = {
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q10'] // Home page uses these 5 questions
  };

  // Update structure
  data.pages.home.faq = homeFAQConfig;

  // Add top-level FAQ with registry
  data.faq = {
    ...faqMetadata,
    registry: faqRegistry
  };

  // Write back with proper order: faq first, then pages
  const orderedData = {
    faq: data.faq,
    pages: data.pages
  };

  fs.writeFileSync(filePath, JSON.stringify(orderedData, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Restructured FAQ successfully`);
  console.log(`   📦 Registry questions: ${Object.keys(faqRegistry).length}`);
  console.log(`   🏠 Home page questions: ${homeFAQConfig.questionIds.length}`);

  return true;
}

function main() {
  console.log('🚀 Fixing FAQ structure...\n');
  console.log('Goal: Extract FAQ registry to top-level (shared by all pages)');
  console.log('      Keep page-specific FAQ configs in each page\n');

  let successCount = 0;
  let errorCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (fixFAQStructure(locale)) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
      errorCount++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✨ FAQ restructuring complete!`);
  console.log(`   ✅ Success: ${successCount}/${LANGUAGES.length}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(50) + '\n');
}

main();
