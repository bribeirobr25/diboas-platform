# /build-ui — Structured UI Build Workflow

Build a UI surface using the human-first design process defined in `CLAUDE.md`.

## Before building anything

### 1. Read the project docs

Read these files in order. Note which are present and which are missing or empty:
- `docs/brand-brief.md`
- `docs/design-principles.md`
- `docs/design-system-notes.md`
- `docs/anti-slop-checklist.md`

Also check for existing design tokens, component libraries, and global styles in the codebase.

### 2. Assess what context is available

If the project docs cover the task well, proceed to step 3.

If critical context is missing, use the `ask_user_input` tool to gather it. Adapt the
questions to the specific task — these are starting points, not a rigid script.

**For any UI task where the brief is unclear or docs are empty:**

Use ask_user_input to ask:

Question 1 — "What are we building?"
- type: single_select
- Options adapted from the user's message. Examples:
  - "Landing page"
  - "Dashboard"
  - "Settings / admin page"
  - "Mobile app screen"
  - "Component or section"

Question 2 — "How should this feel to the user?"
- type: multi_select
- Options:
  - "Warm and approachable"
  - "Clean and minimal"
  - "Bold and energetic"
  - "Premium and refined"
  - "Playful and friendly"
  - "Calm and trustworthy"

Question 3 — "What should this NOT feel like?"
- type: multi_select
- Options:
  - "Generic SaaS / cookie-cutter"
  - "Corporate / cold"
  - "Crypto-bro / techy"
  - "Cheap / untrustworthy"
  - "Cluttered / overwhelming"
  - "Boring / lifeless"

**For larger or net-new tasks, also ask:**

Question 4 — "Do you have references or techniques to draw from?"
References can be screenshots, URLs of sites you admire, tweet threads about specific
techniques, CodePens, or articles describing an effect. If the user shares a URL, navigate
to it (via Playwright or web_fetch) to analyze the technique and extract what to apply.
- type: single_select
- Options:
  - "Yes, let me share screenshots or URLs"
  - "No, use good judgment"
  - "I'll describe what I like"

Question 5 — "What is the priority?"
- type: single_select
- Options:
  - "Polish and craft — take the time to get it right"
  - "Speed — get something solid up fast, we'll refine later"
  - "Exploration — show me a few directions to choose from"

If the user selects "Speed", switch to lightweight mode as defined in `CLAUDE.md`.
If the user selects "Exploration", generate 2-3 visual direction candidates and present
them via ask_user_input with single_select for the user to choose.

**For tasks involving content or data:**

Question 6 — "What about the content?"
- type: single_select
- Options:
  - "I'll provide real content"
  - "Use realistic sample content — label it as illustrative"
  - "Placeholder is fine for now"

### 3. Summarize the design direction

After gathering context, write a 3-5 sentence summary of:
- Who this is for and what emotional outcome we want
- The aesthetic direction (with specific references if provided)
- Key constraints (framework, existing components, accessibility requirements)
- Any stated assumptions

### 4. Build

Follow the full process from `CLAUDE.md` starting at Step 4 (Brand and system foundation):
- Define or reuse tokens and components
- Build from smallest slice upward
- Build through the system — no ad-hoc styling
- Account for all states (empty, loading, error, success, edge cases)
- Add purposeful motion
- Add human touch details
- Use realistic content

**For complex interactions or effects:** Before integrating into the full page, consider
building the effect in isolation first — a small standalone playground where you can
experiment with just that one interaction (a hover animation, a loading sequence, a
transition effect) without the complexity of the full page. This is especially useful
for motion design where you need to dial in timing and easing values.

**For fine-tuning animation and visual parameters:** If the user wants to interactively
tweak motion timing, easing, spacing, or other visual values, add a Leva control panel
(or similar parameter UI) that exposes the relevant controls. This lets the user visually
dial in values in real-time instead of going back and forth through prompts. Remove the
control panel before shipping to production.

### 5. Validate

If Playwright MCP is available:
- Screenshot the result at desktop and mobile viewports
- Check console for errors
- Compare against the direction summary from step 3
- Fix issues before declaring done

If Playwright is NOT available:
- State explicitly: "I could not visually verify this — browser tooling is not available."
- Ask the user for a screenshot or manual confirmation.

### 6. Review

Run the anti-slop checklist from `docs/anti-slop-checklist.md`.
Run the collapse-and-elevate audit.
Run the review questions from Step 13 in `CLAUDE.md`.

If any check fails, fix it before delivering.

### 7. Deliver

Present the result with:
- Brief summary of what was built
- Design direction used
- Assumptions made (if any)
- States implemented vs. intentionally deferred
- Known issues or areas for future refinement
- Whether visual validation was performed or not
