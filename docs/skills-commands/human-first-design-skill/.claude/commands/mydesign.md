# /mydesign — Human-First Design Workflow

A single entry point for all design work. Uses `ask_user_input` to determine what the user
needs, gathers context interactively, then executes the right workflow.

All design rules, anti-slop defaults, and process steps are defined in `CLAUDE.md`.
This command orchestrates when and how to apply them.

---

## Step 0 — Read project context

Before anything else, read these files if they exist. Note which are present and complete
vs. missing or empty:
- `docs/brand-brief.md`
- `docs/design-principles.md`
- `docs/design-system-notes.md`
- `docs/anti-slop-checklist.md`

Also scan the codebase for existing design tokens, component libraries, and global styles.

---

## Step 1 — Determine what the user needs

If the user's message already makes it clear (e.g., "build me a pricing page" or "review
the homepage"), skip this question and proceed to the appropriate mode.

Otherwise, use ask_user_input:

**"What do you need?"**
- type: single_select
- Options:
  - "Build — create new UI (page, component, section)"
  - "Review — check a specific page or recent changes for quality"
  - "Audit — deep review of design system, tokens, Storybook, or full codebase"
  - "Explore — see a few design directions before committing"
  - "Tweak — fine-tune animations, spacing, or visual details"

Then branch to the appropriate workflow below.

---

## MODE: BUILD

### Gather context

If project docs are complete, summarize the design direction and proceed.

If critical context is missing, use ask_user_input to gather it. Combine up to 3 questions
per interaction to avoid over-asking.

**First interaction — the essentials:**

Question 1 — "How should this feel to the user?"
- type: multi_select
- Options:
  - "Warm and approachable"
  - "Clean and minimal"
  - "Bold and energetic"
  - "Premium and refined"
  - "Playful and friendly"
  - "Calm and trustworthy"

Question 2 — "What should this NOT feel like?"
- type: multi_select
- Options:
  - "Generic SaaS / cookie-cutter"
  - "Corporate / cold"
  - "Crypto-bro / techy"
  - "Cheap / untrustworthy"
  - "Cluttered / overwhelming"
  - "Boring / lifeless"

Question 3 — "What is the priority?"
- type: single_select
- Options:
  - "Polish and craft — take the time"
  - "Speed — get something solid up fast"
  - "Exploration — show me directions first"

If the user selects "Speed", switch to lightweight mode (brief → one direction → smallest
slice → one review). If "Exploration", switch to EXPLORE mode below.

**Second interaction — if helpful for the task:**

Question 4 — "Do you have references or techniques to draw from?"
References can be screenshots, URLs, tweet threads, CodePens, or articles.
- type: single_select
- Options:
  - "Yes, let me share them"
  - "No, use good judgment"
  - "I'll describe what I like"

If the user shares a URL, navigate to it (via Playwright or web_fetch) to analyze the
technique and extract what to apply.

Question 5 — "What about the content?"
- type: single_select
- Options:
  - "I'll provide real content"
  - "Use realistic sample content — label it as illustrative"
  - "Placeholder is fine for now"

### Summarize direction

After gathering context, write a 3-5 sentence summary of:
- Who this is for and what emotional outcome we want
- The aesthetic direction (with references if provided)
- Key constraints (framework, existing components, accessibility)
- Any assumptions

### Build

Follow the full process from `CLAUDE.md`:
1. Define or reuse tokens and components (Step 4)
2. Build from smallest slice upward (Step 5)
3. Build through the system — no ad-hoc styling (Step 6)
4. Account for all states: empty, loading, error, success, edge cases (Step 7)
5. Add purposeful motion (Step 8)
6. Use realistic content (Step 9)
7. Check accessibility (Step 10)
8. Add human touch details (Step 11)

**For complex effects:** Build in isolation first (a standalone playground), dial it in,
then integrate into the full page.

**For fine-tuning:** If the user wants to tweak animation timing, spacing, or visual
parameters interactively, add a Leva control panel with the relevant knobs. Remove
before shipping.

