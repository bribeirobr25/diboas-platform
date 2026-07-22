# Voice Rubric — the scorable gate for diBoaS copy

> **Created:** 2026-07-12 · **Author:** CMO board (Chat 01), Session 030 · **Status:** operational gate, companion to `UX_PRINCIPLES_CANON.md`.
> **Derives from and defers to:** `docs/full-view/BRAND_POSITIONING.md` §Voice & Tone → The Writing System. That document defines the voice; this one scores it. On any conflict, the positioning document wins.
> **What this is:** the positive, scorable form of the four voice qualities — used two ways: as a **build gate** (score new copy before it ships) and as an **audit gate** (score existing copy, in any of the four locales, to find what to improve).
>
> **What this is NOT:** a script. Voice is not mechanically checkable — no validator can decide whether a paragraph makes someone feel something or reads as a promise. This rubric is applied by a reasoning pass (a person, or Claude given this file). The mechanical layer it sits beside is different: `anti-slop-checklist.md` Part 2 catches machine-generated _tells_ (em-dashes, banned vocabulary, triads) with `pnpm check:ux-greps`; Part 3 catches friction and dark patterns. This rubric catches the thing those cannot: whether the copy is _good_ by diBoaS's own definition of good.

## The north star this rubric serves

**The reader should finish the copy wanting to live the experience diBoaS offers.** Every score below is ultimately a proxy for that one outcome. A surface can pass all the plain-language rules and clear every gate and still fail here by being correct and lifeless. When in doubt, ask the only question that matters: _does this make someone want it?_

---

## The four qualities, scored

Score each **PASS / WEAK / FAIL** per quality, per surface. WEAK means "on-brand but not yet alive — improve before ship." Any FAIL on Q3 (the three nevers) is a **blocker**, exactly like a veto row in Part 3 — a promise or a piece of advice about someone's money is not a style preference, it is a truth-and-regulatory breach.

### Q1 — Draper: does it make the reader feel something?

- **PASS:** the copy makes the reader feel their own life — a need, a worry, a relief — before or instead of naming a feature. It sells the hole, not the drill. One big idea, felt.
- **WEAK:** benefit-led but generic; true and pleasant but it doesn't land in the body. "Grow your money with confidence" — fine, forgettable.
- **FAIL:** feature-led explanation; a spec sheet in prose. "diBoaS uses MPC wallets and DeFi protocols to generate yield."
- **The bar (shipped copy):** _"The future doesn't arrive all at once. It shows up as rent. As an emergency. As a plan you keep putting off."_ No feature named; the reader feels their own postponed life. That is PASS.
- **Images too:** a photograph is scored on the same question — does it make the reader feel something true (the golden-hour horizon, the open notebook beside an old family photo), or is it decorative stock manufacturing a mood the words didn't earn? Decoration is WEAK; a mood the copy contradicts is FAIL.

### Q2 — Adelaide: normal language, her reality, never patronising

- **PASS:** a 65-year-old non-technical reader understands it and trusts it; plain-language swaps hold (earn/goal/digital dollar, no DeFi/APY/blockchain in body); it respects a smart adult who was failed by the system — and it reads as **a peer trading ideas, not a teacher giving a lesson** (a friend who says "here's how this works, you decide," never "let me teach you what to do").
- **WEAK:** a stray technical term that has a plain-language equivalent; slightly stiff or over-formal, but comprehensible.
- **FAIL — two directions, both fail:** (a) **jargon wall** — "hedge against currency debasement via non-custodial stablecoin exposure"; OR (b) **patronising** — baby-talk, over-explaining the obvious, a "don't worry your head" tone, or **lecturing from above** (a teacher-to-student hierarchy — "today you'll learn…" — instead of a peer trading ideas). Adelaide was failed by the system, not by her own intelligence; talking down to her is as much a failure as talking over her.
- **The bar (shipped copy):** _"She saved with discipline. With care. With trust. The system gave her low returns, little explanation, and almost no access to better options."_ Plain, warm, and it treats her as capable. PASS.

### Q3 — The three nevers: never selling, never promising, never advising (BLOCKER on FAIL)

_Regulatory anchor (CLO-verified 2026-07-20, D-2 LIGHT): the never-promising / never-"safe-or-guaranteed" instinct is the mainstream financial-conduct standard, not diBoaS eccentricity — R-1 (ESMA over-optimistic-wording ban) + R-2 (FCA "fair, clear, not misleading" / restricted "guaranteed/protected/secure"). Supporting authority, not a binding gate on diBoaS. Full wording: `docs/tech/ux-governance/UX_PRINCIPLES_CANON.md` Appendix E._

