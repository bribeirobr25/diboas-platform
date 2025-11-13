#!/usr/bin/env node

/**
 * Validate Pages Before Cleanup
 *
 * Correctly scans nested page files and validates translation content.
 * This script prevents false positives by:
 * - Scanning recursively for all page.tsx files
 * - Correctly mapping nested paths (business/account → businessAccount)
 * - Validating findings against multiple sources
 *
 * DRY Principles: Single source of truth for page validation logic
 * No Hardcoded Values: All paths configurable
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');
const PAGES_DIR = path.join(__dirname, '../apps/web/src/app/[locale]/(marketing)');

/**
 * Recursively find all page.tsx files
 * Returns array of relative paths (e.g., ["about", "business/account", "rewards/referral-program"])
 */
function getAllPageFilesRecursive(dir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let pages = [];

  for (const entry of entries) {
    // Skip special Next.js directories (dynamic routes, private folders)
    if (entry.name.startsWith('[') || entry.name.startsWith('_')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Check if this directory contains a page.tsx
      const pageFile = path.join(fullPath, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        pages.push(relativePath);
      }

      // Recursively scan subdirectories
      pages = pages.concat(getAllPageFilesRecursive(fullPath, relativePath));
    }
  }

  return pages;
}

/**
 * Convert page path to translation key
 * Handles both top-level and nested routes with kebab-case conversion
 *
 * Examples:
 *   "about" → "about"
 *   "banking-services" → "bankingServices"
 *   "business/account" → "businessAccount"
 *   "business/credit-solutions" → "businessCreditSolutions"
 *   "rewards/referral-program" → "rewardsReferralProgram"
 *   "learn/cryptocurrency-guide" → "learnCryptocurrencyGuide"
 */
