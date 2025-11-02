/**
 * Parse StickyFeaturesNav Markdown Content and Populate Translation Files
 *
 * This script:
 * 1. Reads markdown files for all 4 languages (en, es, de, pt-BR)
 * 2. Parses the structured content for 39 pages
 * 3. Adds the content to translation files under marketing.pages.{pageKey}.stickyFeaturesNav
 * 4. Assigns appropriate landscape images from assets
 */

const fs = require('fs');
const path = require('path');

// Language configurations with their specific label patterns
// Note: All markdown files use English labels (Title, Description)
const LANGUAGES = {
  'en': { file: 'docs/diboas-stickyfeatnav-en.md', labels: { title: 'Title', description: 'Description' } },
  'es': { file: 'docs/diboas-stickyfeatnav-es.md', labels: { title: 'Title', description: 'Description' } },
  'de': { file: 'docs/diboas-stickyfeatnav-de.md', labels: { title: 'Title', description: 'Description' } },
  'pt-BR': { file: 'docs/diboas-stickyfeatnav-ptBR.md', labels: { title: 'Title', description: 'Description' } }
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

// Landscape images pool (will be assigned round-robin)
const LANDSCAPE_IMAGES = [
  '/assets/socials/real/family-trip.avif',
  '/assets/socials/real/music.avif',
  '/assets/socials/real/nature.avif',
  '/assets/socials/real/chilling.avif',
  '/assets/socials/real/couple.avif',
  '/assets/socials/real/friends.avif',
  '/assets/socials/real/group.avif',
  '/assets/socials/real/happy.avif',
  '/assets/socials/real/family-picnic.avif',
  '/assets/socials/real/having-fun.avif',
  '/assets/socials/real/balance-with-icon.avif',
  '/assets/socials/real/banking-with-icon.avif',
  '/assets/socials/real/investing-with-icon.avif',
  '/assets/socials/real/growth-with-icon.avif',
  '/assets/socials/real/money-with-icon.avif',
  '/assets/socials/real/rewards-with-icon.avif',
  '/assets/socials/real/security-half.avif',
  '/assets/socials/real/learn-banner.avif',
  '/assets/socials/real/business-half.avif',
  '/assets/socials/real/diboas-banner.avif'
];

/**
 * Parse markdown content for a specific language
 */
function parseMarkdownForLanguage(lang) {
  const config = LANGUAGES[lang];
  const content = fs.readFileSync(config.file, 'utf-8');
  const pages = {};

  // Split by ## markers (page sections)
  const sections = content.split(/^## \d+\./m).filter(Boolean);

  sections.forEach(section => {
    // Extract URL
    const urlMatch = section.match(/\*\*URL:\*\*\s*(.+)/);
    if (!urlMatch) return;

    const url = urlMatch[1].trim();
    const pageKey = PAGE_MAPPING[url];
    if (!pageKey) {
      console.warn(`⚠️  No page key mapping for URL: ${url}`);
      return;
    }

    // Extract Section Title
    const titleMatch = section.match(/### \*\*Section Title:\*\*\s*```\s*([^`]+)\s*```/);
    const sectionTitle = titleMatch ? titleMatch[1].trim() : '';

    // Extract Subtitle
    const subtitleMatch = section.match(/### \*\*Subtitle:\*\*\s*```\s*([^`]+)\s*```/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

    // Extract Cards
    const cards = [];
    const cardSections = section.split(/### \*\*Card \d+\*\*/);

    for (let i = 1; i < cardSections.length; i++) {
      const cardSection = cardSections[i];

      // Extract card title
      const titlePattern = new RegExp(`\\*\\*${config.labels.title}:\\*\\*\\s*\`\`\`\\s*([^\`]+)\\s*\`\`\``, 'i');
      const cardTitleMatch = cardSection.match(titlePattern);
      const cardTitle = cardTitleMatch ? cardTitleMatch[1].trim() : '';

      // Extract card description
      const descPattern = new RegExp(`\\*\\*${config.labels.description}:\\*\\*\\s*\`\`\`\\s*([^\`]+)\\s*\`\`\``, 'i');
      const cardDescMatch = cardSection.match(descPattern);
      const cardDesc = cardDescMatch ? cardDescMatch[1].trim() : '';

      if (cardTitle && cardDesc) {
        cards.push({
          title: cardTitle,
          description: cardDesc
        });
      }
    }

    pages[pageKey] = {
      sectionTitle,
      subtitle,
      cards
    };
  });

  return pages;
}

/**
 * Convert text to camelCase for card IDs
 * Handles numbers and special characters properly
 */
function toCamelCase(text) {
  // First, handle special cases with numbers
  let result = text
    .replace(/1-Click/gi, 'One Click') // "1-Click" -> "One Click"
    .replace(/24\/7/g, 'Twenty Four Seven') // "24/7" -> "Twenty Four Seven"
    .replace(/2FA/gi, 'Two FA'); // "2FA" -> "Two FA"

  // Then convert to camelCase
  result = result
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 0) // Remove empty strings
    .map((word, index) => {
      word = word.toLowerCase();
      return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');

  return result;
}

/**
 * Update translation file with sticky features nav content
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

  // Add sticky features nav content for each page
  Object.entries(pagesData).forEach(([pageKey, data]) => {
    // Ensure page structure exists
    if (!translations.pages[pageKey]) {
      translations.pages[pageKey] = {};
    }

    // Create stickyFeaturesNav structure
    const stickyFeatNav = {
      title: data.sectionTitle,
      subtitle: data.subtitle,
      cards: {}
    };

    // Add cards using canonical English keys
    data.cards.forEach((card, index) => {
      // Use canonical key from English if available, otherwise generate from title
      const cardId = canonicalKeys && canonicalKeys[pageKey] && canonicalKeys[pageKey][index]
        ? canonicalKeys[pageKey][index]
        : toCamelCase(card.title);

      stickyFeatNav.cards[cardId] = {
        title: card.title,
        description: card.description,
        imageAlt: `${card.title} illustration`
      };
    });

    translations.pages[pageKey].stickyFeaturesNav = stickyFeatNav;
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
  console.log('🚀 Starting StickyFeaturesNav content parsing...\n');

  // Step 1: Parse English first to establish canonical keys
  console.log('📝 Processing en (establishing canonical keys)...');
  const englishPagesData = parseMarkdownForLanguage('en');
  console.log(`   Found ${Object.keys(englishPagesData).length} pages`);

  // Extract canonical keys from English content
  const canonicalKeys = {};
  Object.entries(englishPagesData).forEach(([pageKey, data]) => {
    canonicalKeys[pageKey] = data.cards.map(card => toCamelCase(card.title));
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
