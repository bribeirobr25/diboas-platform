# /review-ui — Quick Design Review

Run a focused design quality review on a specific page or recent UI changes.

## Process

### 1. Identify what to review

First, check what was modified:

```
git status
git diff --name-only origin/HEAD...
```

Focus the review on changed files and affected pages.

If the user specified a page or component, review that instead.
If git diff is empty and user didn't specify, use ask_user_input:

Question — "What should I review?"
- type: single_select
- Options adapted to the project. Examples:
  - "The page I just built"
  - "A specific page (I'll name it)"
  - "The whole frontend"

### 2. Section discovery and per-section screenshots

Use Docker MCP Playwright tools (`mcp__MCP_DOCKER__browser_*`):
1. Install browser: `mcp__MCP_DOCKER__browser_install`
2. Start dev server: `pnpm dev:web`
3. Get network IP: `ifconfig en0 | grep "inet "` — Docker browser cannot reach `localhost`
4. Navigate with `mcp__MCP_DOCKER__browser_navigate` using `http://<NETWORK_IP>:3000/...`
5. Run `mcp__MCP_DOCKER__browser_snapshot` to discover ALL sections on the page
6. **Screenshot EACH section individually** by element ref at 1:1 scale — do NOT rely on a single
   full-page screenshot (spacing and sizing issues are invisible at full-page zoom)
7. Resize to mobile (375×812), repeat per-section screenshots
8. Read console with `mcp__MCP_DOCKER__browser_console_messages`
9. Use `mcp__MCP_DOCKER__browser_snapshot` for accessibility tree analysis

If Docker MCP browser tools are NOT available:
- State: "Browser tooling is not available — this review is code-only."
- Ask the user for screenshots if visual validation matters.

### 3. Interaction and user flow testing

**Don't just screenshot the initial state. Actively interact with every interactive component:**
- Click through wizard/stepper flows — screenshot EVERY step (not just step 1)
- Navigate carousels — verify all slides render
- Expand accordions — verify content doesn't break layout
- Fill out forms — test validation, error states, success states
- **For button groups:** verify all buttons in same group have consistent sizing and visual weight
- Test all interactive states: hover, focus, active, disabled
- Enter invalid data in forms — verify error handling
- Test content overflow (long text, extreme values)
- Verify loading and empty states

### 4. Section-level layout audit

For EACH section identified in step 2:
- **Vertical spacing:** Enough breathing room between elements? Too cramped or too sparse?
- **Button consistency:** All buttons/CTAs in the section have harmonious sizing?
- **Content density:** Appropriate for the section type? (Cards can be dense, prose needs air)
- **Section transitions:** Visual break between adjacent sections feels intentional?
- **Icon usage:** Design system icons or emoji/external icons being used?

### 5. Anti-slop checklist (visual + code cross-reference)

Check every item in `docs/anti-slop-checklist.md` — both visually AND via code grep.

For each item, state PASS or FAIL based on what you actually see in the rendered page.

Mandatory code scans:
```bash
# Emoji in component JSX
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' apps/web/src/components/ --include="*.tsx"
# Emoji in translation strings
grep -rP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' packages/i18n/translations/ --include="*.json"
# Hardcoded English (check accessibility tree on /de page for English text leaking through)
# External icon imports
grep -r "from 'lucide-react'" apps/web/src/ | grep -v LucideIcon
```

### 6. Multi-locale testing (MANDATORY)

After EN testing:
1. Navigate to `/de` at mobile (375×812)
2. Screenshot EACH section — check for:
   - Text overflow or truncation (German is ~30% longer)
   - Buttons overflowing their containers
   - **Untranslated English strings** (hardcoded text not using i18n)
   - Layout breaks from longer text
3. Quick check one additional locale (PT-BR or ES)

### 7. Collapse-and-elevate audit

- What is too busy and should be collapsed?
- What is too sparse and should be enriched?
- What is duplicated and should be consolidated?
- What is decorative but not useful?
- What is useful but under-emphasized?

### 8. Check states

For each major component or page reviewed:
- Are empty states handled?
- Are loading states contextual (not just a spinner)?
- Are error states helpful (not just "Error")?
- Are success states confirmed?
- Are disabled states styled?
- Does long content break the layout?

### 9. Check accessibility basics

- Color contrast (4.5:1 for text, 3:1 for UI components)
- Focus rings present and styled
- Interactive elements keyboard-reachable
- Tap targets at least 44x44px on touch devices
- Heading hierarchy logical

### 10. Deliver the review

**Communication principle:** Describe problems and their impact on the user — not specific
code fixes. "The spacing feels inconsistent here, making it harder to scan" rather than
"change margin to 16px." Attach a Playwright screenshot for every visual issue found.

Format the review as:

**Summary:** 1-2 sentence overall assessment.

**Sections identified:** List all sections found on the page.

**Issues found** (with per-section screenshot evidence):
- P0 — Blocking (broken functionality, accessibility failures, fake product claims)
- P1 — Should fix (anti-slop patterns, missing states, inconsistent styling, layout issues)
- P2 — Nice to have (craft improvements, motion polish, human touch additions)

**Anti-slop audit:** PASS/FAIL per item (visual + code).

**Multi-locale results:** Per-locale findings with screenshots.

**What works well:** Note 2-3 things that are strong.

**Recommended next steps:** Prioritized list of fixes.

If the user wants you to fix the issues rather than just report them, proceed to fix
starting from P0, then P1, then P2.
