#!/usr/bin/env node

/**
 * Add FAQ Accordion Section to pages.home
 *
 * Adds the missing faqAccordion section to pages.home structure.
 * The home page displays FAQAccordion but it was missing from marketing.json.
 *
 * Changes:
 * - Adds pages.home.faqAccordion with questionIds referencing shared FAQ registry
 *
 * DRY Principles: Uses shared FAQ registry (marketing.faq.registry)
 * Code Reusability: Consistent with other pages' FAQ structure
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');

/**
 * Add faqAccordion section to pages.home
 */
function addHomeFAQSection(locale) {
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

  // Check if faqAccordion already exists
  if (data.pages.home.faqAccordion) {
    console.log(`   ℹ️  pages.home.faqAccordion already exists (already added?)`);
    return false;
  }

  console.log(`   ✓ Adding faqAccordion section to pages.home`);

  // Find the position to insert faqAccordion (after stickyFeaturesNav, before benefitsCards)
  const homeKeys = Object.keys(data.pages.home);
  const insertIndex = homeKeys.indexOf('benefitsCards');

  // Create new home object with faqAccordion inserted in the correct position
  const newHome = {};
  homeKeys.forEach((key, index) => {
    if (index === insertIndex) {
      // Insert faqAccordion before benefitsCards
      newHome.faqAccordion = {
        questionIds: ["q1", "q2", "q3", "q4", "q10"]
      };
    }
    newHome[key] = data.pages.home[key];
  });

  // Update pages.home
  data.pages.home = newHome;

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`   ✅ Added faqAccordion section with 5 question IDs`);
  console.log(`   📍 Position: After stickyFeaturesNav, before benefitsCards`);

  return true;
}

function main() {
  console.log('🔄 ADDING FAQ ACCORDION SECTION TO pages.home\n');
  console.log('='.repeat(70));
  console.log('\nChange:');
  console.log('   Adding pages.home.faqAccordion section');
  console.log('\nContent:');
  console.log('   questionIds: ["q1", "q2", "q3", "q4", "q10"]');
  console.log('\nUsed by: Home page (line 123 in page.tsx)');
  console.log('\n' + '='.repeat(70));

  let successCount = 0;

  LANGUAGES.forEach(locale => {
    try {
      if (addHomeFAQSection(locale)) {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${locale}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Update complete!`);
  console.log(`   📦 Languages processed: ${successCount}/${LANGUAGES.length}`);
  console.log(`   📋 Section added: pages.home.faqAccordion`);
  console.log('\n' + '='.repeat(70) + '\n');

  console.log('📊 HOME PAGE SECTIONS (Complete):');
  console.log('   1. hero');
  console.log('   2. productCarousel');
  console.log('   3. featureShowcase');
  console.log('   4. appFeatures');
  console.log('   5. oneFeature');
  console.log('   6. stickyFeaturesNav');
  console.log('   7. faqAccordion          ← ADDED');
  console.log('   8. benefitsCards');
  console.log('   9. bgHighlight');
  console.log('   10. stepGuide\n');

  console.log('✅ BENEFITS:');
  console.log('   • Home page now has complete 10 sections');
  console.log('   • FAQ section references shared registry (q1, q2, q3, q4, q10)');
  console.log('   • Consistent with other pages structure');
  console.log('   • Matches actual page.tsx implementation\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   2. Verify application: pnpm run dev:web');
  console.log('   3. Check home page FAQ section displays correctly\n');
}

main();
