#!/usr/bin/env node

/**
 * Audit Unused Marketing Content
 *
 * Scans marketing.json for content that is not referenced in the codebase.
 * Helps identify dead code and maintain clean translation files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');
const SRC_DIR = path.join(__dirname, '../apps/web/src');

function getAllTranslationKeys(obj, prefix = 'marketing') {
  let keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = `${prefix}.${key}`;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively get keys from nested objects
      keys.push(fullKey);
      keys = keys.concat(getAllTranslationKeys(value, fullKey));
    } else {
      // Leaf node (actual content)
      keys.push(fullKey);
    }
  }

  return keys;
}

function isKeyUsedInCodebase(key, srcDir) {
  try {
    // Search for the key in all TypeScript/TSX files
    // Using grep for performance
    const searchPattern = key.replace(/\./g, '\\.');
    const result = execSync(
      `grep -r "${searchPattern}" ${srcDir} --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function analyzeUnusedContent() {
  console.log('🔍 Analyzing marketing.json content usage...\n');

  // Read English marketing.json as reference
  const marketingPath = path.join(TRANSLATIONS_DIR, 'en', 'marketing.json');
  const marketingData = JSON.parse(fs.readFileSync(marketingPath, 'utf8'));

  console.log('📊 Extracting all translation keys...');
  const allKeys = getAllTranslationKeys(marketingData);
  console.log(`   Found ${allKeys.length} total keys\n`);

  console.log('🔎 Checking usage in codebase (this may take a minute)...\n');

  const unusedKeys = [];
  const usedKeys = [];
  const sectionUsage = {};

  // Group keys by top-level section
  allKeys.forEach(key => {
    const parts = key.split('.');
    const topSection = parts[1]; // marketing.{section}

    if (!sectionUsage[topSection]) {
      sectionUsage[topSection] = { total: 0, used: 0, unused: 0, unusedKeys: [] };
    }

    sectionUsage[topSection].total++;
  });

  // Check each key
  let processed = 0;
  for (const key of allKeys) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`   Processed ${processed}/${allKeys.length} keys...`);
    }

    const isUsed = isKeyUsedInCodebase(key, SRC_DIR);
    const parts = key.split('.');
    const topSection = parts[1];

    if (isUsed) {
      usedKeys.push(key);
      sectionUsage[topSection].used++;
    } else {
      unusedKeys.push(key);
      sectionUsage[topSection].unused++;
      sectionUsage[topSection].unusedKeys.push(key);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📈 USAGE ANALYSIS REPORT');
  console.log('='.repeat(70) + '\n');

  console.log(`Total Keys: ${allKeys.length}`);
  console.log(`Used Keys: ${usedKeys.length} (${((usedKeys.length / allKeys.length) * 100).toFixed(1)}%)`);
  console.log(`Unused Keys: ${unusedKeys.length} (${((unusedKeys.length / allKeys.length) * 100).toFixed(1)}%)`);
  console.log('\n' + '-'.repeat(70) + '\n');

  // Report by section
  console.log('📊 USAGE BY SECTION:\n');

  const sections = Object.keys(sectionUsage).sort();
  sections.forEach(section => {
    const stats = sectionUsage[section];
    const usagePercent = ((stats.used / stats.total) * 100).toFixed(1);
    const status = stats.unused === 0 ? '✅' : stats.unused > stats.used ? '⚠️ ' : '⚡';

    console.log(`${status} ${section}`);
    console.log(`   Total: ${stats.total} keys`);
    console.log(`   Used: ${stats.used} (${usagePercent}%)`);
    console.log(`   Unused: ${stats.unused}`);

    if (stats.unused > 0 && stats.unused <= 10) {
      console.log(`   Unused keys:`);
      stats.unusedKeys.forEach(key => {
        console.log(`     - ${key}`);
      });
    }

    console.log('');
  });

  console.log('-'.repeat(70) + '\n');

  // Sections with high unused content
  const highUnusedSections = sections.filter(s => {
    const stats = sectionUsage[s];
    return stats.unused > stats.used && stats.total > 5;
  });

  if (highUnusedSections.length > 0) {
    console.log('⚠️  SECTIONS WITH HIGH UNUSED CONTENT:\n');
    highUnusedSections.forEach(section => {
      const stats = sectionUsage[section];
      console.log(`${section}: ${stats.unused}/${stats.total} keys unused`);
    });
    console.log('');
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalKeys: allKeys.length,
      usedKeys: usedKeys.length,
      unusedKeys: unusedKeys.length,
      usagePercentage: ((usedKeys.length / allKeys.length) * 100).toFixed(1)
    },
    sectionUsage,
    unusedKeysList: unusedKeys
  };

  const reportPath = path.join(__dirname, '../docs/unused-content-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`📄 Detailed report saved to: docs/unused-content-report.json`);
  console.log('\n' + '='.repeat(70) + '\n');

  return report;
}

// Run analysis
analyzeUnusedContent();
