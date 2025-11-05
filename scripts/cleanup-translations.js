#!/usr/bin/env node

/**
 * Translation Cleanup Script
 * Removes unused translation keys from all language files
 */

const fs = require('fs');
const path = require('path');

// Keys to remove from common.json
const COMMON_KEYS_TO_REMOVE = [
  // Unused navigation keys
  'navigation.home',
  'navigation.features',
  'navigation.pricing',
  'navigation.contact',
  'navigation.login',
  'navigation.signup',
  'navigation.dashboard',
  'navigation.settings',
  'navigation.help',

  // Unused button keys
  'buttons.signUp',
  'buttons.signIn',
  'buttons.signOut',
  'buttons.save',
  'buttons.cancel',
  'buttons.delete',
  'buttons.edit',
  'buttons.submit',
  'buttons.loading',
  'buttons.tryAgain',

  // Unused common utilities
  'common.and',
  'common.or',
  'common.yes',
  'common.no',
  'common.ok',
  'common.error',
  'common.success',
  'common.warning',
  'common.info',

  // Unused SEO section (entire section)
  'seo',
];

// Keys to remove from marketing.json
const MARKETING_KEYS_TO_REMOVE = [
  // Entire sections
  'hero',
  'domains',
  'mascots',
  'trust',
];

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const BASE_PATH = path.join(__dirname, '../packages/i18n/translations');

/**
 * Remove nested key from object
 */
function removeKey(obj, keyPath) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();

  let current = obj;
  for (const key of keys) {
    if (!current[key]) return false;
    current = current[key];
  }

  if (current[lastKey] !== undefined) {
    delete current[lastKey];
    return true;
  }

  return false;
}

/**
 * Clean a translation file
 */
function cleanTranslationFile(filePath, keysToRemove) {
  console.log(`\nProcessing: ${filePath}`);

  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Track removals
  let removed = 0;
  const removedKeys = [];

  // Remove keys
  for (const key of keysToRemove) {
    const success = removeKey(data, key);
    if (success) {
      removed++;
      removedKeys.push(key);
      console.log(`  ✓ Removed: ${key}`);
    }
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`  Total removed: ${removed} keys`);

  return { removed, removedKeys };
}

/**
 * Main cleanup function
 */
function main() {
  console.log('========================================');
  console.log('Translation Cleanup Script');
  console.log('========================================');

  const stats = {
    totalRemoved: 0,
    byLanguage: {},
    byFile: {}
  };

  // Process each language
  for (const lang of LANGUAGES) {
    console.log(`\n📦 Processing language: ${lang}`);
    stats.byLanguage[lang] = { common: 0, marketing: 0 };

    // Clean common.json
    const commonPath = path.join(BASE_PATH, lang, 'common.json');
    const commonResult = cleanTranslationFile(commonPath, COMMON_KEYS_TO_REMOVE);
    stats.byLanguage[lang].common = commonResult.removed;
    stats.totalRemoved += commonResult.removed;

    // Clean marketing.json
    const marketingPath = path.join(BASE_PATH, lang, 'marketing.json');
    const marketingResult = cleanTranslationFile(marketingPath, MARKETING_KEYS_TO_REMOVE);
    stats.byLanguage[lang].marketing = marketingResult.removed;
    stats.totalRemoved += marketingResult.removed;
  }

  // Print summary
  console.log('\n========================================');
  console.log('CLEANUP SUMMARY');
  console.log('========================================');
  console.log(`\nTotal keys removed: ${stats.totalRemoved}`);
  console.log('\nBy language:');
  for (const [lang, counts] of Object.entries(stats.byLanguage)) {
    console.log(`  ${lang}:`);
    console.log(`    common.json: ${counts.common} keys`);
    console.log(`    marketing.json: ${counts.marketing} keys`);
  }

  console.log('\n✅ Cleanup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify JSON files are valid');
  console.log('2. Test the application: pnpm dev');
  console.log('3. Check for missing translation warnings');
  console.log('4. Commit changes if everything works');
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}
