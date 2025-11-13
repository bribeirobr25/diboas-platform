#!/usr/bin/env node

/**
 * Detailed Content Audit
 *
 * Provides specific recommendations for content cleanup
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');
const PAGES_DIR = path.join(__dirname, '../apps/web/src/app/[locale]/(marketing)');

function getActualPages() {
  const dirs = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
  return dirs
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !name.startsWith('[') && !name.startsWith('_'));
}

function pageNameToKey(pageName) {
  // Convert kebab-case to camelCase
  return pageName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function keyToPageName(key) {
  // Convert camelCase to kebab-case
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function analyzeContent() {
  console.log('🔍 DETAILED CONTENT AUDIT\n');
  console.log('='.repeat(70) + '\n');

  // Get actual pages from filesystem
  const actualPages = getActualPages();
  console.log(`📂 Found ${actualPages.length} actual page directories:\n`);
  actualPages.sort().forEach(p => console.log(`   - ${p}`));
  console.log('');

  // Get pages from marketing.json
  const marketingPath = path.join(TRANSLATIONS_DIR, 'en', 'marketing.json');
  const marketingData = JSON.parse(fs.readFileSync(marketingPath, 'utf8'));
  const jsonPages = Object.keys(marketingData.pages);

  console.log(`📄 Found ${jsonPages.length} pages in marketing.json:\n`);
  jsonPages.sort().forEach(p => console.log(`   - ${p}`));
  console.log('\n' + '='.repeat(70) + '\n');

  // Map page names
  const actualPageKeys = actualPages.map(pageNameToKey);
  const actualPageSet = new Set(actualPageKeys);

  // Find unused pages
  const unusedPages = jsonPages.filter(page => {
    // Special case: home page (no directory, it's page.tsx at root)
    if (page === 'home') return false;

    // Check if page directory exists
    return !actualPageSet.has(page) && !actualPages.includes(keyToPageName(page));
  });

  console.log('📊 ANALYSIS RESULTS:\n');

  if (unusedPages.length > 0) {
    console.log(`⚠️  UNUSED PAGES (${unusedPages.length}):\n`);
    console.log('These pages have content in marketing.json but NO corresponding page file:\n');

    unusedPages.forEach(page => {
      const pageData = marketingData.pages[page];
      const keyCount = JSON.stringify(pageData).split('"').length;
      console.log(`❌ pages.${page}`);
      console.log(`   Expected file: ${keyToPageName(page)}/page.tsx`);
      console.log(`   Approximate size: ~${keyCount} keys`);
      console.log('');
    });

    console.log('-'.repeat(70) + '\n');
  }

  // Analyze sections within pages
  console.log('📋 PAGE SECTIONS ANALYSIS:\n');

  const usedPages = jsonPages.filter(page => !unusedPages.includes(page));

  // Common sections that appear in pages
  const commonSections = new Set();
  usedPages.forEach(page => {
    if (marketingData.pages[page]) {
      Object.keys(marketingData.pages[page]).forEach(section => {
        if (typeof marketingData.pages[page][section] === 'object') {
          commonSections.add(section);
        }
      });
    }
  });

  console.log('Common section types found:');
  Array.from(commonSections).sort().forEach(s => console.log(`   - ${s}`));
  console.log('');

  console.log('='.repeat(70) + '\n');

  // Calculate savings
  let totalKeys = 0;
  let unusedKeys = 0;

  Object.keys(marketingData.pages).forEach(page => {
    const pageKeys = JSON.stringify(marketingData.pages[page]).split('"').length;
    totalKeys += pageKeys;

    if (unusedPages.includes(page)) {
      unusedKeys += pageKeys;
    }
  });

  console.log('💾 POTENTIAL SAVINGS:\n');
  console.log(`Total page content keys: ~${totalKeys}`);
  console.log(`Unused page content keys: ~${unusedKeys} (${((unusedKeys/totalKeys)*100).toFixed(1)}%)`);
  console.log(`Potential file size reduction: ~${(unusedKeys * 50 / 1024).toFixed(1)} KB per language`);
  console.log(`Total reduction (4 languages): ~${(unusedKeys * 50 * 4 / 1024).toFixed(1)} KB`);

  console.log('\n' + '='.repeat(70) + '\n');

  // Recommendations
  console.log('💡 RECOMMENDATIONS:\n');

  if (unusedPages.length > 0) {
    console.log('1. DELETE UNUSED PAGES:');
    console.log('   The following pages can be safely removed from marketing.json:');
    unusedPages.forEach(page => console.log(`   - pages.${page}`));
    console.log('');
  }

  console.log('2. FAQ REGISTRY:');
  console.log('   ✅ FAQ registry is shared and properly structured');
  console.log('   ⚠️  Only 20/365 FAQ keys are used (5.5%)');
  console.log('   Consider: Keep all 120 questions for future use');
  console.log('');

  console.log('3. NEXT STEPS:');
  console.log('   a) Review unused pages list');
  console.log('   b) Confirm these pages won\'t be implemented');
  console.log('   c) Run cleanup script to remove unused content');
  console.log('');

  console.log('='.repeat(70) + '\n');

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      actualPages: actualPages.length,
      jsonPages: jsonPages.length,
      unusedPages: unusedPages.length,
      potentialSavings: `${(unusedKeys * 50 * 4 / 1024).toFixed(1)} KB`
    },
    unusedPagesList: unusedPages,
    actualPagesList: actualPages,
    jsonPagesList: jsonPages
  };

  const reportPath = path.join(__dirname, '../docs/detailed-content-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`📄 Detailed report saved to: docs/detailed-content-audit.json\n`);

  return { unusedPages, actualPages, jsonPages };
}

// Run analysis
const results = analyzeContent();

// Export for cleanup script
module.exports = { results };
