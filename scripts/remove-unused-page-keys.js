#!/usr/bin/env node

/**
 * Remove Unused Page Translation Keys
 *
 * Removes:
 * 1. marketing.pages.docs (complete orphan page - never implemented)
 * 2. marketing.pages.banking (legacy - replaced by banking-services)
 * 3. marketing.pages.defi (legacy - replaced by defi-strategies)
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, '..');
const TRANSLATIONS_PATH = path.join(BASE_PATH, 'packages/i18n/translations');
const CONFIG_PATH = path.join(BASE_PATH, 'apps/web/src/config');

console.log('========================================');
console.log('Remove Unused Page Translation Keys');
console.log('========================================\n');

let stats = {
  translationFiles: 0,
  configFiles: 0,
  keysRemoved: 0,
  linesRemoved: 0
};

// ============================================
// PART 1: Remove from Translation Files
// ============================================
console.log('📝 PART 1: Removing unused keys from translation files\n');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];
const KEYS_TO_REMOVE = ['docs', 'banking', 'defi'];

for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_PATH, lang, 'marketing.json');
  console.log(`Processing: ${lang}/marketing.json`);

  try {
    // Read and parse
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Track removals
    let removed = 0;

    // Remove unused page keys
    if (data.pages) {
      for (const key of KEYS_TO_REMOVE) {
        if (data.pages[key]) {
          delete data.pages[key];
          removed++;
          console.log(`  ✓ Removed: marketing.pages.${key}`);
        }
      }
    }

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`  Total removed: ${removed} page keys\n`);
    stats.translationFiles++;
    stats.keysRemoved += removed;

  } catch (error) {
    console.error(`  ❌ Error processing ${lang}/marketing.json:`, error.message);
  }
}

// ============================================
// PART 2: Remove from Config Files
// ============================================
console.log('\n📝 PART 2: Removing "docs" from config files\n');

const CONFIG_FILES = [
  'hero-pages.ts',
  'featureShowcase-pages.ts',
  'stickyFeaturesNav-pages.ts',
  'benefitsCards-pages.ts',
  'faqAccordion-pages.ts'
];

for (const configFile of CONFIG_FILES) {
  const filePath = path.join(CONFIG_PATH, configFile);
  console.log(`Processing: ${configFile}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.split('\n').length;

    // For faqAccordion-pages.ts, also remove from type definition
    if (configFile === 'faqAccordion-pages.ts') {
      // Remove 'docs' from PageKey type union
      content = content.replace(/\s*\|\s*'docs'/g, '');
      content = content.replace(/'docs'\s*\|\s*/g, '');
    }

    // Remove docs configuration block
    // Pattern 1: docs: { ... }
    content = content.replace(/\s*docs:\s*\{[^}]*\},?\n?/g, '');

    // Pattern 2: For objects with nested structure
    content = content.replace(/\s*docs:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\},?\n?/gm, '');

    // Pattern 3: Multiline docs object
    const docsBlockRegex = /\s*docs:\s*\{[\s\S]*?\n\s*\},?\n/g;
    content = content.replace(docsBlockRegex, '');

    // Clean up any trailing commas before closing braces
    content = content.replace(/,(\s*)\n(\s*)\}/g, '$1\n$2}');

    // Clean up multiple blank lines
    content = content.replace(/\n\n\n+/g, '\n\n');

    const newLength = content.split('\n').length;
    const linesRemoved = originalLength - newLength;

    fs.writeFileSync(filePath, content, 'utf8');

    if (linesRemoved > 0) {
      console.log(`  ✓ Removed docs entry (${linesRemoved} lines)\n`);
      stats.configFiles++;
      stats.linesRemoved += linesRemoved;
    } else {
      console.log(`  ℹ No docs entry found\n`);
    }

  } catch (error) {
    console.error(`  ❌ Error processing ${configFile}:`, error.message);
  }
}

// ============================================
// PART 3: Validation
// ============================================
console.log('\n📝 PART 3: Validating JSON files\n');

let validationErrors = 0;

for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_PATH, lang, 'marketing.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content); // Will throw if invalid
    console.log(`  ✓ ${lang}/marketing.json is valid JSON`);
  } catch (error) {
    console.error(`  ❌ ${lang}/marketing.json has invalid JSON:`, error.message);
    validationErrors++;
  }
}

// ============================================
// SUMMARY
// ============================================
console.log('\n========================================');
console.log('CLEANUP SUMMARY');
console.log('========================================\n');

console.log(`📊 Statistics:`);
console.log(`  Translation files updated: ${stats.translationFiles}/4`);
console.log(`  Config files updated: ${stats.configFiles}/5`);
console.log(`  Page keys removed: ${stats.keysRemoved * 4} (${stats.keysRemoved} per locale × 4 locales)`);
console.log(`  Config lines removed: ${stats.linesRemoved}`);
console.log(`  Validation errors: ${validationErrors}`);

console.log(`\n🗑️  Removed Pages:`);
console.log(`  • marketing.pages.docs (orphan - never implemented)`);
console.log(`  • marketing.pages.banking (legacy - replaced by banking-services)`);
console.log(`  • marketing.pages.defi (legacy - replaced by defi-strategies)`);

console.log(`\n📁 Files Modified:`);
console.log(`  Translation files (4):`);
LANGUAGES.forEach(lang => console.log(`    - packages/i18n/translations/${lang}/marketing.json`));
console.log(`  Config files (5):`);
CONFIG_FILES.forEach(file => console.log(`    - apps/web/src/config/${file}`));

if (validationErrors === 0) {
  console.log('\n✅ All changes applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Clean cache: rm -rf apps/web/.next .turbo');
  console.log('3. Test build: pnpm build');
  console.log('4. Commit: git commit -m "Remove unused page translation keys"');
} else {
  console.log('\n⚠️  Some validation errors occurred. Please review before proceeding.');
  process.exit(1);
}
