/**
 * Parse FeatureShowcase Markdown Content and Populate Translation Files
 *
 * This script:
 * 1. Reads markdown files for all 4 languages (en, es, de, pt-BR)
 * 2. Parses the structured content for 39 pages (3 slides each)
 * 3. Adds the content to translation files under marketing.pages.{pageKey}.featureShowcase
 * 4. Uses canonical English keys for consistency across all languages
 */

const fs = require('fs');
const path = require('path');

// Language configurations - all use English labels
const LANGUAGES = {
  'en': { file: 'docs/diboas-featureshowcase-en.md', labels: { title: 'title', description: 'description' } },
  'es': { file: 'docs/diboas-featureshowcase-es.md', labels: { title: 'title', description: 'description' } },
  'de': { file: 'docs/diboas-featureshowcase-de.md', labels: { title: 'title', description: 'description' } },
  'pt-BR': { file: 'docs/diboas-featureshowcase-ptbr.md', labels: { title: 'title', description: 'description' } }
};

// Page key mapping from URL to camelCase key
const PAGE_MAPPING = {
  'diboas.com/benefits': 'benefits',
  'diboas.com/account': 'account',
  'diboas.com/banking-services': 'bankingServices',
  'diboas.com/investing': 'investing',
  'diboas.com/cryptocurrency': 'cryptocurrency',
  'diboas.com/defi-strategies': 'defiStrategies',
  'diboas.com/credit': 'credit',
  'diboas.com/learn/benefits': 'learnBenefits',
  'diboas.com/learn/financial-basics': 'learnFinancialBasics',
  'diboas.com/learn/money-management': 'learnMoneyManagement',
  'diboas.com/learn/investment-guide': 'learnInvestmentGuide',
  'diboas.com/learn/cryptocurrency-guide': 'learnCryptocurrencyGuide',
  'diboas.com/learn/defi-explained': 'learnDefiExplained',
  'diboas.com/learn/special-content': 'learnSpecialContent',
  'diboas.com/business/benefits': 'businessBenefits',
  'diboas.com/business/account': 'businessAccount',
  'diboas.com/business/banking': 'businessBanking',
  'diboas.com/business/payments': 'businessPayments',
  'diboas.com/business/treasury': 'businessTreasury',
  'diboas.com/business/yield-strategies': 'businessYieldStrategies',
  'diboas.com/business/credit-solutions': 'businessCreditSolutions',
  'diboas.com/rewards/benefits': 'rewardsBenefits',
  'diboas.com/rewards/ai-guides': 'rewardsAiGuides',
  'diboas.com/rewards/referral-program': 'rewardsReferralProgram',
  'diboas.com/rewards/points-system': 'rewardsPointsSystem',
  'diboas.com/rewards/badges-leaderboard': 'rewardsBadgesLeaderboard',
  'diboas.com/rewards/campaigns': 'rewardsCampaigns',
  'diboas.com/rewards/token-airdrop': 'rewardsTokenAirdrop',
  'diboas.com/security/benefits': 'securityBenefits',
  'diboas.com/security/audit-reports': 'securityAuditReports',
  'diboas.com/security/safety-guide': 'securitySafetyGuide',
  'diboas.com/help/faq': 'helpFaq',
  'diboas.com/about': 'about',
  'diboas.com/careers': 'careers',
  'diboas.com/docs': 'docs',
  'diboas.com/investors': 'investors',
  'diboas.com/legal/terms': 'legalTerms',
  'diboas.com/legal/privacy': 'legalPrivacy',
  'diboas.com/legal/cookies': 'legalCookies'
};

// Canonical slide names (English) - these will be used as keys across all languages
const CANONICAL_SLIDE_KEYS = ['unification', 'simplicity', 'rewards'];

/**
 * Parse markdown content for a specific language
 */
