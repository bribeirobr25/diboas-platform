# Human-First Design Skill Pack

A Claude Code skill pack that produces frontend interfaces that look human-made, not
AI-generated. It combines interactive context-gathering, design system enforcement,
visual anti-pattern elimination, and craft-level detail.

## What it solves

AI coding agents produce generic-looking UI because they can't see their own output,
have no taste constraints, and optimize for completion over craft. This skill pack fixes
all three problems by giving Claude:

- **Context** — structured templates that define how the product should look and feel
- **Tools** — integration with Playwright (visual verification) and shadcn MCP (component awareness)
- **Validation** — anti-slop checklist, design review agent, and visual self-correction loops
- **Interaction** — uses `ask_user_input` to gather design context when project docs are incomplete

## Install

1. Copy `CLAUDE.md` to your project root.
2. Copy the `.claude/` folder to your project root.
3. Copy the `docs/templates/` files into your project `docs/` folder.
4. Fill in the templates with your project's specifics.
5. Restart Claude Code.

## File structure

```
your-project/
├── CLAUDE.md                              ← persistent design operating rules
├── .claude/
│   ├── commands/
│   │   ├── mydesign.md                    ← /mydesign — unified entry point
│   │   ├── build-ui.md                    ← /build-ui — build only (alternative)
│   │   └── review-ui.md                   ← /review-ui — review only (alternative)
│   └── agents/
│       └── design-reviewer.md             ← @agent design-reviewer subagent
└── docs/
    ├── brand-brief.md                     ← product truth and emotional target
    ├── design-principles.md               ← concrete UI implementation rules
    ├── design-system-notes.md             ← tokens, libraries, breakpoints
    └── anti-slop-checklist.md             ← canonical anti-pattern list
```

## What each file does

| File | Purpose | Fill when |
|------|---------|-----------|
| `CLAUDE.md` | Orchestration rules, process steps, anti-slop defaults. Loaded into every Claude Code session. | Once — then rarely changes |
| `docs/brand-brief.md` | Product truth, audience, emotional target, references, what must never be invented. | Once at project start |
| `docs/design-principles.md` | Concrete rules: typography, color, layout, motion, content, accessibility. | Once, then updated as the design evolves |
| `docs/design-system-notes.md` | Token source, component library, icon set, chart library, breakpoints. | Once, then updated as the system grows |
| `docs/anti-slop-checklist.md` | Canonical anti-pattern list and project-specific review notes. | Ongoing — add project-specific notes as you build |
| `.claude/commands/mydesign.md` | Unified entry point — build, review, explore, or tweak. Interactive mode selection. | Never changes |
| `.claude/commands/build-ui.md` | Focused build workflow (alternative to /mydesign). | Never changes |
| `.claude/commands/review-ui.md` | Focused review workflow (alternative to /mydesign). | Never changes |
| `.claude/agents/design-reviewer.md` | Comprehensive design review subagent. | Never changes |

## Usage

### The main command: /mydesign

Type `/mydesign` in Claude Code followed by your request. It handles everything — building,
reviewing, exploring directions, and fine-tuning details.

If your intent is clear from the message, it proceeds directly. If not, it uses
`ask_user_input` to ask what mode you need (build, review, explore, tweak) with clickable
options. Then it gathers whatever design context is missing before doing any work.

Examples:
```
/mydesign Build a pricing page for our SaaS product with three tiers
/mydesign Review the landing page we just built
/mydesign Audit our design system — check tokens, Storybook, and icon consistency
/mydesign Show me a few directions for the onboarding flow
/mydesign Fine-tune the hover animations on the strategy cards
```

### Focused alternatives

If you prefer a more targeted entry point:

- `/build-ui` — goes straight to the build workflow
- `/review-ui` — goes straight to the review workflow
- `@agent design-reviewer` — invokes the comprehensive design review subagent

## Operating modes

### Full mode (default)
For new products, major pages, core flows, large redesigns. Uses the complete multi-step
workflow: brief → references → direction exploration → system foundation → components →
pages → states → motion → review → refine.

### Lightweight mode
For quick prototypes, small changes, component tweaks. Compresses to: brief → one direction →
smallest slice → one review. Activated automatically when the user selects "Speed" in the
context-gathering step, or can be triggered by saying "quick" or "prototype" in the request.

Even in lightweight mode, the skill enforces anti-slop rules and accessibility basics.

## Recommended tooling

These MCPs significantly improve output quality:

| MCP | What it does | Priority |
|-----|-------------|----------|
| **Playwright MCP** | Gives Claude eyes — screenshots, mobile testing, console logs, visual self-correction | **Essential** — without this, Claude cannot verify its own visual output |
| **shadcn MCP** | Component library awareness — knows what components exist and how to use them | **High** — prevents Claude from creating custom components when built-in ones exist |
| **Figma MCP** | Reads Figma designs directly — extracts specs, spacing, colors | Useful if you design in Figma first |
| **Context7 MCP** | Framework documentation access | Useful for unfamiliar frameworks |

