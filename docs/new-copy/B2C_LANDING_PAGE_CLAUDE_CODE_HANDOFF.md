# B2C Landing Page — Claude Code Implementation Handoff

**Date:** February 20, 2026
**Status:** Ready for Implementation
**Priority:** Critical — Pre-launch
**Depends on:** CLO-approved copy (4 locales), UI/UX Audit, Image Prompts v2

---

## Purpose

This document instructs Claude Code to rebuild the B2C landing page (`(landing)/page.tsx`) to absorb the new CLO-approved copy, implement the UI/UX audit recommendations, and create any new components needed — all while respecting the 12 architectural principles defined in `docs/coding-standards.md`, the component architecture pattern in `docs/component-architecture-pattern.md`, and the section components guide in `docs/section-components-guide.md`.

**Read these docs before writing any code:**
- `docs/coding-standards.md` — The 12 Principles of Excellence
- `docs/component-architecture-pattern.md` — The FeatureShowcase Blueprint
- `docs/section-components-guide.md` — All section component interfaces
- `docs/design-system.md` — Brand colors, typography, mascot system
- `docs/internationalization.md` — i18n patterns and translation integration
- `docs/new-copy/diBoaS_B2C_Landing_Page_EN_Final.md` — Authoritative EN copy
- `docs/new-copy/diBoaS_B2C_Landing_Page_PTBR_Final.md` — PT-BR copy
- `docs/new-copy/diBoaS_B2C_Landing_Page_DE_Final.md` — DE copy
- `docs/new-copy/diBoaS_B2C_Landing_Page_ES_Final.md` — ES copy
- `docs/new-copy/B2C_LANDING_UIUX_AUDIT_AND_RECOMMENDATIONS.md` — Full UI/UX audit (in `/mnt/user-data/outputs/` or request from user)

---

## Scope Summary

The current page renders **8 sections**. The new page renders **11 sections**. Three sections are entirely new. Two existing sections need significant interface changes. The remaining six need config/copy updates and style adjustments.

### Section Mapping: Old → New

| # | New Section | Current Component | Action |
|---|------------|-------------------|--------|
| 1 | Hero | `HeroSection` (fullBackground) | **UPDATE** config + style tokens |
| 2 | Origin Story | `FeatureShowcase` (single slide) | **UPDATE** to prose-only variant |
| 3 | How It Works | `ProductCarouselFactory` | **UPDATE** config + add quote field |
| 4 | Real-Life Scenarios | ❌ None | **CREATE** new `ScenarioCards` component |
| 5 | Feature Carousel | `BenefitsCardsSection` | **REPLACE** with `FeatureShowcase` multi-slide or new variant |
| 6 | Fees | ❌ None | **CREATE** new `FeeTable` component |
| 7 | What's the Catch? | ❌ None | **CREATE** new `ProseSection` component |
| 8 | Interactive Demo | `DemoEmbed` (exists, not wired) | **WIRE** into page with dual CTA |
| 9 | Waitlist | `WaitlistSection` + `SocialProofSection` | **MERGE** counter row into waitlist |
| 10 | FAQ | `FAQAccordion` | **UPDATE** config + fix HTML rendering |
| 11 | Footer | `MinimalFooter` | **UPDATE** config + add nav links + disclaimers |

### Sections Removed from Current Page

- `SocialProofSection` — Counter data merges into Waitlist (Section 9)
- `FutureYouPreviewSection` — Absorbed into Demo dual CTA ("Quick Future You Check")
- `BenefitsCardsSection` (as Features) — Replaced by FeatureShowcase multi-slide

---

## File Change Map

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/app/[locale]/(landing)/page.tsx` | New 11-section layout, new imports, new configs |
| `apps/web/src/config/landing-b2c.ts` | Complete rewrite of all section configs |
| `packages/i18n/translations/en/landing-b2c.json` | Complete rewrite with new keys |
| `packages/i18n/translations/pt-BR/landing-b2c.json` | Complete rewrite with new keys |
| `packages/i18n/translations/de/landing-b2c.json` | Complete rewrite with new keys |
| `packages/i18n/translations/es/landing-b2c.json` | Complete rewrite with new keys |
| `apps/web/src/styles/design-tokens.css` | Token updates for typography, backgrounds, colors |
| `apps/web/src/components/Sections/ProductCarousel/` | Add optional `quote` field to slide interface |
| `apps/web/src/components/Sections/FeatureShowcase/` | Add prose-only variant (no image, no CTA) |
| `apps/web/src/components/Layout/Footer/MinimalFooter.tsx` | Add nav links, tagline, locale disclaimers |
| `apps/web/src/components/Sections/WaitlistSection/` | Add counter row (stats from SocialProof) |
| `apps/web/src/components/Sections/FAQAccordion/` | Fix HTML rendering, support multi-paragraph |
| `apps/web/src/config/assets.ts` | Add new image asset references |
| `apps/web/src/components/Sections/index.ts` | Export new components |

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/Sections/ScenarioCards/` | Section 4: Real-Life Scenarios |
| `apps/web/src/components/Sections/FeeTable/` | Section 6: Fee transparency table |
| `apps/web/src/components/Sections/ProseSection/` | Section 7: "What's the Catch?" freeform prose |
| `apps/web/src/config/scenarioCards.ts` | Config types for ScenarioCards |
| `apps/web/src/config/feeTable.ts` | Config types for FeeTable |
| `apps/web/src/config/proseSection.ts` | Config types for ProseSection |

