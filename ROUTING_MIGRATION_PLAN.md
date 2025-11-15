# Routing Restructure - Implementation Plan

**Status:** In Progress
**Branch:** `refactor/routing-restructure`
**Estimated Time:** 3-4 hours

---

## ✅ PHASE 1: PREPARATION (COMPLETED)

- [x] Created git branch: `refactor/routing-restructure`
- [x] Updated `apps/web/src/config/routes.ts`

---

## 🔄 PHASE 2: UPDATE NAVIGATION & CONFIGS (30 minutes)

### Step 2.2: Update Navigation Config

**File:** `apps/web/src/config/navigation.ts`

Find and replace these lines:

```typescript
// Line 21 - CHANGE:
{ id: 'know-diboas', label: 'common.navigation.diboas.subItems.know', href: createUrl(ROUTES.BENEFITS) },
// TO:
{ id: 'know-diboas', label: 'common.navigation.diboas.subItems.know', href: createUrl(ROUTES.WHY_DIBOAS) },

// Line 22 - CHANGE:
{ id: 'account', label: 'common.navigation.diboas.subItems.account', href: createUrl(ROUTES.ACCOUNT) },
// TO:
{ id: 'account', label: 'common.navigation.diboas.subItems.account', href: createUrl(ROUTES.PERSONAL.ACCOUNT) },

// Line 23 - CHANGE:
{ id: 'banking', label: 'common.navigation.diboas.subItems.banking', href: createUrl(ROUTES.BANKING_SERVICES) },
// TO:
{ id: 'banking', label: 'common.navigation.diboas.subItems.banking', href: createUrl(ROUTES.PERSONAL.BANKING) },

// Line 24 - CHANGE:
{ id: 'investing', label: 'common.navigation.diboas.subItems.investing', href: createUrl(ROUTES.INVESTING) },
// TO:
{ id: 'investing', label: 'common.navigation.diboas.subItems.investing', href: createUrl(ROUTES.PERSONAL.INVESTING) },

// Line 25 - CHANGE:
{ id: 'crypto', label: 'common.navigation.diboas.subItems.crypto', href: createUrl(ROUTES.CRYPTOCURRENCY) },
// TO:
{ id: 'crypto', label: 'common.navigation.diboas.subItems.crypto', href: createUrl(ROUTES.PERSONAL.CRYPTOCURRENCY) },

// Line 26 - CHANGE:
{ id: 'strategies', label: 'common.navigation.diboas.subItems.strategies', href: createUrl(ROUTES.DEFI_STRATEGIES) },
// TO:
{ id: 'strategies', label: 'common.navigation.diboas.subItems.strategies', href: createUrl(ROUTES.PERSONAL.DEFI_STRATEGIES) },

// Line 27 - CHANGE:
{ id: 'credit', label: 'common.navigation.diboas.subItems.credit', href: createUrl(ROUTES.CREDIT) }
// TO:
{ id: 'credit', label: 'common.navigation.diboas.subItems.credit', href: createUrl(ROUTES.PERSONAL.CREDIT) }

// Line 36 - CHANGE:
{ id: 'learn-center', label: 'common.navigation.learn.subItems.center', href: createUrl(ROUTES.LEARN.BENEFITS) },
// TO:
{ id: 'learn-center', label: 'common.navigation.learn.subItems.center', href: createUrl(ROUTES.LEARN.OVERVIEW) },

// Line 51 - CHANGE:
{ id: 'know-business', label: 'common.navigation.business.subItems.know', href: createUrl(ROUTES.BUSINESS.BENEFITS) },
// TO:
{ id: 'know-business', label: 'common.navigation.business.subItems.know', href: createUrl(ROUTES.BUSINESS.ADVANTAGES) },

// Line 66 - CHANGE:
{ id: 'diboas-rewards', label: 'common.navigation.rewards.subItems.program', href: createUrl(ROUTES.REWARDS.BENEFITS) },
// TO:
{ id: 'diboas-rewards', label: 'common.navigation.rewards.subItems.program', href: createUrl(ROUTES.REWARDS.OVERVIEW) },

// Line 81 - CHANGE:
{ id: 'protection', label: 'common.navigation.security.subItems.protection', href: createUrl(ROUTES.SECURITY.BENEFITS) },
// TO:
{ id: 'protection', label: 'common.navigation.security.subItems.protection', href: createUrl(ROUTES.SECURITY.PROTECTION) },

// Lines 103-105 (mobileHighlights) - CHANGE:
{ id: 'benefits', label: 'common.navigation.mobile.highlights.benefits', href: createUrl(ROUTES.BENEFITS) },
{ id: 'learn', label: 'common.navigation.mobile.highlights.learn', href: createUrl(ROUTES.LEARN.BENEFITS) },
{ id: 'rewards', label: 'common.navigation.mobile.highlights.rewards', href: createUrl(ROUTES.REWARDS.BENEFITS) }
// TO:
{ id: 'benefits', label: 'common.navigation.mobile.highlights.benefits', href: createUrl(ROUTES.WHY_DIBOAS) },
{ id: 'learn', label: 'common.navigation.mobile.highlights.learn', href: createUrl(ROUTES.LEARN.OVERVIEW) },
{ id: 'rewards', label: 'common.navigation.mobile.highlights.rewards', href: createUrl(ROUTES.REWARDS.OVERVIEW) }

// Lines 112-114 (mobileSections.forYou) - CHANGE:
{ id: 'diboas', label: 'common.navigation.diboas.label', href: createUrl(ROUTES.BENEFITS) },
{ id: 'learn', label: 'common.navigation.learn.label', href: createUrl(ROUTES.LEARN.BENEFITS) },
{ id: 'rewards', label: 'common.navigation.rewards.label', href: createUrl(ROUTES.REWARDS.BENEFITS) }
// TO:
{ id: 'diboas', label: 'common.navigation.diboas.label', href: createUrl(ROUTES.WHY_DIBOAS) },
{ id: 'learn', label: 'common.navigation.learn.label', href: createUrl(ROUTES.LEARN.OVERVIEW) },
{ id: 'rewards', label: 'common.navigation.rewards.label', href: createUrl(ROUTES.REWARDS.OVERVIEW) }

// Line 120 (mobileSections.forBusiness) - CHANGE:
{ id: 'business', label: 'common.navigation.business.label', href: createUrl(ROUTES.BUSINESS.BENEFITS) }
// TO:
{ id: 'business', label: 'common.navigation.business.label', href: createUrl(ROUTES.BUSINESS.ADVANTAGES) }
```

