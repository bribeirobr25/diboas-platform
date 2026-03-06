# About Page — FINAL Copy (EN)

## Document Status

| Field | Value |
|-------|-------|
| Version | FINAL — Post-CLO + Post-Copywriter Review |
| Language | English (EN) |
| Date | February 28, 2026 |
| CMO Audit | 7 critical + 9 important findings resolved in v2.0 rewrite |
| CLO Review | 1 P0 + 4 P1 resolved. All fixes applied below. |
| Copywriter Review | 2 fixes + 5 polish items. Approved for production. |
| Pending | CEO sign-off (routine, no open questions) |
| Previous | `about.json` (legacy), `ABOUT_PAGE_AUDIT_AND_REWRITE_EN.md` (v2.0 draft) |
| Component | `AboutPageContent.tsx` — minor changes (1 new `<p>` tag + 4 transitions + footer import) |

## CLO Fixes Applied

| CLO # | Issue | Fix Applied |
|-------|-------|-------------|
| P0-1 | "Free" transfers needs qualification | Micro-disclaimer added below paragraph: "Free transfers between diBoaS users..." |
| P1-1 | "Same financial tools" overclaim | → "financial tools that were previously out of reach" |
| P1-2 | "2 to 3%" needs softening for EU | Removed specific percentage. Numberless version. |
| P1-3 | "Billions" vs Strategies phrasing | Confirmed deliberate. About = narrative context, "billions" appropriate. |
| P1-4 | Footer disclaimers required | Shared footer component must be wired by CTO. Locale table below. |

## Copywriter Fixes Applied

| CW # | Issue | Fix Applied |
|------|-------|-------------|
| FIX-1 | Mission section generic/weak | Option B: Rewritten with Adelaide callback + concrete details ($5, four languages) |
| FIX-2 | No transition hooks between sections | 4 transition hooks added matching B2C/Protocols pattern |

## Global Rules

- NO em-dash characters. Use commas, periods, colons, or line breaks.
- NO emojis in body copy.
- Adelaide Filter applies: no jargon. No "stablecoins," "protocols," "DeFi," "yield," "APY."
- Transition hooks styled as subtle lead-in text.
- Footer uses shared disclaimer component (same as B2C, Strategies, Protocols).

## Section Flow

| # | Section | Component | Changes from Current |
|---|---------|-----------|---------------------|
| 1 | Hero | `PageHeroSection` | Subtitle rewritten |
| t1 | Transition | Subtle lead-in text | **NEW** |
| 2 | The Story | `SectionContainer` + prose | H2 + body rewritten. Adelaide named. |
| t2 | Transition | Subtle lead-in text | **NEW** |
| 3 | What diBoaS Does | `SectionContainer` + prose | Completely rewritten. Free transfers first. |
| 4 | What We Believe | `ContentCard` × 3 | All 3 cards rewritten |
| 5 | The Mission | `SectionContainer` | Rewritten with Adelaide callback |
| t3 | Transition | Subtle lead-in text | **NEW** |
| 6 | For Businesses | `SectionContainer` + CTA | Expanded with pain points |
| t4 | Transition | Subtle lead-in text | **NEW** |
| 7 | Contact | `SectionContainer` | "Bar" (not "Breno") + personal email added |
| 8 | Waitlist | `WaitlistSection` | No changes (shared component) |
| — | Footer | Shared footer component | **NEW: must be added by CTO** |

## Transition Hooks

Transitions are short text hooks between sections. Style as subtle lead-in text (`text-gray-500 text-sm italic` or similar). They are NOT headings.

`[CW FIX-2: Transition hooks added to match B2C and Protocols cross-page pattern.]`

| Hook | Text | Position |
|------|------|----------|
| t1 | "Let me tell you a story." | After Hero → Before Section 2 |
| t2 | "Here's what I built." | After Section 2 → Before Section 3 |
| t3 | "And it's not just for individuals." | After Section 5 → Before Section 6 |
| t4 | "Want to talk? I'm right here." | After Section 6 → Before Section 7 |

**i18n keys:** `about.transitions.t1` through `about.transitions.t4`

**Notes:**
- No transition between Section 3 → Section 4 (natural flow from product → values).
- No transition between Section 4 → Section 5 (mission follows values naturally).
- t1 ("Let me tell you a story.") sets intimate tone before the grandmother narrative.
- t2 ("Here's what I built.") mirrors B2C's "I built it for you." — same founder voice, different specificity.
- t4 ("Want to talk? I'm right here.") is warmer than a standard contact transition and matches the personal tone of "I read every email."