---

## Image Asset Convention

All images live in `apps/web/public/assets/images/` and follow this naming pattern:

```
{section-name}-{descriptive-name}.{avif|webp|jpg}
```

Provide AVIF as primary format with WebP fallback. Use Next.js `<Image>` with `priority` on hero only.

### Expected Image Files

| Section | Expected filenames | Dimensions | Notes |
|---------|-------------------|------------|-------|
| Hero | `hero-hand-phone.avif`, `hero-hand-phone-mobile.avif` | 1440×800 desktop, 390×844 mobile | Different crops for mobile |
| Origin Story | `origin-grandmother-hands.avif` | 600×400 | Optional — section may be text-only per audit |
| How It Works | `howitworks-step1-deposit.avif`, `howitworks-step2-strategy.avif`, `howitworks-step3-grow.avif` | 400×400 square | One per card |
| Real-Life Scenarios | `scenarios-friends-dinner.avif`, `scenarios-global-payment.avif`, `scenarios-emergency-night.avif` | 500×350 (16:9) | Background images with overlay |
| Feature Carousel | `features-send-receive.avif`, `features-goal-strategies.avif`, `features-no-surprises.avif` | 400×300 | Optional per slide |
| Demo | `demo-preview.avif` | 600×400 | Fallback if demo fails to load |

If images are not yet present at implementation time, use `placeholder="blur"` with a teal-tinted blurDataURL. The component must render correctly without images (graceful fallback).

---

## Translation Key Structure

Complete rewrite of `landing-b2c.json` across all 4 locales. The new key structure:

```json
{
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "cta": "Try Demo"
  },
  "origin": {
    "header": "Why This Exists",
    "paragraphs": {
      "p1": "My grandmother never had access...",
      "p2": "Not because she wasn't smart enough...",
      "p3": "The tools existed...",
      "p4": "I'm building this for her...",
      "p5": "I called it Adelaide."
    }
  },
  "howItWorks": {
    "header": "Three Steps. That's It.",
    "step1": {
      "title": "Add Money",
      "description": "ACH or debit card — deposit the way you already do...",
      "quote": "I send money to my family. Fast and simple."
    },
    "step2": {
      "title": "Pick Your Strategy",
      "description": "Conservative, balanced, or aggressive...",
      "quote": "I had $200 sitting in my account doing nothing. Now it's growing."
    },
    "step3": {
      "title": "Grow — or Go",
      "description": "Your money grows. Adelaide keeps you informed...",
      "quote": "My money earns while I sleep. Adelaide tells me how it's going."
    }
  },
  "scenarios": {
    "header": "Real People. Real Moments.",
    "card1": {
      "title": "Splitting dinner in San Francisco",
      "description": "Four friends. One tap. Done before the waiter brings the check."
    },
    "card2": {
      "title": "Paying a designer in Dubai",
      "description": "They're in the Middle East. You're in America. The money arrives before the meeting ends."
    },
    "card3": {
      "title": "Emergency money to Mom",
      "description": "3 AM. She needs it now. Not during \"business hours.\""
    }
  },
  "features": {
    "slide1": {
      "tagline": "Money that moves like messages",
      "title": "Send & Receive",
      "description": "Send money to anyone, anywhere. Request payments. Split expenses."
    },
    "slide2": {
      "tagline": "Savings that grow",
      "title": "Goal-Based Strategies",
      "description": "Pick a goal. Pick a risk level. Each strategy stress-tested..."
    },
    "slide3": {
      "tagline": "Your money works while you sleep",
      "title": "No Surprises",
      "description": "24/7. No weekends. No holidays. No business hours..."
    }
  },
  "fees": {
    "title": "Our fees. All of them.",
    "subtitle": "You should know exactly what you're paying. Here's everything.",
    "rows": {
      "adding": {
        "action": "Adding money",
        "explanation": "Goes to payment network. We don't add anything.",
        "fee": "Card processing fee (set by your card provider)"
      },
      "sending": {
        "action": "Sending money",
        "explanation": "We don't charge for transfers. The blockchain network does...",
        "fee": "Network fee (varies, typically < $0.01)"
      },
      "investing": {
        "action": "Investing",
        "explanation": "No entry fees.",
        "fee": "Free to buy"
      },
      "selling": {
        "action": "Selling investments",
        "explanation": "This is how we sustain diBoaS.",
        "fee": "0.12%"
      },
      "stopping": {
        "action": "Stopping a growth strategy",
        "explanation": "Same as above.",
        "fee": "0.12%"
      },
      "withdrawing": {
        "action": "Withdrawing or transferring out",
        "explanation": "This is how we sustain diBoaS.",
        "fee": "0.75%"
      }
    },
    "disclaimer": "No monthly fees. No minimum balance fees. No \"account maintenance\" fees. No hidden spreads."
  },
  "catch": {
    "paragraphs": {
      "p1": "You might be thinking: what's the catch?",
      "p2": "Fair question. Here's the honest answer:",
      "p3": "For decades, the best financial tools were locked behind walls...",
      "p4": "New technology changed that...",
      "p5": "We didn't invent this. We just made it simple enough that anyone can use it.",
      "p6": "The catch? There isn't one. We make money when you sell or withdraw (0.12% and 0.75%). That's it. When you grow, we grow. Our interests are aligned."
    }
  },
  "demo": {
    "header": "Try It. No Signup Needed.",
    "subtext": "See exactly how diBoaS works. Add money, send it, invest it, take it back...",
    "ctaPrimary": "Try Full Demo",
    "ctaSecondary": "Quick Future You Check"
  },
  "waitlist": {
    "header": "Want early access?",
    "description": "We're opening diBoaS to a small group first...",
    "emailPlaceholder": "Your email address",
    "submitButton": "Join Waitlist",
    "counterRow": "{count} people from {countries} countries already joined",
    "privacyNote": "We'll never spam you. Just updates on when you can get started."
  },
  "faq": {
    "header": "Questions? We've got answers.",
    "items": {
      "isBank": {
        "question": "Is diBoaS a bank?",
        "answer": "No. diBoaS is a non-custodial platform..."
      },
      "howPossible": {
        "question": "How is this possible without high fees?",
        "answer": "By removing the middlemen..."
      },
      "safety": {
        "question": "Is my money safe?",
        "answer": "Your money is secured by you..."
      },
      "understanding": {
        "question": "What if I don't understand investing?",
        "answer": "That's exactly who we built this for..."
      },
      "minimum": {
        "question": "What's the minimum amount to start?",
        "answer": "Start with as little as $5 (US), €5 (EU), or R$10 (Brazil)..."
      }
    }
  },
  "footer": {
    "tagline": "Named after Adelaide. Built for everyone like her.",
    "nav": {
      "forYou": "For You",
      "forBusiness": "For Business",
      "adelaideDaily": "Adelaide Daily",
      "about": "About",
      "help": "Help",
      "legal": "Legal"
    },
    "disclosures": {
      "general": "This content is for educational purposes only...",
      "crypto": "The value of crypto-assets may fluctuate...",
      "stories": "User stories are illustrative examples...",
      "ai": "🤖 This content was created with the assistance of artificial intelligence...",
      "closing": "You decide what's best for your situation."
    },
    "copyright": "© 2026 diBoaS. All rights reserved."
  },
  "seo": {
    "title": "diBoaS | The System Wasn't Built for You. We're Changing That.",
    "description": "...",
    "ogTitle": "The system isn't broken. It's working exactly as designed. Just not for you.",
    "ogDescription": "..."
  }
}
```

**Copy the full text from each locale's `_Final.md` document.** The key structure above must be identical across all 4 locale files. Only the values change.

**Locale-specific notes:**
- Section 4 (Scenarios) has locale-adapted city names — see LOCALE NOTE in each `_Final.md`
- Section 6 (Fees) has locale-adapted currency/payment methods
- Section 10 (FAQ) minimum amounts differ per locale ($5 / €5 / R$10)
- Footer disclaimers differ per jurisdiction (US, MiCA DE/ES, CVM PT-BR)

---

## Design Token Changes

Apply these changes to `apps/web/src/styles/design-tokens.css`:

### Font Family Resolution

Remove the Geist Sans font loader from `apps/web/src/app/layout.tsx`. Commit to Inter across the entire system. The design-tokens.css `--font-family-primary: 'Inter'` and tailwind.config.ts `fontFamily.sans: ['Inter']` are already correct — the Geist loader overrides them.