**Quick find/replace (use your editor):**
- `ROUTES.BENEFITS` → `ROUTES.WHY_DIBOAS`
- `ROUTES.ACCOUNT` → `ROUTES.PERSONAL.ACCOUNT`
- `ROUTES.BANKING_SERVICES` → `ROUTES.PERSONAL.BANKING`
- `ROUTES.INVESTING` → `ROUTES.PERSONAL.INVESTING`
- `ROUTES.CRYPTOCURRENCY` → `ROUTES.PERSONAL.CRYPTOCURRENCY`
- `ROUTES.DEFI_STRATEGIES` → `ROUTES.PERSONAL.DEFI_STRATEGIES`
- `ROUTES.CREDIT` → `ROUTES.PERSONAL.CREDIT`
- `ROUTES.LEARN.BENEFITS` → `ROUTES.LEARN.OVERVIEW`
- `ROUTES.BUSINESS.BENEFITS` → `ROUTES.BUSINESS.ADVANTAGES`
- `ROUTES.REWARDS.BENEFITS` → `ROUTES.REWARDS.OVERVIEW`
- `ROUTES.SECURITY.BENEFITS` → `ROUTES.SECURITY.PROTECTION`

---

### Step 2.3: Update Other Config Files

**File:** `apps/web/src/config/appFeaturesCarousel.ts`

Find and replace:
- `ctaHref: ROUTES.BENEFITS` → `ctaHref: ROUTES.WHY_DIBOAS`
- `ctaHref: ROUTES.LEARN.BENEFITS` → `ctaHref: ROUTES.LEARN.OVERVIEW`
- `ctaHref: ROUTES.INVESTING` → `ctaHref: ROUTES.PERSONAL.INVESTING`

---

## 🔄 PHASE 3: UPDATE SEO CONSTANTS (30 minutes)

### Step 3.1: Update `apps/web/src/lib/seo/constants.ts`

This file is LARGE. Use find/replace in your editor:

