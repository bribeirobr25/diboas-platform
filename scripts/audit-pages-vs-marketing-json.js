#!/usr/bin/env node

/**
 * Audit Pages vs Marketing.json Structure
 *
 * Compares actual page implementations with marketing.json structure
 * to identify mismatches, missing content, or unused content.
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');
const PAGES_DIR = path.join(__dirname, '../apps/web/src/app/[locale]/(marketing)');

// Map of component names to expected marketing.json section names
const COMPONENT_TO_SECTION = {
  'HeroSection': 'hero',
  'ProductCarousel': 'productCarousel',
  'FeatureShowcase': 'featureShowcase',
  'AppFeaturesCarousel': 'appFeatures',
  'OneFeature': 'oneFeature',
  'StickyFeaturesNav': 'stickyFeaturesNav',
  'FAQAccordion': 'faqAccordion',
  'BenefitsCardsSection': 'benefitsCards',
  'BgHighlightSection': 'bgHighlight',
  'StepGuideSection': 'stepGuide'
};

/**
 * Extract components used from a page.tsx file
 */
function extractComponentsFromPage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const components = [];

  // Look for component usage patterns like <ComponentName or <ComponentName>
  Object.keys(COMPONENT_TO_SECTION).forEach(component => {
    if (content.includes(`<${component}`)) {
      components.push(component);
    }
  });

  return components;
}

/**
 * Get page key from file path
 */
function getPageKeyFromPath(filePath) {
  const relativePath = path.relative(PAGES_DIR, path.dirname(filePath));

  // Home page
  if (relativePath === '.') return 'home';

  // Convert path to camelCase key
  return relativePath
    .split('/')
    .map((segment, index) => {
      const camelCase = segment.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return index > 0 ? camelCase.charAt(0).toUpperCase() + camelCase.slice(1) : camelCase;
    })
    .join('');
}

/**
 * Scan all pages and compare with marketing.json
 */
function auditPages() {
  console.log('🔍 AUDITING PAGES VS MARKETING.JSON\n');
  console.log('='.repeat(70) + '\n');

  // Load marketing.json
  const marketingPath = path.join(TRANSLATIONS_DIR, 'en', 'marketing.json');
  const marketingData = JSON.parse(fs.readFileSync(marketingPath, 'utf8'));

  // Find all page files
  const findPages = (dir, basePath = '') => {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('[') || entry.name.startsWith('_')) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const pageFile = path.join(fullPath, 'page.tsx');
        if (fs.existsSync(pageFile)) {
          files.push({ path: pageFile, relativePath });
        }
        files.push(...findPages(fullPath, relativePath));
      }
    }

    return files;
  };

  const pages = findPages(PAGES_DIR);

  console.log(`Found ${pages.length} page files\n`);

  const issues = [];
  const matches = [];

  pages.forEach(({ path: pagePath, relativePath }) => {
    const pageKey = getPageKeyFromPath(pagePath);
    const components = extractComponentsFromPage(pagePath);
    const sections = components.map(c => COMPONENT_TO_SECTION[c]);

    // Check if page exists in marketing.json
    if (!marketingData.pages[pageKey]) {
      issues.push({
        type: 'MISSING_PAGE',
        page: pageKey,
        path: relativePath,
        message: `Page "${pageKey}" missing in marketing.json`
      });
      return;
    }

    const marketingSections = Object.keys(marketingData.pages[pageKey])
      .filter(k => typeof marketingData.pages[pageKey][k] === 'object' && !['title', 'description'].includes(k));

    // Compare sections
    const missingSections = sections.filter(s => !marketingSections.includes(s));
    const unusedSections = marketingSections.filter(s => !sections.includes(s));

    if (missingSections.length > 0 || unusedSections.length > 0) {
      issues.push({
        type: 'SECTION_MISMATCH',
        page: pageKey,
        path: relativePath,
        components: components,
        implementedSections: sections,
        marketingSections: marketingSections,
        missing: missingSections,
        unused: unusedSections
      });
    } else {
      matches.push({
        page: pageKey,
        path: relativePath,
        sections: sections.length
      });
    }
  });

  // Report results
  console.log('📊 AUDIT RESULTS:\n');

  if (issues.length === 0) {
    console.log('✅ PERFECT MATCH!\n');
    console.log(`All ${pages.length} pages match their marketing.json structure.\n`);

    matches.forEach(m => {
      console.log(`  ✓ ${m.page} (${m.sections} sections)`);
    });
  } else {
    console.log(`⚠️  Found ${issues.length} issue(s):\n`);

    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.type}: ${issue.page}`);
      console.log(`   Path: ${issue.path}`);

      if (issue.type === 'MISSING_PAGE') {
        console.log(`   Problem: ${issue.message}`);
      } else if (issue.type === 'SECTION_MISMATCH') {
        console.log(`   Components used: ${issue.components.join(', ')}`);
        console.log(`   Implemented sections: ${issue.implementedSections.join(', ')}`);
        console.log(`   Marketing.json sections: ${issue.marketingSections.join(', ')}`);

        if (issue.missing.length > 0) {
          console.log(`   ❌ Missing in marketing.json: ${issue.missing.join(', ')}`);
        }
        if (issue.unused.length > 0) {
          console.log(`   ⚠️  Unused in page: ${issue.unused.join(', ')}`);
        }
      }

      console.log('');
    });

    console.log(`\n✅ Matching pages: ${matches.length}/${pages.length}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Summary by issue type
  const missingPages = issues.filter(i => i.type === 'MISSING_PAGE');
  const sectionMismatches = issues.filter(i => i.type === 'SECTION_MISMATCH');

  console.log('📋 SUMMARY:\n');
  console.log(`Total pages: ${pages.length}`);
  console.log(`Matching pages: ${matches.length}`);
  console.log(`Pages with issues: ${issues.length}`);
  console.log(`  - Missing from marketing.json: ${missingPages.length}`);
  console.log(`  - Section mismatches: ${sectionMismatches.length}`);

  console.log('\n' + '='.repeat(70) + '\n');

  if (issues.length > 0) {
    console.log('💡 RECOMMENDATIONS:\n');

    if (missingPages.length > 0) {
      console.log('1. Add missing pages to marketing.json');
      missingPages.forEach(p => {
        console.log(`   - Add pages.${p.page} with required sections`);
      });
      console.log('');
    }

    if (sectionMismatches.length > 0) {
      console.log('2. Fix section mismatches:');
      sectionMismatches.forEach(issue => {
        if (issue.missing.length > 0) {
          console.log(`   - ${issue.page}: Add ${issue.missing.join(', ')} to marketing.json`);
        }
        if (issue.unused.length > 0) {
          console.log(`   - ${issue.page}: Remove ${issue.unused.join(', ')} from marketing.json or use in page`);
        }
      });
    }
  }

  console.log('');

  return issues.length === 0;
}

const success = auditPages();
process.exit(success ? 0 : 1);