Update `layout.tsx` to load Inter via `next/font/google`:
```
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
```

### Text Color Hierarchy

Add or update these tokens:

```css
/* Unified text color hierarchy */
--color-text-heading: #0f172a;    /* slate-900 — headings */
--color-text-body: #334155;       /* slate-700 — body, descriptions */
--color-text-secondary: #64748b;  /* slate-500 — captions, muted */
--color-text-on-dark: #ffffff;    /* white — text on dark backgrounds */
--color-text-on-dark-muted: rgba(255, 255, 255, 0.85); /* subheadlines on dark */
```

All section-specific title/description tokens (`--hs-color-title`, `--fs-color-title`, `--bc-color-title`, etc.) should reference these unified tokens instead of individual hex values. This eliminates the navy-vs-black inconsistency.

### Section Background Rhythm

Add or update:

```css
--section-bg-white: #ffffff;
--section-bg-neutral: #fafafa;
--section-bg-warm: #f8f7f4;       /* NEW — "What's the Catch" section */
--section-bg-brand: #f0fdfa;      /* teal-50 — Waitlist section emphasis */
--section-bg-dark: #0f172a;       /* slate-900 — Footer */
```

Remove `--bc-color-section-bg: #f5f3ff` (light purple). It is not used in the new design.

### Mobile Typography Adjustments

```css
/* Hero title — mobile */
--hs-font-size-title-mobile: 30px;       /* was 38px */
--hs-font-weight-title: 600;             /* was 700 */

/* Section titles — mobile */
--section-title-font-size-mobile: 26px;  /* was 28px */

/* Prose sections — line height */
--prose-line-height: 1.7;               /* NEW — for Origin Story, Catch */
--prose-paragraph-spacing: 1.5em;        /* NEW — gap between paragraphs */
```

---

## Per-Section Implementation Details

### Section 1: Hero — UPDATE `HeroSection`

**Config changes in `landing-b2c.ts`:**

```typescript
export const B2C_HERO_CONFIG: HeroVariantConfig = {
  variant: 'fullBackground',
  content: {
    title: 'landing-b2c.hero.headline',
    description: 'landing-b2c.hero.subheadline', // ENABLE this — currently not rendered
    ctaText: 'landing-b2c.hero.cta',
    ctaHref: '#demo',
    ctaTarget: '_self'
  },
  backgroundAssets: {
    backgroundImage: '/assets/images/hero-hand-phone.avif',
    backgroundImageMobile: '/assets/images/hero-hand-phone-mobile.avif',
    overlayOpacity: 0.7  // was 0.4 in config (renders ~92% visually) — set to 0.7 for actual 70%
  },
  // ... seo, analytics same structure
};
```

**Component changes:**
- Ensure the `description` field from config actually renders (currently may be skipped in the template)
- Subheadline: 18px, font-weight 400, `var(--color-text-on-dark-muted)`
- Apply `min-height: 100svh` instead of fixed heights
- Add bottom gradient overlay (transparent → white, bottom 15% of hero)
- CTA: Remove question mark, remove arrow text (use chevron icon if desired)

**Image:** `hero-hand-phone.avif` / `hero-hand-phone-mobile.avif` in `/assets/images/`

---

### Section 2: Origin Story — UPDATE `FeatureShowcase` (prose-only variant)

**What changes:** The current FeatureShowcase renders as a two-column layout (text + image). The new Origin Story is a single-column prose block with 5 distinct paragraphs and a signature line. No image. No CTA.

**Approach:** Add a new variant to FeatureShowcase (e.g., `prose` or `story`) that renders:
- Single centered column, `max-width: 680px`
- Section header (`<h2>`)
- Multiple paragraphs with `1.5em` spacing between them
- Final line ("I called it Adelaide.") styled distinctly: `font-size: 20px`, `font-weight: 600`, `color: var(--color-primary-700)` (teal-700)
- No image column, no CTA button
- Body text: `18px`, `line-height: 1.7`, `color: var(--color-text-body)`
- Background: `var(--section-bg-white)`

**Config:**

```typescript
export const B2C_ORIGIN_STORY_CONFIG: FeatureShowcaseVariantConfig = {
  variant: 'prose', // NEW variant
  slides: [{
    id: 'origin-story',
    content: {
      title: 'landing-b2c.origin.header',
      // Use paragraphs array instead of single description
      paragraphs: [
        'landing-b2c.origin.paragraphs.p1',
        'landing-b2c.origin.paragraphs.p2',
        'landing-b2c.origin.paragraphs.p3',
        'landing-b2c.origin.paragraphs.p4',
        'landing-b2c.origin.paragraphs.p5',
      ],
      signatureLine: 'landing-b2c.origin.paragraphs.p5', // styled differently
    },
    assets: {}, // No image
    seo: { imageAlt: '' }
  }],
  settings: { showNavigation: false, showDots: false },
  // ...
};
```