1. **Rename existing keys:**
   - Find: `benefits: {` (line ~75)
   - Replace with: `'why-diboas': {`
   - Update content:
     ```typescript
     'why-diboas': {
       title: 'Why Choose diBoaS - Complete Financial Freedom',
       description: 'Discover the advantages of managing your finances with diBoaS. Zero fees, instant transfers, and AI-powered insights.',
       keywords: ['why diboas', 'financial advantages', 'zero fees', 'complete financial solution']
     },
     ```

   - Find: `'learn/benefits': {` (line ~111)
   - Replace with: `'learn/overview': {`

   - Find: `'business/benefits': {` (line ~147)
   - Replace with: `'business/advantages': {`
   - Update content:
     ```typescript
     'business/advantages': {
       title: 'Business Advantages - Enterprise Financial Solutions',
       description: 'Discover how diBoaS empowers businesses with comprehensive financial services and tools.',
       keywords: ['business advantages', 'enterprise finance', 'business solutions']
     },
     ```

   - Find: `'rewards/benefits': {` (line ~183)
   - Replace with: `'rewards/overview': {`
   - Update content:
     ```typescript
     'rewards/overview': {
       title: 'diBoaS Rewards - Loyalty Program Overview',
       description: 'Earn rewards for every transaction and unlock exclusive benefits with diBoaS Rewards.',
       keywords: ['rewards overview', 'loyalty program', 'cashback rewards']
     },
     ```

   - Find: `'security/benefits': {` (line ~219)
   - Replace with: `'security/protection': {`
   - Update content:
     ```typescript
     'security/protection': {
       title: 'diBoaS Protection - Security Benefits',
       description: 'Learn about our comprehensive security measures and protection benefits.',
       keywords: ['financial protection', 'security benefits', 'secure banking']
     },
     ```

2. **Add NEW personal product entries** (insert after `'why-diboas'`):

```typescript
  // Personal Products
  'personal/account': {
    title: 'Personal Account - Your Financial Hub',
    description: 'Open your diBoaS personal account and access banking, investing, and DeFi services in one platform.',
    keywords: ['personal account', 'digital account', 'financial account', 'online banking account']
  },
  'personal/banking': {
    title: 'Personal Banking - Modern Banking Solutions',
    description: 'Experience next-generation personal banking with zero fees, instant transfers, and smart budgeting tools.',
    keywords: ['personal banking', 'digital banking', 'online banking', 'smart banking']
  },
  'personal/credit': {
    title: 'Personal Credit - Smart Lending Solutions',
    description: 'Access personal credit and lending solutions with competitive rates and flexible terms.',
    keywords: ['personal credit', 'personal loans', 'lending', 'financing']
  },
  'personal/cryptocurrency': {
    title: 'Personal Crypto - Secure Crypto Platform',
    description: 'Trade cryptocurrencies with advanced security, low fees, and institutional-grade infrastructure.',
    keywords: ['personal cryptocurrency', 'crypto trading', 'bitcoin', 'ethereum']
  },
  'personal/defi-strategies': {
    title: 'Personal DeFi - Decentralized Finance',
    description: 'Earn yields and access DeFi protocols with enterprise-grade security and expert strategies.',
    keywords: ['personal defi', 'yield farming', 'decentralized finance', 'liquidity mining']
  },
  'personal/investing': {
    title: 'Personal Investing - Smart Crypto Investing',
    description: 'Access cryptocurrencies and traditional assets with AI-powered portfolio management.',
    keywords: ['personal investing', 'investment platform', 'portfolio management']
  },
```

3. **Add NEW help center entries** (insert after `'help/faq'`):

```typescript
  'help/contact': {
    title: 'Contact Us - Get in Touch',
    description: 'Contact diBoaS support team for assistance with your account and services.',
    keywords: ['contact', 'support', 'help', 'customer service']
  },
  'help/getting-started': {
    title: 'Getting Started - Quick Start Guide',
    description: 'Get started with diBoaS in minutes. Learn how to open an account and start managing your finances.',
    keywords: ['getting started', 'quick start', 'onboarding', 'tutorial']
  },
  'help/troubleshooting': {
    title: 'Troubleshooting - Common Issues',
    description: 'Find solutions to common issues and problems with your diBoaS account.',
    keywords: ['troubleshooting', 'problems', 'issues', 'solutions']
  },
  'help/support': {
    title: 'Support - Customer Support Center',
    description: 'Access diBoaS customer support resources and contact options.',
    keywords: ['support', 'customer service', 'help desk', 'assistance']
  },
```

