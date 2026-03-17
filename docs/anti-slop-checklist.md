# Anti-Slop Checklist — diBoaS

This is the canonical anti-pattern and review list for the diBoaS project.
If `CLAUDE.md` and this file differ on anti-patterns, this file wins.

Reject or refine UI if you see any of these patterns.

---

## Visual slop

- [ ] Default purple/blue startup gradients or shiny AI orbs
- [ ] Gradient profile circles with initials used as decoration
- [ ] Pure black (#000) or pure white (#FFF) instead of slate-derived neutrals
- [ ] Repeated KPI strips showing the same data in multiple places
- [ ] Card soup — too many cards with equal visual weight and no hierarchy
- [ ] Mixed icon families or inconsistent icon weights (project uses custom SVG icons ONLY)
- [ ] External icon libraries imported (Lucide, Hero Icons, FontAwesome) — use `@/components/UI/Icon`
- [ ] Emoji used as core UI icons or visual language
- [ ] Empty charts or decorative analytics that communicate nothing real
- [ ] Too much border-radius on everything with no variation
- [ ] Hierarchy created only by colored boxes instead of typography + spacing
- [ ] One generic layout template repeated across screens
- [ ] Floating action buttons or modals where inline action would be clearer
- [ ] Purple or coral colors used outside their designated domain contexts (investing/DeFi)
- [ ] Landing page icon grids where product screenshots or fee tables would be more convincing
- [ ] "Welcome to diBoaS" or similar generic heading
- [ ] Over-saturated, evenly-distributed color palette with no dominant/accent hierarchy
- [ ] Tech-bro gradients (purple-blue-teal sphere fading to edges) on any surface

## Typography slop

- [ ] Font families other than Inter, Geist, or JetBrains Mono introduced
- [ ] Same font size used for headings and body text
- [ ] No letter-spacing adjustments (large text too loose, small text too tight)
- [ ] No line-height variation between headings and body
- [ ] Proportional fonts used for numerical data columns (use tabular-nums or JetBrains Mono)
- [ ] Hardcoded font sizes instead of design token references

## Interaction slop

- [ ] Motion with no communicative purpose — decoration-only animation
- [ ] Missing hover states on interactive elements
- [ ] Missing focus states (or browser default focus ring without brand styling)
- [ ] Missing active/pressed states on buttons
- [ ] Missing disabled states
- [ ] Instant page transitions where subtle slide or fade would feel better
- [ ] Generic spinner where contextual loading message would help
- [ ] Blank screen during data loading instead of skeleton screen or message
- [ ] No feedback for success or error actions
- [ ] No mobile or tablet responsive consideration
- [ ] Sound effects without user opt-in
- [ ] Linear easing on animations (feels robotic)
- [ ] Animations longer than 600ms (feels sluggish)
- [ ] Animations that ignore `prefers-reduced-motion`

## Content slop

- [ ] Lorem ipsum, "Acme Inc", or obvious placeholder copy
- [ ] Fake metrics, fake workflows, or hallucinated features
- [ ] Labels or terminology not matching the product domain (see brand-brief.md)
- [ ] Repeated information with no added value across the page
- [ ] Sparse modals or forms that waste available space
- [ ] Long content or edge cases that obviously break the layout
- [ ] Content presented as fact when it should be labeled "illustrative"
- [ ] "Send money to anyone" — P2P is between diBoaS users only
- [ ] DeFi, blockchain, stablecoin, or Solana mentioned on consumer-facing pages
- [ ] Non-custodial, private keys, seed phrase, or gas fees in consumer-facing copy

## diBoaS-specific content rules

- [ ] Legacy fee figures used anywhere (0.75%, 0.12%, 0.09%, subscription tiers, 0.39% buy/invest from v3.3)
- [ ] Fee figures that don't match Fee Lab v3.4 in `docs/fees.md`
- [ ] Return guarantees or specific future yield percentages stated as fact
- [ ] Regulatory registration claimed (diBoaS is NOT registered with SEC/CFTC/FinCEN)
- [ ] Deposit insurance or fund protection guarantees implied
- [ ] Missing MiCA verbatim disclaimer on EU-facing pages (DE, ES)
- [ ] Missing CVM 3-warning on Brazil-facing pages (PT-BR)
- [ ] Missing FTC-compliant risk disclosure on US-facing pages (EN)
- [ ] Missing AI disclosure on disclaimers (CLO-required)
- [ ] "Expanding worldwide" claim used (flagged for CLO review)
- [ ] Smart contract audit status claimed (not yet decided)
- [ ] Financial advice language used (diBoaS is a software provider, not an advisor)

## Layout and spacing slop

- [ ] Buttons in the same group with dramatically different sizes (e.g., tiny "Back" next to full-width "Next")
- [ ] Section content too tightly spaced with insufficient breathing room between elements
- [ ] Section content too sparse with wasted vertical space
- [ ] Inconsistent vertical rhythm between adjacent sections
- [ ] Hardcoded English text not using i18n (appears as English on non-EN locale pages)
- [ ] Components rendering translation keys as raw strings instead of translated text

## Quality and trust issues

- [ ] Text contrast below 4.5:1 ratio (use `--text-primary-accessible` for teal on white)
- [ ] Large text or UI component contrast below 3:1 ratio
- [ ] Tap targets smaller than 44x44px on touch devices
- [ ] Ambiguous CTA hierarchy (unclear what the primary action is)
- [ ] Ad-hoc styling instead of design token / component reuse
- [ ] Hardcoded hex colors, font sizes, or spacing instead of token references
- [ ] Design choices that feel directly copied rather than referenced
- [ ] UI that implies product capabilities not actually confirmed in brand-brief.md
- [ ] Missing semantic heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Interactive elements not keyboard-reachable
- [ ] Missing `<fieldset>` + `<legend>` on form groups
- [ ] Modals without focus trap

## Multi-locale issues

- [ ] UI breaks with German text expansion (~30% longer than English)
- [ ] Text truncation in any locale
- [ ] Locale-specific regulatory text missing or inconsistently styled
- [ ] Content not localized (just translated — missing cultural adaptation)
- [ ] PT-BR copy competes with PIX on domestic payments (should emphasize international)
- [ ] DE copy uses inconsistent Sie/du
- [ ] New user-facing strings not added to all 4 locales

---

## State audit for this project

- **Empty state notes:** Use Acqua mascot + helpful message + suggested action. Never "No data."
- **Loading state notes:** Contextual message + animated indicator. Use design token durations. Never generic spinner alone.
- **Error state notes:** Helpful message that suggests what to do next. Never just "Error" or HTTP status codes.
- **Success state notes:** Inline confirmation for form actions. Toast for background operations.
- **Disabled state notes:** Visually distinct (reduced opacity, no pointer events). Tooltip explaining why disabled when possible.
- **Content edge case notes:** German compound words, Portuguese full names, R$0.01 minimum, $999,999.99 max display, zero transactions, one strategy, many strategies.

## Collapse-and-elevate notes for this project

- **What should be collapsed:** Navigation links on mobile, advanced strategy options, secondary CTAs, settings/billing details
- **What should be elevated:** Fee comparison table (strongest conversion element), "$5 minimum" and "if diBoaS disappeared tomorrow" statements (currently buried in FAQ — should be in hero), product screenshots/demo when available
- **What should be removed:** "0 founding members / 0 countries" counter (vulnerability at launch — needs rethinking), any decorative-only elements that add visual noise without communicating value

## Human touch audit for this project

- [ ] Textured or off-white backgrounds on Adelaide story section
- [ ] Soft, natural shadows on cards (not flat or harsh)
- [ ] Custom focus rings in brand teal (#14b8a6)
- [ ] Custom selection highlight color
- [ ] Contextual loading messages (not just spinners)
- [ ] Thoughtful empty states with Acqua mascot
- [ ] Helpful error messages (not just error codes)
- [ ] Staggered reveal on marketing page sections
- [ ] Subtle page transition animation (fade/slide, 300ms)
- [ ] Button press feedback animation (150ms)
- [ ] Typography fine-tuning (letter-spacing on hero, tabular-nums on fees, prose line-height)
- [ ] First-person voice from Bar where appropriate ("I built this," "I read every email")
- [ ] Adelaide story has distinctive warmth compared to other sections

## Project-specific notes

- Fee table is the strongest conversion element — protect its clarity and honesty at all costs
- The Adelaide story is the emotional foundation — any section near it should feel warmer and more personal than standard marketing sections
- Anti-bank positioning is absolute — never mention banks positively or advise users to "keep their bank"
- "You stay in control of your money at all times" is the marketing voice — not "we never touch your money"
- User referral sentence: "It's how I send money for free."
