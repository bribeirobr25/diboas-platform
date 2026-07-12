# UX Governance — Usage Protocol

> **Created:** 2026-07-10 · **Status:** operational protocol (companion to `UX_PRINCIPLES_CANON.md`).
> **Purpose:** the repeatable instruction set for using the UX governance layer. Any session — CMO, Claude Code, CTO, design-reviewer, or a chat with no memory of how this system was built — should be able to open this file and run either mode cold.
>
> **The three layers, one line each:**
> **Canon** (what we believe): `docs/full-view/BRAND_POSITIONING.md` §The Writing System (the north star, 4 lenses, 4 gates) + `docs/tech/ux-governance/UX_PRINCIPLES_CANON.md` (59 principles, UX-01…UX-59, each with evidence + verdict). **Enforcement** (what gets checked): `docs/tech/ux-governance/anti-slop-checklist.md` — Part 2 is the machine-tell check, Part 3 is the friction/dark-pattern check (**rows 10–17 are the canonical veto list; a FAIL there blocks the change regardless of measured lift**); `docs/tech/ux-governance/VOICE_RUBRIC.md` is the voice check (the four qualities, scored PASS/WEAK/FAIL — a judgment pass, not a script). **Findings** (what's wrong right now): dated `docs/audit/UX_AUDIT_*` files in the F-finding format below.
>
> **Two enforcement layers, kept distinct:** the checklist catches what is _wrong_ (machine tells, friction, dark patterns) mechanically or near-mechanically; the voice rubric catches whether copy is _good_ (feels something, respects Adelaide, never sells/promises/advises, makes the reader want it) by reasoning. A surface can pass the whole checklist and still be lifeless — that is a rubric FAIL, and it matters.

---

## Mode 1 — BUILD (new feature, page, flow, or copy)

1. **Scope the principles.** Open canon Appendix C, find your surface's owner row, and list the UX-IDs that apply. Typical mappings: a form → UX-06, 16, 36; a decision/confirm screen → UX-37, 39, 44, 52, 53; a multi-step flow → UX-07, 09, 50; a category/index page → UX-15, 55, 56; a results screen → UX-02, 08, 34, 47; an empty or unavailable state → UX-58.
2. **Write through the four lenses** (Writing System): Adelaide tone → Draper craft → core message → friction & motivation, all serving the north star (the reader should finish _wanting_ the experience). The Lens-4 question that catches the most: _is the true thing said at the moment of doubt, or later?_
3. **Score the copy against the voice rubric before human review.** `VOICE_RUBRIC.md`, BUILD mode: score Q1 Draper / Q2 Adelaide / Q3 the three nevers / Q4 the want. Target PASS on all four; a Q3 FAIL (selling, promising, or advising) blocks exactly like a veto row. For any non-English surface, apply the four-locale rule — score each locale in its own register.
4. **Self-check checklist Part 3 before human review.** Rows 1–9 and 18–21 should PASS; any YES on rows 10–17 means the design changes before it is seen, not after.
5. **Route the gates.** Anything near a veto row → CLO. Any Q3 rubric FAIL → CLO (promise/advice is regulatory, not only brand). Naming → CMO board vote. Fees → cite `FEES.md`, never restate values. Any number with a date → `docs/tech/DATA_VINTAGE_POLICY.md`.

## Mode 2 — AUDIT (review something already built)

1. **Collect the surface honestly.** Rendered screenshots for visual claims; page text/i18n strings for copy and flow claims. State which you had — findings made from text alone about visual matters carry the tag **[VISUAL PASS REQUIRED]** and are hypotheses, not defects, until the design-reviewer confirms them.
2. **Run checklist Part 3 row by row.** Record PASS / FAIL / N/A per row. Rows 10–17 findings are blocking by definition.
3. **Score the copy against the voice rubric** (`VOICE_RUBRIC.md`, AUDIT mode): Q1–Q4 per surface, per locale. This is the half that finds "correct but lifeless" — the flat hero, the translated-but-cold German line, the paragraph that quietly advises. For pt-BR/es/de, apply the four-locale rule and tag anything you can't confirm natively **[NATIVE PASS REQUIRED]** — a non-native pass yields hypotheses, not verdicts.
4. **Write findings in the F-format** (below), citing the failing checklist row(s) AND/OR voice quality — "feels off" is not a finding; "violates UX-44/UX-52" or "WEAK on Q1 Draper — explains instead of making the reader feel it" is actionable.
5. **Record what is strong.** Zero instances of the veto rows is a result worth stating (it is an investor-quotable asset), and existing good patterns get named so nobody "fixes" them. Name the surfaces that PASS the rubric cleanly too — they are the reference bar for the rewrites.
6. **Route per the role table.** Output file: `docs/audit/UX_AUDIT_<scope>_<date>.md` (or `VOICE_AUDIT_<scope>_<date>.md` for a copy-only pass), archived after execution — never deleted (see the retention note in `UX_GOVERNANCE_FIX_PLAN_2026-07-10.md`).

## The F-finding format

`### F-n · <one-line defect>. — <UX-IDs> · <severity HIGH/MED/LOW> · <owner route> [· VISUAL PASS REQUIRED if applicable]`
Body: what is (verifiable state, quoted string or screenshot ref) → why it matters (the principle's logic, not vibes) → the fix (concrete, smallest honest version) → what it rides with (existing item/plan, if any).

**Worked example (real, from `UX_AUDIT_BUILT_SURFACES_2026-07-05.md`):**

> **F-5 · The all-in cost is never stated at the moment of decision. — UX-44, UX-52 · HIGH · CMO→CLO→CC.** The site states 0.48% and that third-party costs pass through at cost, but never tells a person that adding $100 by card costs ~1.48% all-in. The strongest evidence in the source corpus is that the screen volunteering the unfavourable fact converts better (UX-44, transparency bias). Fix: the confirm button carries the total, and the pass-through line appears before the action. Rides with usability C2/C3.

## Role table

| Role                         | Reads                                                   | Responsibility                                                                                                         |
| ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Founder / CMO board          | Writing System + canon + voice rubric                   | Verdicts, naming votes, gate calls, ratification; owns every voice Q-score                                             |
| Claude Code                  | This file + checklist Part 3 + canon IDs + voice rubric | Pre-PR self-check (per `CLAUDE.md` build rules); audits on request; validator upkeep                                   |
| design-reviewer agent        | Checklist Parts 1 + 3                                   | Screenshot-based visual pass; confirms/kills [VISUAL PASS REQUIRED] hypotheses; scores the image half of rubric Q1     |
| CLO board                    | Canon Appendix B + Gate 4 + rubric Q3                   | Sign-off on anything near the veto rows; projection framing (UX-47 ADAPT); every rubric Q3 (never-promise/advise) FAIL |
| CTO board                    | Canon Part 4 + UX-12/13/14/57                           | Money-product structure (bottom nav, status timelines, personalisation, thumb zone)                                    |
| Data Ops                     | `DATA_VINTAGE_POLICY.md` + UX-58                        | Data-unavailable states; every figure's date and window                                                                |
| Native reviewer (per locale) | Voice rubric, four-locale rule                          | Confirms/kills [NATIVE PASS REQUIRED] voice findings in pt-BR / es / de                                                |

## Using this in another project

Nothing above is diBoaS-specific except the finance rule's examples and the file paths. To port: copy the canon + checklist + the voice rubric + this file, replace the Appendix-C surface mappings, the veto-list examples, and the rubric's brand-specific bars with the new product's equivalents, and keep the three-layer shape (canon → enforcement → findings) plus the validator. Two non-negotiables for any money-adjacent product: **the veto rows stay blocking regardless of measured lift**, and **the never-promise / never-advise rubric checks stay blocking** — both are regulatory, not stylistic.
