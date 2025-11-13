#!/usr/bin/env node

/**
 * Generate Landing Page Documentation
 *
 * Extracts all marketing content from the landing page
 * and generates comprehensive markdown documentation for each language.
 */

const fs = require('fs');
const path = require('path');

const LANGUAGES = {
  'en': 'English',
  'pt-BR': 'Portuguese (Brazil)',
  'es': 'Spanish',
  'de': 'German'
};

const TRANSLATIONS_DIR = path.join(__dirname, '../packages/i18n/translations');
const DOCS_DIR = path.join(__dirname, '../docs');

function generateMarkdown(locale, language, data) {
  const lines = [];

  // Header
  lines.push(`# Landing Page Content - ${language} (${locale})`);
  lines.push('');
  lines.push('> **Complete marketing content documentation for the diBoaS landing page**');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of Contents
  lines.push('## 📑 Table of Contents');
  lines.push('');
  lines.push('1. [Page Metadata](#page-metadata)');
  lines.push('2. [Hero Section](#hero-section)');
  lines.push('3. [Product Carousel](#product-carousel)');
  lines.push('4. [Feature Showcase](#feature-showcase)');
  lines.push('5. [App Features](#app-features)');
  lines.push('6. [Benefits Cards](#benefits-cards)');
  lines.push('7. [One Feature (Security)](#one-feature-security)');
  lines.push('8. [FAQ Section](#faq-section)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Page Metadata
  lines.push('## 📄 Page Metadata');
  lines.push('');
  if (data.pages && data.pages.home) {
    lines.push('### SEO Title');
    lines.push('**Type**: Meta Title');
    lines.push('```');
    lines.push(data.pages.home.title || 'N/A');
    lines.push('```');
    lines.push('');
    lines.push('### SEO Description');
    lines.push('**Type**: Meta Description');
    lines.push('```');
    lines.push(data.pages.home.description || 'N/A');
    lines.push('```');
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // Hero Section
  lines.push('## 🎯 Hero Section');
  lines.push('');
  lines.push('**Section ID**: `hero`');
  lines.push('**Component**: HeroSection');
  lines.push('');
  if (data.pages && data.pages.home && data.pages.home.hero) {
    const hero = data.pages.home.hero;
    lines.push('### Hero Title');
    lines.push('**Type**: Main Heading (H1)');
    lines.push('**Content**:');
    lines.push('```');
    lines.push(hero.title || 'N/A');
    lines.push('```');
    lines.push('');
    if (hero.description) {
      lines.push('### Hero Description');
      lines.push('**Type**: Subheading');
      lines.push('**Content**:');
      lines.push('```');
      lines.push(hero.description);
      lines.push('```');
      lines.push('');
    }
    if (hero.cta) {
      lines.push('### Hero CTA Button');
      lines.push('**Type**: Call-to-Action Button');
      lines.push('**Text**: `' + hero.cta + '`');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // Product Carousel
  lines.push('## 🎠 Product Carousel');
  lines.push('');
  lines.push('**Section ID**: `productCarousel`');
  lines.push('**Component**: ProductCarousel');
  lines.push('');
  if (data.productCarousel) {
    const carousel = data.productCarousel;
    lines.push('### Section Heading');
    lines.push('**Type**: Section Title (H2)');
    lines.push('**Content**: `' + (carousel.heading || 'N/A') + '`');
    lines.push('');

    if (carousel.slides) {
      lines.push('### Slide 1: Benefits');
      lines.push('**Card Type**: Carousel Slide');
      lines.push('');
      lines.push('- **Title**: `' + (carousel.slides.benefits?.title || 'N/A') + '`');
      lines.push('- **Subtitle**:');
      lines.push('  ```');
      lines.push('  ' + (carousel.slides.benefits?.subtitle || 'N/A'));
      lines.push('  ```');
      lines.push('');

      lines.push('### Slide 2: Rewards');
      lines.push('**Card Type**: Carousel Slide');
      lines.push('');
      lines.push('- **Title**: `' + (carousel.slides.rewards?.title || 'N/A') + '`');
      lines.push('- **Subtitle**:');
      lines.push('  ```');
      lines.push('  ' + (carousel.slides.rewards?.subtitle || 'N/A'));
      lines.push('  ```');
      lines.push('');

      lines.push('### Slide 3: Business');
      lines.push('**Card Type**: Carousel Slide');
      lines.push('');
      lines.push('- **Title**: `' + (carousel.slides.business?.title || 'N/A') + '`');
      lines.push('- **Subtitle**:');
      lines.push('  ```');
      lines.push('  ' + (carousel.slides.business?.subtitle || 'N/A'));
      lines.push('  ```');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // Feature Showcase
  lines.push('## ✨ Feature Showcase');
  lines.push('');
  lines.push('**Section ID**: `featureShowcase`');
  lines.push('**Component**: FeatureShowcase');
  lines.push('');
  if (data.featureShowcase) {
    const features = data.featureShowcase;

    // Overview Feature
    if (features.overview) {
      lines.push('### Feature 1: Overview');
      lines.push('**Card Type**: Feature Card');
      lines.push('');
      lines.push('- **Title**: `' + (features.overview.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (features.overview.description || 'N/A'));
      lines.push('  ```');
      lines.push('');
    }

    // Activities Feature
    if (features.activities) {
      lines.push('### Feature 2: Activities');
      lines.push('**Card Type**: Feature Card');
      lines.push('');
      lines.push('- **Title**: `' + (features.activities.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (features.activities.description || 'N/A'));
      lines.push('  ```');
      lines.push('');
    }

    // Rewards Feature
    if (features.rewards) {
      lines.push('### Feature 3: Rewards');
      lines.push('**Card Type**: Feature Card');
      lines.push('');
      lines.push('- **Title**: `' + (features.rewards.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (features.rewards.description || 'N/A'));
      lines.push('  ```');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // App Features
  lines.push('## 📱 App Features');
  lines.push('');
  lines.push('**Section ID**: `appFeatures`');
  lines.push('**Component**: AppFeaturesCarousel');
  lines.push('');
  if (data.appFeatures) {
    const appFeatures = data.appFeatures;

    lines.push('### Section Title');
    lines.push('**Type**: Section Heading (H2)');
    lines.push('**Content**: `' + (appFeatures.sectionTitle || 'N/A') + '`');
    lines.push('');

    // Feature 1: Organize Money
    if (appFeatures.organizeMoney) {
      lines.push('### Feature Card 1: Organize Money');
      lines.push('**Card Type**: Feature Card with Chip');
      lines.push('');
      lines.push('- **Chip Label**: `' + (appFeatures.organizeMoney.chipLabel || 'N/A') + '`');
      lines.push('- **Title**: `' + (appFeatures.organizeMoney.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (appFeatures.organizeMoney.description || 'N/A'));
      lines.push('  ```');
      lines.push('- **CTA Text**: `' + (appFeatures.organizeMoney.ctaText || 'N/A') + '`');
      lines.push('');
    }

    // Feature 2: Instant Payments
    if (appFeatures.instantPayments) {
      lines.push('### Feature Card 2: Instant Payments');
      lines.push('**Card Type**: Feature Card with Chip');
      lines.push('');
      lines.push('- **Chip Label**: `' + (appFeatures.instantPayments.chipLabel || 'N/A') + '`');
      lines.push('- **Title**: `' + (appFeatures.instantPayments.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (appFeatures.instantPayments.description || 'N/A'));
      lines.push('  ```');
      lines.push('- **CTA Text**: `' + (appFeatures.instantPayments.ctaText || 'N/A') + '`');
      lines.push('');
    }

    // Feature 3: Secure Purchases
    if (appFeatures.securePurchases) {
      lines.push('### Feature Card 3: Secure Purchases');
      lines.push('**Card Type**: Feature Card with Chip');
      lines.push('');
      lines.push('- **Chip Label**: `' + (appFeatures.securePurchases.chipLabel || 'N/A') + '`');
      lines.push('- **Title**: `' + (appFeatures.securePurchases.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (appFeatures.securePurchases.description || 'N/A'));
      lines.push('  ```');
      lines.push('- **CTA Text**: `' + (appFeatures.securePurchases.ctaText || 'N/A') + '`');
      lines.push('');
    }

    // Feature 4: Financial Goals
    if (appFeatures.financialGoals) {
      lines.push('### Feature Card 4: Financial Goals');
      lines.push('**Card Type**: Feature Card with Chip');
      lines.push('');
      lines.push('- **Chip Label**: `' + (appFeatures.financialGoals.chipLabel || 'N/A') + '`');
      lines.push('- **Title**: `' + (appFeatures.financialGoals.title || 'N/A') + '`');
      lines.push('- **Description**:');
      lines.push('  ```');
      lines.push('  ' + (appFeatures.financialGoals.description || 'N/A'));
      lines.push('  ```');
      lines.push('- **CTA Text**: `' + (appFeatures.financialGoals.ctaText || 'N/A') + '`');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // Benefits Cards
  lines.push('## 💎 Benefits Cards');
  lines.push('');
  lines.push('**Section ID**: `benefits`');
  lines.push('**Component**: BenefitsCarousel');
  lines.push('');
  if (data.benefits) {
    const benefits = data.benefits;

    // Benefit 1
    if (benefits.exclusiveRewards) {
      lines.push('### Benefit Card 1: Exclusive Rewards');
      lines.push('**Card Type**: Benefit Card');
      lines.push('');
      lines.push('- **Title**: `' + (benefits.exclusiveRewards.title || 'N/A') + '`');
      lines.push('- **Description**: `' + (benefits.exclusiveRewards.description || 'N/A') + '`');
      if (benefits.exclusiveRewards.ctaText) {
        lines.push('- **CTA Text**: `' + benefits.exclusiveRewards.ctaText + '`');
      }
      lines.push('');
    }

    // Benefit 2
    if (benefits.financialFreedom) {
      lines.push('### Benefit Card 2: Financial Freedom');
      lines.push('**Card Type**: Benefit Card');
      lines.push('');
      lines.push('- **Title**: `' + (benefits.financialFreedom.title || 'N/A') + '`');
      lines.push('- **Description**: `' + (benefits.financialFreedom.description || 'N/A') + '`');
      if (benefits.financialFreedom.ctaText) {
        lines.push('- **CTA Text**: `' + benefits.financialFreedom.ctaText + '`');
      }
      lines.push('');
    }

    // Benefit 3
    if (benefits.smartInvesting) {
      lines.push('### Benefit Card 3: Smart Investing');
      lines.push('**Card Type**: Benefit Card');
      lines.push('');
      lines.push('- **Title**: `' + (benefits.smartInvesting.title || 'N/A') + '`');
      lines.push('- **Description**: `' + (benefits.smartInvesting.description || 'N/A') + '`');
      if (benefits.smartInvesting.ctaText) {
        lines.push('- **CTA Text**: `' + benefits.smartInvesting.ctaText + '`');
      }
      lines.push('');
    }

    // Benefit 4
    if (benefits.secureBanking) {
      lines.push('### Benefit Card 4: Secure Banking');
      lines.push('**Card Type**: Benefit Card');
      lines.push('');
      lines.push('- **Title**: `' + (benefits.secureBanking.title || 'N/A') + '`');
      lines.push('- **Description**: `' + (benefits.secureBanking.description || 'N/A') + '`');
      if (benefits.secureBanking.ctaText) {
        lines.push('- **CTA Text**: `' + benefits.secureBanking.ctaText + '`');
      }
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // One Feature (Security)
  lines.push('## 🔒 One Feature (Security)');
  lines.push('');
  lines.push('**Section ID**: `oneFeature`');
  lines.push('**Component**: OneFeature');
  lines.push('');
  if (data.oneFeature) {
    const oneFeature = data.oneFeature;

    lines.push('### Main Title');
    lines.push('**Type**: Section Heading (H2)');
    lines.push('**Content**: `' + (oneFeature.title || 'N/A') + '`');
    lines.push('');

    lines.push('### Subtitle');
    lines.push('**Type**: Section Description');
    lines.push('**Content**:');
    lines.push('```');
    lines.push(oneFeature.subtitle || 'N/A');
    lines.push('```');
    lines.push('');

    lines.push('### CTA Button');
    lines.push('**Type**: Call-to-Action Button');
    lines.push('**Text**: `' + (oneFeature.ctaText || 'N/A') + '`');
    lines.push('');

    if (oneFeature.features) {
      lines.push('### Feature Options');
      lines.push('');
      lines.push('- **Option 1**: `' + (oneFeature.features.fraudReport || 'N/A') + '`');
      lines.push('- **Option 2**: `' + (oneFeature.features.reports || 'N/A') + '`');
      lines.push('- **Option 3**: `' + (oneFeature.features.protection || 'N/A') + '`');
      lines.push('- **Option 4**: `' + (oneFeature.features.support || 'N/A') + '`');
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');

  // FAQ Section
  lines.push('## ❓ FAQ Section');
  lines.push('');
  lines.push('**Section ID**: `faqAccordion`');
  lines.push('**Component**: FAQAccordion');
  lines.push('**Configuration**: Landing page displays 5 questions (q1, q2, q3, q4, q10) from `config/faqAccordion.ts`');
  lines.push('');

  if (data.faq) {
    lines.push('### Section Title');
    lines.push('**Type**: Section Heading (H2)');
    lines.push('**Content**: `' + (data.faq.title || 'N/A') + '`');
    lines.push('');

    if (data.faq.description) {
      lines.push('### Section Subtitle');
      lines.push('**Type**: Section Description');
      lines.push('**Content**:');
      lines.push('```');
      lines.push(data.faq.description);
      lines.push('```');
      lines.push('');
    }

    if (data.faq.ctaText) {
      lines.push('### CTA Button');
      lines.push('**Type**: Link Button');
      lines.push('**Text**: `' + data.faq.ctaText + '`');
      lines.push('');
    }

    // Landing page uses these 5 questions as per config/faqAccordion.ts:
    // q1, q2, q3 (getting started), q4 (guides), q10 (fees)
    const landingPageQuestionIds = ['q1', 'q2', 'q3', 'q4', 'q10'];

    if (data.faq.items) {
      lines.push('### FAQ Questions');
      lines.push('**Type**: Accordion Items');
      lines.push('**Note**: Landing page displays 5 carefully selected questions');
      lines.push('');

      landingPageQuestionIds.forEach((questionId, index) => {
        const question = data.faq.items[questionId];
        if (question) {
          lines.push(`#### Question ${index + 1} (ID: ${questionId})`);
          lines.push('**Category**: ' + (index < 3 ? 'Getting Started' : index === 3 ? 'Guides' : 'Fees & Costs'));
          lines.push('');
          lines.push('**Question**:');
          lines.push('```');
          lines.push(question.question || 'N/A');
          lines.push('```');
          lines.push('');
          lines.push('**Answer**:');
          lines.push('```');
          lines.push(question.answer || 'N/A');
          lines.push('```');
          lines.push('');
        }
      });
    }
  }
  lines.push('---');
  lines.push('');

  // Footer
  lines.push('## 📝 Document Information');
  lines.push('');
  lines.push('- **Language**: ' + language + ' (' + locale + ')');
  lines.push('- **Generated**: ' + new Date().toISOString());
  lines.push('- **Source**: `packages/i18n/translations/' + locale + '/marketing.json`');
  lines.push('- **Purpose**: Marketing content reference for landing page');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('**Note**: This document is auto-generated from translation files. To update content, modify the source JSON files and regenerate.');
  lines.push('');

  return lines.join('\n');
}

// Main execution
console.log('🚀 Generating Landing Page Documentation...\n');

for (const [locale, language] of Object.entries(LANGUAGES)) {
  try {
    // Read marketing.json for this locale
    const marketingPath = path.join(TRANSLATIONS_DIR, locale, 'marketing.json');
    const data = JSON.parse(fs.readFileSync(marketingPath, 'utf8'));

    // Generate markdown
    const markdown = generateMarkdown(locale, language, data);

    // Write to docs folder
    const outputFile = path.join(DOCS_DIR, `landing-${locale}.md`);
    fs.writeFileSync(outputFile, markdown, 'utf8');

    console.log(`✅ ${locale}: Generated ${outputFile}`);
  } catch (error) {
    console.error(`❌ ${locale}: Error - ${error.message}`);
  }
}

console.log('\n✨ Documentation generation complete!');
