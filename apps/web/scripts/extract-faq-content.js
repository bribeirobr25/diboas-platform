#!/usr/bin/env node
/**
 * Extract FAQ content for all languages
 * FAQ is the single source of truth for the entire project
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '../../../packages/i18n/translations');
const OUTPUT_DIR = path.join(__dirname, '../../../docs/faq-content');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];

function formatFAQItems(items) {
  let output = '';
  const keys = Object.keys(items).sort((a, b) => {
    const numA = parseInt(a.replace('q', ''));
    const numB = parseInt(b.replace('q', ''));
    return numA - numB;
  });

  keys.forEach((key, index) => {
    const item = items[key];
    output += `### ${index + 1}. ${item.question}\n\n`;
    output += `${item.answer}\n\n`;
  });

  return output;
}

function generateMarkdown(lang, data) {
  let md = `# FAQ Content - ${lang.toUpperCase()}\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `---\n\n`;

  // Main FAQ header
  if (data.title) {
    md += `## ${data.title}\n\n`;
    if (data.description) {
      md += `${data.description}\n\n`;
    }
    if (data.ctaText) {
      md += `**CTA**: ${data.ctaText}\n\n`;
    }
    md += `---\n\n`;
  }

  // Main FAQ items (landing page FAQ)
  if (data.items) {
    md += `## Landing Page FAQ Items\n\n`;
    md += formatFAQItems(data.items);
    md += `---\n\n`;
  }

  // Registry FAQ (account/registration related)
  if (data.registry) {
    md += `## Registration & Account FAQ\n\n`;
    md += formatFAQItems(data.registry);
    md += `---\n\n`;
  }

  // Categories if present
  if (data.categories) {
    md += `## FAQ Categories\n\n`;
    Object.entries(data.categories).forEach(([catKey, catData]) => {
      md += `### ${catData.title || catKey}\n\n`;
      if (catData.description) {
        md += `${catData.description}\n\n`;
      }
      if (catData.items) {
        md += formatFAQItems(catData.items);
      }
    });
    md += `---\n\n`;
  }

  return md;
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process each language
LANGUAGES.forEach(lang => {
  const faqPath = path.join(TRANSLATIONS_DIR, lang, 'faq.json');

  if (!fs.existsSync(faqPath)) {
    console.error(`Missing faq.json for ${lang}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
    const markdown = generateMarkdown(lang, data);

    const outputPath = path.join(OUTPUT_DIR, `faq-content-${lang}.md`);
    fs.writeFileSync(outputPath, markdown);

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${lang}:`, error.message);
  }
});

console.log('\nDone! Check docs/faq-content/ for the generated files.');
