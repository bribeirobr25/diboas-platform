# Asset Compliance Checklist — generated images & video frames

> **Purpose:** the pass/fail gate for **rendered marketing assets** — social/campaign images, video frames, thumbnails, banners — distinct from `anti-slop-checklist.md` Part 1, which governs the **web-app UI**. This is where AI-generated brand imagery is checked before it ships.
> **Derives from and defers to:** `docs/full-view/BRAND_POSITIONING.md` §Voice & Tone → The Writing System (the canonical brand definition). On any conflict, that document wins.
> **Companions:** `anti-slop-checklist.md` (Part 3 rows 10–17 are the canonical veto list — referenced here, never redefined), `VOICE_RUBRIC.md` (on-image copy is scored there too), `UX_PRINCIPLES_CANON.md`, `docs/full-view/FEES.md` (fee truth), `CLAUDE.md` "Anti-slop defaults".
> **How it is applied:** a reasoning pass — by the design-reviewer and/or Claude — over each rendered asset before publish and after every regeneration. Like the Voice Rubric, it is judgment, not a script. Findings go to a dated `docs/audit/…` file.
> **Created:** 2026-07-13, from the Week-2 campaign image audit. **This file is append-only:** new failure modes get added to the checklist and the findings log as they are discovered.

---

## 0. Source-of-truth assets — never invent these

| Thing                          | Canonical source                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logo / wordmark**            | Official source PNGs: `apps/web/brand-source/` (`logo-light-palette.png`, `logo-dark-palette.png`, `logo-icon.png`, `favicon.png` — moved out of the served tree 2026-07-16, F-BRAND). Served derivatives: `apps/web/public/assets/logos/logo-icon-monogram.avif` + `logo-wordmark-{onlight,ondark}.{avif,webp}`; favicon `apps/web/public/favicon.ico`. The mark is the **"diBoaS" wordmark whose B is a teal-gradient icon containing a negative-space palm tree**. Casing is exactly **diBoaS** (d-i-B-o-a-S).                                                                                                                                                            |
| **Brand colors**               | `apps/web/src/styles/design-tokens.css` — teal-primary: `--brand-primary #14b8a6`, `--brand-primary-dark #0d9488`, `--brand-logo #02c3cf`; deep ink-teal `--accent-ink #0b1f24`; cream/slate neutrals. **No gold** — founder ratified teal campaign-wide (2026-07-13); gold is not used in any campaign asset.                                                                                                                                              |
| **Fees / any figure**          | `docs/full-view/FEES.md` — the ONLY source. 0.48% ramp (B2C caps $250/€250/R$250; B2B none) · 0.39% exit (cap $25) · invest/send/swap FREE. There is no "cost of funds," no "platform fee," no "success fee."                                                                                                                                                                                                                                               |
| **Founder character (BAR)**    | `docs/socials/avatar/bar/` — `BAR_PERSONA.md` + reference images (`bar-front.png`, `bar-portrait.png`, `bar-side.png`, `bar-profile.png`, `bar-storyboard.png`) + voice (`voice_en.mp3`, `voice_br.m4a`). Use for any asset featuring the founder/narrator.                                                                                                                                                                                                 |
| **Adelaide (the grandmother)** | **Intentionally NOT a fixed character.** Adelaide is represented by _different_ grandmothers depending on culture, moment, post, and audience — the idea is she could be the viewer's own grandma. The only constants: a **dignified, capable elderly grandmother, culturally appropriate to the post/locale, never frail or pitiable**. No fixed face, no character sheet. (`week_2_ig_2.png` is a good example of the _treatment_, not a master to copy.) |
| **Positioning line**           | "Your side-pocket for wealth creation — goal-driven, powered by the digital dollar." No invented alternative taglines.                                                                                                                                                                                                                                                                                                                                      |

---

## 1. The checklist — score PASS / FAIL / N/A per asset

### Group A — Truth & compliance (any FAIL blocks publish)

1. **No fabricated numbers.** No invented fees, percentages, returns, balances, runway figures, projections, regime scores, ratings, or user counts rendered anywhere (headline, card, prop, screen, paper). A real figure appears only if it is from `FEES.md` and placed deliberately. [RT-C class]
2. **No product-boundary violations.** The asset never depicts diBoaS as credit / lending / BNPL / a working-capital facility / a payment processor / a "cost of funds" or treasury-desk product. (`BUSINESS.md`: "Credit / BNPL / lending — permanently excluded." B2B = idle-cash yield + payment-fee visibility, never a facility.)
3. **Veto rows apply to rendered content.** No manufactured urgency/countdown, herd/volume proof, star ratings, status/performance badges, or "guaranteed / risk-free / safe / passive income / limited-time" — **even inside a parody or "bad example."** (`anti-slop-checklist.md` Part 3 rows 10–17.)
4. **The three nevers on any on-image copy.** Never selling, never promising, never advising. (`BRAND_POSITIONING.md` Gate 1; scored via `VOICE_RUBRIC.md` Q3.)
5. **Regulatory.** Any claim that requires a per-locale disclaimer does not sit on the image without it (MiCA / CVM / FTC).

