# /review-ui — Quick Design Review

Run a focused design quality review on recent UI changes.

## Process

### 1. Identify what changed

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

### 2. Visual validation (if browser tooling available)

If Playwright MCP is available:
- Navigate to the relevant page(s)
- Take screenshots at desktop (1440px) and mobile (375px) viewports
- Read browser console for errors or warnings
- Click through the primary user flow on affected pages
- Test at least one edge case actively (invalid input, empty state, long content)
- Attach screenshots as evidence for any issue found

If Playwright is NOT available:
- State: "Browser tooling is not available — this review is code-only."
- Ask the user for screenshots if visual validation matters.

### 3. Run the anti-slop checklist

Check every item in `docs/anti-slop-checklist.md` against the current output.

For each issue found, note:
- What the issue is
- Where it appears
- Suggested fix

### 4. Run the collapse-and-elevate audit

- What is too busy and should be collapsed?
- What is too sparse and should be enriched?
- What is duplicated and should be consolidated?
- What is decorative but not useful?
- What is useful but under-emphasized?

### 5. Check states

For each major component or page reviewed:
- Are empty states handled?
- Are loading states contextual (not just a spinner)?
- Are error states helpful (not just "Error")?
- Are success states confirmed?
- Are disabled states styled?
- Does long content break the layout?

### 6. Check accessibility basics

- Color contrast (4.5:1 for text, 3:1 for UI components)
- Focus rings present and styled
- Interactive elements keyboard-reachable
- Tap targets at least 44x44px on touch devices
- Heading hierarchy logical

### 7. Deliver the review

**Communication principle:** Describe problems and their impact on the user — not specific
code fixes. "The spacing feels inconsistent here, making it harder to scan" rather than
"change margin to 16px." Attach a Playwright screenshot for every visual issue found.

Format the review as:

**Summary:** 1-2 sentence overall assessment.

**Issues found** (with screenshot evidence where available):
- P0 — Blocking (broken functionality, accessibility failures, fake product claims)
- P1 — Should fix (anti-slop patterns, missing states, inconsistent styling)
- P2 — Nice to have (craft improvements, motion polish, human touch additions)

**What works well:** Note 2-3 things that are strong.

**Recommended next steps:** Prioritized list of fixes.

If the user wants you to fix the issues rather than just report them, proceed to fix
starting from P0, then P1, then P2.
