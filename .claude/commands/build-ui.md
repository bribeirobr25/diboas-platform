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

If critical context is missing, use the `ask_user_input` tool to gather it.

**For any UI task where the brief is unclear or docs are empty:**

Question 1 — "What are we building?"
- type: single_select
- Options adapted from the user's message (e.g., Landing page, Dashboard, Settings, Mobile screen, Component)

Question 2 — "How should this feel to the user?"
- type: multi_select
- Options: Warm and approachable, Clean and minimal, Bold and energetic, Premium and refined, Playful and friendly, Calm and trustworthy

Question 3 — "What should this NOT feel like?"
- type: multi_select
- Options: Generic SaaS, Corporate / cold, Crypto-bro / techy, Cheap / untrustworthy, Cluttered / overwhelming, Boring / lifeless

**For larger or net-new tasks, also ask:**

Question 4 — "Do you have references or techniques to draw from?"
References can be screenshots, URLs, tweet threads, CodePens, or articles.
- type: single_select
- Options: Yes let me share screenshots or URLs, No use good judgment, I'll describe what I like

Question 5 — "What is the priority?"
- type: single_select
- Options: Polish and craft, Speed, Exploration — show me directions

Question 6 — "What about the content?"
- type: single_select
- Options: I'll provide real content, Use realistic sample content — label as illustrative, Placeholder is fine

### 3. Summarize the design direction

Write a 3-5 sentence summary of who this is for, emotional outcome, aesthetic direction, constraints, assumptions.

### 4. Build

Follow the full process from `CLAUDE.md`:
- Define or reuse tokens and components
- Build from smallest slice upward
- Build through the system — no ad-hoc styling
- Account for all states (empty, loading, error, success, edge cases)
- Add purposeful motion
- Add human touch details
- Use realistic content

**For complex effects:** Build in isolation first, then integrate.

**For fine-tuning:** Add a Leva control panel for interactive parameter adjustment. Remove before shipping.

### 5. Validate

If Playwright MCP is available: screenshot at desktop and mobile, check console, compare against direction, fix issues.

If NOT available: explicitly state "I could not visually verify this."

### 6. Review

Run anti-slop checklist, collapse-and-elevate audit, and self-review questions from `CLAUDE.md`.

### 7. Deliver

Present with: summary, direction used, assumptions, states implemented vs. deferred, known issues, visual validation status.