### Validate

If Playwright MCP is available:
- Screenshot at desktop and mobile viewports
- Check console for errors
- Compare against the direction summary
- Fix issues before declaring done

If Playwright is NOT available:
- State: "I could not visually verify this — browser tooling is not available."
- Ask the user for a screenshot or manual confirmation.

### Review before delivering

Run the anti-slop checklist from `docs/anti-slop-checklist.md`.
Run the collapse-and-elevate audit from Step 14 in `CLAUDE.md`.
Run the self-review questions from Step 13 in `CLAUDE.md`.

If any check fails, fix before delivering.

### Deliver

Present with:
- Brief summary of what was built
- Design direction used
- Assumptions made (if any)
- States implemented vs. deferred
- Known issues or refinement areas
- Whether visual validation was performed

---

## MODE: REVIEW

### Identify scope

First, understand what changed. Run these automatically:

```
git status
git diff --name-only origin/HEAD...
git log --no-decorate -5 --oneline
```

This tells you which files were modified and what the recent changes are. Focus the review
on the changed files and affected pages — not the entire frontend unless asked.

If the user specified a page or component, review that.
If the git diff is empty or the user is not working from a branch, use ask_user_input:

**"What should I review?"**
- type: single_select
- Options adapted to the project, such as:
  - "The page I just built"
  - "The last set of UI changes"
  - "A specific page (I'll name it)"
  - "The whole frontend"

### Phase 1: Visual validation

If Playwright MCP is available:
- Navigate to affected page(s)
- Screenshot at desktop (1440px) and mobile (375px) viewports
- Read browser console for errors and warnings
- Note any visual issues visible in screenshots

If Playwright is NOT available:
- State: "Browser tooling not available — this is a code-only review."
- Ask for screenshots if visual validation matters.

### Phase 2: Interaction and robustness testing

If Playwright MCP is available, actively test — don't just check that states are defined:
- Click through the primary user flow on affected pages
- Test all interactive states (hover, focus, active, disabled)
- Enter invalid data in any forms — verify error handling
- Test content overflow (long text, extreme values)
- Verify loading states render correctly (not just that they exist)
- Check empty states and edge cases (zero items, one item, many items)
- Verify destructive actions have confirmations

### Phase 3: Design quality checks

1. **Anti-slop checklist** — every item in `docs/anti-slop-checklist.md`
2. **Collapse-and-elevate audit** — busy → collapse, sparse → enrich, redundant → consolidate
3. **Accessibility** — contrast (4.5:1), focus rings, keyboard nav, tap targets, heading hierarchy
4. **Human touch** — are craft details present or is the UI sterile?

### Phase 4: Code health

Check the code diff for:
- Hardcoded values that should be tokens (colors, spacing, font sizes)
- Ad-hoc components that should use the design system
- Mixed icon libraries or inconsistent icon weights
- Duplicated styling patterns

### Communication principle: problems over prescriptions

Describe what is wrong and its impact — not the specific code fix.

Good: "The spacing between these cards feels inconsistent with the rest of the page, creating
visual clutter that makes it harder to scan."

Bad: "Change margin-bottom from 12px to 16px on the card component."

The implementer knows how to fix code. The reviewer's job is to identify what doesn't feel
right and why it matters to the user.

### Deliver the review

For every visual issue, include a Playwright screenshot as evidence if available.

**Summary:** 1-2 sentence overall assessment.

**Issues found** (with screenshot evidence where applicable):
- P0 — Blocking (broken functionality, accessibility failures, fake product claims)
- P1 — Should fix (anti-slop patterns, missing states, inconsistency, interaction bugs)
- P2 — Polish (craft improvements, motion, human touch, specific techniques to try)

**What works well:** 2-3 strengths.

**Recommended next steps:** Prioritized fix list.

If the user wants fixes applied, proceed starting from P0 → P1 → P2.

---

## MODE: AUDIT