Install Playwright MCP:
```bash
claude mcp add playwright -- npx @anthropic-ai/playwright-mcp@latest
```

Install shadcn MCP (if using shadcn/ui):
```bash
claude mcp add shadcn -- npx shadcn@latest mcp
```

## How the interactive context-gathering works

When you run `/mydesign` and the project docs are incomplete, Claude uses the `ask_user_input`
tool to present structured questions with clickable options:

1. **What do you need?** (single select — build / review / audit / explore / tweak)
2. **How should it feel?** (multi select — emotional direction, for build/explore)
3. **What should it NOT feel like?** (multi select — anti-goals, for build/explore)
4. **Do you have references or techniques?** (single select — screenshots, URLs, CodePens, articles, or "use good judgment")
5. **What is the priority?** (single select — polish/speed/exploration)

For audit mode: **What should I audit?** (multi select — tokens, components/Storybook, icons,
hardcoded values, dark mode, responsive, or full health check)

For build/content tasks: **What about the content?** (single select — real/illustrative/placeholder)

After gathering answers, Claude summarizes the design direction in 3-5 sentences before
building anything. This summary becomes the reference point for the entire session.

## Design philosophy

This skill pack is opinionated about process but not about aesthetics. It does not force
one visual style. It forces:

- Defining how things should feel before deciding how they look
- Building the design system before building pages
- Using the system consistently instead of ad-hoc styling
- Eliminating patterns that signal "AI generated this"
- Adding craft details that signal "a human built this with care"
- Visually verifying the output (or honestly saying it couldn't)
- Reviewing against a concrete anti-pattern list before delivering

The aesthetic direction comes from YOUR project docs and references, not from the skill's
defaults. The skill just makes sure whatever direction you choose is executed with
consistency, intention, and craft.

## Advanced patterns

### Reference technique feeding
References aren't limited to screenshots. You can share URLs of articles, tweet threads
about specific CSS techniques, CodePens with effects you admire, or design system
documentation from products you respect. Claude will navigate to the URL, analyze the
technique, and apply the transferable principles to your project. This is especially
powerful for animation patterns, shadow techniques, and layout approaches.

### Playground isolation
For complex interactions or animations, build the effect in isolation first — a small
standalone playground where you experiment with just that one thing. Integrate into the
full page once you've dialed it in. This prevents the "tweak one thing, break three others"
problem that happens when iterating on effects inside a full page.

### Leva control panels for fine-tuning
When you need to visually dial in animation timing, easing, spacing, or color values, tell
Claude to add a Leva control panel (or Tweakpane) that exposes the relevant parameters.
You tweak values in real-time in the browser instead of prompting back and forth. Remove
the panel before shipping to production.

### Build-the-tool-as-deliverable
For brand or design system work, consider building interactive parameter tools (pattern
generators, color palette explorers, icon testers) that constrain the design space to
on-brand outputs. These tools can be handed to clients or team members so they can generate
on-brand variations themselves without needing to understand the design system deeply.
Build these in Lovable, V0, or as standalone React apps.

### Taste agents from designer references
You can build custom design audit agents by collecting CodePens, articles, and examples
from designers whose work you admire (e.g., 15-20 references from 2-3 designers). Feed
these to Claude Code and have it create a subagent that embodies their collective philosophy
and techniques. Use this agent to audit your UI and get recommendations aligned with the
taste you've curated. Keep the reference set focused — 2-3 designers with complementary
philosophies, not every designer you've ever liked.

## CLAUDE.md guidance

Keep your project's `CLAUDE.md` focused on design workflow rules only. Do not use it as a
journal of everything about your project — that bloats context and degrades quality.

For non-design project context (API details, backend architecture, business logic), use
subdirectory-level `.claude.md` files that are only loaded when Claude is working in that
area of the codebase. The design-focused `CLAUDE.md` from this skill pack should stay
lean and specific to the visual workflow.

If you already have a project-level `CLAUDE.md`, merge the design rules from this skill
pack's version into it rather than replacing it. Keep the design section clearly labeled
so it doesn't get mixed with unrelated project configuration.

## Credits

Synthesized from analysis of 15 independent AI design workflow approaches covering:
emotional design direction, micro-animation craft, design tokens as AI context, aesthetic
stacks, anti-pattern elimination, PRD-first workflows, design trend positioning, design
systems in code, brand identity systems, Playwright visual verification, shadcn component
awareness, multi-agent design, tool-as-deliverable brand workflows, reference technique
feeding, taste agent construction, and the principle that craft and care remain the final
differentiator in AI-native design.
