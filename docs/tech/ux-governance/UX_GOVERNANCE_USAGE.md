# UX Governance — Usage Protocol

> **Created:** 2026-07-10 · **Status:** operational protocol (companion to `UX_PRINCIPLES_CANON.md`).
> **Purpose:** the repeatable instruction set for using the UX governance layer. Any session — CMO, Claude Code, CTO, design-reviewer, or a chat with no memory of how this system was built — should be able to open this file and run either mode cold.
>
> **The three layers, one line each:**
> **Canon** (what we believe): `docs/full-view/BRAND_POSITIONING.md` §The Writing System (4 lenses, 4 gates) + `docs/tech/ux-governance/UX_PRINCIPLES_CANON.md` (59 principles, UX-01…UX-59, each with evidence + verdict). **Enforcement** (what gets checked): `docs/tech/ux-governance/anti-slop-checklist.md` — Part 3 is the friction/dark-pattern check; **rows 10–17 are the canonical veto list; a FAIL there blocks the change regardless of measured lift.** **Findings** (what's wrong right now): dated `docs/audit/UX_AUDIT_*` files in the F-finding format below.

---

## Mode 1 — BUILD (new feature, page, flow, or copy)

1. **Scope the principles.** Open canon Appendix C, find your surface's owner row, and list the UX-IDs that apply. Typical mappings: a form → UX-06, 16, 36; a decision/confirm screen → UX-37, 39, 44, 52, 53; a multi-step flow → UX-07, 09, 50; a category/index page → UX-15, 55, 56; a results screen → UX-02, 08, 34, 47; an empty or unavailable state → UX-58.
2. **Write through the four lenses** (Writing System): Adelaide tone → Draper craft → core message → friction & motivation. The Lens-4 question that catches the most: _is the true thing said at the moment of doubt, or later?_
3. **Self-check checklist Part 3 before human review.** Rows 1–9 and 18–21 should PASS; any YES on rows 10–17 means the design changes before it is seen, not after.
4. **Route the gates.** Anything near a veto row → CLO. Naming → CMO board vote. Fees → cite `FEES.md`, never restate values. Any number with a date → `docs/tech/DATA_VINTAGE_POLICY.md`.

## Mode 2 — AUDIT (review something already built)

1. **Collect the surface honestly.** Rendered screenshots for visual claims; page text/i18n strings for copy and flow claims. State which you had — findings made from text alone about visual matters carry the tag **[VISUAL PASS REQUIRED]** and are hypotheses, not defects, until the design-reviewer confirms them.
2. **Run checklist Part 3 row by row.** Record PASS / FAIL / N/A per row. Rows 10–17 findings are blocking by definition.
3. **Write findings in the F-format** (below), citing UX-IDs — "feels off" is not a finding; "violates UX-44/UX-52" is actionable.
4. **Record what is strong.** Zero instances of the veto rows is a result worth stating (it is an investor-quotable asset), and existing good patterns get named so nobody "fixes" them.
5. **Route per the role table.** Output file: `docs/audit/UX_AUDIT_<scope>_<date>.md`, archived after execution — never deleted (see the retention note in `UX_GOVERNANCE_FIX_PLAN_2026-07-10.md`).

## The F-finding format

`### F-n · <one-line defect>. — <UX-IDs> · <severity HIGH/MED/LOW> · <owner route> [· VISUAL PASS REQUIRED if applicable]`
Body: what is (verifiable state, quoted string or screenshot ref) → why it matters (the principle's logic, not vibes) → the fix (concrete, smallest honest version) → what it rides with (existing item/plan, if any).

**Worked example (real, from `UX_AUDIT_BUILT_SURFACES_2026-07-05.md`):**

> **F-5 · The all-in cost is never stated at the moment of decision. — UX-44, UX-52 · HIGH · CMO→CLO→CC.** The site states 0.48% and that third-party costs pass through at cost, but never tells a person that adding $100 by card costs ~1.48% all-in. The strongest evidence in the source corpus is that the screen volunteering the unfavourable fact converts better (UX-44, transparency bias). Fix: the confirm button carries the total, and the pass-through line appears before the action. Rides with usability C2/C3.

## Role table

| Role                  | Reads                                    | Responsibility                                                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Founder / CMO board   | Writing System + canon                   | Verdicts, naming votes, gate calls, ratification                                     |
| Claude Code           | This file + checklist Part 3 + canon IDs | Pre-PR self-check (per `CLAUDE.md` build rules); audits on request; validator upkeep |
| design-reviewer agent | Checklist Parts 1 + 3                    | Screenshot-based visual pass; confirms/kills [VISUAL PASS REQUIRED] hypotheses       |
| CLO board             | Canon Appendix B + Gate 4                | Sign-off on anything near the veto rows; projection framing (UX-47 ADAPT)            |
| CTO board             | Canon Part 4 + UX-12/13/14/57            | Money-product structure (bottom nav, status timelines, personalisation, thumb zone)  |
| Data Ops              | `DATA_VINTAGE_POLICY.md` + UX-58         | Data-unavailable states; every figure's date and window                              |

## Using this in another project

Nothing above is diBoaS-specific except the finance rule's examples and the file paths. To port: copy the canon + checklist + this file, replace the Appendix-C surface mappings and the veto-list examples with the new product's regulated equivalents, and keep the three-layer shape (canon → enforcement → findings) plus the validator. The one non-negotiable for any money-adjacent product: **the veto rows stay blocking regardless of measured lift.**
