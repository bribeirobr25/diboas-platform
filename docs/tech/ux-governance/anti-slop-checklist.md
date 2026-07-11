# Anti-Slop Checklist

> **Purpose:** the enforcement checklist for `docs/full-view/BRAND_POSITIONING.md` §Voice & Tone → The Writing System — the canonical definition of the diBoaS voice. This file is the mechanical pass/fail layer in four parts: visual slop (rendered UI), writing slop (copy and docs), friction & dark patterns (flows and decision screens), and detection commands. The positioning document defines the voice and **wins on any conflict**. Referenced by `.claude/agents/design-reviewer.md` (Phase 4). _(The B0 copy-audit rubric formerly at `docs/audit/FINAL_FIXES_AUDIT_PLAN.md` was removed in the 2026-07-07 cleanup; the B0 scoring format was lifted into the Writing System before removal — the rubric's canonical home is now the Writing System itself.)_
>
> **Companions:** `docs/full-view/BRAND_POSITIONING.md` §Voice & Tone → The Writing System (canonical voice source), CLAUDE.md "Anti-slop defaults" (the source for Part 1), `docs/full-view/FEES.md` (fee truth).

## Part 1 — Visual slop (frontend)

Avoid these unless a brand rule explicitly allows them:

- Default purple or blue startup gradients, or shiny "AI orb" decorations.
- Gradient profile circles with initials as decoration.
- Pure black (#000) or pure white (#FFF). Use palette-derived neutrals.
- Repeated KPI strips showing the same data in several places.
- Card soup: many cards of equal weight with no hierarchy.
- Mixed icon families or inconsistent icon weights. Use the project `LucideIcon` only.
- Emoji used as UI icons.
- Empty or decorative charts that communicate nothing real.
- Uniform heavy border-radius with no variation.
- Hierarchy built only from colored boxes instead of typography and spacing.
- Generic SaaS layout templates repeated across screens.
- Fake metrics, fake workflows, fake pricing, or hallucinated features.
- Placeholder copy ("Lorem ipsum", "Acme Inc") in any deliverable.
- Legacy fee figures (0.75%, 0.12%, 0.09%, subscription tiers). Current fees live in `docs/full-view/FEES.md`.

## Part 2 — Writing slop (copy and docs)

The goal: copy that reads as if a thoughtful person wrote it for one specific reader (Adelaide), not text a model produced. The tells below are what make writing feel machine-made.

### Punctuation and symbols

- **Emoji: none in product copy.** Not in headings, body, buttons, or as bullet markers. (Internal status docs may use a small, consistent set, but never page copy or translation strings.)
- **Em-dash (—): use sparingly.** Heavy em-dash use is the most common AI tell. Prefer a comma, a period, a colon, or parentheses. A rough ceiling: at most one em-dash per paragraph, and most paragraphs should have none.
- No decorative separators in prose (middot ·, bullets inside a sentence, arrows → as connectors).
- No exclamation-mark inflation. One is plenty for a whole page; usually zero.
- Straight quotes and apostrophes, used consistently (do not mix straight and curly).
- Avoid Title Case On Ordinary Phrases. Use sentence case for headings and labels.

### Vocabulary to avoid (AI house-style)

delve, dive into, unlock, elevate, seamless / seamlessly, robust, leverage (as a verb), supercharge, empower, embark on a journey, navigate the world of, in today's fast-paced world, it's important to note, needless to say, rest assured, look no further, game-changer, cutting-edge, at the end of the day, when it comes to, the world of X, take it to the next level. For diBoaS specifically, also avoid the finance and crypto jargon banned by the Phase-7 list and the Voice and Tone section of BRAND_POSITIONING.md (yield, stablecoin, hedge, APY, DeFi, blockchain in body copy).

### Sentence shapes to avoid

- The "It's not just X, it's Y" / "X isn't only Y, it's Z" construction.
- Rule-of-three triads stacked back to back (every list and sentence in threes).
- "Not only... but also" and other over-balanced parallelism.
- Empty opener and closer sentences that restate the heading or summarize nothing.
- Uniform sentence length. Vary rhythm; let some sentences be short.
- Hedging stacks ("may potentially sometimes help in certain cases").

### Substance

- Concrete beats generic. "Keep your 13º salário safe from inflation until December" beats "earn competitive returns."
- No fabricated specifics: invented numbers, percentages, names, dates, or features. Every claim traces to FEES.md or confirmed product reality.
- Say it once, clearly. Do not repeat the same point in three phrasings.

## Part 3 — Friction & dark-pattern checks (Lens 4 + Gate 4)

Enforces `BRAND_POSITIONING.md` §Voice & Tone → The Writing System, Lens 4 and Gate 4. Principles and evidence: `docs/tech/ux-governance/UX_PRINCIPLES_CANON.md`. Run against any flow, form, selector, or decision screen. State PASS / FAIL / N/A per row.

**Friction (Lens 4) — should PASS**

1. **Defaults.** Every multi-field form pre-fills what is neutral and knowable (date, locale, currency, a mid-range horizon). No field asks for a decision the product can already make. [UX-06]
2. **Never zero.** No progress indicator shows 0% where a step has already been completed. Momentum is real, not celebrated with emoji or hype. [UX-07]
3. **Give first.** Real value is delivered before the first ask. (The hostage variant — a computed result hidden behind a signup — is veto row 15; score it there, not here.) [UX-08]
4. **Number, not range.** Any figure that can be resolved to a single number is shown as one. A resolvable range is doubt, not transparency. [UX-47]
5. **Specificity.** Round or vague figures ("low fees", "200+", "fast") are replaced with real measurements ("0.48%, capped at $250", "221", "two taps"). [UX-34, UX-46]
6. **True thing sooner.** The fee appears before the button; the risk sits beside the choice it qualifies; the button carries the all-in total; the top objection is answered in one line where it arises, not in an FAQ. [UX-37, UX-39, UX-44, UX-52, UX-53]
7. **Visible options.** Dropdowns are replaced by swatches, chips, or segmented controls wherever there are ≤5 choices. [UX-36]
8. **Input method.** Sliders/wheels only for casual, one-time, bounded inputs; text fields, steppers or numeric keypads for precise or repeated entry. [UX-16]
9. **Hierarchy.** The value is more prominent than its label; one primary action per screen. [UX-01, UX-02]

**Dark patterns (Gate 4) — any YES is a FAIL, no exceptions, regardless of measured lift. Rows 10–17 are THE canonical veto list: `BRAND_POSITIONING.md` Gate 4 and canon Appendix B are narrative forms of these rows and defer to them on any drift.**

10. Is there manufactured urgency, a countdown, or threat framing about the person's money? (Real, factual deadlines stated plainly are fine.) [UX-10]
11. Is there volume or herd social proof on a financial product ("500+ bought this week")? [UX-35]
12. Is there a status or performance badge on a strategy, goal, or asset ("most popular", "best performing")? [UX-32]
13. Does any default, pre-selection, tint, or visual emphasis favour the option that earns diBoaS more? [UX-06 finance rule, UX-38]
14. Are returns or projections anchored against another number, or is any reference price fabricated? [UX-11, UX-54]
15. Is a real, computed result hidden behind a signup wall? [UX-08]
16. Does any button verb disguise what is about to happen to the money? [UX-41]
17. Is any selection card tinted, tagged, or pre-selected in favour of the higher-fee or higher-risk option? [UX-55]

**Additional friction rows (Lens 4) — should PASS**

18. **Interaction cost.** Value is exposed directly, not hidden behind a promotional banner or an extra tap. [UX-56]
19. **Empty states.** No screen dead-ends. Every empty or unavailable state states the benefit, gives a next step, and offers one clear action — including data-unavailable states on `/market`. [UX-58]
20. **Visual cues clarify, never decorate.** Icons come from the design system; no emoji. [UX-59, Gate 3]
21. **Build before commitment.** Where a signup or email ask exists, the person configures or creates something of their own first (a goal, a plan, a result) — the wall never precedes the work, and the ask's button names the continuation ("Continue to save your plan"), never a bare "Sign up". What people build, they don't abandon. [UX-09]

## Part 4 — Detection commands

**One portable command runs all four checks** (replaces the former raw greps — CC-4,
`UX_GOVERNANCE_FIX_PLAN_2026-07-10.md`; the old `grep -P` commands failed on stock macOS grep
and their hand-rolled ranges missed whole emoji blocks — ⭐, 🪙, flags, ⏰):

```
pnpm check:ux-greps        # → node scripts/check-ux-greps.mjs
```

What it checks (severities encoded in the script):

1. **Emoji in component files** — hard FAIL on characters that render as emoji by default
   (Unicode `Emoji_Presentation` / VS16); text-default pictographs used as glyph-icons
   (`↗`, `▶`…) are reported as leads (design-system finding: use `LucideIcon`), not build
   failures. `.stories.` fixtures excluded. Escaped forms (`▼`, `\u{1F600}`) are
   decoded and scanned too — a literal-only scan missed one (2026-07-10).
2. **Emoji in translation strings** — same rule, all locales.
3. **Em-dash density per locale** — hot-spot review, never a fail.
4. **Hardcoded-English heuristic** — leads only (the heuristic only sees JSX text on lines
   carrying `className`; absence of hits is not absence of violations).

The structural drift guard for THIS governance layer (canon ID sequence, checklist↔canon
citation integrity, veto-list parity, dead references, blocking-range consistency) is
`pnpm validate:ux-canon` — wired into `pnpm validate:all` (skips gracefully where the
untracked governance files are absent, per founder ruling G-1 2026-07-10).

## How to use it

For a rendered page, run Part 1 against screenshots and the accessibility tree, and state PASS or FAIL per item. For copy and docs, run Part 2 against the actual strings. For any flow, form, selector, or decision screen, run Part 3 — a FAIL on rows 10–17 blocks the change regardless of anything else. Run Part 4 to find emoji and em-dash hot spots. Findings feed the relevant audit (design review, or the B0 copy audit). Operating protocol (build mode / audit mode / finding format): `docs/tech/ux-governance/UX_GOVERNANCE_USAGE.md`.