---

## SECTION 1: HERO

**H1:**

```
About diBoaS
```

**Subtitle:**

```
One grandmother. One problem. One platform.
```

---

## SECTION 2: THE STORY

**H2:**

```
Her name was Adelaide.
```

**Body:**

```
My grandmother lived in Rio de Janeiro her whole life. She taught me to save. She said I should try to save half of everything I earn. She tried that herself. Her whole life.
```

**Body (medium-weight):**

```
Work hard. Buy only the basics. Try to save.
```

**Body (bold):**

```
It still didn't work.
```

**Body:**

```
Here's what no one told her: her bank paid her almost nothing while earning real returns with her money. That gap, between what banks earn and what they share, is the system working as designed. Just not for people like her.
```

**Body:**

```
Access was locked behind high minimums, complicated words, and institutions that didn't care about people with small savings.
```

**Body:**

```
In 2024, I lost my job and I decided to do something about this problem. New technology made it possible to bypass the gatekeepers. I just had to build the door.
```

**Body (medium-weight):**

```
I named it after her.
```

### Notes

- "Her name was Adelaide." must match B2C Section 2 H2 exactly.
- "I named it after her." is the emotional close. Consider slight spacing above it.
- "Work hard. Buy only the basics. Try to save." uses medium-weight styling (same as current `storyMedium` CSS class).
- "It still didn't work." uses bold styling (same as current `storyBold` CSS class).
- No specific bank rate claims (CLO-safe). "Almost nothing" + "real returns" carries the same emotional weight.

---

## SECTION 3: WHAT diBoaS DOES

**H2:**

```
What diBoaS Does
```

**Body (paragraph 1 — free transfers):**

```
First, the basics. Send money to anyone on diBoaS. Anywhere in the world. In seconds. Free. No forms, no fees, no waiting three business days. Money should move like a message. Now it does.
```

**Micro-disclaimer (small text, below paragraph 1):**

```
Free transfers between diBoaS users. Transfer times are typical and may vary. Subject to applicable sanctions and compliance requirements.
```

`[CLO FIX P0-1: Micro-disclaimer added. Main copy preserved for emotional impact. Qualifier handles FTC §5, UCPD, and CDC Art. 37 exposure.]`

**Body (paragraph 2 — growth):**

```
Then, growth. Choose from 10 ways to grow your money, from the safest option to the most adventurous. Starting at $5. Your money works through trusted financial systems that have collectively secured billions in assets. The same kind of systems institutions use, now open to you.
```

**Body (paragraph 3 — Adelaide AI, medium-weight):**

```
And Adelaide watches over it all. Named after the grandmother who inspired this, Adelaide is your personal financial intelligence. What's moving. What it means. What you could do. Clear language, not jargon.
```

### Notes