**Alternative approach:** If extending FeatureShowcase's variant type feels forced, build this as the new `ProseSection` component (Section 7 also needs it) and reuse it for both sections 2 and 7 with different configs.

**Image:** `origin-grandmother-hands.avif` — OPTIONAL. The audit recommends text-only for this section. If the image exists and is compelling, add it as a subtle decorative element (low opacity, not in the two-column layout). If not, skip it.

---

### Section 3: How It Works — UPDATE `ProductCarousel`

**What changes:** The current ProductCarousel has 3 slides with title + subtitle + image. The new copy adds a **user quote** per card. The audit recommends vertical stacked cards on mobile instead of carousel.

**Component changes:**
- Add optional `quote?: string` field to the `ProductCarouselSlide` interface (or equivalent type)
- Render quote as: `font-style: italic`, `font-size: 16px`, `color: var(--color-primary-700)`, with a `3px solid var(--color-primary-200)` left border, `padding-left: 16px`
- Consider adding visible step numbers (01, 02, 03) as large light-teal numerals at card top-left
- Background: `var(--section-bg-neutral)`

**Config update:**

```typescript
// Each slide gets a quote field
slides: [
  {
    id: 'step-1-deposit',
    title: 'landing-b2c.howItWorks.step1.title',
    subtitle: 'landing-b2c.howItWorks.step1.description',
    quote: 'landing-b2c.howItWorks.step1.quote', // NEW
    image: '/assets/images/howitworks-step1-deposit.avif',
    imageAlt: 'Step 1: Add money'
  },
  // ... step2, step3 same pattern
]
```

**Images:** `howitworks-step1-deposit.avif`, `howitworks-step2-strategy.avif`, `howitworks-step3-grow.avif` in `/assets/images/`

---

### Section 4: Real-Life Scenarios — CREATE `ScenarioCards`

**This is a new component.** Follow the component architecture pattern from `docs/component-architecture-pattern.md`.

**File structure:**
```
components/Sections/ScenarioCards/
├── ScenarioCards.tsx
├── ScenarioCards.module.css
├── index.ts
└── components/
    └── ScenarioCard.tsx

config/
├── scenarioCards.ts
```

**Behavior:**
- Section header (`<h2>`) + 3 cards
- Each card has: background image (30% opacity) + bottom gradient overlay + title (in quotes) + description
- Desktop: 3 cards side-by-side in a grid
- Mobile: Vertical stack
- Card height: `280px` mobile, `360px` desktop
- Title: `font-size: 20px`, `font-weight: 600`, white text
- Description: `font-size: 16px`, `rgba(255,255,255,0.85)`
- Background: `var(--section-bg-white)`

**Locale handling:** City names in card titles differ per locale. Use i18n keys — do NOT hardcode city names.

**Config interface:**

```typescript
interface ScenarioCardsConfig {
  section: {
    title: string; // i18n key
  };
  cards: Array<{
    id: string;
    title: string;        // i18n key — "Splitting dinner in San Francisco"
    description: string;  // i18n key
    backgroundImage: string;
    imageAlt: string;
  }>;
  seo: { headingLevel: 'h2'; ariaLabel: string };
  analytics: { sectionId: string; category: string };
}
```

**Images:** `scenarios-friends-dinner.avif`, `scenarios-global-payment.avif`, `scenarios-emergency-night.avif` in `/assets/images/`

---

### Section 5: Feature Carousel — REPLACE `BenefitsCardsSection`

**What changes:** The current BenefitsCardsSection shows 4 icon+title+description cards. The new copy has 3 slides, each with a tagline + title + description. The format is closer to FeatureShowcase in multi-slide mode.

**Approach:** Use `FeatureShowcase` in a multi-slide variant, or repurpose `AppFeaturesCarousel` if its interface is closer. The key requirement is 3 cards visible simultaneously on desktop, swipeable on mobile.

**Per-slide structure:**
- Tagline: `font-size: 14px`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `color: var(--color-primary-600)` (teal-600)
- Title: `font-size: 24px`, `font-weight: 700`
- Description: standard body text
- Optional image per slide

**Background:** `var(--section-bg-neutral)`

**Config: adapt to whichever component is chosen.** The i18n keys are `landing-b2c.features.slide1.tagline`, `.title`, `.description`, etc.

**Images:** `features-send-receive.avif`, `features-goal-strategies.avif`, `features-no-surprises.avif` — optional. If not available, render as text-only cards.

---

