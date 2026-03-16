# Design Principles — diBoaS

## Product feeling

- **Primary emotional outcome:** Trust and empowerment — "I can do this, and my money is safe"
- **Secondary emotional outcome:** Warmth and honesty — "someone real built this and cares about me"
- **What it must NOT feel like:** Another crypto app. Corporate fintech. Tech-bro startup. Generic SaaS.
- **The "one thing" someone should remember:** "It felt like someone built this with care, not like AI generated it."

## Audience and context

- **Primary user:** Mainstream consumer excluded by traditional banking — not crypto-native, not financially sophisticated
- **Their context of use:** Mobile and desktop, managing money in spare moments. Not power users at terminals.
- **Their pressure or pain:** Money losing value, confused by financial jargon, skeptical of fintech promises
- **Their technical comfort level:** Comfortable with banking apps and messaging. NOT comfortable with wallets, gas fees, or DeFi terminology.
- **What they are comparing us to:** Revolut, Nubank, their bank's app

## Visual direction

- **Chosen aesthetic direction:** Warm minimal — clean but not cold, with human touches that signal care
- **What to borrow from references:** Nubank's approachability, Linear's craft precision, Stripe's credible data presentation
- **What to avoid copying:** Purple color identity (Nubank), developer aesthetics (Linear), enterprise tone (Stripe)
- **Distinctive visual hook:** The Adelaide story as emotional anchor. Mascot system (Acqua/Mystic/Coral) for personality. First-person voice from the founder.
- **2026 trend positioning:** Lean strongly toward "human touch" / wabi-sabi over tech-bro gradients. Grounded, warm colors over neon or saturated palettes. Texture and warmth over flat surfaces. Avoid the purple/blue/teal SaaS uniform entirely.

## Typography rules

- **Display font:** Geist (via `--font-geist`), falling back to Inter
- **Body font:** Inter (`--font-family-primary`)
- **Numeric/data font:** JetBrains Mono (monospace) for prices, stats, percentages, fee amounts
- **Type scale (desktop):** Title 48px, Section title 38px, Subtitle 22px, Body 16px, UI link 14px, UI button 16px
- **Type scale (mobile):** Title 38px (hero 30px), Section title 28px, Subtitle 18px, Body 16px
- **Heading weight:** Semibold (600) for titles, Bold (700) for emphasis
- **Body weight:** Normal (400), Medium (500) for labels
- **Letter-spacing rules:**
  - Large headings: tight (`-0.01em` / `--letter-spacing-tight`)
  - Body text: normal (`0`)
  - Small labels / all-caps: wide (`0.05em` / `--letter-spacing-wide`) to wider (`0.1em`)
- **Line-height rules:**
  - Titles: 1.2 (`--line-height-title`)
  - Subtitles: 1.3 (`--line-height-subtitle`)
  - Descriptions: 1.5 (`--line-height-description`)
  - Body text: 1.6 (`--line-height-text`)
  - Prose: 1.7 (`--prose-line-height`)
- **Font feature settings:** `font-variant-numeric: tabular-nums` for data columns and fee tables
- **Explicit font bans:** Never introduce new font families. The system uses Inter + Geist + JetBrains Mono. No Roboto, Arial, system-ui as display fonts.

## Color rules

- **Brand logo:** `#02c3cf` (`--brand-logo`)
- **Primary:** `#14b8a6` (`--brand-primary`) — teal/turquoise
- **Primary dark:** `#0d9488` (`--brand-primary-dark`)
- **CTA primary:** `#0f766e` (`--cta-bg-primary`) — darker teal for accessible text on white (5.47:1 contrast)
- **Secondary (Mystic/investing):** `#a855f7` — purple, used for investing/strategy contexts only
- **Accent (Coral/DeFi):** `#ef4444` — coral, used for DeFi/innovation contexts only
- **Neutral system:** Slate-derived grays:
  - Headings: `#0f172a` (slate-900, `--color-text-heading`)
  - Body: `#334155` (slate-700, `--color-text-body`)
  - Secondary/muted: `#64748b` (slate-500, `--color-text-secondary`)
  - On dark backgrounds: `#ffffff` / `rgba(255,255,255,0.85)` muted
- **Semantic colors:**
  - Success: `#10b981` (emerald-500), accessible text: `#059669`
  - Warning: `#f59e0b` (amber-500)
  - Error: `#ef4444` (red-500), accessible text: `#dc2626`
  - Info: `#3b82f6` (blue-500)
