/**
 * Add StickyFeaturesNav Section to All Marketing Pages
 *
 * This script:
 * 1. Identifies all 39 marketing/legal page files
 * 2. Adds the StickyFeaturesNav section after BenefitsCards section
 * 3. Follows the existing pattern used for Hero and BenefitsCards sections
 */

const fs = require('fs');
const path = require('path');

// Page mapping with file paths
const PAGES = [
  // KNOW DIBOAS
  { key: 'benefits', path: 'apps/web/src/app/[locale]/(marketing)/benefits/page.tsx' },
  { key: 'account', path: 'apps/web/src/app/[locale]/(marketing)/account/page.tsx' },
  { key: 'bankingServices', path: 'apps/web/src/app/[locale]/(marketing)/banking-services/page.tsx' },
  { key: 'investing', path: 'apps/web/src/app/[locale]/(marketing)/investing/page.tsx' },
  { key: 'cryptocurrency', path: 'apps/web/src/app/[locale]/(marketing)/cryptocurrency/page.tsx' },
  { key: 'defiStrategies', path: 'apps/web/src/app/[locale]/(marketing)/defi-strategies/page.tsx' },
  { key: 'credit', path: 'apps/web/src/app/[locale]/(marketing)/credit/page.tsx' },

  // LEARN CENTER
  { key: 'learnBenefits', path: 'apps/web/src/app/[locale]/(marketing)/learn/benefits/page.tsx' },
  { key: 'learnFinancialBasics', path: 'apps/web/src/app/[locale]/(marketing)/learn/financial-basics/page.tsx' },
  { key: 'learnMoneyManagement', path: 'apps/web/src/app/[locale]/(marketing)/learn/money-management/page.tsx' },
  { key: 'learnInvestmentGuide', path: 'apps/web/src/app/[locale]/(marketing)/learn/investment-guide/page.tsx' },
  { key: 'learnCryptocurrencyGuide', path: 'apps/web/src/app/[locale]/(marketing)/learn/cryptocurrency-guide/page.tsx' },
  { key: 'learnDefiExplained', path: 'apps/web/src/app/[locale]/(marketing)/learn/defi-explained/page.tsx' },
  { key: 'learnSpecialContent', path: 'apps/web/src/app/[locale]/(marketing)/learn/special-content/page.tsx' },

  // BUSINESS
  { key: 'businessBenefits', path: 'apps/web/src/app/[locale]/(marketing)/business/benefits/page.tsx' },
  { key: 'businessAccount', path: 'apps/web/src/app/[locale]/(marketing)/business/account/page.tsx' },
  { key: 'businessBanking', path: 'apps/web/src/app/[locale]/(marketing)/business/banking/page.tsx' },
  { key: 'businessPayments', path: 'apps/web/src/app/[locale]/(marketing)/business/payments/page.tsx' },
  { key: 'businessTreasury', path: 'apps/web/src/app/[locale]/(marketing)/business/treasury/page.tsx' },
  { key: 'businessYieldStrategies', path: 'apps/web/src/app/[locale]/(marketing)/business/yield-strategies/page.tsx' },
  { key: 'businessCreditSolutions', path: 'apps/web/src/app/[locale]/(marketing)/business/credit-solutions/page.tsx' },

  // REWARDS
  { key: 'rewardsBenefits', path: 'apps/web/src/app/[locale]/(marketing)/rewards/benefits/page.tsx' },
  { key: 'rewardsAiGuides', path: 'apps/web/src/app/[locale]/(marketing)/rewards/ai-guides/page.tsx' },
  { key: 'rewardsReferralProgram', path: 'apps/web/src/app/[locale]/(marketing)/rewards/referral-program/page.tsx' },
  { key: 'rewardsPointsSystem', path: 'apps/web/src/app/[locale]/(marketing)/rewards/points-system/page.tsx' },
  { key: 'rewardsBadgesLeaderboard', path: 'apps/web/src/app/[locale]/(marketing)/rewards/badges-leaderboard/page.tsx' },
  { key: 'rewardsCampaigns', path: 'apps/web/src/app/[locale]/(marketing)/rewards/campaigns/page.tsx' },
  { key: 'rewardsTokenAirdrop', path: 'apps/web/src/app/[locale]/(marketing)/rewards/token-airdrop/page.tsx' },

  // SECURITY
  { key: 'securityBenefits', path: 'apps/web/src/app/[locale]/(marketing)/security/benefits/page.tsx' },
  { key: 'securityAuditReports', path: 'apps/web/src/app/[locale]/(marketing)/security/audit-reports/page.tsx' },
  { key: 'securitySafetyGuide', path: 'apps/web/src/app/[locale]/(marketing)/security/safety-guide/page.tsx' },

  // HELP
  { key: 'helpFaq', path: 'apps/web/src/app/[locale]/(marketing)/help/faq/page.tsx' },

  // MORE ABOUT DIBOAS
  { key: 'about', path: 'apps/web/src/app/[locale]/(marketing)/about/page.tsx' },
  { key: 'careers', path: 'apps/web/src/app/[locale]/(marketing)/careers/page.tsx' },
  { key: 'investors', path: 'apps/web/src/app/[locale]/(marketing)/investors/page.tsx' },

  // LEGAL
  { key: 'legalTerms', path: 'apps/web/src/app/[locale]/(marketing)/legal/terms/page.tsx' },
  { key: 'legalPrivacy', path: 'apps/web/src/app/[locale]/(marketing)/legal/privacy/page.tsx' },
  { key: 'legalCookies', path: 'apps/web/src/app/[locale]/(marketing)/legal/cookies/page.tsx' }
];

