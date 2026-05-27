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

Use Docker MCP Playwright tools (`mcp__MCP_DOCKER__browser_*`) for visual validation:

1. Install browser: `mcp__MCP_DOCKER__browser_install`
2. Start dev server: `pnpm dev:web`
3. Get network IP: `ifconfig en0 | grep "inet "` — Docker browser cannot reach `localhost`
4. Navigate with `mcp__MCP_DOCKER__browser_navigate` using `http://<NETWORK_IP>:3000/...`
5. Use `mcp__MCP_DOCKER__browser_snapshot` to discover all sections on the page
6. **Screenshot EACH section individually** by element ref — not just one full-page screenshot
7. Resize to desktop (1440×900) and mobile (375×812) with `mcp__MCP_DOCKER__browser_resize`
8. For interactive components (wizards, carousels): click through ALL steps, screenshot each
9. Check console with `mcp__MCP_DOCKER__browser_console_messages`
10. Test German locale at mobile — screenshot each section for text overflow
11. Verify no hardcoded English strings appear on non-EN locales
12. Compare against the direction summary
13. Fix issues before declaring done

If Docker MCP browser tools are NOT available:

- State: "I could not visually verify this — browser tooling is not available."
- Ask the user for a screenshot or manual confirmation.

### Review before delivering

Run the anti-slop checklist from `docs/anti-slop-checklist.md` — both visually (against
screenshots) AND via code-level grep:

- Emoji in components: `grep -rP '[\x{1F300}-\x{1F9FF}]' apps/web/src/components/ --include="*.tsx"`
- Emoji in translations: `grep -rP '[\x{1F300}-\x{1F9FF}]' packages/i18n/translations/ --include="*.json"`
- Hardcoded English: check accessibility tree for untranslated strings on non-EN pages
- Button consistency: verify all buttons in the same section have harmonious sizing

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

### Phase 1: Section discovery and per-section screenshots

Use Docker MCP Playwright tools (`mcp__MCP_DOCKER__browser_*`):

1. Install browser: `mcp__MCP_DOCKER__browser_install`
2. Start dev server: `pnpm dev:web`
3. Get network IP: `ifconfig en0 | grep "inet "` — Docker browser cannot reach `localhost`
4. Navigate with `mcp__MCP_DOCKER__browser_navigate` using `http://<NETWORK_IP>:3000/...`
5. Run `mcp__MCP_DOCKER__browser_snapshot` to discover ALL sections on the page
6. **Screenshot EACH section individually** by element ref at 1:1 scale — do NOT rely on a single full-page screenshot (spacing/sizing issues are invisible at full-page zoom)
7. For each section screenshot, evaluate: spacing, typography hierarchy, visual weight, content density
8. Resize to mobile (375×812), repeat section screenshots
9. Read console with `mcp__MCP_DOCKER__browser_console_messages`

If Docker MCP browser tools are NOT available:

- State: "Browser tooling not available — this is a code-only review."
- Ask for screenshots if visual validation matters.

### Phase 2: Interaction and user flow testing

**Critical: Don't just screenshot the initial page state. Actively interact with every
interactive component:**

- Click through wizard/stepper flows — screenshot EVERY step (not just step 1)
- Navigate carousels — verify all slides render
- Expand accordions — verify content doesn't break layout
- Fill out forms — verify validation, error states, success states
- Test all interactive states: hover, focus, active, disabled
- **For button groups:** verify all buttons in the same group have consistent sizing and visual weight
- Enter invalid data in forms — verify error handling
- Test content overflow (long text, extreme values)
- Verify loading and empty states

### Phase 3: Section-level layout audit

For EACH section identified in Phase 1:

- **Vertical spacing:** Is there enough breathing room between elements? Too cramped or too sparse?
- **Button consistency:** Do all buttons/CTAs in the section have harmonious sizing? (A small outline "Back" next to a massive full-width "Next" is a visual hierarchy failure)
- **Content density:** Is the density appropriate for the section type? (Cards can be dense, prose needs air)
- **Section transitions:** Does the visual break between this section and adjacent sections feel intentional? (Background changes, spacing, visual rhythm)
- **Icon usage:** Are icons from the design system, or are emoji/external icons being used?

### Phase 4: Anti-slop checklist (visual + code cross-reference)

For EVERY item in `docs/anti-slop-checklist.md`:

1. **Check visually** in the screenshots and accessibility tree — state PASS or FAIL
2. **Check in code** with grep commands — state PASS or FAIL

Mandatory code scans:

```bash
# Emoji in component JSX
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' apps/web/src/components/ --include="*.tsx"
# Emoji in translation strings used as UI elements
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' packages/i18n/translations/ --include="*.json"
# Hardcoded hex colors outside var() fallbacks
grep -r '#[0-9a-fA-F]\{3,6\}' apps/web/src/components/ --include="*.module.css" | grep -v 'var(' | grep -v '@keyframes' | grep -v '/\*'
# External icon imports
grep -r "from 'lucide-react'" apps/web/src/ | grep -v LucideIcon
# Hardcoded English strings (check accessibility tree on /de page for English text)
```

If visual check says PASS but code check says FAIL (or vice versa), investigate the discrepancy.

### Phase 5: Multi-locale testing (MANDATORY)

After completing EN testing:

1. Navigate to `/de` (German) at mobile viewport (375×812)
2. Screenshot EACH section — compare with EN for:
   - Text overflow or truncation (German is ~30% longer)
   - Button text overflowing containers
   - Layout breaks from longer text
   - **Untranslated English strings** leaking through (hardcoded text not using i18n)
3. Quick check of one additional locale (PT-BR or ES) at mobile for the same issues

### Phase 6: Design quality checks

1. **Collapse-and-elevate audit** — busy → collapse, sparse → enrich, redundant → consolidate
2. **Accessibility** — contrast (4.5:1), focus rings, keyboard nav, tap targets, heading hierarchy
3. **Human touch** — are craft details present or is the UI sterile?

### Phase 7: Code health

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

### Deliver the review

For every visual issue, include a Playwright screenshot as evidence.

**Summary:** 1-2 sentence overall assessment.

**Sections identified:** List all sections found on the page.

**Issues found** (with screenshot evidence where applicable):

- P0 — Blocking (broken functionality, accessibility failures, fake product claims)
- P1 — Should fix (anti-slop patterns, missing states, inconsistency, interaction bugs, layout issues)
- P2 — Polish (craft improvements, motion, human touch, specific techniques to try)

**Anti-slop audit table:** PASS/FAIL for each checklist item (visual + code).

**Multi-locale results:** Per-locale findings with screenshots.

**What works well:** 2-3 strengths.

**Recommended next steps:** Prioritized fix list.

If the user wants fixes applied, proceed starting from P0 → P1 → P2.

---

## MODE: AUDIT

The comprehensive "run everything" command. Combines code-level audit, live visual inspection
(via `@agent design-reviewer`), anti-slop checklist, interaction testing, and multi-locale
verification into a single unified report.

### Usage

```
/mydesign audit                    → Full platform audit (all main pages, all locales)
/mydesign audit /en                → Audit only the B2C landing page (EN)
/mydesign audit /en/business       → Audit only the B2B landing page (EN)
/mydesign audit /pt-BR/about       → Audit only the About page (PT-BR)
/mydesign audit https://diboas.com → Audit production URL directly
```

### Determine scope

**If a page path or URL is provided as argument:**

- Audit ONLY that page (skip code-level system audit, go straight to visual)
- If it's a relative path (e.g., `/en/business`), use the local dev server
- If it's a full URL (e.g., `https://diboas.com/en`), navigate directly to that URL
- The locale for multi-locale testing is derived from the path (e.g., `/en/...` → also test `/de/...`)

**If NO argument is provided:**

- Run the FULL platform audit: code-level system checks + visual inspection of ALL main pages
- Main pages to audit: B2C landing (`/en`), B2B landing (`/en/business`), and any other
  key pages (About, Strategies, Protocols, Demo) if time permits
- Also test DE locale for each page

**If ambiguous**, use ask_user_input:

**"What do you want me to audit?"**

- type: single_select
- Options:
  - "Full platform audit (all pages, all checks)"
  - "A specific page (I'll provide the path)"
  - "Code-level only (tokens, storybook, hardcoded values — no visual)"

---

### Part A: Code-Level System Audit (skip if auditing a specific page)

Only runs when no page argument is provided (full platform audit).

#### A1. Token audit

Read the token source files (tailwind.config, globals.css, design-tokens.css, etc.).

Check for completeness against these categories:

- [ ] Color palette with tonal scales (5-7 shades per primary color)
- [ ] Semantic colors (success, warning, error, info) defined
- [ ] Chart / data visualization colors defined
- [ ] Typography scale (heading sizes h1-h6, body, small, caption, overline)
- [ ] Font weights (heading, body, bold, light) defined
- [ ] Spacing scale (consistent system)
- [ ] Border radius values (multiple sizes, not just one)
- [ ] Shadow definitions (sm, md, lg, xl)
- [ ] Z-index scale
- [ ] Dark mode variant tokens (if dark mode is supported)
- [ ] Breakpoint definitions
- [ ] Transition / animation duration tokens
- [ ] Focus ring color and style tokens

#### A2. Component library / Storybook audit

For each component, check:

- [ ] Uses design tokens — no hardcoded colors, spacing, font sizes, or shadows
- [ ] Has all required states: default, hover, focus, active, disabled
- [ ] Has loading, empty, and error states (if applicable)
- [ ] Has responsive behavior defined
- [ ] Uses the project icon set consistently
- [ ] Has documentation or Storybook story showing variants
- [ ] Accessibility: ARIA, keyboard nav, contrast

#### A3. Icon and emoji audit

- [ ] Single icon library used consistently
- [ ] Consistent weight / stroke width
- [ ] No emoji used as core UI icons (grep JSX AND translation JSON files)
- [ ] Icon colors use token values
- [ ] Mandatory grep scan:
  ```bash
  grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' apps/web/src/components/ --include="*.tsx"
  grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' packages/i18n/translations/ --include="*.json"
  ```

#### A4. Hardcoded value scan

Search the codebase for hardcoded hex colors, font sizes, spacing, shadows, border radius,
z-index, and breakpoint values that should reference tokens.

#### A5. Compliance scan

```bash
grep -ri "military" packages/i18n/translations/ --include="*.json" | grep -v '"militaryGrade'
grep -r "0\.09%" packages/i18n/translations/ --include="*.json"
grep -ri "SIPC" packages/i18n/translations/ --include="*.json"
grep -ri "FDIC" packages/i18n/translations/ --include="*.json" | grep -v "FDIC National"
```

#### A6. Validation pipeline

```bash
pnpm type-check
pnpm validate:translations
pnpm validate:design-tokens
pnpm lint
```

---

### Part B: Live Visual Inspection (ALWAYS runs — this is the core of the audit)

This part runs for EVERY audit, whether full platform or single page.

#### B1. Browser setup