### Section 6: Fees — CREATE `FeeTable`

**This is a new component.** Follow the component architecture pattern.

**File structure:**
```
components/Sections/FeeTable/
├── FeeTable.tsx
├── FeeTable.module.css
├── index.ts

config/
├── feeTable.ts
```

**Behavior:**
- Section title + subtitle
- Desktop: HTML `<table>` element, `max-width: 800px`, centered
- Mobile: Each row becomes a card (responsive table pattern)
- Table columns: Action | Explanation | Fee
- Table header: `background: var(--color-primary-50)` (teal-50)
- Fee column: `font-weight: 600`, `color: var(--color-primary-700)` (teal-700)
- Rows where fee = "Free to buy": render with checkmark icon + teal-600 color
- Below table: disclaimer paragraph — `font-size: 16px`, `color: var(--color-text-secondary)`, `max-width: 600px`, centered
- Border style: horizontal lines only (no vertical borders, no full grid)
- Background: `var(--section-bg-white)`

**Config interface:**

```typescript
interface FeeTableConfig {
  content: {
    title: string;        // i18n key
    subtitle: string;     // i18n key
    disclaimer: string;   // i18n key
    rows: Array<{
      id: string;
      action: string;     // i18n key
      explanation: string; // i18n key
      fee: string;        // i18n key
      isFree?: boolean;   // renders with checkmark styling
    }>;
  };
  seo: { headingLevel: 'h2'; ariaLabel: string };
  analytics: { sectionId: string; category: string };
}
```

**Images:** None.

---

### Section 7: What's the Catch? — CREATE `ProseSection`

**This is a new reusable component.** It renders centered long-form prose with no structural elements (no cards, no images, no table). Useful for both this section and potentially the Origin Story if FeatureShowcase's prose variant feels too forced.

**File structure:**
```
components/Sections/ProseSection/
├── ProseSection.tsx
├── ProseSection.module.css
├── index.ts

config/
├── proseSection.ts
```