/**
 * Check if file already has StickyFeaturesNav section
 */
function hasStickyFeaturesNav(content) {
  return content.includes('StickyFeaturesNav') || content.includes('sticky-features-nav');
}

/**
 * Check if file needs StickyFeaturesNav import
 */
function needsStickyFeaturesNavImport(content) {
  return !content.includes("import { StickyFeaturesNav }") &&
         !content.includes("StickyFeaturesNav") &&
         !content.includes("import { HeroSection, FeatureShowcase, StickyFeaturesNav }");
}

/**
 * Check if file needs getStickyFeaturesNavConfig import
 */
function needsGetConfigImport(content) {
  return !content.includes("getStickyFeaturesNavConfig");
}

/**
 * Add StickyFeaturesNav to imports
 */
function addStickyFeaturesNavImport(content) {
  // Find the Sections import line
  const sectionsImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/Sections['"]/;
  const match = content.match(sectionsImportRegex);

  if (match) {
    const imports = match[1].split(',').map(i => i.trim());
    if (!imports.includes('StickyFeaturesNav')) {
      imports.push('StickyFeaturesNav');
      const newImport = `import { ${imports.join(', ')} } from '@/components/Sections'`;
      content = content.replace(sectionsImportRegex, newImport);
    }
  }

  return content;
}

/**
 * Add getStickyFeaturesNavConfig to imports
 */
function addGetConfigImport(content, pageKey) {
  // Check if there's already a config import line
  const configImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/config\/stickyFeaturesNav-pages['"]/;

  if (configImportRegex.test(content)) {
    // Already has import from this file, just add the function
    content = content.replace(
      configImportRegex,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        if (!importList.includes('getStickyFeaturesNavConfig')) {
          importList.push('getStickyFeaturesNavConfig');
        }
        return `import { ${importList.join(', ')} } from '@/config/stickyFeaturesNav-pages'`;
      }
    );
  } else {
    // Add new import after other config imports
    const lastConfigImport = content.lastIndexOf("from '@/config/");
    if (lastConfigImport !== -1) {
      const lineEnd = content.indexOf('\n', lastConfigImport);
      const insertPos = lineEnd + 1;
      content = content.slice(0, insertPos) +
                "import { getStickyFeaturesNavConfig } from '@/config/stickyFeaturesNav-pages';\n" +
                content.slice(insertPos);
    }
  }

  return content;
}

/**
 * Add StickyFeaturesNav section to page
 */
function addStickyFeaturesNavSection(content, pageKey) {
  // Find the last closing </SectionErrorBoundary> before </main>
  const mainClosingIndex = content.lastIndexOf('</main>');
  if (mainClosingIndex === -1) {
    console.warn(`   ⚠️  Could not find </main> tag`);
    return content;
  }

  // Find the last SectionErrorBoundary before </main>
  const beforeMain = content.substring(0, mainClosingIndex);
  const lastBoundaryIndex = beforeMain.lastIndexOf('</SectionErrorBoundary>');

  if (lastBoundaryIndex === -1) {
    console.warn(`   ⚠️  Could not find closing SectionErrorBoundary`);
    return content;
  }

  const insertPos = lastBoundaryIndex + '</SectionErrorBoundary>'.length;

  // Generate the StickyFeaturesNav section
  const stickyNavSection = `

        {/* Sticky Features Navigation Section */}
        <SectionErrorBoundary
          sectionId="sticky-features-nav-${pageKey}"
          sectionType="StickyFeaturesNav"
          enableReporting={true}
          context={{ page: '${pageKey}' }}
        >
          <StickyFeaturesNav
            variant="default"
            config={getStickyFeaturesNavConfig('${pageKey}')}
            enableAnalytics={true}
          />
        </SectionErrorBoundary>`;

  content = content.slice(0, insertPos) + stickyNavSection + content.slice(insertPos);

  return content;
}

/**
 * Process a single page file
 */
function processPage(page) {
  const { key, path: filePath } = page;

  try {
    // Read file
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if already has StickyFeaturesNav
    if (hasStickyFeaturesNav(content)) {
      console.log(`   ⏭️  Already has StickyFeaturesNav`);
      return { success: true, skipped: true };
    }

    // Add imports if needed
    if (needsStickyFeaturesNavImport(content)) {
      content = addStickyFeaturesNavImport(content);
    }

    if (needsGetConfigImport(content)) {
      content = addGetConfigImport(content, key);
    }

    // Add section
    content = addStickyFeaturesNavSection(content, key);

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');

    return { success: true, skipped: false };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Adding StickyFeaturesNav to all pages...\n');

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  PAGES.forEach(page => {
    console.log(`📄 Processing ${page.key}...`);
    const result = processPage(page);

    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        processed++;
        console.log(`   ✅ Added StickyFeaturesNav`);
      }
    } else {
      failed++;
    }
  });

  console.log(`\n✨ Done!`);
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n📦 Next step: Rebuild i18n package with: cd packages/i18n && pnpm build`);
}

main();
