# UX & UI Principles Canon — distilled for diBoaS

> **Created:** 2026-07-05 · **Author:** CMO Board (Chat 01), Session 028 · **Status: RATIFIED by founder 2026-07-10**, as amended (see Appendix D, 2026-07-10 entry). This document is now binding canon; the DRAFT-while-enforced contradiction is closed.
> **Provenance:** distilled from **seven** YouTube UX/UI teardown videos captured to `docs/ui-ux/ux-tips-{0..6}/` (transcript + screenshots, captured July 2026). Source files are retained as optional illustration; **this document is self-contained and remains valid if they are removed.** Sponsor/marketing content in the sources (playbook and tool promotions) is excluded as noise.
>
> **Source map (authoritative — Part numbers are NOT directory numbers):**
>
> | Part | Source directory | Topic                                                                        |
> | ---- | ---------------- | ---------------------------------------------------------------------------- |
> | 1    | `ux-tips-1`      | Visual craft                                                                 |
> | 2    | `ux-tips-0`      | Conversion psychology (6 principles)                                         |
> | 3    | `ux-tips-3`      | Advanced UX                                                                  |
> | 4    | `ux-tips-4`      | Bottom navigation                                                            |
> | 5    | `ux-tips-5`      | Product-page conversion                                                      |
> | 6    | `ux-tips-6`      | Three A/B teardowns                                                          |
> | 7    | `ux-tips-2`      | UI patterns (cards, interaction cost, thumb zone, empty states, visual cues) |
>
> **Verification note (2026-07-05):** transcripts for all seven sets were read in full from disk. Screenshots were visually inspected for sets `ux-tips-0` (via founder paste), `-1`, `-3`, `-4`, `-5`, `-6`. The eight screenshots in **`ux-tips-2` could not be rendered for inspection**; Part 7 is derived from that set's transcript only, and its visual specifics are correspondingly less detailed. Flagged rather than papered over.
> **Authority:** subordinate to `docs/full-view/BRAND_POSITIONING.md` §Voice & Tone → The Writing System (canonical voice + Lens 4) and to `FEES.md` / CLO gates. Where a principle here conflicts with those, they win.
> **Evidence discipline:** statistics asserted in the sources are recorded as **[CLAIMED — unverified]**. Every principle stands on its own logic without them. Do not quote these figures in investor, marketing, or product material without independent verification.

## How to read this

Each principle has an ID, the rule, the concrete before/after evidence, and a **verdict**:

- **ADOPT** — use freely; consistent with diBoaS values.
- **ADAPT** — use, but under a named gate (CLO, board vote, or the Truth gate). The mechanism is sound; the source's execution is not.
- **REJECT** — do not use. Prohibited pattern for a money product.
- **DEFER (money product)** — not applicable to the marketing site; input to the money-product build (CTO board). Recorded so nothing is lost.

---

# Part 1 — Visual craft (`ux-tips-1`)

**UX-01 · Differentiate information with size, weight, colour and icons. — ADOPT**
Presenting every field as an identical label/value pair produces no hierarchy and forces the reader to scan everything. Evidence: a property card listing `Type:`, `Price:`, `Location:`, `Size:`, `Bedrooms:`, `Bathrooms:` in uniform rows, versus the same data with the price as the largest element, a "For sale" status pill, the address de-emphasised with a location icon, and specs reduced to icon + number ("1634 sqft · 5 bed · 3 bath"). Same information, half the reading effort.

**UX-02 · Rank content by importance before designing; emphasise the value, not the label. — ADOPT**
Evidence: three metric cards where "Earnings / Sales / Views" are set large and the figures small, versus the inverse — labels small and grey, `$4,981.00`, `591`, `2,121` large and white. Users came for the numbers. This is the most direct fix for any dashboard, calculator result, or comparison table.

**UX-03 · Use soft shadows, not harsh ones. — ADOPT (design-reviewer)**
Evidence: `X:0 Y:0 Blur:48 #9F9F9F` (heavy, flat, dated) versus `X:0 Y:12 Blur:48 #E9E9E9` (light, offset downward, natural depth).

**UX-04 · Tint the shadow toward the background colour. — ADOPT (design-reviewer)**
On a lavender background, a neutral grey shadow (`#C7C7C7`) reads as dirty and breaks harmony; a purple-tinted shadow (`#CFC9DD`) at identical offset and blur blends. Rule: never pure grey or black shadows on a coloured surface.

**UX-05 · Test presentation, not just the product. — ADAPT (Truth gate)**
The source improved a book cover's conversion by showing the product in context and then by revealing actual interior pages — transparency about the contents outperformed decoration. Conversion figures **[CLAIMED — unverified: 22% → 48%]**. The transferable rule: showing the real thing beats depicting it abstractly. diBoaS analogue: real product screens on `/`, not illustrations of screens.

---

# Part 2 — Conversion psychology (`ux-tips-0`)

**UX-06 · Smart defaults: pre-select the most common choice. — ADAPT (Truth gate; see the finance rule below)**
Evidence: a restaurant booking form with five empty fields and a disabled button, versus the same form pre-filled with "Tomorrow, Fri 25 Mar", 7:00pm (from a row of popular times), 2 guests, "Indoor", and an enabled button reading "Search 12 Available Tables". Defaults are read as recommendations. **[CLAIMED — unverified: 70–90% of users never change a default; a jam display of 24 flavours converted 3% vs 30% for six flavours — note the jam study has failed multiple replication attempts.]**

> **THE FINANCE RULE (binding, applies to UX-06, UX-38, UX-55).** In a money product a default is an implicit recommendation, and a recommendation is a regulated act. **Defaults must optimise for the user's safety, never for diBoaS revenue.** Pre-fill what is neutral (date, currency, locale, a mid-range time horizon). Never pre-select the higher-fee route, the higher-risk strategy, or the larger amount. Where no neutral default exists, present the conservative option first, unselected.

**UX-07 · Goal gradient: never start a user at zero. — ADOPT**
Evidence: an identical profile form showing "0% Complete" with five empty dots, versus "20%" with the first step ("Sign up") already checked and labelled. No extra work was done; account creation was simply counted as step one. **[CLAIMED — unverified: a car-wash loyalty card with 10 stamps of which 2 were pre-filled produced nearly double the completion rate of an 8-stamp empty card, for the same 8 washes required.]** LinkedIn's profile-strength meter is never at zero.
_Execution note:_ the source's screen used a 🎉 emoji, a 🔥 emoji and "You're doing great!". The **principle** transfers; that execution fails our no-emoji and no-hype rules. Ours must be quiet: "Step 1 of 5 complete."

**UX-08 · Reciprocity: give real value before asking for anything. — ADAPT (hard boundary below)**
Evidence: an SEO tool that blurs the report behind "Sign up to unlock", versus one that shows the real score (72/100), the three critical issues, five warnings and eight passes, then offers to save the full report. **[CLAIMED — unverified: free samples lift purchases up to 2,000%.]**
**Boundary:** the _hostage_ variant — computing a real result and then hiding it — is prohibited. Give the number, then invite.

