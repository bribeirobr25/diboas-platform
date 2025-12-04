#!/usr/bin/env node
/**
 * Extract landing page content for all languages
 * Generates markdown files with section content (excluding nav/footer)
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../../../packages/i18n/translations');
const OUTPUT_DIR = path.join(__dirname, '../../../docs/landing-page-content');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];

// Sections on the landing page (in order)
const LANDING_SECTIONS = [
  'hero',
  'productCarousel',
  'featureShowcase',
  'appFeatures',
  'oneFeature',
  'stickyFeaturesNav',
  'faqAccordion',
  'benefitsCards',
  'bgHighlight',
  'stepGuide'
];

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

function extractSectionContent(data, sectionKey) {
  // Look for section in pages.home path
  const homeData = data?.pages?.home || {};
  return homeData[sectionKey] || null;
}

function formatContent(sectionName, content, depth = 0) {
  if (!content) return '';

  const indent = '  '.repeat(depth);
  let output = '';

  if (typeof content === 'string') {
    return `${indent}${content}\n`;
  }

  if (Array.isArray(content)) {
    content.forEach((item, index) => {
      output += `${indent}${index + 1}. `;
      if (typeof item === 'string') {
        output += `${item}\n`;
      } else if (typeof item === 'object') {
        output += '\n';
        output += formatContent('', item, depth + 1);
      }
    });
    return output;
  }

  if (typeof content === 'object') {
    for (const key in content) {
      const value = content[key];
      if (typeof value === 'string') {
        output += `${indent}**${key}**: ${value}\n`;
      } else if (Array.isArray(value)) {
        output += `${indent}**${key}**:\n`;
        output += formatContent('', value, depth + 1);
      } else if (typeof value === 'object' && value !== null) {
        output += `${indent}**${key}**:\n`;
        output += formatContent('', value, depth + 1);
      }
    }
  }

  return output;
}

function generateMarkdown(lang, data) {
  let md = `# Landing Page Content - ${lang.toUpperCase()}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  const homeData = data?.pages?.home || {};

  LANDING_SECTIONS.forEach(sectionKey => {
    const sectionContent = homeData[sectionKey];
    if (sectionContent) {
      md += `## ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/([A-Z])/g, ' $1').trim()}\n\n`;
      md += formatContent(sectionKey, sectionContent);
      md += '\n---\n\n';
    } else {
      md += `## ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/([A-Z])/g, ' $1').trim()}\n\n`;
      md += `*Section not found in translations*\n\n`;
      md += '---\n\n';
    }
  });

  return md;
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process each language
LANGUAGES.forEach(lang => {
  const marketingPath = path.join(TRANSLATIONS_DIR, lang, 'marketing.json');

  if (!fs.existsSync(marketingPath)) {
    console.error(`Missing marketing.json for ${lang}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(marketingPath, 'utf-8'));
    const markdown = generateMarkdown(lang, data);

    const outputPath = path.join(OUTPUT_DIR, `landing-content-${lang}.md`);
    fs.writeFileSync(outputPath, markdown);

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${lang}:`, error.message);
  }
});

console.log('\nDone! Check docs/landing-page-content/ for the generated files.');