**Behavior:**
- Single centered column, `max-width: 680px`
- No header (the copy opens with "You might be thinking: what's the catch?")
- Multiple paragraphs with `line-height: 1.7`, paragraph spacing `1.5em`
- One emphasized line: "There isn't one." — `color: var(--color-primary-700)`, `font-weight: 600`
- Body text: `font-size: 18px`, `color: var(--color-text-body)`
- Background: `var(--section-bg-warm)` (#f8f7f4) — this is the ONLY section using this warm neutral
- Extra vertical padding: `80px` desktop, `64px` mobile (more generous than standard)

**Config interface:**

```typescript
interface ProseSectionConfig {
  content: {
    paragraphs: string[];      // Array of i18n keys
    emphasisLine?: string;     // i18n key for "There isn't one." — rendered in teal
  };
  style: {
    backgroundColor: string;
    maxWidth?: string;
    verticalPadding?: 'standard' | 'generous';
  };
  seo: { ariaLabel: string };
  analytics: { sectionId: string; category: string };
}
```

If you build ProseSection as a generic component, reuse it for Section 2 (Origin Story) as well — pass a different config with a header and signature line.

**Images:** None.

---

### Section 8: Interactive Demo — WIRE `DemoEmbed`

**The component exists** at `components/Sections/DemoEmbed/` but is NOT currently in the page layout.

**Changes:**
- Import and add to page between ProseSection and WaitlistSection
- Add dual CTA buttons: "Try Full Demo" (filled teal) + "Quick Future You Check" (outline teal)
- "Quick Future You Check" links to `/[locale]/future-you` (existing page)
- On demo close/complete → auto-scroll to Waitlist section (`#waitlist`)
- If demo component fails to load after 5 seconds, show fallback: inline email capture that submits to waitlist
- Background: `var(--section-bg-neutral)`

**Config update in `landing-b2c.ts`:** The existing `B2C_DEMO_CONFIG` is mostly correct. Add the secondary CTA and update i18n keys per new copy.

**Images:** `demo-preview.avif` — fallback/loading state only.

---

### Section 9: Waitlist — UPDATE `WaitlistSection`

**What changes:** Merge the counter data (currently in separate `SocialProofSection`) into the WaitlistSection component.

**Additions:**
- Add counter row below the email input: "[X] people from [Y] countries already joined"
- Counter should animate (count-up) when the section scrolls into view
- Privacy note below button: "We'll never spam you. Just updates on when you can get started."
- Success state after submission: "You're #[position]! 🎉" + referral link (if available)
- Background: `var(--section-bg-brand)` (teal-50 #f0fdfa) — this section is the primary CTA, needs visual emphasis
- Mobile: email input and button stack vertically, full width

**Counter data source:** Use existing `config/waitlist-stats.ts` or the API endpoint already powering SocialProofSection.

**Image:** None.

---

### Section 10: FAQ — UPDATE `FAQAccordion`

**What changes:**
- Replace all 6+1 current FAQ items with the 5 new items from the approved copy
- Fix HTML rendering bug: `<strong>` tags currently display as literal text in some answers. Ensure the answer renderer uses `dangerouslySetInnerHTML` with DOMPurify (already a dependency) or a markdown-safe renderer
- Support multi-paragraph answers (some new answers have paragraph breaks)
- Remove the CTA from the left panel (current config has `ctaText` + `ctaHref`)
- Rotate the expand icon from `+` to `×` on open (or use a chevron that rotates 180°)
- Background: `var(--section-bg-white)`

**Config update:** Replace `B2C_FAQ_ITEMS` array and update `B2C_FAQ_CONFIG` in `landing-b2c.ts` with new i18n keys.

---

### Section 11: Footer — UPDATE `MinimalFooter`

**What changes:**
- Add tagline: "Named after Adelaide. Built for everyone like her." (i18n key: `landing-b2c.footer.tagline`)
- Add product navigation links: For You, For Business, Adelaide Daily, About, Help, Legal
- Fix social media icons — the current implementation renders letters (I, T, Y, L) instead of icons. Ensure Lucide icon dynamic imports resolve correctly
- Update copyright from `© 2025` to `© 2026`
- Add full disclosure block with locale-conditional disclaimers:
  - General disclaimer (all locales)
  - Crypto volatility warning (all locales)
  - User stories disclosure (all locales)
  - AI disclosure with robot emoji (all locales — California SB 942)
  - MiCA Article 68 verbatim (DE, ES locales only)
  - CVM 3-warning requirements (PT-BR locale only)
  - US regulatory note (EN locale only)
- Desktop layout: Logo + tagline left, nav links center, social icons right
- Mobile: Stack all elements vertically

**Locale-conditional rendering:** Use the current locale from i18n context to conditionally render jurisdiction-specific disclaimers. The disclaimer text lives in the i18n JSON, but the logic for WHICH disclaimers to show should be in the footer config or component.

---

## Page Layout Assembly

The new `page.tsx` should render sections in this exact order:

```tsx
<main className="main-page-wrapper">
  {/* 1. Hero */}
  <SectionErrorBoundary sectionId="hero" sectionType="HeroSection">
    <HeroSection variant="fullBackground" config={B2C_HERO_CONFIG} priority={true} />
  </SectionErrorBoundary>

  {/* 2. Origin Story */}
  <SectionErrorBoundary sectionId="origin-story" sectionType="FeatureShowcase">
    <div id="our-story">
      {/* FeatureShowcase prose variant OR ProseSection */}
    </div>
  </SectionErrorBoundary>

  {/* 3. How It Works */}
  <SectionErrorBoundary sectionId="how-it-works" sectionType="ProductCarousel">
    <div id="how-it-works">
      <ProductCarouselFactory config={B2C_HOW_IT_WORKS_CONFIG} />
    </div>
  </SectionErrorBoundary>

  {/* 4. Real-Life Scenarios — NEW */}
  <SectionErrorBoundary sectionId="scenarios" sectionType="ScenarioCards">
    <div id="scenarios">
      <ScenarioCards config={B2C_SCENARIOS_CONFIG} />
    </div>
  </SectionErrorBoundary>

  {/* 5. Feature Carousel — REPLACED */}
  <SectionErrorBoundary sectionId="features" sectionType="FeatureShowcase">
    <div id="features">
      {/* FeatureShowcase multi-slide OR adapted component */}
    </div>
  </SectionErrorBoundary>

  {/* 6. Fees — NEW */}
  <SectionErrorBoundary sectionId="fees" sectionType="FeeTable">
    <div id="fees">
      <FeeTable config={B2C_FEES_CONFIG} />
    </div>
  </SectionErrorBoundary>

  {/* 7. What's the Catch? — NEW */}
  <SectionErrorBoundary sectionId="catch" sectionType="ProseSection">
    <ProseSection config={B2C_CATCH_CONFIG} />
  </SectionErrorBoundary>

  {/* 8. Interactive Demo — WIRED */}
  <SectionErrorBoundary sectionId="demo" sectionType="DemoEmbed">
    <div id="demo">
      <DemoEmbed config={B2C_DEMO_CONFIG} />
    </div>
  </SectionErrorBoundary>

  {/* 9. Waitlist — UPDATED */}
  <SectionErrorBoundary sectionId="waitlist" sectionType="WaitlistSection">
    <div id="waitlist">
      <WaitlistSection config={B2C_WAITLIST_CONFIG} />
    </div>
  </SectionErrorBoundary>

  {/* 10. FAQ */}
  <SectionErrorBoundary sectionId="faq" sectionType="FAQAccordion">
    <FAQAccordion config={B2C_FAQ_CONFIG} />
  </SectionErrorBoundary>
</main>
```

**Removed from layout:**
- `SocialProofSection` — data absorbed into WaitlistSection
- `FutureYouPreviewSection` — absorbed into Demo dual CTA
- `BenefitsCardsSection` (for features) — replaced

---

## CLO Compliance Checklist

These items are CLO-mandated and must be present at launch. Verify each during implementation:

| Item | Location | Status |
|------|----------|--------|
| AI disclosure (California SB 942) | Footer disclaimers | Must render on all locales |
| MiCA Article 68 verbatim language | Footer disclaimers | Must render on DE + ES only |
| CVM 3-warning requirements | Footer disclaimers | Must render on PT-BR only |
| "Not investment advice" general disclaimer | Footer disclaimers | All locales |
| Crypto volatility + no deposit guarantee | Footer + FAQ "Is my money safe?" | All locales |
| User stories = illustrative examples | Footer disclaimers | All locales |
| Fee table: 0.12% sell/close + 0.75% withdraw | Fees section | Authoritative — match exactly |
| "No hidden spreads" claim | Fees disclaimer | ⚠️ CTO must verify architecturally true before deploying |
| Non-custodial definition | FAQ "Is diBoaS a bank?" | Must include "we don't hold, access, or manage your money" |
| Copyright year | Footer | Must be 2026, not 2025 |

---

## Implementation Order

Execute in this sequence to minimize merge conflicts and allow incremental testing:

**Phase 1 — Fix bugs in existing components (no layout changes)**
1. Fix FAQ `<strong>` HTML rendering bug
2. Fix MinimalFooter social icon rendering
3. Update copyright to 2026
4. Ensure HeroSection renders the `description` field

**Phase 2 — Design token updates**
5. Resolve font family (Inter everywhere, remove Geist loader)
6. Add unified text color tokens
7. Add section background tokens
8. Adjust mobile typography scale

**Phase 3 — Update existing components for new copy**
9. Update all 4 `landing-b2c.json` locale files with new key structure
10. Update `landing-b2c.ts` config for Hero, How It Works, FAQ
11. Add `quote` field to ProductCarousel slide interface
12. Add prose variant to FeatureShowcase (or build ProseSection)
13. Merge counter into WaitlistSection
14. Update MinimalFooter with tagline, nav links, locale disclaimers

**Phase 4 — Build new components**
15. Create `ScenarioCards` (Section 4)
16. Create `FeeTable` (Section 6)
17. Create `ProseSection` (Section 7) — if not done in Phase 3

**Phase 5 — Assemble new page layout**
18. Wire DemoEmbed into page
19. Rewrite `page.tsx` with 11-section layout
20. Remove unused imports (SocialProofSection, FutureYouPreviewSection, BenefitsCardsSection)
21. Update `generateMetadata` with new SEO copy

**Phase 6 — Polish**
22. Test all 4 locales render correctly
23. Verify all CLO compliance items from checklist
24. Test mobile viewport (375px) — verify no text overflow, touch targets ≥ 48px
25. Run Lighthouse audit — target Performance > 90, Accessibility > 95
26. Verify images load with fallbacks (missing images must not break layout)

---

## Constraints & Guardrails

- **Do not delete** `SocialProofSection`, `FutureYouPreviewSection`, or `BenefitsCardsSection` components. They may be used on other pages. Only remove them from the B2C landing page import and render.
- **Do not hardcode text.** Every user-visible string must be an i18n key.
- **Do not hardcode colors or sizes.** Use design tokens from `design-tokens.css` or Tailwind config.
- **All new components** must follow the file structure pattern in `docs/component-architecture-pattern.md` — separate `.tsx`, `.module.css`, `index.ts`, and config file.
- **All components** must be wrapped in `SectionErrorBoundary` in the page layout.
- **All new CSS** must use CSS Modules (`.module.css`), not inline styles or global CSS.
- **Test ID convention:** `data-section-id="{section-name}-section-b2c"` on each section wrapper.
- **Analytics:** Every section config must include an `analytics` block with `sectionId` and `category: 'landing-b2c'`.
- **Accessibility:** All images need `alt` text. All sections need `aria-label`. Interactive elements need `role` attributes. Focus states must be visible.
- **Images that don't exist yet:** Components must render gracefully without images. Use conditional rendering — if no image file exists at the path, skip the image element entirely. Never render a broken image.