**UX-09 · Endowment / IKEA effect: let people build before they commit. — ADOPT**
Evidence: a signup wall (email, password, "Sign up") versus a "Design Your Profile" step where the user chooses name, title, colour palette and card style, with the button reading "Continue to sign up". Duolingo: language, goals and first lesson all precede account creation. What people build, they don't abandon.

**UX-10 · Loss aversion via manufactured threat. — REJECT**
Evidence: a storage app's "Upgrade to Premium / Maybe Later" card, versus "Your Files Will Be Deleted — in **3 days**… Files at risk: Project_Proposal.pdf … Total: 2.8 GB will be lost", with the dismissal relabelled "I'll Risk It". The source concedes the second screen is "a threat".
**Prohibited for diBoaS.** Fabricated urgency and fear-framing about a person's money is a dark pattern, contradicts "we name risk harder than you would", and is a regulatory hazard (inducement). Real, factual deadlines (a genuine legal cut-off, an actual expiry) may be stated plainly — that is disclosure, not a countdown.

**UX-11 · Contrast / anchoring: a number is judged against the number seen before it. — ADAPT (CLO gate; never on returns)**
Evidence: $50/month shown alone reads as $600/year; the same $50 shown beneath a $1,900 laptop, labelled "just 2.6%", disappears. Restaurants anchor a $40 salmon with a $90 steak.
**Permitted:** anchoring a _cost_ against a real, user-supplied reference (our 0.48% against the actual card-processing stack the user would otherwise pay). **Prohibited:** anchoring _returns_ or projections to make them feel inevitable or modest — this is precisely the "too good to be true" failure the Adelaide persona already flagged, and it collides with CLO Gate 4 on hypothetical performance.

---

# Part 3 — Advanced UX (`ux-tips-3`)

**UX-12 · Personalise by user state (new / repeat / power). — DEFER (money product)**
Evidence: a fitness app showing a new user goal-setting plus a few trending programmes; a repeat user their workout of the day with duration and calories; a power user a stats band (steps, calories, heart rate) followed by plan and diet. Same app, three home screens.
diBoaS analogue: first-session vs. funded vs. multi-goal user. **CTO handoff.**

**UX-13 · Search is a moment of intent — never answer it with a blank screen. — DEFER (money product) / partial ADOPT**
Evidence: an empty search overlay versus one offering recent searches as tappable thumbnails, "You might like" with prices and ratings, and personalised suggestions. Suggestions support the unsure user and are ignorable by the sure one.
_Partial today:_ `/learn` and `/tools` index pages can surface "most used" without any search implementation.

**UX-14 · Design the waiting state; it is where trust is won. — DEFER (money product)**
Evidence: a bare order screen (order number, plain item list, courier name and phone, dated text lines) versus one opening with "Your order is on its way!", a delivery window and address with icons, a courier photo with call/message buttons, item thumbnails, and a checkmarked visual timeline of stages.
**This is the single most important set-3 pattern for diBoaS.** The money product's equivalent question is _"where is my money right now?"_ — on-ramp settling, swap executing, bridge in flight, strategy entered. A dated text log will feel like a bank; a visual timeline with plain-language stages will feel like control. **CTO handoff.**
_Production reference (Mobbin shell study 2026-07-30, benchmark doc §4):_ Wise ships exactly this — a transfer rendered as a checkmarked stage timeline ("You set up your transfer → We received your SGD → Your money's being processed → We pay out") with a visible **Cancel transfer** for the stages where cancellation is still possible. The reference implementation for our ramp/swap/bridge status surfaces.

**UX-15 · Category screens: colour-coded cards with isolated imagery beat photo-overlay cards. — ADOPT**
Evidence: three versions — (a) a plain text list with "See selection" links: clean but no hierarchy, every row identical; (b) full-bleed photo cards with text over the image: looks designed, but contrast fails even with an overlay, the photos clash stylistically (bright, moody, magazine), and the visual noise slows comprehension; (c) soft solid colour blocks, each with one cleanly isolated subject image, a title and an item count ("Fresh fruits · 32 items") plus an affordance arrow. Version (c) is cohesive, on-brand, scannable in seconds, and accessible.
Directly applicable to `/tools` (11 calculators) and `/learn`.

**UX-16 · Match the input method to the task, not to the data type. — ADOPT**
Evidence: a one-time setup asking height and weight via a horizontal scroll-wheel ruler showing "170 cm" and "70 kg" with a unit toggle — low effort, values within a known range, no keyboard. Versus daily food logging, where a scroll wheel is slow and imprecise and a numeric text field ("120 g") wins. And a counter-example: three bare numeric fields for height, weight and goal weight — technically fine, unnecessarily effortful.
**Rule:** sliders and wheels for casual, one-time, bounded inputs; text fields, steppers or numeric keypads for frequent, precise, or repeated entry.
Applies today to the 11 calculators and the Dream Mode amount inputs.

---

# Part 4 — Bottom navigation (`ux-tips-4`) — DEFER (money product), full spec retained

The marketing site has no bottom nav. This entire section is input to the money-product build. **CTO handoff.**

**UX-17 · The bottom bar is the app's top-level structure and its most-tapped real estate.** iOS calls it a tab bar, Android bottom navigation.

**UX-18 · What belongs there:** home/dashboard, search/discover, a create/add action, messages/notifications, profile/account. **What does not:** help/FAQ, log out, legal pages, back/forward buttons, or a logo. Placing top-nav furniture at the bottom violates Jacob's Law — people expect your app to behave like the ones they already use.

**UX-19 · A central CTA is a legitimate exception.** A prominent centre button (create, add, order) is both eye-catching and thumb-reachable on large devices.

**UX-20 · Know the user before choosing labels.** Icon-only may suit a young, technical audience; icons **with** labels give older or less confident users certainty. **For diBoaS the Adelaide persona settles this: always labelled.**

**UX-21 · Geometry.** Icons ≈24px. Labels 10–12px (smaller harms accessibility, larger competes with content). Home indicator ≈34px — never overlap, hide or modify it; respect the safe area or users will trigger it when aiming for a tab. Tabs ≈74px wide on a 393px viewport, ~12px outer margins. Design against two or three device widths and test on a physical device.

**UX-22 · Three to five tabs (six absolute maximum).** More tabs shrink targets and induce choice paralysis.

**UX-23 · Tap targets ≥44×44px** — sized to a human thumb; supports users with reduced dexterity. 24×24 causes mis-taps.

**UX-24 · Active state needs at least two visual changes** — e.g. outline icon → filled **and** a colour change, or colour change **and** bolder label. Changing only the label text is not enough. Keep one icon style throughout, with the filled variant reserved for the selected tab; keep icon complexity consistent.

**UX-25 · Icons: simple and conventional.** A magnifying glass for search, not binoculars.

**UX-26 · Labels: short, single-line.** Two-line labels inflate the bar and clutter the layout.

**UX-27 · Restraint in colour.** Neutral bar (white, grey, dark); reserve brand/primary colour for the active state and for key actions on the content area. Never one colour per tab. Keep top and bottom nav palettes consistent.