function pagePathToKey(pagePath) {
  return pagePath
    .split('/')
    .map((segment, index) => {
      // Convert kebab-case to camelCase
      const camelCase = segment.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      // Capitalize first letter of segments after the first (for nested paths)
      if (index > 0) {
        return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
      }
      return camelCase;
    })
    .join('');
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 VALIDATING PAGE FILES VS TRANSLATION CONTENT\n');
  console.log('='.repeat(70) + '\n');

  // 1. Get all actual page files (recursive scan)
  console.log('📂 Scanning for page files recursively...\n');
  const allPagePaths = getAllPageFilesRecursive(PAGES_DIR);
  console.log(`Found ${allPagePaths.length} page files:\n`);

  // Group by top-level section for better readability
  const grouped = {};
  allPagePaths.forEach(p => {
    const section = p.split('/')[0];
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(p);
  });

  Object.keys(grouped).sort().forEach(section => {
    console.log(`   ${section}/`);
    grouped[section].forEach(p => {
      if (p !== section) {
        console.log(`      ✓ ${p}`);
      } else {
        console.log(`      ✓ ${p} (top-level)`);
      }
    });
  });
  console.log('');

  // 2. Convert paths to translation keys
  const pageKeys = allPagePaths.map(pagePathToKey);
  const pageKeysSet = new Set(pageKeys);

  console.log('🔑 Translation key mapping:\n');
  allPagePaths.forEach((path, i) => {
    console.log(`   ${path.padEnd(40)} → pages.${pageKeys[i]}`);
  });
  console.log('\n' + '='.repeat(70) + '\n');

  // 3. Check marketing.json
  const marketingPath = path.join(TRANSLATIONS_DIR, 'en', 'marketing.json');
  const marketingData = JSON.parse(fs.readFileSync(marketingPath, 'utf8'));
  const jsonPages = Object.keys(marketingData.pages || {});

  console.log(`📄 Pages in marketing.json: ${jsonPages.length}\n`);
  jsonPages.sort().forEach(p => console.log(`   - ${p}`));
  console.log('\n' + '='.repeat(70) + '\n');

  // 4. Find mismatches
  const missingInJson = pageKeys.filter(key => key !== 'home' && !jsonPages.includes(key));
  const unusedInJson = jsonPages.filter(key => key !== 'home' && !pageKeysSet.has(key));

  console.log('📊 VALIDATION RESULTS:\n');

  if (missingInJson.length > 0) {
    console.log(`❌ MISSING IN marketing.json (${missingInJson.length}):\n`);
    console.log('These page files exist but have NO translations:\n');
    missingInJson.forEach(key => {
      const path = allPagePaths[pageKeys.indexOf(key)];
      console.log(`   Page file: ${path}`);
      console.log(`   Expected key: pages.${key}`);
      console.log(`   Status: TRANSLATION MISSING ❌`);
      console.log('');
    });
  }

  if (unusedInJson.length > 0) {
    console.log(`⚠️  UNUSED IN marketing.json (${unusedInJson.length}):\n`);
    console.log('These pages have content but NO corresponding page file:\n');
    unusedInJson.forEach(key => {
      // Try to guess what the page path would be
      const guessedPath = key
        .replace(/([A-Z])/g, (m, p1, offset) => {
          // Check if this is the start of a new segment (like "business" + "Account")
          const prevChar = key[offset - 1];
          if (prevChar && prevChar === prevChar.toLowerCase() && p1 === p1.toUpperCase()) {
            return '/' + p1.toLowerCase();
          }
          return '-' + p1.toLowerCase();
        })
        .replace(/^-/, '');

      console.log(`   Translation key: pages.${key}`);
      console.log(`   Expected file: ${guessedPath}/page.tsx`);
      console.log(`   Status: PAGE FILE NOT FOUND ⚠️`);
      console.log('');
    });
  }

  if (missingInJson.length === 0 && unusedInJson.length === 0) {
    console.log('✅ PERFECT MATCH!\n');
    console.log('All page files have corresponding translations.\n');
    console.log('No unused translations found.\n');
  }

  console.log('='.repeat(70) + '\n');

  // 5. Summary
  console.log('📋 SUMMARY:\n');
  console.log(`Total page files found: ${allPagePaths.length}`);
  console.log(`Total pages in marketing.json: ${jsonPages.length}`);
  console.log(`Missing translations: ${missingInJson.length}`);
  console.log(`Unused translations: ${unusedInJson.length}`);
  console.log(`Match percentage: ${((1 - (missingInJson.length + unusedInJson.length) / Math.max(allPagePaths.length, jsonPages.length)) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(70) + '\n');

  // 6. Recommendations
  if (missingInJson.length > 0) {
    console.log('🔨 ACTION REQUIRED - Missing Translations:\n');
    console.log('Some page files exist but have no translations.');
    console.log('These pages will show MISSING_TRANSLATION errors.\n');
    console.log('Recommended actions:');
    console.log('1. Create translation content for missing pages');
    console.log('2. Or remove unused page files if they\'re not needed\n');
  }

  if (unusedInJson.length > 0) {
    console.log('💡 CLEANUP RECOMMENDATION:\n');
    console.log('⚠️  WARNING: Before deleting ANY content, VERIFY MANUALLY that these pages don\'t exist!\n');
    console.log('The audit script can make mistakes. Always double-check by:');
    console.log('1. Searching for the page file in the codebase');
    console.log('2. Checking if it\'s a nested route or dynamic route');
    console.log('3. Visiting the page URL in a browser');
    console.log('4. Creating a backup before deletion\n');
    console.log('If you\'re ABSOLUTELY CERTAIN these pages don\'t exist:');
    console.log('1. Create backup: cp packages/i18n/translations/en/marketing.json packages/i18n/translations/en/marketing.json.backup');
    console.log('2. Run cleanup with --dry-run first');
    console.log('3. Verify in browser before committing');
    console.log('4. Test all locales (en, pt-BR, es, de)\n');
  }

  // 7. Cross-language validation
  console.log('🌍 CROSS-LANGUAGE VALIDATION:\n');
  const languages = ['en', 'pt-BR', 'es', 'de'];
  const consistencyIssues = [];

  languages.forEach(lang => {
    const langPath = path.join(TRANSLATIONS_DIR, lang, 'marketing.json');
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const langPages = Object.keys(langData.pages || {}).sort().join(',');

    if (lang === 'en') {
      console.log(`   ✓ ${lang} (reference): ${Object.keys(langData.pages || {}).length} pages`);
    } else {
      const enPages = Object.keys(marketingData.pages || {}).sort().join(',');
      if (langPages === enPages) {
        console.log(`   ✓ ${lang}: ${Object.keys(langData.pages || {}).length} pages (consistent)`);
      } else {
        console.log(`   ⚠️  ${lang}: ${Object.keys(langData.pages || {}).length} pages (INCONSISTENT)`);
        consistencyIssues.push(lang);
      }
    }
  });

  if (consistencyIssues.length > 0) {
    console.log(`\n   ⚠️  Warning: ${consistencyIssues.join(', ')} have different pages than English!`);
    console.log('   This could cause translation errors in those locales.');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // 8. Exit code
  if (missingInJson.length > 0 || unusedInJson.length > 0) {
    console.log('❌ VALIDATION FAILED - Issues found\n');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED - All pages have translations\n');
    process.exit(0);
  }
}

main();