### Group B — Brand identity (FAIL = fix before publish)

6. **Logo is the official palm-tree-B mark** from the asset files above. No invented marks (no door, leaf, book, infinity, diamond, monogram). Wordmark casing is exactly **diBoaS**, undistorted.
7. **Colors trace to `design-tokens.css`** (teal-primary + ink-teal + cream/slate). No off-brand palettes, and **no gold** (founder ratified teal, 2026-07-13).
8. **No invented positioning taglines** (e.g. never "Decision Intelligence for Fintech," "Know First. Decide Better.," "Finance · Governance · Control," "Governança que dá sustentação"). Use the canonical line or none.
9. **One visual system per platform family**; typography consistent within it.
10. **Character rules.** **BAR is fixed** — the same recognizable founder across every asset, per `BAR_PERSONA.md`. **Adelaide is deliberately variable** — a dignified elderly grandmother appropriate to the post's culture/audience (she can be the viewer's own grandma), so the check is "reads as a fitting, dignified grandmother," not "same person." Neither should ever appear frail, pitiable, or off-age (Adelaide is never young).

### Group C — Voice & craft

11. **On-image copy follows the Voice Rubric register** — plain, felt, concrete; custody as "your keys, your call," not "non-custodial"; no yield/APY/DeFi/blockchain.
12. **Locale correctness** — pt-BR spelling and accents correct; the canonical line is respected (e.g. Adelaide: "A Adelaide guardava. O sistema não explicava." — imperfect tense, no number).
13. **Correct campaign labels** — day/week numbering matches the founder calendar (no stray "Day 3" on a Week-2 post).
14. **No decorative analytics** — no charts, graphs, donuts, or rising-arrow icons that communicate nothing real. (`anti-slop-checklist.md` Part 1.)
15. **Legibility & artifacts** — no warped wordmark, no garbled or misspelled text, no mangled hands/faces; sufficient contrast (avoid low-contrast gold-on-green sub-text); text readable at feed size.
16. **Correct platform ratio & safe zones** for the destination (LinkedIn, X, Instagram feed/story/reel).

---

## 2. How to route findings

Write findings in the F-format from `UX_GOVERNANCE_USAGE.md`, tagged **[VISUAL PASS REQUIRED]** when made from a description rather than the render. Group-A FAILs are blocking. Verdicts per asset: **KEEP** (ships as-is), **REVISE** (targeted fix — usually logo/label/prop), **REGEN** (recompose). Route Group-A near the veto rows to CLO; brand-identity calls (logo, palette, tagline) to the CMO board; character sheets to the founder/design-reviewer.

---

## 3. Findings log (append-only — do-not-reintroduce)

**2026-07-13 — Week-2 campaign images** (`docs/socials/30days-campaign/images/week2/`, 18 assets). Full audit: memory `campaign-image-asset-findings.md`.

- **Invented logo marks** on every asset (door / leaf / book / infinity / diamond / circle-slash) instead of the real palm-tree-B. _Do-not-reintroduce: use only the official logo files._
- **Off-brand palette** — forest-green + prominent gold vs the canonical teal-emerald + ink-teal. _Resolved 2026-07-13: founder ratified teal campaign-wide; no gold._
- **Fabricated financial figures** — L6 "1.18% p.a.", X5 "1.42% cost of funds / T+1", X6 "0.35% total cost." None are diBoaS fees.
- **Product-boundary violation** — L6 "Working Capital Facility," X5 "Payment Partner Decision / cost of funds" depict a credit/treasury product diBoaS permanently excludes.
- **Rendered banned claims** — X4's "hype" parody printed "GUARANTEED / RISK-FREE / 100% Risk-Free / LIMITED TIME / ★★★★★ / GET IT NOW." _Never render the veto claims, even as a bad example._
- **Invented taglines** — "Decision Intelligence for Fintech" (X5), "Know First. Decide Better." + "#KnowFirst" (X6), "Governança que dá sustentação" (IG5), "Finance · Governance · Control" (L6).
- **Adelaide portrayal** — rendered as a ~35-yr-old (X2 — wrong: she must be an _elderly grandmother_, though intentionally a different one per post) and pinned to the past with a fabricated "1962–1987" date on a savings book (L2 — wrong: no numbers/dates on props). Adelaide is a variable grandmother by design; the failures are "not elderly" and "fabricated date," not "inconsistent face."
- **Day-label drift** — "Day 3/4/5" (L4/5/6), "Day 4"/"Dia 4" (X5/IG5) on Week-2 posts.
- **Decorative charts** as props/icons (donuts, bars, rising arrows) across several otherwise-strong assets.

---

**2026-07-13 — Week-2 MOTION storyboards + scene frames** (`docs/socials/30days-campaign/motion/week2/`, 90 frames = 5 videos × 3 platforms × 6 frames). Verdict: **15/15 REGEN — not usable as motion-video reference.** They contradict the rewritten motion prompts (which mandate labels-only/teal/logo-by-hand) and would bake violations into the generated video.