function parseMarkdownForLanguage(lang) {
  const config = LANGUAGES[lang];
  const content = fs.readFileSync(config.file, 'utf-8');
  const pages = {};

  // Split by ### markers (page sections)
  const sections = content.split(/^### \d+\./m).filter(Boolean);

  sections.forEach(section => {
    // Extract Link/URL
    const linkMatch = section.match(/\*\*Link:\*\*\s*(.+)/);
    if (!linkMatch) return;

    const url = linkMatch[1].trim();
    const pageKey = PAGE_MAPPING[url];
    if (!pageKey) {
      console.warn(`⚠️  No page key mapping for URL: ${url}`);
      return;
    }

    // Extract slides (3 per page: Unification, Simplicity, Rewards)
    const slides = [];
    const slideSections = section.split(/^#### \*\*Slide \d+:/m).filter(Boolean);

    // Process up to 3 slides
    for (let i = 1; i < Math.min(slideSections.length, 4); i++) {
      const slideSection = slideSections[i];

      // Extract title
      const titleMatch = slideSection.match(/\*\*title:\*\*\s*```\s*([^`]+)\s*```/s);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Extract description
      const descMatch = slideSection.match(/\*\*description:\*\*\s*```\s*([^`]+)\s*```/s);
      const description = descMatch ? descMatch[1].trim() : '';

      // Extract CTA text
      const ctaTextMatch = slideSection.match(/text:\s*`([^`]+)`/);
      const ctaText = ctaTextMatch ? ctaTextMatch[1].trim() : 'Get Started';

      if (title && description) {
        slides.push({
          title,
          description,
          ctaText
        });
      }
    }

    // Only add if we have slides
    if (slides.length > 0) {
      pages[pageKey] = { slides };
    }
  });

  return pages;
}

/**
 * Update translation file with feature showcase content
 * Uses canonical English keys for consistency across all languages
 */
function updateTranslationFile(lang, pagesData, canonicalKeys) {
  const translationPath = `packages/i18n/translations/${lang}/marketing.json`;

  // Read existing translation file
  let translations = {};
  try {
    const content = fs.readFileSync(translationPath, 'utf-8');
    translations = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${translationPath}:`, error.message);
    return;
  }

  // Ensure pages structure exists
  if (!translations.pages) {
    translations.pages = {};
  }

  // Add feature showcase content for each page
  Object.entries(pagesData).forEach(([pageKey, data]) => {
    // Ensure page structure exists
    if (!translations.pages[pageKey]) {
      translations.pages[pageKey] = {};
    }

    // Create featureShowcase structure
    const featureShowcase = {
      slides: {}
    };

    // Add slides using canonical English keys
    data.slides.forEach((slide, index) => {
      // Use canonical key from English
      const slideKey = canonicalKeys && canonicalKeys[pageKey] && canonicalKeys[pageKey][index]
        ? canonicalKeys[pageKey][index]
        : CANONICAL_SLIDE_KEYS[index] || `slide${index + 1}`;

      featureShowcase.slides[slideKey] = {
        title: slide.title,
        description: slide.description,
        ctaText: slide.ctaText,
        imageAlt: `${slide.title} illustration`
      };
    });

    translations.pages[pageKey].featureShowcase = featureShowcase;
  });

  // Write back to file
  try {
    fs.writeFileSync(
      translationPath,
      JSON.stringify(translations, null, 2) + '\n',
      'utf-8'
    );
    console.log(`✅ Updated ${lang}/marketing.json with ${Object.keys(pagesData).length} pages`);
  } catch (error) {
    console.error(`❌ Error writing ${translationPath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting FeatureShowcase content parsing...\n');

  // Step 1: Parse English first to establish canonical keys
  console.log('📝 Processing en (establishing canonical keys)...');
  const englishPagesData = parseMarkdownForLanguage('en');
  console.log(`   Found ${Object.keys(englishPagesData).length} pages`);

  // Extract canonical keys from English content
  const canonicalKeys = {};
  Object.entries(englishPagesData).forEach(([pageKey, data]) => {
    canonicalKeys[pageKey] = data.slides.map((_, index) => CANONICAL_SLIDE_KEYS[index]);
  });

  // Update English translations
  updateTranslationFile('en', englishPagesData, null);

  // Step 2: Process other languages using canonical English keys
  const otherLanguages = Object.keys(LANGUAGES).filter(lang => lang !== 'en');
  otherLanguages.forEach(lang => {
    console.log(`📝 Processing ${lang} (using canonical English keys)...`);
    const pagesData = parseMarkdownForLanguage(lang);
    console.log(`   Found ${Object.keys(pagesData).length} pages`);
    updateTranslationFile(lang, pagesData, canonicalKeys);
  });

  console.log('\n✨ Done! All translation files updated.');
  console.log('📦 Next step: Rebuild i18n package with: cd packages/i18n && pnpm build');
}

main();