- **Chart/data visualization colors:** Defined per domain theme (banking/turquoise, crypto/coral, investing/purple)
- **Dark mode notes:** Not yet implemented for production. Demo/Dream Mode uses dark theme with glass effects (`--glass-*` tokens). Full dark mode is post-launch.
- **Opacity rules for hierarchy:** Headings 100%, body 85% (`--text-white-primary` on dark), secondary 70% (`--text-white-secondary`), muted 50% (`--text-white-muted`)
- **Explicit bans:**
  - Never use pure `#000000` — use slate-900 (`#0f172a`) or darker slate variants
  - Never use pure `#ffffff` for backgrounds on the marketing site — use neutral-50 or subtle off-whites
  - Never use purple/blue/teal gradient orbs or spheres (the "tech bro gradient")
  - Never use the secondary purple or coral colors outside their designated domain contexts (investing/DeFi)

## Layout rules

- **Density:** Spacious for marketing pages. Information-dense for app screens (post-launch).
- **Preferred whitespace level:** Generous — let content breathe. Whitespace is a trust signal.
- **Section padding:**
  - Desktop: 64px vertical, 120px horizontal (`--padding-section-desktop-*`)
  - Tablet: 48px vertical, 64px horizontal (`--padding-section-tablet-*`)
  - Mobile: 48px vertical, 24px horizontal (`--padding-section-mobile-*`)
  - Hero & Navigation: zero padding (full-bleed)
- **Card usage rules:** Cards group meaningfully related content. No card soup — never more than 3-4 cards of equal visual weight in a row. Use elevation (shadow) to create hierarchy between card levels.
  - Card padding: 16px mobile, 20px tablet, 24px desktop
- **Sidebar / nav rules:** Desktop nav height 80px, mobile nav 60px. Persistent left sidebar for app screens (post-launch).
- **Table rules:** Left-align text, right-align numbers. Clear headers. Adequate row height. Sorting indicators on clickable columns.
- **Chart usage rules:** Charts must communicate real data or clearly labeled illustrative data. No decorative charts. Use domain theme colors (turquoise for banking, purple for investing, coral for DeFi).
- **Repetition to avoid:** Never show the same KPI or data point in multiple places on one page.
- **Responsive priorities:**
  - Mobile: 375px (sm: 640px)
  - Tablet: 768px (md: 768px)
  - Desktop: 1024px+ (lg: 1024px, xl: 1280px, 2xl: 1536px)
  - What changes: layout collapses to single column on mobile, sidebar becomes hamburger menu, cards stack vertically, horizontal scrolling for data tables
- **Platform conventions:** Web-first. Follow web accessibility standards. Touch-friendly tap targets (44px minimum) on all viewports.

## Interaction rules

- **Motion philosophy:** Purposeful only — every animation communicates feedback, continuity, hierarchy, or delight in key moments. No decoration-only motion.
- **Required motion:**
  - Page transitions: subtle fade/slide, 300ms (`--animation-duration-normal`)
  - Loading states: contextual message + animated indicator (not just a spinner)
  - Button press feedback: scale or color shift, 150ms (`--animation-duration-fast`)
  - Hover states: every interactive element must respond visually
  - Focus rings: `2px solid #14b8a6` with 2px offset (`--focus-ring-*` tokens)
- **Recommended motion:**
  - Staggered reveals on page load (elements appear sequentially)
  - Number/value transitions (counters animate between values)
  - Modal appearance: scale + fade, 300ms
  - Scroll-triggered reveals for long marketing content
- **Motion duration guidelines:**
  - Fast: 150ms (`--animation-duration-fast`) — hover, focus, button press
  - Normal: 300ms (`--animation-duration-normal`) — standard transitions, modals
  - Slow: 600ms (`--animation-duration-slow`) — complex animations, page transitions
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for ease-out (default), `cubic-bezier(0.4, 0, 0.2, 1)` for ease-in-out, `cubic-bezier(0.68, -0.55, 0.265, 1.55)` for bounce
- **Motion bans:**
  - Never use linear easing (feels robotic)
  - Never exceed 600ms for a single transition
  - Never animate purely for decoration
  - Never add sound without user opt-in
  - Always respect `prefers-reduced-motion`