4. **REMOVE these old keys:**
   - Delete: `account: {` (line ~80-84)
   - Delete: `'banking-services': {` (line ~85-89)
   - Delete: `investing: {` (line ~90-94)
   - Delete: `cryptocurrency: {` (line ~95-99)
   - Delete: `'defi-strategies': {` (line ~100-104)
   - Delete: `credit: {` (line ~105-109)

---

### Step 3.2: Update Metadata Factory

**File:** `apps/web/src/lib/seo/metadata-factory.ts`

Find the `generateCategoryStructuredData` function (around line 209) and add this case BEFORE the `learn/` check:

```typescript
static generateCategoryStructuredData(pageKey: string, pageConfig: any) {
  // NEW: Check for /personal/ prefix
  if (pageKey.startsWith('personal/')) {
    return this.generateServiceStructuredData({
      name: pageConfig.title,
      description: pageConfig.description,
      category: 'Personal Financial Services'
    });
  }

  if (pageKey.startsWith('learn/')) {
    return this.generateEducationalStructuredData({
      name: pageConfig.title,
      description: pageConfig.description,
      category: 'Financial Education'
    });
  }

  // ... rest stays same
}
```

---

## 🔄 PHASE 4: MOVE & RENAME PAGE DIRECTORIES (20 minutes)

### Step 4.1: Create `/personal/` directory

```bash
mkdir -p apps/web/src/app/\[locale\]/\(marketing\)/personal
```

### Step 4.2: Move personal product pages

```bash
# Move account
mv apps/web/src/app/\[locale\]/\(marketing\)/account \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/

# Move banking-services → banking
mv apps/web/src/app/\[locale\]/\(marketing\)/banking-services \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/banking

# Move credit
mv apps/web/src/app/\[locale\]/\(marketing\)/credit \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/

# Move cryptocurrency
mv apps/web/src/app/\[locale\]/\(marketing\)/cryptocurrency \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/

# Move defi-strategies
mv apps/web/src/app/\[locale\]/\(marketing\)/defi-strategies \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/

# Move investing
mv apps/web/src/app/\[locale\]/\(marketing\)/investing \
   apps/web/src/app/\[locale\]/\(marketing\)/personal/
```

### Step 4.3: Rename main benefits page

```bash
# Rename benefits → why-diboas
mv apps/web/src/app/\[locale\]/\(marketing\)/benefits \
   apps/web/src/app/\[locale\]/\(marketing\)/why-diboas
```

### Step 4.4: Rename "benefits" sub-pages

```bash
# Rename business/benefits → business/advantages
mv apps/web/src/app/\[locale\]/\(marketing\)/business/benefits \
   apps/web/src/app/\[locale\]/\(marketing\)/business/advantages

# Rename learn/benefits → learn/overview
mv apps/web/src/app/\[locale\]/\(marketing\)/learn/benefits \
   apps/web/src/app/\[locale\]/\(marketing\)/learn/overview

# Rename rewards/benefits → rewards/overview
mv apps/web/src/app/\[locale\]/\(marketing\)/rewards/benefits \
   apps/web/src/app/\[locale\]/\(marketing\)/rewards/overview

# Rename security/benefits → security/protection
mv apps/web/src/app/\[locale\]/\(marketing\)/security/benefits \
   apps/web/src/app/\[locale\]/\(marketing\)/security/protection
```

### Step 4.5: Verify moves

```bash
# Check personal directory
ls -la apps/web/src/app/\[locale\]/\(marketing\)/personal/

# Should see: account, banking, credit, cryptocurrency, defi-strategies, investing

# Check renamed pages
ls -la apps/web/src/app/\[locale\]/\(marketing\)/ | grep -E "why-diboas|business/advantages|learn/overview|rewards/overview|security/protection"
```

---

## 🔄 PHASE 5: UPDATE PAGE FILES (45 minutes)

Now we need to update the `generateStaticPageMetadata()` calls and breadcrumbs in each moved/renamed page.

