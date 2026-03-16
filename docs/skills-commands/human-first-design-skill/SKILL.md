---
name: human-first-design
description: >
  Generates frontend design that looks human-made, not AI-generated. Use this skill whenever
  building any frontend UI: websites, landing pages, dashboards, mobile apps, React components,
  HTML pages, marketing materials, or any visual interface. This skill enforces design system
  consistency, eliminates common AI aesthetic patterns ("AI slop"), and produces interfaces
  that feel intentional, warm, and crafted. Trigger whenever the user mentions design, UI, UX,
  frontend, landing page, website, component, layout, styling, visual design, or asks to make
  something "look better", "more professional", "less AI-looking", or "more human". Also trigger
  when building any page or component in an existing project — consistency with the design system
  is always relevant. Trigger even for small surface changes or component tweaks — the lightweight
  mode handles those efficiently. This skill uses the ask_user_input tool to gather design context
  interactively before building, so it works even when project docs are incomplete.
---

# Human-First Design Skill

This skill gives Claude a structured design workflow that reduces generic AI UI output. It
combines interactive context-gathering, design system enforcement, visual anti-pattern
elimination, and craft-level detail to produce interfaces that feel like a human designer
built them with care.

## How to use this skill

### Installation

1. Copy `CLAUDE.md` to the project root.
2. Copy the `.claude/` folder to the project root.
3. Copy the `docs/templates/` files into the project's `docs/` folder and fill them in.
4. Restart Claude Code.

### Workflow

The primary entry point is a single slash command:

- `/mydesign` — unified design workflow. Uses `ask_user_input` to determine mode (build,
  review, explore, or tweak), gathers context interactively, then executes.

Alternative focused commands are also available:
- `/build-ui` — structured build workflow only
- `/review-ui` — quick review pass only
- `@agent design-reviewer` — comprehensive design review subagent

### What the skill reads at runtime

On every frontend task, read these project docs in order of precedence:

1. `docs/brand-brief.md` — product truth, audience, emotional target, references
2. `docs/design-principles.md` — typography, color, layout, interaction, content rules
3. `docs/design-system-notes.md` — tokens, component library, icon set, breakpoints
4. `docs/anti-slop-checklist.md` — canonical anti-pattern list and review criteria

If any doc is missing or mostly empty, the `/build-ui` command will use the `ask_user_input`
tool to gather the critical context interactively before proceeding. The skill works with
incomplete docs — it just asks for what it needs.

### Two operating modes

**Full mode** — for new products, major pages, core flows, large redesigns. Uses the complete
multi-step workflow with visual direction exploration, system foundation, and comprehensive review.

**Lightweight mode** — for quick prototypes, small changes, component tweaks, exploratory work.
Compresses to: brief → one direction → smallest slice → one review. Still enforces anti-slop
and accessibility basics.

### For complete details

Read the `CLAUDE.md` file in the project root. It contains the full operating rules, document
precedence hierarchy, required process steps, anti-slop defaults, and output quality gates.
The slash commands and subagent reference `CLAUDE.md` as their source of truth.
