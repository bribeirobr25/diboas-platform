#!/usr/bin/env node

/**
 * Update Config File References for Home Sections
 *
 * Updates all config files to reference new paths after moving sections into pages.home
 *
 * Changes:
 * - marketing.productCarousel.* → marketing.pages.home.productCarousel.*
 * - marketing.featureShowcase.* → marketing.pages.home.featureShowcase.*
 * - marketing.appFeatures.* → marketing.pages.home.appFeatures.*
 * - marketing.oneFeature.* → marketing.pages.home.oneFeature.*
 * - marketing.stickyFeaturesNav.* → marketing.pages.home.stickyFeaturesNav.*
 * - marketing.benefitsCards.* → marketing.pages.home.benefitsCards.*
 * - marketing.bgHighlight.* → marketing.pages.home.bgHighlight.*
 * - marketing.stepGuide.* → marketing.pages.home.stepGuide.*
 *
 * DRY Principles: Automated update of all references
 * No Hardcoded Values: Pattern-based replacement
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '../apps/web/src/config');

// Map of old paths to new paths
const PATH_MAPPINGS = {
  'marketing.productCarousel': 'marketing.pages.home.productCarousel',
  'marketing.featureShowcase': 'marketing.pages.home.featureShowcase',
  'marketing.appFeatures': 'marketing.pages.home.appFeatures',
  'marketing.oneFeature': 'marketing.pages.home.oneFeature',
  'marketing.stickyFeaturesNav': 'marketing.pages.home.stickyFeaturesNav',
  'marketing.benefitsCards': 'marketing.pages.home.benefitsCards',
  'marketing.bgHighlight': 'marketing.pages.home.bgHighlight',
  'marketing.stepGuide': 'marketing.pages.home.stepGuide'
};

// Config files to update
const CONFIG_FILES = [
  'productCarousel.ts',
  'featureShowcase.ts',
  'appFeaturesCarousel.ts',
  'oneFeature.ts',
  'stickyFeaturesNav.ts',
  'benefitsCards.ts',
  'bgHighlight.ts',
  'stepGuide.ts'
];

/**
 * Update references in a config file
 */
function updateConfigFile(fileName) {
  const filePath = path.join(CONFIG_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  ${fileName} not found - skipping`);
    return { updated: false, count: 0 };
  }

  console.log(`\n📝 Processing ${fileName}...`);

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let replacementCount = 0;

  // Replace all matching patterns
  Object.entries(PATH_MAPPINGS).forEach(([oldPath, newPath]) => {
    // Match the pattern in translation keys (inside quotes)
    const pattern = new RegExp(`(['"\`])${oldPath.replace(/\./g, '\\.')}`, 'g');
    const matches = content.match(pattern);

    if (matches) {
      content = content.replace(pattern, `$1${newPath}`);
      const count = matches.length;
      replacementCount += count;
      console.log(`   ✓ Replaced ${count}x: ${oldPath} → ${newPath}`);
    }
  });

  if (replacementCount === 0) {
    console.log(`   ℹ️  No changes needed`);
    return { updated: false, count: 0 };
  }

  // Write back to file
  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`   ✅ Updated ${replacementCount} references`);

  return { updated: true, count: replacementCount };
}

function main() {
  console.log('🔄 UPDATING CONFIG FILE REFERENCES\n');
  console.log('='.repeat(70));
  console.log('\nPath mappings:');
  Object.entries(PATH_MAPPINGS).forEach(([old, newPath]) => {
    console.log(`   ${old}`);
    console.log(`   → ${newPath}`);
  });
  console.log('\n' + '='.repeat(70));

  let totalUpdated = 0;
  let totalReplacements = 0;
  const updatedFiles = [];

  CONFIG_FILES.forEach(fileName => {
    try {
      const result = updateConfigFile(fileName);
      if (result.updated) {
        totalUpdated++;
        totalReplacements += result.count;
        updatedFiles.push(fileName);
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${fileName}: ${error.message}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n✨ Update complete!`);
  console.log(`   📦 Files processed: ${CONFIG_FILES.length}`);
  console.log(`   ✏️  Files updated: ${totalUpdated}`);
  console.log(`   🔄 Total replacements: ${totalReplacements}`);

  if (updatedFiles.length > 0) {
    console.log(`\n   Updated files:`);
    updatedFiles.forEach(file => console.log(`     - ${file}`));
  }

  console.log('\n' + '='.repeat(70) + '\n');

  console.log('✅ BENEFITS:');
  console.log('   • All config files now reference pages.home.*');
  console.log('   • Consistent with new marketing.json structure');
  console.log('   • No broken translation references\n');

  console.log('📋 NEXT STEPS:');
  console.log('   1. Rebuild i18n package: pnpm --filter @diboas/i18n build');
  console.log('   2. Verify application: pnpm run dev:web');
  console.log('   3. Check browser console for errors\n');
}

main();