- **Empty state expectations:** Mascot illustration (Acqua for beginners) + helpful message + suggested action. Never just "No data."
- **Success / error expectations:** Inline feedback for form actions. Toast notifications for background operations. Error messages that help rather than blame.
- **Fine-tuning approach:** Use Leva/Tweakpane control panels for interactive parameter tuning during development. Remove before shipping.

## Content rules

- **Tone of UI copy:** First person where Bar speaks ("I built this," "I read every email"). Warm, direct, honest. Short sentences. Conversational, never corporate. No financial jargon on consumer pages — the Adelaide Filter: "would grandmother understand this?"
- **Voice examples:**
  - Button: "Get my spot" (not "Join Waitlist")
  - Error: "We couldn't find that — try again?" (not "404 Error")
  - Empty state: "Nothing here yet. Your first investment starts with $5." (not "No data available")
- **Sample data realism rules:** All example content must feel believable for the financial domain. Fee examples use confirmed Fee Lab v3.4 figures. Yield examples use historical ranges (4-8% Safe Harbor) marked as illustrative.
- **What must never be fabricated:** Return guarantees, regulatory status claims, product capabilities not in the confirmed list, user testimonials, download counts, "send money to anyone" (P2P is diBoaS users only), legacy fee figures.
- **Labels / terminology conventions:** "Strategies" not "funds." "Digital dollars" not "stablecoins" (consumer pages). "Your wallet" not "non-custodial wallet." "Add Money" not "on-ramp." "Cash Out" not "off-ramp."
- **Edge-case content to account for:**
  - Long names / titles: German compound words, Portuguese full names
  - Empty data: first-time user with no transactions, no strategies active
  - Single-item lists: one strategy, one transaction
  - Extreme numerical values: R$0.01, $999,999.99, 0.001% yield
  - Multi-locale text expansion: DE ~30% longer than EN, verify no truncation

## Accessibility rules

- **Contrast expectations:** WCAG AA — 4.5:1 for normal text, 3:1 for large text (18px+ or 14px bold) and UI components. Use `--text-primary-accessible` (#0f766e, 5.47:1) for teal text on white.
- **Tap target / spacing expectations:** 44x44px minimum on all touch devices
- **Focus visibility expectations:** Visible focus ring on every interactive element using `--focus-ring-color` (#14b8a6), `--focus-ring-width` (2px), `--focus-ring-offset` (2px). Never remove focus indicators.
- **Keyboard navigation notes:** All modals use `useFocusTrap`. Escape key closes dropdowns/modals and returns focus. Tab order follows visual order.
- **Screen reader considerations:** Semantic HTML, proper heading hierarchy (h1 → h2 → h3, no skipping), form labels with `<fieldset>` + `<legend>`, image alt text.
- **Inclusive imagery / language notes:** Avoid stereotyped representations. Financial imagery should include diverse people and contexts. Never assume gender, nationality, or wealth level.
- **Regulatory accessibility requirements:** All disclaimer text must be readable (not hidden in tiny print). Regulatory text font size minimum 12px.

## Human touch rules

Include at least 2-3 per major page:

- **Texture:** Subtle off-white backgrounds instead of pure white on marketing pages. Soft, natural shadows.
- **Imperfection:** Hand-drawn accent under key phrases (Adelaide story). Mascot illustrations add warmth.
- **Warmth:** Warm-tinted neutrals (slate-derived, not pure gray). Rounded corners but not over-rounded.
- **Typography craft:** Tight letter-spacing on hero headings. Tabular nums for fee tables and data. Prose line-height (1.7) for long-form content.
- **Detail:** Custom focus rings in brand teal. Custom selection highlight color. Contextual loading messages. Helpful empty states with mascot.
- **Project-specific:** Adelaide story section should have distinctive warmth (texture, typography treatment, pacing). Fee table is the strongest conversion element — keep it prominent and honest.

## Build rules

- **Existing components to prefer:** Use Factory pattern components in `apps/web/src/components/`. Check existing variants before creating new ones.
- **When new components are allowed:** Only when no existing component or variant fits. New components must follow the Factory pattern with variant directories.
- **Refactor expectations for ad-hoc UI:** Any ad-hoc styling found during review must be refactored into the design system (token + component).
- **Token / system source reference:** `apps/web/src/styles/design-tokens.css` is the canonical CSS source. `config/design-tokens.json` + schema for validation.
- **Component documentation location:** Storybook 9 is configured but no stories exist yet. Stories should be created for all new components following the `ComponentName.stories.tsx` convention.