### Step 5.1: Update Personal Product Pages

**File:** `apps/web/src/app/[locale]/(marketing)/personal/account/page.tsx`

Change:
```typescript
// OLD:
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('account', locale as SupportedLocale);
}

const breadcrumbData = MetadataFactory.generateBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Account', url: ROUTES.ACCOUNT }
], locale);

const heroVariant = getVariantForPageConfig('account');

// NEW:
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('personal/account', locale as SupportedLocale);
}

const breadcrumbData = MetadataFactory.generateBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Personal', url: '/personal' },
  { name: 'Account', url: ROUTES.PERSONAL.ACCOUNT }
], locale);

const heroVariant = getVariantForPageConfig('personal-account');
```

Repeat for:
- `/personal/banking/page.tsx` → `'personal/banking'` and `'personal-banking'`
- `/personal/credit/page.tsx` → `'personal/credit'` and `'personal-credit'`
- `/personal/cryptocurrency/page.tsx` → `'personal/cryptocurrency'` and `'personal-cryptocurrency'`
- `/personal/defi-strategies/page.tsx` → `'personal/defi-strategies'` and `'personal-defi-strategies'`
- `/personal/investing/page.tsx` → `'personal/investing'` and `'personal-investing'`

---

### Step 5.2: Update Main Benefits Page

**File:** `apps/web/src/app/[locale]/(marketing)/why-diboas/page.tsx`

Change:
```typescript
// OLD:
generateStaticPageMetadata('benefits', locale as SupportedLocale);
ROUTES.BENEFITS
getVariantForPageConfig('benefits');

// NEW:
generateStaticPageMetadata('why-diboas', locale as SupportedLocale);
ROUTES.WHY_DIBOAS
getVariantForPageConfig('why-diboas');
```

---

### Step 5.3: Update Renamed Sub-Pages

**File:** `apps/web/src/app/[locale]/(marketing)/business/advantages/page.tsx`

Change:
```typescript
// OLD:
generateStaticPageMetadata('business/benefits', locale as SupportedLocale);
ROUTES.BUSINESS.BENEFITS
getVariantForPageConfig('business-benefits');

// NEW:
generateStaticPageMetadata('business/advantages', locale as SupportedLocale);
ROUTES.BUSINESS.ADVANTAGES
getVariantForPageConfig('business-advantages');
```

**File:** `apps/web/src/app/[locale]/(marketing)/learn/overview/page.tsx`

Change:
```typescript
// OLD:
generateStaticPageMetadata('learn/benefits', locale as SupportedLocale);
ROUTES.LEARN.BENEFITS
getVariantForPageConfig('learn-benefits');

// NEW:
generateStaticPageMetadata('learn/overview', locale as SupportedLocale);
ROUTES.LEARN.OVERVIEW
getVariantForPageConfig('learn-overview');
```

**File:** `apps/web/src/app/[locale]/(marketing)/rewards/overview/page.tsx`

Change:
```typescript
// OLD:
generateStaticPageMetadata('rewards/benefits', locale as SupportedLocale);
ROUTES.REWARDS.BENEFITS
getVariantForPageConfig('rewards-benefits');

// NEW:
generateStaticPageMetadata('rewards/overview', locale as SupportedLocale);
ROUTES.REWARDS.OVERVIEW
getVariantForPageConfig('rewards-overview');
```

**File:** `apps/web/src/app/[locale]/(marketing)/security/protection/page.tsx`

Change:
```typescript
// OLD:
generateStaticPageMetadata('security/benefits', locale as SupportedLocale);
ROUTES.SECURITY.BENEFITS
getVariantForPageConfig('security-benefits');

// NEW:
generateStaticPageMetadata('security/protection', locale as SupportedLocale);
ROUTES.SECURITY.PROTECTION
getVariantForPageConfig('security-protection');
```

---

## 🔄 PHASE 6: UPDATE HERO & COMPONENT CONFIGS (60 minutes)

This is the most tedious part. All config keys in these files need to match the new page structure.

### Step 6.1: Update `hero-pages.ts`

**File:** `apps/web/src/config/hero-pages.ts`

**Strategy:** Use find/replace in your editor:

1. **Rename existing keys:**
   - `'benefits':` → `'why-diboas':`
   - `'account':` → `'personal-account':`
   - `'banking-services':` → `'personal-banking':`
   - `'investing':` → `'personal-investing':`
   - `'cryptocurrency':` → `'personal-cryptocurrency':`
   - `'defi-strategies':` → `'personal-defi-strategies':`
   - `'credit':` → `'personal-credit':`
   - `'learn-benefits':` → `'learn-overview':`
   - `'business-benefits':` → `'business-advantages':`
   - `'rewards-benefits':` → `'rewards-overview':`
   - `'security-benefits':` → `'security-protection':`

2. **Update translation keys inside configs:**
   - `marketing.pages.benefits.` → `marketing.pages.whyDiboas.`
   - `marketing.pages.account.` → `marketing.pages.personalAccount.`
   - `marketing.pages.bankingServices.` → `marketing.pages.personalBanking.`
   - `marketing.pages.investing.` → `marketing.pages.personalInvesting.`
   - `marketing.pages.cryptocurrency.` → `marketing.pages.personalCryptocurrency.`
   - `marketing.pages.defiStrategies.` → `marketing.pages.personalDefiStrategies.`
   - `marketing.pages.credit.` → `marketing.pages.personalCredit.`
   - `marketing.pages.learnBenefits.` → `marketing.pages.learnOverview.`
   - `marketing.pages.businessBenefits.` → `marketing.pages.businessAdvantages.`
   - `marketing.pages.rewardsBenefits.` → `marketing.pages.rewardsOverview.`
   - `marketing.pages.securityBenefits.` → `marketing.pages.securityProtection.`

---

### Step 6.2: Update `benefitsCards-pages.ts`

Same strategy - rename keys:
- `'account':` → `'personal-account':`
- `'benefits':` → `'why-diboas':`
- etc.

And update translation key patterns inside.

---

### Step 6.3: Update Other Component Configs

Repeat for:
- `featureShowcase-pages.ts`
- `stickyFeaturesNav-pages.ts`
- `faqAccordion-pages.ts`

---

## 🔄 PHASE 7: UPDATE TRANSLATIONS (30 minutes)

This step adds the new translation keys. Since you have 4 locales, start with English and then copy structure to others.

### Step 7.1: Update English Translations

**File:** `packages/i18n/translations/en/marketing.json`

In the `pages` object, rename these sections:
- `benefits:` → `whyDiboas:`
- `learnBenefits:` → `learnOverview:`
- `businessBenefits:` → `businessAdvantages:`
- `rewardsBenefits:` → `rewardsOverview:`
- `securityBenefits:` → `securityProtection:`

And ADD these new sections (copy content from old keys):
- `personalAccount:` (copy from `account:`)
- `personalBanking:` (copy from `bankingServices:`)
- `personalCredit:` (copy from `credit:`)
- `personalCryptocurrency:` (copy from `cryptocurrency:`)
- `personalDefiStrategies:` (copy from `defiStrategies:`)
- `personalInvesting:` (copy from `investing:`)

Then DELETE the old keys:
- `account:`
- `bankingServices:`
- `credit:`
- `cryptocurrency:`
- `defiStrategies:`
- `investing:`

---

### Step 7.2: Repeat for Other Locales

Copy the same structure to:
- `packages/i18n/translations/pt-BR/marketing.json`
- `packages/i18n/translations/es/marketing.json`
- `packages/i18n/translations/de/marketing.json`

---

## 🔄 PHASE 8: CREATE NEW HELP PAGES (30 minutes)

Create 4 new help center pages by copying the FAQ structure.

### Step 8.1: Create Help/Contact Page

```bash
mkdir -p apps/web/src/app/\[locale\]/\(marketing\)/help/contact
```

**File:** `apps/web/src/app/[locale]/(marketing)/help/contact/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { HeroSection } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { HERO_PAGE_CONFIGS, getVariantForPageConfig } from '@/config/hero-pages';
import { ROUTES } from '@/config/routes';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('help/contact', locale as SupportedLocale);
}

export default async function HelpContactPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Help', url: '/help' },
    { name: 'Contact', url: ROUTES.HELP.CONTACT }
  ], locale);

  const heroVariant = getVariantForPageConfig('help-contact');

  return (
    <>
      <StructuredData data={breadcrumbData} />

      <SectionErrorBoundary>
        <HeroSection
          variant={heroVariant}
          config={HERO_PAGE_CONFIGS['help-contact']}
          priority
        />
      </SectionErrorBoundary>

      {/* TODO: Add contact form and support information */}
    </>
  );
}
```