**UX-28 · Badges only for essentials**, top-right of the icon, small but legible, optionally outlined; numerals must be readable. Badge everything and users stop seeing badges.

**UX-29 · Separate the bar from the content** with a 1px border, a subtly different background, or a soft shadow above it — otherwise it floats ambiguously in the page. The source names this as the mistake even professionals repeat.

**UX-30 · Inactive states must still meet contrast requirements.** Prefer reduced opacity over a different hue. WCAG minimum 3:1 for graphical elements and UI components. (Our pa11y gate already enforces WCAG2AA; this is the design-time counterpart.)

**UX-31 · Micro-interactions last, never first.** Tap feedback (colour, scale, ripple), an animated indicator sliding between tabs, and soft screen transitions. Fundamentals first — no animation rescues a broken structure.

---

# Part 5 — Product-page conversion (`ux-tips-5`)

Source claims a redesign moved a product page from 2% to 7% conversion **[CLAIMED — unverified: "3.5×"]**. Ten distinct moves; several are prohibited for us. Recorded individually so the good ones are usable and the bad ones are named.

**UX-32 · Halo badge above the title ("Best seller", "Top rated"). — REJECT for products; ADAPT elsewhere**
Framing an item with a status badge colours everything read afterward. On a financial strategy this is an inducement and a performance implication. Prohibited on strategies, goals, or anything money moves into. Acceptable on non-financial content (e.g. a most-read learn article), CLO-gated.

**UX-33 · Close the imagination gap: show the thing being used, not the thing in isolation. — ADOPT**
Evidence: a tub of powder on an empty background versus the same tub beside a freshly mixed glass with fruit. The brain reads images far faster than text; showing the outcome removes the mental translation step.
diBoaS analogue: the real product screen, mid-task, not an abstract illustration. This is the same insight as UX-05, and it is what the pending "How it works" 3-up needs from its final mockups.

**UX-34 · Specificity is trust. — ADOPT (strongest transferable idea in the corpus)**
Round numbers read as estimates or invention: "200+ reviews" became "4.9 (221 reviews)". "Fast delivery" loses to "delivery in 23 minutes". "Quick setup" loses to "start in two taps". A precise number does the persuading, because only a real measurement is precise.
For diBoaS this is free: our numbers are already real. Say "0.48%, capped at $250", not "low fees". Say what the pass-through actually costs. The precision _is_ the trust signal.

**UX-35 · Social-proof volume counters ("500+ sold this week", fire icon). — REJECT**
Herd inducement on a financial decision. Prohibited.

**UX-36 · Replace dropdowns with visible options (swatches, chips, segmented controls). — ADOPT**
A dropdown forces a click, a scroll and a read merely to learn what the choices are. Three visible flavour chips with icons remove that entirely. Applies to our calculator selectors and locale/currency pickers.

**UX-37 · Answer the fear at the exact moment of hesitation. — ADOPT**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-1 — Appendix E._
Evidence: hovering a flavour reveals "Light, tart, and not overly sweet" — the unspoken worry ("what if it tastes awful?") answered where it arises, without cluttering the layout. Good UX anticipates the question and replies in place.
diBoaS analogue: the risk sentence belongs _next to the strategy selector_, not in a footnote; the fee appears _before_ the button, not on the next screen.

**UX-38 · Side-by-side selection cards over stacked radio buttons. — ADAPT (THE FINANCE RULE applies)**
Two equal radio buttons let people default to the lowest-risk choice; side-by-side cards with one visually favoured card steer them. The source pre-selects "Subscribe", tints it, and tags it "MOST POPULAR" — that is steering toward the vendor's revenue. **We may use the card layout; we may not use the tag, the tint, or the pre-selection to favour the option that earns diBoaS more.**

**UX-39 · Put the reassurance inside the decision box. — ADOPT**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-1 — Appendix E._
"Save 15% · Cancel anytime, no fees · Priority dispatch" sits inside the selection card, at the second the user is deciding — not in an FAQ. Ours: fee, cap, and "you can withdraw any time" inside the confirm box.

**UX-40 · Progressive disclosure. — ADOPT**
Clicking "one-time purchase" expands to reveal 1-, 2- and 3-month bundles. The initial screen stays clean; the click is rewarded with more, not punished with a wall.

**UX-41 · Button copy names the journey, not the transaction. — ADAPT (Draper craft + Truth gate)**
"Add to cart" became "Add to cart · Start my journey". "Subscribe" became "Start my free trial now". Softening is legitimate; **obscuring is not.** Our buttons must still say what happens ("Add money", "Start this goal"). Never disguise a money movement behind a lifestyle verb.

**UX-42 · Trust badges tailored to the actual fear, not generic ones. — ADOPT**
"Free shipping / money-back / made in USA" is wallpaper. "100% vegan · 60-day guarantee · third-party tested for heavy metals" answers what this buyer actually fears.
**This is the direct fix for usability finding d3** (no Banco Central/FGC framing, no CNPJ, no address, no phone, no human, no testimonials). Our badges should answer _our_ buyer's fears: who holds the keys, what happens if diBoaS disappears, how the money comes back out, who audited the contracts.

---

# Part 6 — Three A/B teardowns (`ux-tips-6`)

**UX-43 · Ask an easy question, not a hard one. — ADAPT (Truth gate)**
Paywall A: hero art, "Get access to 1000+ … games", $19/month, three feature bullets, "Subscribe and start 7 days for free". The screen asks _"is this worth $19 a month?"_ — a hard question, 30 seconds after install. Paywall B is headed "How your free trial works" and asks _"can I try this free?"_. Same price, same trial, different question.
**Truth-gate boundary (2026-07-10):** reframing the question is craft; hiding the decision is a dark pattern. Where money moves, the easier question must never suppress the substance of "should I do this at all?" — the cost, the risk, and the commitment stay visible on the same screen the easier question is asked. Same boundary family as UX-41.

**UX-44 · Transparency bias: proactively disclose the downside — trust converts. — ADOPT. THE MOST IMPORTANT PRINCIPLE IN THIS DOCUMENT FOR DIBOAS.**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-1 + R-2 — Appendix E._
Paywall B replaces feature bullets with a three-step timeline: **Today** — full access; **Day 5** — we send a reminder that the trial is ending; **Day 7** — the first charge begins, cancel any time before. The Day-5 line does more work than every feature bullet combined, because it says _we will warn you before we take your money_. Revealing a potential downside makes users trust you more, not less; the screen stops being a sales pitch and becomes a safety net. People buy from safety nets.
**This is empirical support for diBoaS's entire positioning.** Radical honesty is not a conversion tax; it is the conversion mechanism. The corollaries: state the fee before the button; disclose the FX spread before the transaction (open usability item C3); tell the user what happens if they do nothing.
_Production reference (Mobbin shell study 2026-07-30, benchmark doc §4) — the limit stated before the wall:_ N26's add-money review states the remaining allowance in place ("You can add €4,980.00 more this month (€5,000.00 limit)"); bunq states the free-tier bound at the ask ("no extra cost — up to €500.00 every month"). Disclosing the constraint *before* the user hits it converts an error state into an informed decision — proactive disclosure applied to limits, not only downsides.