For deep review of an existing design system, token architecture, component library,
Storybook, icon set, or full codebase design health. This goes beyond page-level review
(that's REVIEW mode) into the infrastructure and system that pages are built from.

### Determine audit scope

If not specified, use ask_user_input:

**"What do you want me to audit?"**
- type: multi_select
- Options adapted to what exists in the project:
  - "Design tokens (colors, typography, spacing, shadows)"
  - "Component library / Storybook"
  - "Icon consistency across the project"
  - "Token usage — are components actually using tokens or hardcoding?"
  - "Dark mode coverage"
  - "Responsive behavior across components"
  - "Full design system health check (all of the above)"

### 1. Token audit

Read the token source files (tailwind.config, globals.css, tokens.ts, theme files, etc.).

Check for completeness against these categories:
- [ ] Color palette with tonal scales (5-7 shades per primary color)
- [ ] Semantic colors (success, warning, error, info) defined
- [ ] Chart / data visualization colors defined
- [ ] Typography scale (heading sizes h1-h6, body, small, caption, overline)
- [ ] Font weights (heading, body, bold, light) defined
- [ ] Spacing scale (consistent system — e.g., 4/8/12/16/24/32/48/64)
- [ ] Border radius values (multiple sizes, not just one)
- [ ] Shadow definitions (sm, md, lg, xl)
- [ ] Z-index scale
- [ ] Dark mode variant tokens (if dark mode is supported)
- [ ] Breakpoint definitions
- [ ] Transition / animation duration tokens
- [ ] Focus ring color and style tokens

Report: what's defined, what's missing, what's inconsistent, what's unused.

### 2. Component library / Storybook audit

If Storybook exists, read its configuration and scan the stories.
If a component library exists without Storybook, scan the component directory.

For each component, check:
- [ ] Uses design tokens — no hardcoded colors, spacing, font sizes, or shadows
- [ ] Has all required states: default, hover, focus, active, disabled
- [ ] Has loading state (if applicable)
- [ ] Has empty state (if applicable)
- [ ] Has error state (if applicable)
- [ ] Works in dark mode (if project supports it)
- [ ] Has responsive behavior defined
- [ ] Uses the project icon set consistently (not mixing icon libraries)
- [ ] Has documentation or Storybook story showing variants
- [ ] Accessibility: proper ARIA attributes, keyboard navigable, sufficient contrast
- [ ] Typography follows the type scale (not arbitrary font sizes)
- [ ] Spacing follows the spacing scale (not arbitrary padding/margin values)

Also check across all components:
- [ ] Consistent border radius usage (same components use same radius values)
- [ ] Consistent shadow usage (not mixing shadow styles arbitrarily)
- [ ] Consistent animation patterns (same easing, similar durations)
- [ ] No duplicate components (two different cards, two different buttons, etc.)
- [ ] No orphaned components (defined but never used)

### 3. Icon audit

Scan all icon usage across the codebase:
- [ ] Single icon library used (not mixing Lucide + Hero Icons + FontAwesome)
- [ ] Consistent icon weight / stroke width
- [ ] No emoji used where proper icons should be
- [ ] Icons sized consistently relative to text
- [ ] Icon colors use token values, not hardcoded
- [ ] Lined vs filled usage is intentional (e.g., filled for active tab only)

### 4. Hardcoded value scan

Search the codebase for design values that should be tokens but aren't:
- Hardcoded hex colors (anything like `#3b82f6` or `rgb(...)` that isn't a token reference)
- Hardcoded font sizes (inline `font-size: 14px` instead of a token/class)
- Hardcoded spacing (inline `padding: 12px` instead of a token/class)
- Hardcoded shadows (inline `box-shadow: ...` instead of a token/class)
- Hardcoded border radius (inline `border-radius: 8px` instead of a token/class)
- Hardcoded z-index values
- Hardcoded breakpoint values in media queries

Report: file, line, the hardcoded value, and what token it should reference instead.

### 5. Cross-page consistency check

If Playwright MCP is available, navigate to the main pages of the application and
screenshot each one. Compare across pages:
- [ ] Same components look the same on every page
- [ ] Color usage is consistent (not blue buttons on one page, green on another)
- [ ] Typography hierarchy is consistent across pages
- [ ] Spacing rhythm feels consistent
- [ ] Navigation and layout patterns are consistent
- [ ] Loading states use the same pattern
- [ ] Empty states use the same pattern

If Playwright is NOT available, do a code-level comparison by reading the page files
and checking component imports and styling approaches.

### 6. Multi-locale consistency (if applicable)

If the project supports multiple locales:
- [ ] All token values are locale-independent (no locale-specific colors or fonts)
- [ ] Components handle text expansion gracefully (especially German ~30% longer)
- [ ] No text truncation that breaks in longer locales
- [ ] Locale-specific regulatory text has consistent styling
- [ ] RTL support (if applicable) doesn't break layout

### 7. Anti-slop check on existing system

Run the full anti-slop checklist from `docs/anti-slop-checklist.md` against the design
system as a whole, not just individual pages:
- Does the overall system feel generic or distinctive?
- Are there AI-generated tells in the component library itself?
- Is the token system opinionated (brand-specific) or default (generic shadcn/Tailwind)?

### Deliver the audit

Format as:

**Design System Health: [grade A-D]**

**Token System:**
- Completeness: [percentage of categories covered]
- Issues: [missing categories, inconsistencies]

**Component Library:**
- Total components: [count]
- Fully compliant: [count] (all states, tokens, accessibility)
- Needs work: [count] (list the specific issues per component)
- Missing: [components the project needs but doesn't have]

**Consistency:**
- Hardcoded values found: [count, grouped by type]
- Icon issues: [list]
- Cross-page issues: [list]

**Anti-Slop Assessment:**
- [Does the system feel human-made or generic?]
- [Specific AI-tell patterns found in the system itself]

**Priority Actions:**
- P0 — Blocking: [accessibility failures, broken components]
- P1 — Should fix: [hardcoded values, missing states, inconsistent patterns]
- P2 — Elevate: [craft improvements, token gaps, human touch opportunities]

**Recommended next steps:** Prioritized fix list with estimated effort.

If the user wants fixes applied, use ask_user_input:

**"How should I proceed?"**
- type: single_select
- Options:
  - "Fix everything — start from P0 and work through"
  - "Fix tokens first — make the foundation solid"
  - "Fix components first — make the library consistent"
  - "Just give me the report — I'll decide what to fix"

---

## MODE: EXPLORE

### Gather minimal context

Use ask_user_input to get the essentials if not already provided (feeling, anti-goals,
references). Keep it to one interaction.

### Generate 2-3 directions

For each direction, describe:
- Aesthetic name (2-3 words)
- Intended feeling
- Typography and color direction
- What AI-slop patterns it specifically avoids
- A distinctive hook

### Let the user choose

Present directions via ask_user_input:

**"Which direction resonates?"**
- type: single_select
- Options: the 2-3 direction names with one-line descriptions

### Build the chosen direction

Switch to BUILD mode using the selected direction as the foundation.

---

## MODE: TWEAK

For fine-tuning existing UI — animations, spacing, visual details.

### Identify what to tweak

If not specified, use ask_user_input:

**"What do you want to fine-tune?"**
- type: multi_select
- Options adapted to what exists, such as:
  - "Animation timing and easing"
  - "Spacing and padding"
  - "Colors and contrast"
  - "Typography details"
  - "Hover and interaction states"
  - "Loading and transition effects"

### Set up controls

Add a Leva control panel (or Tweakpane) exposing the relevant parameters so the user can
adjust values interactively in the browser.

If the user shares a reference URL or technique they want applied, navigate to it, analyze
the approach, and implement it.

### Apply and validate

Once the user is happy with the values:
- Lock them into the design tokens or component styles
- Remove the control panel
- Run a quick anti-slop and accessibility check
- Validate visually if Playwright is available