- **Rendered yields / returns / "outperformance" / benchmark-beating** (Beat 7: "Yield 4.28%/4.82%", "Projected earnings $502,840", "vs Benchmark +1.12%", Base/Best/Stress FP&A model with revenue-growth/margin/probability). _Worst class — promise-of-return; three-nevers breach. Never render a yield, return, projection, or "beats benchmark."_
- **"Protected / safe" claims** (IG Beat 6: "caixa protegido / PROTEGIDO" + shields). Never render "protected/safe money."
- **Fabricated figures at scale** — balances, fees ("Cost 2.1% Est. annual drag"), account tables, BRL amounts, everywhere.
- **Treasury-desk / FP&A repositioning** — "Invest Excess to MMF", "treasury decisions", revenue-growth/gross-margin models. diBoaS is a side-pocket + simple cash tool, not corporate FP&A/treasury.
- **Bloomberg-terminal aesthetic** (IG Beat 6 trading-room) — directly violates BRAND_POSITIONING ("the opposite of a Bloomberg terminal"). _Add: no trading-desk / multi-screen terminal environments._
- **Logo:** invented sunburst / hexagon-layers / "db" monogram AND a mangled **"diBoa$"** (dollar-sign S). "DIBOAS" all-caps. None is the palm-tree-B.
- **Gold-heavy** (production notes bake in "Sunrise-Gold") vs canonical teal.
- **"Yield" vocabulary rendered** (banned; use "earn"). Invented tagline "Cash. Rules. Clarity."
- **Severity gradient (not flat):** LinkedIn beats worst (FP&A/yield/benchmark/treasury); X/IG beats = fabricated consumer-calculator outputs + projected returns + scenario rates that don't match the real tools (showed 5.2/7.2/9.2%, real is 7/10/14%); X/IG _openings_ least-bad (label-led). All 15 still REGEN. Extra invented tagline: IG "Inteligência para decisões reais."
- **Right template exists in-set:** the X and Instagram _opening_ boards are concept/label-led with almost no fabricated numbers — regenerate everything to that approach. Beat labels ("Week 2 · Beat 5–8") were accurate (unlike the image set's day-drift).
- **Craft note:** GPT Image 2 mangles clean product-UI/labels — build UI-heavy frames (dashboards, calculators, wallet, split) in a design tool with label-only content; use GPT Image 2 for the photographic/mood frames.

**2026-07-13 — Week-2 VIDEO storyboards + scene frames** (`docs/socials/30days-campaign/videos/week2/`, ~90 frames: intro + 4 posts × 3 platforms × 6). Verdict: **13/13 REGEN — contains the worst asset in the campaign.**

- **CREDIT-LINE PRODUCT (LinkedIn Post 3) — hard stop.** "Scenario Comparison: Equity / Revenue Share / **Credit Line**" + **"Recommended Path: Credit Line."** Violates the permanent no-lending boundary (BUSINESS.md), **advises** (recommends a financing option), fabricates numbers, and self-contradicts ("We're not here to lend"). _Never depict diBoaS recommending or offering any financing/credit/capital option._
- **Wrong-category tagline** — IG intro "**Gestão de Compras Inteligente**" (procurement management); also "Clarity. Confidence. **Capital**." Never describe diBoaS as procurement/capital/financing.
- **Rendered crypto-hype terms** — X Post 3 shows "APY 999% / 100x / MOON / LFG" (even to reject them). Never render banned hype terms; "APY" is banned vocab.
- **Fabricated financial dashboards** — intro ($1,342,884 / Idle $432,520 / Runway 18 days), Post 3 ($1.2M / $320K–$480K).
- **Palette** — emerald/forest green + navy (L/X), gold/amber (IG) — not the ratified teal.
- **Invented logos** ("d.", green chevron, green wordmark) — not the palm-tree-B. Invented taglines ("Cash. Clarity. Confidence." etc.).
- **BAR absent** — the founder/origin track never establishes the canonical BAR (navy blazer/white tee/"vida" neck tattoo/AF1s per `docs/socials/avatar/bar/BAR_PERSONA.md`); regen must introduce a consistent BAR as narrator.
- **Adelaide ~50s** (LI Post 1) — too young; must be clearly elderly. **Locale-prop mismatch** — Portuguese "POUPANÇA" jar on the EN LinkedIn post.
- **Severity gradient:** LinkedIn worst (credit line + fabricated dashboards + terminal); X milder/closest to salvageable (conceptual, but renders "APY 999%"); IG moderate (warm, but wrong "procurement" tagline + gold).

## Ownership

CMO board owns brand-identity rows (6–9) and every asset verdict. CLO co-owns Group-A rows near the veto list and the three nevers. The design-reviewer applies this checklist during its visual pass and owns character-continuity confirmation. The founder settles character canon (Adelaide portrayal). Palette is settled: teal, no gold (2026-07-13).