**UX-45 · "Start" beats "Subscribe"; "my" beats "your". — ADOPT**
"Subscribe" carries lock-in. "Start my free trial" is light, is a beginning, and the possessive creates ownership before the tap. Pairs with UX-41's boundary: soften the verb, never hide the action.

**UX-46 · Kill uncertainty with a number. — ADOPT**
"Start in two taps" answers "will there be a form? do I need my card? how many steps?" in three words. (Same family as UX-34.)

**UX-47 · Never show a range where you can show a number. — ADOPT for fees and costs; ADAPT (CLO gate) for projections — amended 2026-07-10**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-3 — Appendix E._
Ride-hailing A lists "$13–17", "$17–22", "$16–21". The brain anchors on the high end and then negotiates across three options simultaneously; the easiest outcome is to close the app. Version B shows one price per ride ("$15.99", "$19.99", "$20.99"). Evaluative ease: the less work a decision takes, the likelier it is taken. **A range you could resolve is not transparency, it is doubt — and doubt is the most expensive thing in an interface.**
**Amendment (post-evaluation, 2026-07-10) — the rule inverts for projections.** For fees and costs, one exact number is the honest form (the fee IS $0.48 on $100; a range would manufacture doubt). For **projected returns**, one precise figure reads as a promise — regulators push hypothetical performance toward scenario framing precisely because the future is not a resolvable number. Projections use labelled scenarios (the existing 7/10/14 structure), CLO-gated per Gate 4 on hypothetical performance. The unifying principle: **show a single number wherever a single number is the truth; show scenarios wherever pretending to a single number would be a lie.**

**UX-48 · Reframe cost into convenience where it is true. — ADAPT (Truth gate)**
"12:53pm · 2 min away" turns a price comparison into a convenience comparison. Legitimate only when factual.

**UX-49 · One-word contextual badges do the thinking ("Cheaper"). — ADAPT (CLO gate)**
Powerful and comparative. On money, comparative claims are regulated. Permitted only where objectively verifiable and CLO-approved.

**UX-50 · Commitment consistency: settle the small decision first. — ADAPT (Truth gate)**
Showing the chosen destination card before the ride options means the remaining question is only "which car?", not "should I go?". Our funnel already does this in Dream Mode (goal → path → amount → horizon). Preserve that ordering.
**Truth-gate boundary (2026-07-10):** the ordering settles the user's _own_ prior decision (their goal) — that is respect. It must never be used to smuggle a money commitment past the "should I at all?" moment: the exit stays free and visible at every step, and no step implies a commitment the user hasn't made. Same boundary family as UX-41/UX-43.

**UX-51 · Transport, don't inform. — ADOPT (Draper craft)**
Booking A: small thumbnail, "Beach house with garden", 4.82 stars, €89/night, two date fields, "Reserve". A form. Booking B: full-bleed photo, "Beachside escape steps from the sand", badges (Superhost, Guest favourite, 1/24 photos). Sensory language ("steps from the sand") and a real photograph activate imagination before a single figure is read.
This _is_ Lens 2 (make the reader feel it) with a screenshot attached.

**UX-52 · Show the total, not the unit. — ADOPT**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-1 — Appendix E._
"Reserve" became "Reserve · €445 total". The total pre-empts hidden-fee anxiety. Ours: the confirm button should carry the all-in figure — including pass-throughs — not the headline percentage.
_Production reference (Mobbin shell study 2026-07-30, benchmark doc §4):_ Kraken's buy keypad translates the entered amount live — "$10 · That's ≈ 0.00456 ETH" — with the payment method visible before the review step. The same move at the input instead of the button: the user always sees what the number *becomes*. Directly applicable to the FC-15 fee-inclusive display ("you enter $5 → $Y lands").

**UX-53 · Answer the top objection in one line, before it is voiced. — ADOPT**
"Free cancellation before Mar 26", with a shield icon, under the button. The number-one booking objection ("what if plans change?") answered pre-emptively. Also: day names ("Fri, Mar 28 → Wed, Apr 2") and a "5 nights" badge make the trip concrete and save mental arithmetic.
Ours, in order of user fear: _can I get my money out?_ · _what if diBoaS disappears?_ · _who can touch my keys?_

**UX-54 · Anchoring with a struck-through reference price ("€129 ~~crossed~~ €89, −31%"). — REJECT for anything money-related**
Legitimate in retail where the reference price is real. In our context there is no honest analogue; constructing one would fabricate a baseline. See UX-11.

---

# Part 7 — UI patterns (`ux-tips-2`)

_Screenshots for this set could not be rendered; principles derived from transcript only._

**UX-55 · Selectable cards instead of a vertical list of text options. — ADAPT (THE FINANCE RULE applies)**
A plain vertical list of text options is clear but forgettable, and offers almost no room for visual differentiation. Re-imagining the options as selectable cards — each carrying a label, a colour, and an icon or image — adds context and makes the choice set easier to digest.
Same family as UX-15 (category cards) and UX-36 (visible options over dropdowns). **Constraint:** on a money product, cards are a layout, not a nudge — no card may be tinted, tagged, or pre-selected to favour the higher-fee or higher-risk option (see UX-38 and the finance rule).

**UX-56 · Interaction cost: expose the content, don't hide it behind a banner. — ADOPT**
Interaction cost is the sum of cognitive, physical, and time effort a person must spend to reach their goal. A banner reading "Discover 100+ recipes selected by our chefs" sounds appealing but inserts a tap between the user and the value. Showing the curated list directly delivers value immediately, removes a step, and lets the most relevant items do the persuading.
This is the structural sibling of UX-08 (give before you ask). diBoaS analogue: `/tools` and `/learn` should present the actual calculators and lessons, not a promotional card that leads to them; `/market` should show the current reading, not an invitation to view it.

**UX-57 · Design for the thumb zone. — DEFER (money product)**
Phones are operated one-handed, mostly by thumb. Primary actions — buttons, navigation, calls to action — belong in the arc the thumb naturally reaches; controls placed outside it force a grip change and cause mis-taps, which penalises users on the move and users with limited mobility. Pairs with UX-21/UX-23 (safe area, ≥44×44px targets). **CTO handoff.**
_Partial relevance today:_ the mobile marketing site's primary CTAs and the language switcher sit within reach or do not — [VISUAL PASS REQUIRED] at 375px.

