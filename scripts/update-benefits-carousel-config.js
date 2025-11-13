#!/usr/bin/env node

/**
 * Update Benefits Carousel Config References
 *
 * Updates benefitsCarousel.ts to reference new path after moving carousel
 *
 * Changes:
 * - marketing.benefits.* → marketing.pages.benefits.carousel.*
 *
 * DRY Principles: Automated update of all references
 * No Hardcoded Values: Pattern-based replacement
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../apps/web/src/config/benefitsCarousel.ts');

function updateBenefitsCarouselConfig() {
  console.log('🔄 UPDATING BENEFITS CAROUSEL CONFIG\n');
  console.log('='.repeat(70));
  console.log('\nFile: apps/web/src/config/benefitsCarousel.ts');
  console.log('Change: marketing.benefits.* → marketing.pages.benefits.carousel.*');
  console.log('\n' + '='.repeat(70) + '\n');

  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Error: benefitsCarousel.ts not found!');
    process.exit(1);
  }

  // Read file content
  let content = fs.readFileSync(CONFIG_FILE, 'utf8');
  const originalContent = content;

  // Replace all instances of marketing.benefits. with marketing.pages.benefits.carousel.
  const pattern = /(['"`])marketing\.benefits\./g;
  const matches = content.match(pattern);

  if (!matches) {
    console.log('ℹ️  No changes needed - already updated or no references found');
    return;
  }

  content = content.replace(pattern, '$1marketing.pages.benefits.carousel.');
  const replacementCount = matches.length;

  // Write back to file
  fs.writeFileSync(CONFIG_FILE, content, 'utf8');

  console.log(`✅ Updated ${replacementCount} references\n`);
  console.log('Updated paths:');
  console.log('   marketing.benefits.exclusiveRewards.* → marketing.pages.benefits.carousel.exclusiveRewards.*');
  console.log('   marketing.benefits.financialFreedom.* → marketing.pages.benefits.carousel.financialFreedom.*');
  console.log('   marketing.benefits.smartInvesting.*   → marketing.pages.benefits.carousel.smartInvesting.*');
  console.log('   marketing.benefits.secureBanking.*    → marketing.pages.benefits.carousel.secureBanking.*');

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('✅ COMPLETE!\n');
  console.log('📋 NEXT STEPS:');
  console.log('   1. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   2. Verify application: pnpm run dev:web');
  console.log('   3. Test /benefits page in browser\n');
}

updateBenefitsCarouselConfig();
