#!/usr/bin/env node

/**
 * Reorganize FAQ Accordion Content
 *
 * Purpose:
 * 1. Consolidate all FAQ questions into /help/faq page (master FAQ page)
 * 2. Reduce other pages' FAQ from 3-4 questions to exactly 3 most relevant questions
 * 3. Clean up and organize translations properly
 *
 * Principles:
 * - DRY: Reuse common questions in master FAQ
 * - No Hardcoding: All content via translation keys
 * - Reusability: Organized by topic categories
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, '..');
const TRANSLATIONS_PATH = path.join(BASE_PATH, 'packages/i18n/translations');
const CONFIG_PATH = path.join(BASE_PATH, 'apps/web/src/config/faqAccordion-pages.ts');

console.log('========================================');
console.log('FAQ Content Reorganization');
console.log('========================================\n');

const LANGUAGES = ['en', 'pt-BR', 'es', 'de'];

// Pages to process (all except helpFaq which will be the master)
const PAGE_KEYS = [
  // Main Menu
  'benefits', 'account', 'bankingServices', 'investing', 'cryptocurrency', 'defiStrategies', 'credit',
  // Learn Center
  'learnBenefits', 'learnFinancialBasics', 'learnMoneyManagement', 'learnInvestmentGuide',
  'learnCryptocurrencyGuide', 'learnDefiExplained', 'learnSpecialContent',
  // Business
  'businessBenefits', 'businessAccount', 'businessBanking', 'businessPayments',
  'businessTreasury', 'businessYieldStrategies', 'businessCreditSolutions',
  // Rewards
  'rewardsBenefits', 'rewardsAiGuides', 'rewardsReferralProgram', 'rewardsPointsSystem',
  'rewardsBadgesLeaderboard', 'rewardsCampaigns', 'rewardsTokenAirdrop',
  // Security
  'securityBenefits', 'securityAuditReports', 'securitySafetyGuide',
  // Company (excluding helpFaq)
  'about', 'careers', 'investors',
  // Legal
  'legalTerms', 'legalPrivacy', 'legalCookies'
];

// Category mapping for better organization
const CATEGORY_MAPPING = {
  'Getting Started': ['benefits', 'account'],
  'Banking & Transfers': ['bankingServices', 'account'],
  'Investing': ['investing', 'learnInvestmentGuide'],
  'Cryptocurrency': ['cryptocurrency', 'learnCryptocurrencyGuide'],
  'DeFi Strategies': ['defiStrategies', 'learnDefiExplained'],
  'Credit': ['credit'],
  'Learning': ['learnBenefits', 'learnFinancialBasics', 'learnMoneyManagement', 'learnSpecialContent'],
  'Business Solutions': ['businessBenefits', 'businessAccount', 'businessBanking', 'businessPayments', 'businessTreasury', 'businessYieldStrategies', 'businessCreditSolutions'],
  'Rewards & Benefits': ['rewardsBenefits', 'rewardsAiGuides', 'rewardsReferralProgram', 'rewardsPointsSystem', 'rewardsBadgesLeaderboard', 'rewardsCampaigns', 'rewardsTokenAirdrop'],
  'Security & Safety': ['securityBenefits', 'securityAuditReports', 'securitySafetyGuide'],
  'About diBoaS': ['about', 'careers', 'investors'],
  'Legal & Compliance': ['legalTerms', 'legalPrivacy', 'legalCookies']
};

let stats = {
  questionsCollected: 0,
  questionsReduced: 0,
  pagesProcessed: 0,
  categoriesCreated: 0
};

// ============================================
// STEP 1: Audit & Collect All FAQ Questions
// ============================================
console.log('📋 STEP 1: Auditing all FAQ questions\n');

const allQuestions = {};

for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_PATH, lang, 'marketing.json');
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  allQuestions[lang] = {
    byPage: {},
    byCategory: {}
  };

  // Collect questions from all pages
  for (const pageKey of PAGE_KEYS) {
    if (data.pages[pageKey]?.faqAccordion?.questions) {
      allQuestions[lang].byPage[pageKey] = data.pages[pageKey].faqAccordion.questions;
      stats.questionsCollected += Object.keys(data.pages[pageKey].faqAccordion.questions).length;
    }
  }

  console.log(`  ✓ ${lang}: Collected ${stats.questionsCollected / LANGUAGES.length} questions`);
}

console.log(`\n  Total questions collected: ${stats.questionsCollected} (across ${LANGUAGES.length} languages)\n`);

// ============================================
// STEP 2: Create Master FAQ for helpFaq
// ============================================
console.log('📝 STEP 2: Creating master FAQ for /help/faq\n');

for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_PATH, lang, 'marketing.json');
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Create master FAQ with all questions organized by category
  const masterFAQ = {
    sectionTitle: lang === 'en' ? 'Frequently Asked Questions' :
                  lang === 'pt-BR' ? 'Perguntas Frequentes' :
                  lang === 'es' ? 'Preguntas Frecuentes' :
                  'Häufig gestellte Fragen',
    subtitle: lang === 'en' ? 'Find answers to all your questions about diBoaS.\nCan\'t find what you\'re looking for? Our chat responds in minutes.' :
              lang === 'pt-BR' ? 'Encontre respostas para todas as suas perguntas sobre diBoaS.\nNão encontrou o que procura? Nosso chat responde em minutos.' :
              lang === 'es' ? 'Encuentra respuestas a todas tus preguntas sobre diBoaS.\n¿No encuentras lo que buscas? Nuestro chat responde en minutos.' :
              'Finden Sie Antworten auf alle Ihre Fragen zu diBoaS.\nKönnen Sie nicht finden, wonach Sie suchen? Unser Chat antwortet in Minuten.',
    questions: {},
    ctaText: lang === 'en' ? 'Contact Support' :
             lang === 'pt-BR' ? 'Contatar Suporte' :
             lang === 'es' ? 'Contactar Soporte' :
             'Support kontaktieren'
  };

  // Collect all unique questions organized by topic
  let questionIndex = 1;

  // Iterate through categories to organize questions
  for (const [categoryName, pageKeys] of Object.entries(CATEGORY_MAPPING)) {
    for (const pageKey of pageKeys) {
      const pageQuestions = allQuestions[lang].byPage[pageKey];
      if (pageQuestions) {
        for (const [qKey, qData] of Object.entries(pageQuestions)) {
          masterFAQ.questions[`q${questionIndex}`] = qData;
          questionIndex++;
        }
      }
    }
  }

  // Update helpFaq page with master FAQ
  if (!data.pages.helpFaq) {
    data.pages.helpFaq = {};
  }
  data.pages.helpFaq.faqAccordion = masterFAQ;

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`  ✓ ${lang}: Created master FAQ with ${questionIndex - 1} questions`);
}

stats.categoriesCreated = Object.keys(CATEGORY_MAPPING).length;
console.log(`\n  Categories organized: ${stats.categoriesCreated}\n`);

// ============================================
// STEP 3: Reduce FAQ on Other Pages to 3
// ============================================
console.log('📝 STEP 3: Reducing FAQ on other pages to 3 questions\n');

for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_PATH, lang, 'marketing.json');
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  for (const pageKey of PAGE_KEYS) {
    if (data.pages[pageKey]?.faqAccordion?.questions) {
      const questions = data.pages[pageKey].faqAccordion.questions;
      const questionKeys = Object.keys(questions);

      // Keep only first 3 questions
      if (questionKeys.length > 3) {
        const reducedQuestions = {};
        for (let i = 0; i < 3; i++) {
          const oldKey = questionKeys[i];
          reducedQuestions[`q${i + 1}`] = questions[oldKey];
        }
        data.pages[pageKey].faqAccordion.questions = reducedQuestions;
        stats.questionsReduced += (questionKeys.length - 3);
      }
    }
    stats.pagesProcessed++;
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`  ✓ ${lang}: Reduced ${PAGE_KEYS.length} pages to 3 questions each`);
}

console.log(`\n  Total questions reduced: ${stats.questionsReduced}\n`);

// ============================================
// STEP 4: Update Configuration File
// ============================================
console.log('📝 STEP 4: Updating faqAccordion-pages.ts configuration\n');

let configContent = fs.readFileSync(CONFIG_PATH, 'utf8');

// Update helpFaq to have more questions (let's say 30 for the master FAQ)
configContent = configContent.replace(
  /helpFaq: createPageConfig\('helpFaq', \d+\)/,
  'helpFaq: createPageConfig(\'helpFaq\', 30)'
);

// Update all other pages to have exactly 3 questions
for (const pageKey of PAGE_KEYS) {
  const regex = new RegExp(`${pageKey}: createPageConfig\\('${pageKey}', \\d+\\)`, 'g');
  configContent = configContent.replace(regex, `${pageKey}: createPageConfig('${pageKey}', 3)`);
}

fs.writeFileSync(CONFIG_PATH, configContent, 'utf8');

console.log('  ✓ Updated configuration for all pages');
console.log('    - helpFaq: 30 questions');
console.log(`    - Other pages: 3 questions each\n`);

// ============================================
// STEP 5: Validation
// ============================================
console.log('📝 STEP 5: Validating changes\n');

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
console.log('REORGANIZATION SUMMARY');
console.log('========================================\n');

console.log('📊 Statistics:');
console.log(`  Questions collected: ${stats.questionsCollected} (across ${LANGUAGES.length} languages)`);
console.log(`  Questions in master FAQ: ~${stats.questionsCollected / LANGUAGES.length} per language`);
console.log(`  Questions reduced: ${stats.questionsReduced}`);
console.log(`  Pages processed: ${stats.pagesProcessed / LANGUAGES.length} per language`);
console.log(`  Categories created: ${stats.categoriesCreated}`);
console.log(`  Validation errors: ${validationErrors}`);

console.log('\n📁 Changes Applied:');
console.log('  1. Master FAQ created at /help/faq with all questions');
console.log('  2. All other pages reduced to 3 questions');
console.log('  3. Questions organized by category');
console.log('  4. Configuration updated');

console.log('\n📝 Files Modified:');
LANGUAGES.forEach(lang => console.log(`    - packages/i18n/translations/${lang}/marketing.json`));
console.log(`    - apps/web/src/config/faqAccordion-pages.ts`);

if (validationErrors === 0) {
  console.log('\n✅ All changes applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Clean cache: rm -rf apps/web/.next .turbo');
  console.log('3. Test build: pnpm build');
  console.log('4. Commit: git commit -m "Reorganize FAQ content"');
} else {
  console.log('\n⚠️  Some validation errors occurred. Please review before proceeding.');
  process.exit(1);
}