**UX-58 · Empty states are opportunities, not dead ends. — ADOPT**
A bare "You have no projects" gives no value and no direction; the user is stuck. A designed empty state does four things: states the benefit of starting ("Start managing your projects and stay organised"), carries a supporting illustration so the screen feels inviting rather than broken, offers concrete next steps (invite a teammate; set deadlines), and ends with one clear action ("Create new project").
diBoaS analogues, all live today: a calculator before any input; the waitlist confirmation screen; and **any `/market` signal in a data-unavailable state** (the dashboard's honesty rules make these a recurring, legitimate occurrence — the live queue for specific outages is `docs/audit/PENDING_ALL.md`). The last case matters most — an honest "we can't source this right now, here's what that means for the reading" is both a designed empty state and an instance of UX-44 (proactive disclosure).

**UX-59 · Visual cues carry meaning faster than text. — ADOPT (design-reviewer)**
Icons, colour, and imagery help people grasp information faster and remember it longer. The source's example: an email list where senders are plain text, versus one where each sender is represented by a coloured avatar with an initial — and better still, by the actual photograph of the person or the company's logo, so the reader identifies the sender and the context at a glance.
Constraint under Gate 3: cues must clarify, never decorate. Ours must respect the no-emoji rule — icons from the design system, not emoji (the sources use 🔥 and 🎉 freely; we do not).

---

# Part 8 — The through-line

Every element on a screen asks the user a question, and the question determines whether they act or hesitate. Good design chooses an easier question. For diBoaS the corollary is sharper: **the honest answer and the converting answer are the same answer** — stated earlier, more specifically, and closer to the moment of doubt. Six of the strongest patterns here (UX-34, UX-37, UX-39, UX-44, UX-52, UX-53) are all instances of one move: _say the true thing sooner._

And the corpus's dark side is equally clear. Manufactured loss (UX-10), volume herding (UX-35), status badges on financial products (UX-32), revenue-serving defaults (UX-38), and fabricated reference prices (UX-54) are the patterns a company reaches for when it does not have a true thing to say sooner. We do. **The prohibited list is a competitive asset, not a constraint** — it is quotable to investors and to regulators, and every competitor using fake urgency on someone's savings makes diBoaS the adult in the room.

---

# Part 9 — Honest data-visualization (external research, 2026-07-13)

_Added 2026-07-19 from the deep-research report (`docs/researches/UX Governance Research.md` — source file since removed in a local space cleanup after integration; these principles are self-contained) via the UX-research integration plan, task C-1 (plan record deleted — delete-after-execution). The canon was strong on copy/flow/dark-patterns and near-silent on how to **draw** money — the highest-risk surface for an implied-promise violation once the product renders projections and yield. These four extend UX-47 ("show a single number where a single number is the truth; scenarios where pretending to one would be a lie"). **The regulatory anchors (R-1 ESMA, R-3 FINRA) are pending CLO verification** (R-register in the integration plan); until each clears, these ship on their peer-reviewed evidence and diBoaS's own plain-language caveats, never a verbatim regulatory string._

**UX-60 · Visualize uncertainty; never draw a single deterministic line for an uncertain future. — ADAPT (CLO gate on projections).**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-3 — Appendix E._
A lone projection line implies a promise. Show the future as a range, a set of labelled scenarios, or a distribution — never one hard number or one line. _Evidence (peer-reviewed, not marketing):_ Hullman, Resnick & Adar 2015 (_PLoS ONE_); Kale, Nguyen, Kay & Hullman 2018 (_IEEE TVCG_, on Hypothetical Outcome Plots); Weiskopf 2022 (_Frontiers in Bioinformatics_). Extends UX-47; aligns with Gate 4 on hypothetical performance. _Regulatory anchor pending CLO: R-1/R-3._ _diBoaS surfaces:_ the `/tools` calculators are the reference implementation (a 4-scenario band); Dream Mode is the one surface that regressed to a single line (implementation-review record deleted; the regression fact stands).

**UX-61 · No fake precision on volatile values. — ADOPT.**
Excess decimal places imply a certainty that does not exist. Round yield, return, and projection figures to an honest resolution — the tools suite's currency default of 0 decimals is the baseline; cents on a multi-year projection are false precision. _Evidence:_ NN/g chart-clarity guidance and the HCI false-precision critique.

**UX-62 · A projection is a transparent calculator, never a prediction. — ADAPT (CLO gate).**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-3 — Appendix E._
Show the assumptions and the math, let the user change the inputs, and label every assumed rate _as assumed_ — never present the output as a forecast, and never dramatize an assumption into a settled outcome (no count-up-to-a-guaranteed-number theatre). _Evidence to verify (R-3):_ FINRA Rule 2210(d)(1)(F) permits a "hypothetical illustration of mathematical principles," not a prediction — **pending CLO** (a Feb-2026 FINRA proposal to permit projections is flagged not-in-force). Until R-3 clears, ship on the plain-language principle, not the regulatory text. Pairs with the existing 7/10/14-style scenario structure.

**UX-63 · Every historical or performance figure travels with its honest caveat. — ADOPT.**
_Regulatory anchor (CLO-verified, D-2 LIGHT): R-1 — Appendix E. (UX-63 ships diBoaS's own plain-language caveat, never the ESMA verbatim string.)_
Any past-performance, historical, or return figure carries a plain-language caveat that past results do not predict the future, shown _with_ the figure (never in a footnote). _Evidence to verify (R-1):_ the ESMA-mandated "Past performance does not predict future returns" and its equal-prominence-of-risk rule — **pending CLO**; until R-1 clears, ship diBoaS's own plain-language caveat, never the verbatim regulatory string.
_Amendment (2026-07-30, founder-ratified — teaser rates):_ **a promotional or incentive-boosted rate is never the headline.** The durable base rate leads; promotional components are broken out, labelled, and carry their duration and conditions. Counter-example (Mobbin shell study, benchmark doc §4): Vivid's Interest Rate Pocket headlines "up to 5% a year" where the durable rate is smaller and "+3%" is a promo, with a further "6% fixed — invite a friend" boost. An inflated headline rate is an implied promise (Voice Rubric Q3) and the pattern to watch for in Phase 2, where strategy yields routinely include temporary incentive components.

---

# Part 10 — Onboarding, permissions, consent & account transparency (Mobbin benchmark, 2026-07-30)

_Added 2026-07-30 (founder-ratified) from the five-app onboarding benchmark `docs/sandbox-app/ONBOARDING_BENCHMARKS_MOBBIN_2026-07-30.md` (Revolut, Nubank MX, Stripe Dashboard, Coinbase, Cash App — Mobbin iOS captures). The benchmark validated the existing canon (the reference apps' strongest moves were already UX-34/37/39/44/46/52/56; several of their tactics already sit on the veto list) and surfaced four gaps — all on surfaces the marketing site never had and the sandbox app is about to have. This Part unpacks the C-6 parking lot (Appendix C) into canon; the remaining C-6 items (progressive disclosure, pyramid of trust, aha-fast, recovery UX) stay CTO-cluster input until their surfaces exist. Evidence below is observed shipped design from named products — no conversion statistics are asserted._

**UX-64 · Never fire an OS permission dialog cold — pre-frame it, and let "Not now" be a real answer. — ADOPT**
Every reference app precedes every OS permission dialog with its own value-framed screen: Revolut's push-notification screen ("get payment notifications… balance always up to date" — Enable / Not now) and its ATT pre-prompt, Nubank's location ask ("this makes the process more secure… we protect all your data"), Cash App's contact-sync screen (value + "manage syncing anytime in Security & privacy settings", with **Not now default-highlighted**). The OS dialog is a one-shot, system-worded, deny-and-it's-buried-in-Settings moment; the pre-prompt screen makes the ask explainable, declinable, and re-askable later without nagging. Rules: (1) state the concrete value in the user's terms, not the data collected; (2) the decline is one tap, equal-weight (see UX-66), and never re-asked on a loop; (3) never gate an unrelated flow on the permission. Applies to push (the notification model), and to any future camera/biometric ask. Enforcement: checklist Part 3 row 22.

**UX-65 · State the honest time cost of a long or regulated process before it starts. — ADOPT**
Coinbase's account-setup checklist names its steps **with time estimates** ("About you — approx. 2 min · Verify your identity — approx. 5 min") before asking for anything; Nubank ends onboarding with an honest review promise ("we'll take a maximum of 48 hours"). This is UX-44 (proactive disclosure) applied to _time_, and the completion of UX-46 ("start in two taps" killed step-uncertainty; this kills duration-uncertainty): a known cost stated up front is disclosure — an unstated one is a drop-off and a quiet trust breach when the user discovers it mid-flow. Rule: any flow longer than ~1 minute, or any flow whose completion depends on a third party (identity verification, a bank transfer settling, a review queue), states its expected duration before the user commits to it, and the estimate is honest (never marketing-rounded down). Pairs with UX-14 (design the waiting state) for what happens _during_ the wait. Enforcement: checklist Part 3 row 23.

**UX-66 · Every optional ask carries a decline of equal visual weight. — ADOPT**
The positive form of veto rows 13/17 (which prohibit revenue-favouring emphasis) and the inverse of UX-10's "I'll Risk It" confirm-shaming: where the product asks for something optional — an upsell, a permission, a sync, a referral, a plan upgrade — the "no" is a real button (not a text link, not low-contrast, not beneath the fold), worded neutrally ("Not now", never self-shaming), and costs one tap. Evidence: Cash App highlights **Not now** as the default on contact sync; Revolut's Premium screen and push pre-prompt both carry a plain "Not now"; Nubank's product bundle is declinable per product. The reference apps treat the decline as a first-class outcome — so do we. Enforcement: checklist Part 3 row 24.

**UX-67 · Consent is unbundled, and high-stakes consent is an act, not a checkbox. — ADAPT (CLO gate on consent surfaces)**
_Regulatory anchor (CLO-verified, recorded-only per the founder's option B, 2026-07-20): R-6 — CJEU Planet49 (C-673/17): consent must be active, specific, and unbundled; pre-ticked boxes are not consent. Verification record deleted; Appendix E holds the surviving verified anchors. Supporting authority for this principle, not a binding gate._
Two patterns from the benchmark, one positive and one negative. Positive (Nubank): the final consent screen separates **contract acceptance**, **marketing opt-in**, and the **PEP declaration** into individual checkboxes with the contracts linked in full — and the highest-stakes consent (the credit-bureau pull) is authorized by **its own dedicated act**, an SMS code, not a line in a bundle. Negative (Revolut): T&C + privacy policy + e-sign consent bundled into a single "Agree and continue" tap — legally thin under the Planet49 standard and the pattern we do not copy. Rules: (1) consents with different purposes never share one checkbox or one button; (2) marketing consent is always its own unchecked box; (3) a consent that authorizes a money movement, a data pull from a third party, or a standing permission is its own explicit act (structurally: the bound-consent / step-up pattern the sandbox architecture already rules — FC-12, F-l); (4) no consent box is ever pre-ticked. **Converting this principle into a canonical veto row remains a separate founder/CLO decision** (the option-B posture): until then it binds as a should-PASS friction row. Enforcement: checklist Part 3 row 25.

**UX-68 · The feed tells the whole truth — account events are never silent, and history is never rewritten. — ADOPT**
_Added 2026-07-30 (founder-ratified) from the 12-app shell study (benchmark doc §4)._ Evidence: N26 renders security actions as first-class entries in the user's transaction feed ("Card locked via app", "Card unlocked via app") and shows a **failed** cash withdrawal honestly in history; Chime leaves a canceled payment visible in recents, labelled as canceled. The pattern: the activity feed is the account's honest record, not its highlight reel. Rules: (1) security-relevant account events — step-up verifications, locks/unlocks, permission or signing-policy changes, new-device access — appear as user-visible feed entries, not only as buried settings state; (2) failed and canceled transactions remain in history, honestly labelled, with their reason where known — nothing is silently disappeared; (3) a change to what the account *can do* (a granted permission, an approved standing consent, a frozen card) is an event the user can see happened, when, and via what channel. For diBoaS this is load-bearing: the sandbox ledger is event-sourced (the record already exists — this principle says the user gets to see it), FC-12 step-ups and wallet policy actions are exactly such events, and the feed is where the never-locked guarantee becomes *visible* rather than asserted. Pairs with UX-14 (the in-flight half of the same honesty; the feed is the at-rest half). Enforcement: checklist Part 3 row 26.

---

# Appendix A — Unverified claims register

| Claim as asserted in source                                                                   | Where used               | Status                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24 jam flavours → 3% purchase; 6 flavours → 30%                                               | UX-06                    | **Unverified.** Widely cited; has failed several replications. Do not cite.                                                                                                |
| 70–90% of users never change defaults                                                         | UX-06                    | Unverified. Directionally plausible; not sourced.                                                                                                                          |
| Pre-stamped loyalty card ≈ doubled completion                                                 | UX-07                    | Unverified. Attributed to a car-wash study.                                                                                                                                |
| Free samples increase purchases "up to 2,000%"                                                | UX-08                    | Unverified. Marketing figure. Do not cite.                                                                                                                                 |
| Losses feel ~2× gains (attributed to Kahneman)                                                | UX-10                    | Broadly supported in prospect theory; the "2×" is a simplification.                                                                                                        |
| Book-cover redesign: 22% → 48% conversion                                                     | UX-05                    | Unverified. Vendor's own claim about its own product.                                                                                                                      |
| Product page: 2% → 7% ("3.5×")                                                                | Part 5                   | Unverified. Vendor's own claim.                                                                                                                                            |
| The three A/B tests (paywall, ride-hailing, booking)                                          | Part 6                   | Unverified. No methodology, sample size, or source given. **Treat as illustrative reasoning, not evidence.**                                                               |
| Interaction cost as a named concept                                                           | UX-56                    | Established HCI concept (Nielsen Norman Group). No figure asserted.                                                                                                        |
| ~90-second / ~90%-of-first-impression is colour-driven (attrib. Institute for Color Research) | research (colour/trust)  | **Industry lore.** Widely repeated, not peer-reviewed. Do not cite. (C-4, 2026-07-19)                                                                                      |
| "Transparency lifts conversion 30–60%"                                                        | research (conversion)    | **Unsourced marketing claim.** Do not cite. Use the honesty-as-retention framing on its reasoning, not this figure. (C-4)                                                  |
| Magritte ad library "proven to perform"                                                       | research (platform eval) | **Vendor claim;** performance criteria undisclosed. Do not cite. (C-4)                                                                                                     |
| "25–95%" retention→profit range                                                               | UX-44 / retention        | Cite the Bain/Reichheld financial-services figure (**"~5% retention → >25% profit"**, Reichheld & Sasser 1990, HBR), _not_ the popularized composite "25–95%" range. (C-4) |

**None of these figures may appear in diBoaS marketing, investor, or product material.** The principles are adopted on their reasoning, not on these numbers.

# Appendix B — Prohibited patterns (narrative form)

> **Canonical enforcement list: `docs/tech/ux-governance/anti-slop-checklist.md` Part 3 rows 10–17.** This appendix and `BRAND_POSITIONING.md` Gate 4 are narrative forms of those rows; on any drift, the checklist rows win. (Single-source rule, 2026-07-10.)

1. Manufactured urgency, countdowns, or threat framing about a person's money (UX-10).
   - _Precedent (academic, not law — no CLO gate): Princeton "Dark Patterns at Scale" (Mathur et al. 2019) audited these at scale — activity notifications, low-stock messages, and countdown timers were among the most-deployed manipulative patterns._
2. Volume/herd social proof on financial products (UX-35).
3. Status or performance badges on strategies, goals, or assets (UX-32, UX-49 uncleared).
   - _Precedent (CLO-verified, R-4): In re Robinhood Financial LLC, Massachusetts Securities Division consent order, 18 Jan 2024 ($7.5M) — the regulator required cessation of celebratory imagery tied to trading frequency, "most popular" list push-notifications, and game-of-chance features. Real-world enforcement support for rows 2 (volume/herd proof) and 3 (celebration/status framing on financial actions). Cited as enforcement climate, not a settled holding (Robinhood settled without admitting the premise). See Appendix E._
4. Defaults, pre-selections, or visual emphasis that favour the option earning diBoaS more (UX-06 finance rule, UX-38).
5. Anchoring returns or projections; fabricated reference prices (UX-11, UX-54).
6. Computing a real result and hiding it behind a signup (UX-08 boundary).
7. Button copy that disguises a money movement (UX-41 boundary).
8. Tinting, tagging, or pre-selecting a selection card to favour the higher-fee or higher-risk option (UX-55 constraint).

# Appendix C — Ownership

- **CMO board (this chat):** UX-06…11, 15, 32…54, 55, 56, 58 — copy, flow, brand.
- **Design-reviewer / frontend-design skill:** UX-01…05, 16, 59 — craft, contrast, tokens, visual cues, input-component inventory (UX-16 flow semantics reviewed by CMO).
- **CMO + design-reviewer (data-viz honesty):** UX-60…63 — how money is drawn (Part 9). The design-reviewer enforces them per its data-viz phase (`.claude/agents/design-reviewer.md`, C-1b); CLO-gated where they touch projected returns (UX-60/62).
- **CTO board (deferred handoff):** UX-12, 13, 14, 17…31, 57 — money-product structure, thumb zone. Recorded here in full; scheduled as a separate task. **User-onboarding input (C-6, added 2026-07-19):** the research's account-opening best-practice set — progressive disclosure; NN/g pyramid of trust; aha-moment-fast; contextual help over upfront tours; modern self-custody recovery UX (social-recovery / passkeys over seed-phrase terror); "you hold the keys" stated early — is a named input to the CTO onboarding design alongside UX-12/13/14/57. It is **NOT** marketing-site canon (the surface it governs, the money product's account-opening flow, isn't built).
- **CMO + CTO board (onboarding, permissions, consent & account transparency):** UX-64…68 — Part 10, added 2026-07-30 from the Mobbin benchmark (UX-68 feed-truth from the same-day shell study). The CMO board owns the copy/framing half (pre-prompt wording, time-honesty phrasing, decline labels); the CTO board owns the flow half (where the pre-prompt sits, consent-as-act mechanics per FC-12/F-l). UX-67 is CLO-gated on consent surfaces. This entry unpacks the C-6 parking lot below in part; C-6's remaining items (progressive disclosure, pyramid of trust, aha-fast, recovery UX) stay parked until their surfaces exist.
- **CLO board:** gates on UX-11, 32, 41, 49, 60, 62, 67 and the whole of Appendix B.

# Appendix D — Audit trail

**2026-07-05, self-audit (founder-requested).** The first draft of this document covered six of the seven source directories. `ux-tips-2` was never opened, and the psychology set (`ux-tips-0`) was mis-attributed to it by inference, since both contain eight screenshots. Corrected: provenance and source map added; Part 7 (UX-55…59) written from the missing set; the finance rule's cross-reference corrected from UX-30/31 (bottom-nav contrast and micro-interactions) to UX-38/UX-55 (selection cards); Appendix B extended to eight prohibitions; Appendix C ownership updated. ID sequence verified programmatically: UX-01…UX-59, no duplicates, no gaps. **Lesson: never infer a source's identity from a metadata coincidence — open the file.**

**2026-07-10, founder ratification.** G-3 confirmed by founder: this canon is RATIFIED as amended (status line updated). G-2 confirmed: the citation-annotation standard stands, and reconstruction of founder rulings F-1…F-12 from the session log (plan task CC-5) is unblocked. G-1 (git-tracking the governance layer) declined for now — consequence: the fix-plan retention rule remained the only protection for these files until G-1 was revisited (accepted via relocation later the same day; retention policy superseded 2026-08-04 by delete-after-execution).

**2026-07-19, research integration (UX_RESEARCH_INTEGRATION_PLAN_2026-07-13 execution).** Added **Part 9 — honest data-visualization (UX-60…63)**, the one real gap the deep-research report surfaced (canon was silent on how to draw money): visualize uncertainty not a deterministic line (UX-60), no fake precision (UX-61), calculator-not-prediction (UX-62), every performance figure caveated (UX-63) — on peer-reviewed evidence, with the ESMA/FINRA regulatory anchors held **pending CLO** (R-register). ID sequence now UX-01…UX-63, contiguous. Appendix A (C-4) absorbed the research's own unverified-claim flags (colour-lore, "transparency lifts 30–60%", Magritte "proven", the "25–95%" composite). Appendix C: UX-60…63 ownership recorded (CMO + design-reviewer, CLO-gated on projections) and the design-reviewer wired to enforce them (C-1b); user-onboarding best-practice recorded as a CTO-cluster input, not marketing canon (C-6). Regulatory-anchor tasks C-2/C-3 remain open pending CLO verification of R-1…R-6. (Full implementation-review record deleted — delete-after-execution.)

**2026-07-10, post-evaluation hardening (Claude Code's governance evaluation, findings verified then applied).** Taxonomy corrected — four gated principles relabelled ADOPT→ADAPT per this document's own definitions (UX-05, 08, 48, 55). UX-47 amended: ADOPT for fees/costs, CLO-gated ADAPT for projections (a single precise projection reads as a promise; scenario framing is the honest form — aligns with Gate 4 on hypothetical performance). Truth-gate boundaries added to UX-43 and UX-50 (reframing is craft; hiding the decision is a dark pattern). UX-16 assigned an owner. Live operational state de-baked from UX-58 (canon entries stay durable; outages live in the queue). Appendix B subordinated to the canonical veto list (checklist Part 3 rows 10–17) under the single-source rule. Coordination-plan record deleted; operating protocol: `docs/tech/ux-governance/UX_GOVERNANCE_USAGE.md`.

**2026-07-30 (later same day), shell-study integration (founder-ratified).** The 12-app search-page shell study (benchmark doc §4: Revolut, Coinbase, Wise, Cash App, Neo Financial, PayPal, Chime, Kraken, Vivid, N26, Buddy, bunq) mostly **validated** existing canon in production (Revolut's midpoint-rate note = UX-37/44; N26's fee row = UX-52; Coinbase's checklist-home = UX-07/58). Three changes: (1) **UX-68 "the feed tells the whole truth"** added to Part 10 (retitled "…& account transparency") + checklist friction row 26 — security events, failures, and cancellations are visible, honest feed entries (N26/Chime evidence; FC-12/NT-1/event-sourced-ledger cross-refs); (2) **UX-63 teaser-rate amendment** — a promotional or incentive-boosted rate is never the headline (Vivid counter-example; Phase-2 incentive-yield relevance) + a matching Q3 sentence in the Voice Rubric; (3) **production evidence notes** attached to UX-14 (Wise transfer timeline), UX-44 (N26/bunq limits-before-the-wall), UX-52 (Kraken live conversion). Layout conventions (balance-hero, verb chips, keypads, card kits) deliberately NOT canonized — design fashion, not honesty/friction gates. Band citations updated to rows 1–26.

**2026-07-30, onboarding benchmark integration (founder-ratified).** Added **Part 10 — onboarding, permissions & consent (UX-64…67)** from the five-app Mobbin benchmark (`docs/sandbox-app/ONBOARDING_BENCHMARKS_MOBBIN_2026-07-30.md`): OS-permission pre-prompts (UX-64), time-honesty before long/regulated processes (UX-65), equal-weight decline on optional asks (UX-66), unbundled consent / consent-as-act (UX-67, R-6 Planet49 anchor recorded-only per option B — veto-row conversion stays a separate founder/CLO decision). ID sequence now UX-01…UX-67, contiguous. Checklist Part 3 gained friction rows 22–25 (band citations updated in CLAUDE.md, the usage protocol, and the design-reviewer agent; veto list unchanged at rows 10–17). BRAND_POSITIONING gained "The compliance moment" paragraph (how regulated asks are framed); STORYTELLING_CRAFT §3 notes the 3P intro applies to product flows. The benchmark otherwise **validated** the canon: the reference apps' strongest patterns were already UX-34/37/39/44/46/52/56, and several of their tactics (mid-onboarding credit offers, bundled consent, ad-framed tracking asks) already fail our gates.

**2026-07-20, regulatory anchors landed (C-2/C-3, CLO Session 023 return).** The R-register cleared CLO verification (verification record deleted; Appendix E is the surviving holder): **Appendix E** added holding the R-1/R-2/R-3 anchors (C-2) on UX-37/39/44/47/52/60/62/63 + the three-nevers, each carrying its jurisdiction caveat (diBoaS not bound; supporting authority under **D-2 LIGHT**). Appendix B gained the R-4 (Robinhood) precedent on rows 2/3 and the Princeton "Dark Patterns at Scale" academic note on row 1 (C-3). **Founder ruled option B (2026-07-20):** cancellation (R-5/DSA) and consent (R-6/Planet49) prohibitions are **not** added to the veto list now, so R-5…R-12 stay recorded-verified authority in the verification doc, not canonized. UX-63 keeps its own plain-language caveat, never the ESMA verbatim string.

---

# Appendix E — Regulatory anchors (CLO-verified 2026-07-20, D-2 LIGHT)

> **Board condition (CLO Session 023, unanimous; verification record deleted — this appendix is the surviving record).** Every anchor below is **supporting authority for a principle diBoaS already holds on its own logic — NOT a binding gate on diBoaS.** diBoaS is not a fund, not FCA-authorised, and not a FINRA member; these are cited as the authoritative external articulation of principles diBoaS applies by choice (the **D-2 LIGHT** posture the founder ratified 2026-07-20). Converting any anchor to a _binding_ gate is a separate CLO decision at funding / counsel engagement. **UX-63 always ships diBoaS's own plain-language caveat ("Past performance ≠ future results"), never a verbatim regulatory string presented as a compliance badge.**

**R-1 · ESMA34-45-1272 — VERIFIED WITH CAVEAT. Anchors: UX-37, UX-39, UX-44, UX-52, UX-63, and the three-nevers.**

> Regulatory anchor (CLO-verified, R-1): ESMA Guidelines on Marketing Communications (ESMA34-45-1272, in force 2 Feb 2022) require, in EU fund marketing, that risk be given equal prominence to reward, at a font size ≥ the predominant size, never in footnotes. diBoaS is not a fund and is not bound by these guidelines; they are cited as the authoritative EU articulation of the equal-prominence principle diBoaS already applies.

**R-2 · FCA COBS 4.2.1R + financial-promotions regime — VERIFIED WITH CAVEAT. Anchors: the three-nevers, UX-44.**

> Regulatory anchor (CLO-verified, R-2): the FCA's "fair, clear and not misleading" standard (COBS 4.2.1R) and its financial-promotions regime restrict unjustified "guaranteed/protected/secure" language. diBoaS is not FCA-authorised and not UK-targeted; cited as the mainstream regulatory articulation of the never-promising principle diBoaS already enforces.

**R-3 · FINRA Rule 2210(d)(1)(F) — VERIFIED (both limbs). Anchors: UX-47, UX-60, UX-62.**

> Regulatory anchor (CLO-verified, R-3): FINRA Rule 2210(d)(1)(F) prohibits performance projections in broker-dealer communications; a transparent "hypothetical illustration of mathematical principles" (an assumptions calculator) is the permitted form, not a prediction. In force as of 2026-07-20; a Feb-2026 FINRA proposal to permit projections is pending SEC proceedings (Release 34-105524, instituted 26 May 2026) and is not in force. diBoaS is not a FINRA member; cited as the US regulatory articulation of calculator-not-prediction.

**Precedent annotations (C-3):** R-4 (Robinhood) is attached in **Appendix B** rows 2/3; the Princeton "Dark Patterns at Scale" academic note is on row 1. **R-5 (DSA Art. 25 cancellation), R-6 (Planet49 consent), and R-7…R-12** are CLO-verified but **recorded-only** — the founder ruled option B (2026-07-20): the canon does not add cancellation- or consent-prohibition rows now, so these stand as verified supporting authority in the verification doc, to be canonized only if/when those surfaces gain a prohibition. _Update 2026-07-30:_ R-6 now anchors **UX-67** (Part 10) as a should-PASS **principle** — the consent surface (sandbox signup, FC-1) reached build-ready and the Mobbin benchmark supplied the positive model (Nubank's unbundled checkboxes + consent-as-act). The option-B posture itself is unchanged: UX-67 is a friction row, not a veto row; that conversion remains a separate founder/CLO decision. **Monitoring:** if SR-FINRA-2026-004 is ever approved, update the R-3 anchor (rule shifts from "prohibits" to "permits under conditions"; the UX-62 _principle_ is unchanged — diBoaS refuses predictive framing by choice).