- **PASS:** states what is true and leaves the decision with the reader. Upside always travels with its risk. No "you should," no guarantee, no pressure.
- **FAIL — selling:** manufactured urgency, "don't miss out," pushing the click. (Also a Part-3 veto — cross-check rows 10–17.)
- **FAIL — promising:** any guarantee of return, safety, or outcome, explicit or implied. _"Your money works while you sleep"_ is a promise (it implies reliable, effortless gain); it must be balanced or cut. Watch the shipped `howItWorks.step2` line for exactly this.
- **FAIL — advising:** "you should," "the smart move," "the right choice is" — diBoaS is not the reader's advisor and never speaks as one.
- **The bar (shipped copy):** _"diBoaS does not promise to fix your life. It helps you separate money by what it is meant to do, understand the path, and see the risk before you decide."_ Names the non-promise out loud, then hands the decision back. PASS. This is the single clearest example in the product of the three nevers done right.

### Q4 — The want: does the reader finish wanting the experience?

- **PASS:** having read it, a real person in the target market would want to try it — the door is open and they want to walk through.
- **WEAK:** they understand and approve, but feel no pull. Informational success, emotional zero.
- **FAIL:** they finish cold, confused, or vaguely distrustful. (Often a downstream symptom of a Q1 or Q2 fail.)
- **Note:** Q4 is holistic — it's the whole surface, not a line. Score it last, after Q1–Q3, as the gestalt check. It is the north star wearing a checkbox.

---

## How to use it — BUILD mode

Before new copy ships, score the surface Q1–Q4. Target: **PASS on all four.** A WEAK is a rewrite note, not a block, except that shipping WEAK-heavy copy is how a site drifts lifeless one acceptable sentence at a time. A Q3 FAIL blocks, always. Record the scores in the PR or the copy doc, the same way Part 3 rows are cited.

## How to use it — AUDIT mode

Point the rubric at existing copy — one namespace, one page, or the whole site. For each surface: score Q1–Q4, then write findings in the F-format from `UX_GOVERNANCE_USAGE.md`, citing the quality that fails. "This hero is WEAK on Q1 — it explains the product instead of making the reader feel the need" is actionable; "the copy feels flat" is not. Findings route to the CMO board for rewrite; Q3 FAILs also route to CLO (promise/advice is a regulatory surface, not only a brand one).

## The four-locale rule (this is where audits go wrong)

The rubric travels; the _judgment_ does not translate. Three hard rules for scoring pt-BR, es, and de:

1. **Score each locale in its own register, never against the English.** A line that is warm in English can be cold or childish in German. "Never patronising" is a cultural judgment — the German `du`-register, Brazilian warmth, peninsular-Spanish formality each have their own line between friendly and condescending. Do not port the English verdict.
2. **A perfect translation can still fail the rubric.** Faithful to the English and still flat in the target language is a real, common finding — flag it. The English is the source of _meaning_, not the ceiling of _quality_; each locale must make its own reader feel something.
3. **Where you lack native fluency, say so.** A non-native scoring pass produces _hypotheses_ — "this pt-BR line reads WEAK on Q1 to me, needs a native check," not a verdict. Mark locale findings that need a native-speaker confirmation, the same way visual findings are marked [VISUAL PASS REQUIRED]. Tag: **[NATIVE PASS REQUIRED]**. This keeps an audit from quietly imposing English voice on three other cultures — which would itself violate Q2.

## Worked example — one surface, four scores

Surface: the shipped `draper.founder` section (EN).

- **Q1 Draper — PASS.** "Adelaide saved. The system never explained." A whole thesis felt in five words.
- **Q2 Adelaide — PASS.** Plain, warm, treats her as capable; no jargon, no baby-talk.
- **Q3 nevers — PASS.** No sell, no promise, no advice; it explains a motivation, it doesn't push.
- **Q4 want — PASS.** A reader who recognises Adelaide in their own family finishes wanting the thing built for her.
  Verdict: ship. This section is the reference standard — when scoring anything else, ask whether it clears the bar this one sets.

## Ownership

CMO board owns this rubric and every Q-score. CLO co-owns Q3 FAILs (promise/advice = regulatory). The design-reviewer applies the image half of Q1 during its visual pass. Native-speaker confirmation for [NATIVE PASS REQUIRED] locale findings is a founder/CMO action (or a trusted native reviewer per locale).