### Step 8.2: Create Remaining Help Pages

Repeat for:
- `/help/getting-started/page.tsx`
- `/help/troubleshooting/page.tsx`
- `/help/support/page.tsx`

Just change the metadata key and breadcrumb.

---

## 🧪 PHASE 9: TESTING & VALIDATION (30 minutes)

### Step 9.1: Check for TypeScript Errors

```bash
cd apps/web
npx tsc --noEmit
```

Fix any errors that appear.

---

### Step 9.2: Build the Project

```bash
pnpm build
```

This will catch any missing translation keys or broken imports.

---

### Step 9.3: Start Dev Server

```bash
pnpm run dev:web
```

Should start without errors.

---

### Step 9.4: Manual Testing Checklist

Visit each URL in your browser and verify:

**Personal Products:**
- [ ] http://localhost:3002/en/personal/account
- [ ] http://localhost:3002/en/personal/banking
- [ ] http://localhost:3002/en/personal/credit
- [ ] http://localhost:3002/en/personal/cryptocurrency
- [ ] http://localhost:3002/en/personal/defi-strategies
- [ ] http://localhost:3002/en/personal/investing

**Why diBoaS:**
- [ ] http://localhost:3002/en/why-diboas

**Learn:**
- [ ] http://localhost:3002/en/learn/overview

**Business:**
- [ ] http://localhost:3002/en/business/advantages

**Rewards:**
- [ ] http://localhost:3002/en/rewards/overview

**Security:**
- [ ] http://localhost:3002/en/security/protection

**Help:**
- [ ] http://localhost:3002/en/help/faq
- [ ] http://localhost:3002/en/help/contact
- [ ] http://localhost:3002/en/help/getting-started
- [ ] http://localhost:3002/en/help/troubleshooting
- [ ] http://localhost:3002/en/help/support

**Navigation:**
- [ ] Desktop menu links work
- [ ] Mobile menu links work
- [ ] Breadcrumbs show correct hierarchy
- [ ] All CTAs point to correct URLs

---

## ✅ PHASE 10: COMMIT & PUSH

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "refactor: restructure routing with /personal/ group and rename benefits pages

- Move personal products to /personal/* (account, banking, credit, crypto, defi, investing)
- Rename /benefits to /why-diboas to avoid cannibalization
- Rename /business/benefits to /business/advantages
- Rename /learn/benefits to /learn/overview
- Rename /rewards/benefits to /rewards/overview
- Rename /security/benefits to /security/protection
- Expand /help/ with contact, getting-started, troubleshooting, support
- Update all routes, navigation, SEO configs, and translations
- Update component configs (hero, benefits cards, features, FAQ)

BREAKING CHANGE: All personal product URLs now use /personal/ prefix
"

# Push to remote
git push origin refactor/routing-restructure
```

---

## 📋 COMPLETION CHECKLIST

- [ ] Phase 1: Preparation ✅
- [ ] Phase 2: Update Navigation & Configs
- [ ] Phase 3: Update SEO Constants
- [ ] Phase 4: Move & Rename Directories
- [ ] Phase 5: Update Page Files
- [ ] Phase 6: Update Hero & Component Configs
- [ ] Phase 7: Update Translations
- [ ] Phase 8: Create New Help Pages
- [ ] Phase 9: Testing & Validation
- [ ] Phase 10: Commit & Push

---

## 🆘 TROUBLESHOOTING

### Error: "Cannot find module"
- **Cause:** Import paths pointing to old locations
- **Fix:** Search for old import paths and update

### Error: "Translation key not found"
- **Cause:** Missing translation keys in JSON files
- **Fix:** Add missing keys to all 4 locale files

### Error: "Page not found (404)"
- **Cause:** Route config doesn't match directory structure
- **Fix:** Verify folder names match route config exactly

### Error: TypeScript errors in config files
- **Cause:** Config keys don't match types
- **Fix:** Make sure all renamed keys are consistent

---

## 📞 NEED HELP?

If you get stuck on any step, let me know which phase/step you're on and I'll help debug!