1. Start dev server: `pnpm dev:web` (skip if auditing a production URL)
2. Install browser: `mcp__MCP_DOCKER__browser_install`
3. Get network IP: `ifconfig en0 | grep "inet "` (Docker can't reach localhost)
4. Determine the target URL(s):
   - If page argument is a full URL → use it directly
   - If page argument is a path → `http://<NETWORK_IP>:3000<path>`
   - If no argument → audit all main pages sequentially

#### B2. Section discovery

For EACH page being audited:

1. Navigate to the page with `mcp__MCP_DOCKER__browser_navigate`
2. Set viewport to desktop (1440×900) with `mcp__MCP_DOCKER__browser_resize`
3. Run `mcp__MCP_DOCKER__browser_snapshot` to discover ALL sections
4. List every section found (by `region` role, `data-section-id`, or structural landmark)
5. Report the section list in the audit output

#### B3. Per-section visual inspection (desktop)

For EACH section discovered:

1. **Screenshot the section individually** by element ref using `mcp__MCP_DOCKER__browser_take_screenshot`
   — do NOT rely on full-page screenshots (spacing/sizing issues invisible at that zoom)
2. Evaluate the screenshot for:
   - **Spacing:** Enough breathing room between elements? Too tight or too sparse?
   - **Button consistency:** All buttons/CTAs in the section have harmonious sizing?
   - **Typography hierarchy:** Clear heading → subheading → body progression?
   - **Visual weight:** Does the section draw appropriate attention relative to its importance?
   - **Icon usage:** Design system icons or emoji/external icons?
   - **Content density:** Appropriate for the section type?
3. Compare against adjacent sections — do transitions feel intentional?

#### B4. Interaction and user flow testing

For EACH interactive component on the page:

- **Wizards/steppers:** Click through EVERY step. Screenshot each step. Verify:
  - Button sizing is consistent between steps (no tiny "Back" next to huge "Next")
  - Content layout is consistent between steps
  - Progress indicator updates correctly
  - Back navigation works and preserves state
- **Carousels:** Navigate to every slide. Verify all slides render correctly.
- **Accordions:** Expand each item. Verify content doesn't break layout.
- **Forms:** Fill with valid data, submit. Then test with invalid data.
- **Tabs:** Click each tab. Verify content switches correctly.
- **Links/CTAs:** Verify scroll targets and navigation work.
- **Hover/focus/active states:** Test on buttons, links, interactive cards.

#### B5. Mobile inspection (375×812)

1. Resize to mobile viewport
2. Re-run section discovery (`browser_snapshot`)
3. Screenshot EACH section at mobile — compare with desktop for:
   - Layout adapts properly (no horizontal scroll, no overlap)
   - Touch targets are large enough (44×44px minimum)
   - Text is readable without zooming
   - Buttons don't overflow or truncate
4. Re-test key interactive components at mobile (wizard, forms)

#### B6. Anti-slop checklist (visual + code cross-reference)

For EVERY item in `docs/anti-slop-checklist.md`:

1. **Visual check:** Look at the screenshots and accessibility tree — PASS or FAIL
2. **Code check:** Run the corresponding grep command — PASS or FAIL
3. If visual says PASS but code says FAIL (or vice versa), investigate

Mandatory code scans (run even for single-page audits):

```bash
# Emoji in JSX
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' apps/web/src/components/ --include="*.tsx"
# Emoji in translations
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' packages/i18n/translations/ --include="*.json"
# External icon imports
grep -r "from 'lucide-react'" apps/web/src/ | grep -v LucideIcon
# Hardcoded English on non-EN pages (check accessibility tree)
```

#### B7. Multi-locale testing (MANDATORY)

1. Determine the equivalent DE path for the page being audited
   (e.g., `/en/business` → `/de/business`)
2. Navigate to the DE version at mobile (375×812)
3. Screenshot EACH section — check for:
   - Text overflow or truncation (German is ~30% longer than English)
   - Buttons overflowing their containers
   - **Untranslated English strings** leaking through (hardcoded text not using i18n)
   - Layout breaks from longer text
4. Quick check one more locale (PT-BR) for the same issues
5. Verify regulatory text (MiCA for DE, CVM for PT-BR) is present

#### B8. Console check

Run `mcp__MCP_DOCKER__browser_console_messages` on each page tested.
Flag any errors that are NOT pre-existing known issues.

---

### Part C: Unified Report

Deliver a single report combining all findings:

**Design System Health: [grade A-D]** (only for full platform audits)

**Page(s) audited:** List with URLs and viewports tested.

**Sections identified:** List all sections found on each page.

**Token completeness scorecard** (only for full platform audits)

**Issues found** (with per-section screenshot evidence):

- P0 — Blocking (broken functionality, accessibility failures, fake product claims)
- P1 — Should fix (anti-slop patterns, layout issues, button inconsistency, spacing problems,
  missing states, interaction bugs, untranslated strings)
- P2 — Polish (craft improvements, motion, human touch, specific techniques to try)

**Anti-slop audit table:**

| Checklist item      | Visual    | Code      | Status |
| ------------------- | --------- | --------- | ------ |
| Emoji as UI icons   | PASS/FAIL | PASS/FAIL | ...    |
| Button group sizing | PASS/FAIL | —         | ...    |
| ...                 | ...       | ...       | ...    |

**Section-level layout notes:** Per-section spacing, density, transition observations.

**Multi-locale results:** Per-locale findings with screenshots.

**Interaction testing results:** Per-component flow test results with screenshots of each state.

**What works well:** 2-3 strengths.

**Recommended next steps:** Prioritized fix list (P0 → P1 → P2).

If the user wants fixes applied, proceed starting from P0.

---

## MODE: EXPLORE

### Gather minimal context

Use ask_user_input for essentials (feeling, anti-goals, references). One interaction.

### Generate 2-3 directions

Each with: aesthetic name, feeling, typography/color direction, anti-slop avoidance, hook.

### Let the user choose via ask_user_input, then switch to BUILD mode.

---

## MODE: TWEAK

For fine-tuning existing UI — animations, spacing, visual details.

### Identify what to tweak via ask_user_input if not specified.

### Set up Leva/Tweakpane controls for interactive parameter adjustment.

### Apply values, remove controls, run quick anti-slop and accessibility check.