- Free transfers paragraph comes FIRST (CEO's strategic priority: transfers = acquisition, growth = retention).
- "Money should move like a message" is the OneFi positioning line.
- $5 minimum matches B2C FAQ 6 and Strategies cards.
- "collectively secured billions in assets" is deliberately vaguer than Strategies page ($120B). About page = narrative context. `[CLO P1-3: confirmed deliberate]`
- "The same kind of systems" (not "the same systems") — subtle but important distinction. Retail users access protocols through diBoaS's curated interface, not directly as institutions do.
- "trusted financial systems" instead of "protocols" (Adelaide Filter).
- Adelaide AI introduced as product feature. Name creates emotional through-line from grandmother → platform → AI.
- Micro-disclaimer uses smallest text treatment available. Must be present but should not visually dominate. Same styling as fee disclaimers on other pages.

---

## SECTION 4: WHAT WE BELIEVE

**H2:**

```
What We Believe
```

### Card 1

**Title:**

```
Your money should work for you.
```

**Description:**

```
Not for your bank. Not for a middleman. For you. The gap between what banks earn with your money and what they give back is real. We close that gap.
```

### Card 2

**Title:**

```
Honesty over hype.
```

**Description:**

```
We don't promise guaranteed returns because nobody can. What we offer: real data from nearly 4 years of historical analysis, clear explanations of how each option works, and a Learn Center to help you understand what you're doing before you do it. We show you both sides, the opportunities and the risks, always.
```

### Card 3

**Title:**

```
Start with $5. Learn as you go.
```

**Description:**

```
You don't need $10,000 to begin. Start with what you're comfortable with. Watch how it works. Then decide if it's right for you. No pressure, no package deals, no locked-in commitments.
```

### Notes

- Card 2 contains the brand promise (1 of max 2 appearances on this page): "We show you both sides, the opportunities and the risks, always." Must be verbatim.
- "nearly 4 years" — CLO P1-1 from Strategies review. Must not be "4 years."
- "nobody can" — strongest anti-guarantee sentence on the platform. CLO praised this in their review.
- Card 3 title includes "$5" (concrete, matches B2C). Locale adaptations: €5 (DE/ES), R$10 (PT-BR).

---

## SECTION 5: THE MISSION

**H2:**

```
The Mission
```

**Body:**

```
Adelaide never had a choice. High minimums, hidden fees, and complicated words kept the door closed.
```

**Statement (medium-weight):**

```
We're building the door she never got.
```

**Pillars:**

```
Free money movement. Real growth options. Full transparency. Starting at $5. In four languages. For everyone.
```

`[CW FIX-1: Rewrote Mission section with Adelaide callback and concrete details. Previous version ("To give everyone access to financial tools that were previously out of reach") was generic — could be any fintech. New version earns its place by tying back to the story and adding specifics ($5, four languages). CLO P1-1 fix preserved: no "same as institutions" equivalence claim.]`

### Notes

- "Adelaide never had a choice" calls back to Section 2, giving this section earned emotional weight.
- "We're building the door she never got" echoes Section 2's "I just had to build the door." Deliberate callback.
- "Starting at $5. In four languages. For everyone." = concrete. Verifiable. Not generic.
- Locale adaptations for $5: €5 (DE/ES), R$10 (PT-BR). "Four languages" = EN, DE, ES, PT-BR.
- Previous tagline ("One platform. Your money. Your control.") removed — it was the weakest line on the page. The pillars line now serves as both mission statement and tagline.
- Still does NOT say "Real returns" (CLO risk — implies guaranteed outcomes). "Real growth options" is the approved phrasing.

---

## SECTION 6: FOR BUSINESSES

**H2:**

```
For Businesses
```

**Body (paragraph 1):**

```
If you accept card payments, processing fees eat into every transaction. If you have cash sitting idle, your bank is earning returns with it and paying you almost nothing. The same system that failed my grandmother is sitting on your company's reserves.
```

`[CLO FIX P1-2: "you're losing 2 to 3% on every transaction" → "processing fees eat into every transaction." Removes specific percentage that's inaccurate for EU (IFR caps interchange at 0.2-0.3%). B2B page has the detailed comparison with regional context.]`

**Body (paragraph 2):**

```
diBoaS for Business helps companies keep more of what they earn, with same-day liquidity, board-ready reporting, and access to the same trusted systems powering our personal platform.
```

**CTA:**

```
Learn more about diBoaS for Business
```

CTA links to: `/business`

### Notes

- Grandmother thread maintained: "The same system that failed my grandmother is sitting on your company's reserves." Connects personal story to business value.
- "board-ready reporting" from B2B trust badges.
- "trusted systems powering our personal platform" instead of "institutional-grade protocols" (Adelaide Filter + cross-page connection).
- The B2B landing page has the detailed fee comparison with calculators. The About page is a preview, not a pitch.

---

## SECTION 7: CONTACT

**H2:**

```
Contact
```

**Contact info:**

```
Founder: Bar
Based in: Berlin, Germany
Email: hello@diboas.com
```

**Personal line:**

```
Questions? I read every email. bar@diboas.com
```

`[CLO P2-1 noted: "I read every email" is authentic at launch. Flag for reassessment Q3 2026 when user volume may make it impractical.]`

### Notes

- "Bar" (not "Breno"). Matches B2C Section 8.5 and B2B.
- `hello@diboas.com` = general contact. `bar@diboas.com` = personal founder contact (mailto link).
- Personal line requires one new `<p>` tag in TSX component with mailto link. Only structural code change on the page.

---

## SECTION 8: WAITLIST

No copy changes. Uses shared `WaitlistSection` component. No modifications needed.

---

## FOOTER

The About page now requires the shared footer disclaimer component. Investment-related language ("10 ways to grow your money," "nearly 4 years of historical analysis") triggers MiCA Art. 68 for EU users.

`[CLO P1-4 confirmed: shared footer component must be wired by CTO.]`

### Footer requirements by locale

| Locale | Required Disclaimers |
|--------|---------------------|
| EN | MiCA Art. 68 + Art. 7 + AI Disclosure + US Disclosure |
| DE | MiCA Art. 68 + Art. 7 (German) + AI Disclosure (German) |
| ES | MiCA Art. 68 + Art. 7 (Spanish) + AI Disclosure (Spanish) |
| PT-BR | CVM 3-Warning (NOT MiCA) + AI Disclosure (Portuguese) |

These use the same shared component and identical text as B2C, Strategies, and Protocols pages. No new copy needed. CTO imports the component.

---

## SEO

```json
{
  "seo.title": "About diBoaS | Built for the People Banks Forgot",
  "seo.description": "diBoaS was built because one grandmother deserved better. Now everyone does. Free transfers, real growth options, starting at $5.",
  "seo.ogTitle": "About diBoaS | Built for the People Banks Forgot",
  "seo.ogDescription": "diBoaS was built because one grandmother deserved better. Now everyone does. Free transfers, real growth options, starting at $5."
}
```

`[CLO P2-2 noted: "Banks Forgot" is softer than previous "Banks Keep Hidden." CMO decision: keeping it. Not in banking partnership negotiations yet. Revisit if banking partnerships materialize.]`

---

## CROSS-PAGE CONSISTENCY VERIFICATION

| Element | Other Pages | About Page | Match? |
|---------|-------------|------------|--------|
| "Her name was Adelaide" | B2C Section 2 | Section 2 H2 | ✅ |
| "Bar" (not "Breno") | B2C + B2B | Sections 2, 7 | ✅ |
| $5 minimum | B2C FAQ 6, Strategies | Sections 3, 4, 5 | ✅ |
| "nearly 4 years" | Strategies hero | Section 4 Card 2 | ✅ |
| "collectively secured billions" | Strategies hero | Section 3 | ✅ (deliberate vagueness) |
| Brand promise verbatim | B2C (2 uses) | Section 4 Card 2 | ✅ |
| 0.39% fee | Strategies, Protocols | Not mentioned | ✅ (correct: About page shouldn't specify fees) |
| Adelaide Filter | All consumer pages | Clean (0 violations) | ✅ |
| 10 strategies | B2C Section 4 | Section 3 | ✅ |
| "I named it after her" | B2C Section 2 | Section 2 close | ✅ |
| Free transfers = primary prop | CEO decision, B2C hero | Section 3 paragraph 1 | ✅ |
| Transition hooks | B2C (7), Protocols (5) | About (4) | ✅ |
| "The door" metaphor | B2C Section 2 | Section 2 + Section 5 | ✅ |
| MiCA / CVM footer | All pages | Pending CTO implementation | ⚠️ P1-4 |

---

## i18n KEY DERIVATION

CTO derives i18n keys from section structure. Full key pattern:

```
about.seo.title / .description / .ogTitle / .ogDescription
about.hero.title / .subtitle
about.transitions.t1 / .t2 / .t3 / .t4
about.story.header / .paragraph1 / .paragraph2 / .paragraph3 / .paragraph4 / .gapExplanation / .accessLocked / .turning / .namedAfterHer
about.whatWeDo.header / .transfers / .transfersDisclaimer / .growth / .adelaide
about.beliefs.header / .money.title / .money.description / .honesty.title / .honesty.description / .startSmall.title / .startSmall.description
about.mission.header / .story / .statement / .pillars
about.business.header / .description / .pitch / .cta
about.contact.header / .founder / .founderName / .location / .locationValue / .email / .emailValue / .personal / .personalEmail
```

Locale-specific value adaptations:
- `about.beliefs.startSmall.title`: EN "$5" → DE/ES "€5" → PT-BR "R$10"
- `about.mission.pillars`: EN "$5" → DE/ES "€5" → PT-BR "R$10"

---

## COMPONENT CHANGES NEEDED

| Change | File | Type | Effort |
|--------|------|------|--------|
| Add personal email line | `AboutPageContent.tsx` Section 7 | New `<p>` with mailto | 2 min |
| Add transition hooks (4) | `AboutPageContent.tsx` between sections | New `<p>` elements with transition styling | 5 min |
| Add shared footer component | `AboutPageContent.tsx` bottom | Import + render | 5 min |
| Update all i18n JSON content | `en/about.json` | Content replacement | 15 min |
| CSS module | `AboutPageContent.module.css` | No changes needed | 0 min |

Total CTO effort: ~27 minutes.

---

## WHAT THIS DOCUMENT IS

This is the **EN source of truth** for the About page. All CLO and Copywriter findings resolved. Ready for:

1. CEO sign-off (routine)
2. DE / ES / PT-BR translations
3. Implementation (i18n JSON updates + 3 small TSX changes)

Given the minimal structural changes, a separate Claude Code handoff document is unnecessary. The i18n JSON replacement + footer import + personal email line + transition elements are self-contained enough for direct implementation.
