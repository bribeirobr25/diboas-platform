# diBoaS B2C Landing Page - Final Champion Copy (EN)

## Document Status

| Field | Value |
|-------|-------|
| Version | FINAL - Production Ready |
| Language | English (EN) |
| Approved By | CLO Board, Copywriter, CMO Board, CEO |
| Sessions | 015 + 016 + 017 + 018 |
| Total Changes | 61 copy changes + 9 structural decisions |
| Date | February 26, 2026 |
| Blockers | 0 |

## Implementation Notes for CTO / Claude Code

This document contains the complete, approved English copy for the diBoaS B2C landing page. Every section is production-ready. Use this as the single source of truth for all English page content.

### Global Rules

- NO em-dash characters anywhere on the page. Use commas, periods, colons, or line breaks instead.
- NO emojis in body copy.
- All CTAs are buttons unless noted otherwise.
- All micro-disclosures and footnotes use small/muted text styling.
- Transition hooks between sections should be styled as subtle lead-in text (smaller than headlines, larger than body).
- The Adelaide Filter applies: no jargon on the main page. See Banned Words list at the bottom of this document.

### Section Flow (Final Order)

| Section | Name | Type |
|---------|------|------|
| 1 | Hero | Static |
| 2 | Origin Story | Static |
| 2.5 | Persona Carousel | Rotating carousel (3 slides) |
| 3 | Real-Life Scenarios | Cards (3) |
| 4 | Product Carousel | Rotating carousel (3 slides) |
| 5 | Fee Transparency Table | Static table |
| 6 | What's the Catch | Static |
| 6.5 | How It Works Under the Hood | Expandable/collapsible (collapsed by default) |
| 7 | Interactive Demo | Interactive component |
| 8 | Social Proof | Dynamic counter |
| 8.5 | About the Founder | Static with photo |
| 9 | Waitlist | Form (two versions: pre-cap and post-cap) |
| 10 | FAQ | Accordion (13 items) |
| 11 | Footer | Static with legal disclosures |

---

## SECTION 1: HERO

### Layout

Full-width hero section. Centered text. Single CTA button below sub-headline. No additional text below button.

### Content

**H1:**

```
The system isn't broken. It's working exactly as designed. Just not for you.
```

**Sub-headline:**

```
Send money anywhere in seconds. Free. Then make it grow while you sleep.
```

**CTA Button:**

```
See your money in action
```

### Notes

- H1 is untouchable. Do not modify.
- No friction reducer text below the CTA. The button stands alone.
- CTA links to Section 7 (Interactive Demo).

---

## SECTION 2: ORIGIN STORY

### Layout

Full-width section. Text-centered or left-aligned. Transition hook appears as subtle lead-in text above the H2.

### Content

**Transition hook (from Hero):**

```
Here's why I'm building this.
```

**H2:**

```
Her name was Adelaide.
```

**Body:**

```
My grandmother never had access to the financial tools that could have changed her life.

The system wasn't broken. It was working exactly as designed.
Just not for people like her. Like me. Like you.

Access was locked behind high minimums, complicated words, and big financial institutions that didn't care about people with small savings.

$10,000 to open an investment account. $25 a month just to keep a checking account open. That was the price of access.

New technology made it possible to bypass the gatekeepers.
I just had to build the door.

I named it after her.
```

### Notes

- "Just not for people like her. Like me. Like you." should visually echo the Hero H1 cadence.
- The dollar amounts ($10,000 and $25) should be styled to stand out (bold or slightly larger, at CTO discretion).
- The last line "I named it after her." should feel like a pause. Consider slight spacing above it.

---

## SECTION 2.5: PERSONA CAROUSEL

### Layout

Full-width, hero-scale rotating section. Each slide has a unique background image. Auto-rotation every 4 to 5 seconds. Manual navigation (arrows or dots). Same CTA button on every slide. Transition hook appears as subtle lead-in text above.

### Content

**Transition hook (from Origin Story):**

```
I built it for you.
```

#### Slide 1: The Sender

**Background direction:** Warm, human. Someone on a phone late at night, soft light.

**Headline:**

```
Your mom needs it now. Not during business hours.
```

**Sub-text:**

```
Send money to anyone on diBoaS. Anywhere in the world. In seconds. Free.
```

**CTA Button:**

```
See your money in action
```

#### Slide 2: The Saver

**Background direction:** Clean, practical. Someone looking at a bill or a laptop with numbers.

**Headline:**

```
You're paying hundreds a year in fees you don't even see.
```

**Sub-text:**

```
No monthly charges. No surprise fees. No fine print. Just your money, working for you.
```

**CTA Button:**

```
See your money in action
```

#### Slide 3: The Grower

**Background direction:** Aspirational, calm. Sunrise, someone relaxed, looking forward.

**Headline:**

```
Your savings account is paying you almost nothing. You know it.
```

**Sub-text:**

```
Pick what fits your life, cautious or adventurous. Starting at $5. Adelaide watches your money so you don't have to.
```

**CTA Button:**

```
See your money in action
```

**Transition hook (out, to Scenarios):**

```
And this is what it looks like.
```

### Notes

- All three slides share the same CTA text and link (to Section 7: Demo).
- Background images are design deliverables. Use placeholder images until provided.
- Carousel should be accessible: keyboard navigable, pause on hover, aria labels.

---

## SECTION 3: REAL-LIFE SCENARIOS

### Layout

Three cards side by side on desktop, stacked on mobile. Each card has a title, body text, and a cost comparison line. A clarification line appears below all three cards. A footnote appears at the bottom.

### Content

**H2:**

```
Real People. Real Moments.
```

#### Card 1: Splitting dinner in San Francisco

```
Four friends. One tap. Done before the waiter brings the check.
```

**Cost comparison (small/accent text):**

```
Most payment apps charge $0.25 to $1.75 per instant transfer. diBoaS: free.
```

#### Card 2: Paying a designer in Dubai

```
They're in the Middle East. You're in America. The money arrives before the meeting ends.
```

**Cost comparison (small/accent text):**

```
International wire transfers: $25 to $50 plus 2 to 3 business days. diBoaS: free and instant.
```

#### Card 3: Emergency money to Mom

```
3 AM. She needs it now. Not during "business hours."
```

**Cost comparison (small/accent text):**

```
Traditional money transfer services: $9.99+ and next-day delivery. diBoaS: free, arrives now.
```

**Clarification line (below all cards):**

```
Use diBoaS just for free transfers. Nothing else required. When you're ready for more, it's here.
```

**Footnote (small text):**

```
Pricing comparisons based on publicly available rates as of February 2026.
```

### Notes

- No named competitors (no "Western Union," no "Venmo"). Use generic categories only.
- Cost comparisons should be visually distinct from the card body (smaller font, different color, or accent styling).
- Cards should have subtle hover effects on desktop.

---

## SECTION 4: PRODUCT CAROUSEL

### Layout

Rotating carousel with 3 slides. Each slide has a testimonial quote, a descriptive paragraph, and optionally a payoff line. Manual navigation. A micro-disclosure appears below the carousel. Transition hook above.

### Content

**Transition hook (from Scenarios):**

```
Here's how it works.
```

**H2:**

```
Money that moves like messages.
```

#### Slide 1: Send and Receive

**Quote:**

```
"I sent $200 to my brother. It arrived before I put my phone down."
```

**Description:**

```
Send money to anyone on diBoaS. Anywhere in the world. In seconds. From $5 to $5,000. Free. Your money is stored as a digital dollar, designed to hold a $1 value. Withdraw to your bank account anytime.
```

#### Slide 2: Invest and Grow

**Quote:**

```
"I had $200 sitting in my account doing nothing. Now it's earning more than my bank offered in 5 years."
```

**Description:**

```
Choose from 10 ways to grow your money. From the safest option to the most adventurous. Starting at $5. Your money works while you sleep.
```

#### Slide 3: Track and Learn

**Quote:**

```
"Adelaide watches your money so you don't have to. Check once a day. Less stress. More life."
```

**Description:**

```
What's moving. What it means. What you could do. Clear language, not jargon.
```

**Micro-disclosure (below carousel, small text):**

```
Examples shown are illustrative and do not represent actual users.
```

### Notes

- This section merges the previous "Product Carousel" and "Feature Carousel" into one unified section.
- Quotes should be styled as testimonial callouts (larger font, quote marks, italic or distinct styling).
- Description text is regular body text below each quote.

---

## SECTION 5: FEE TRANSPARENCY TABLE

### Layout

Full-width section with a pain quantification intro paragraph, a table, a summary example, and a footer line. Transition hook above.

### Content

**Transition hook (from Product Carousel):**

```
Now let's talk money.
```

**H2:**

```
What It Costs. All of It.
```

**Pain quantification intro:**

```
The average person pays hundreds of dollars a year in bank fees, transfer charges, and hidden spreads. Here's what it looks like with us.
```

#### Fee Table

| Action | diBoaS | Typical Apps | Difference | Example |
|--------|--------|-------------|------------|---------|
| Account | Free forever | $5 to $15/month | Save $60 to $180/year | Your account: $0. Always. |
| Add Money | 0.48% | 0 to 1.5% | Cheaper than most apps charge to add money | Add $100: costs you 48 cents |
| Send Money | FREE* | $1.50 to $50 | Save $5 to $50 per transfer | Send $50 to Mom: $0 |
| Buy / Invest | FREE | 1.5 to 2.5% (exchanges, brokers) | Save $1.50 to $2.50 per $100 | Invest $100: costs $0 |
| Sell / Close | 0.39% | 1.5 to 2.5% (exchanges, brokers) | Save $1.11 to $2.11 per $100 | Sell $100: costs you 39 cents |
| Swap | FREE* | 0.5 to 2% spread | Save $0.50 to $2 per $100 | Swap $100: $0 |
| Grow (Strategies) | Free to start, 0.39% to exit | N/A | Growth options your bank doesn't offer | Start with $100: free. Exit $100: costs 39 cents |
| Cash Out | 0.48% | 1 to 3% plus delays | Save up to $2.52 per $100 | Cash out $100: costs you 48 cents |

**Fine print (below table, small text):**

```
*diBoaS fee shown. Third-party network fees may apply (typically less than $0.01).
```

**Summary example:**

```
A $100 investment costs $0 with diBoaS. Selling costs 39 cents.
```

**Footer line:**

```
Every fee. On the table. Nothing else.
```

### Notes

- Table should be responsive. On mobile, consider card-style layout instead of horizontal table.
- The "Example" column is the most important for casual readers. Consider visual emphasis.
- "FREE*" should link visually to the fine print asterisk.
- The "Difference" column can be styled in green or accent color to highlight savings.

---

## SECTION 6: WHAT'S THE CATCH?

### Layout

Full-width section. Text-focused. No special components.

### Content

**H2:**

```
What's the catch?
```

**Body:**

```
Fair question. Here's the real answer:

Investing is free. When you sell, we charge 0.39%. If you sell $100, we make 39 cents. The only way we earn more is if your money grows. Our incentives are aligned with yours.

No monthly fees. No surprise charges. No withdrawal penalties.

How? New technology removed the branches, the executives, and the legacy costs. We pass those savings to you.

Is there risk? Yes. Your money isn't in a bank. It's working through new technology. That means it can grow more, but there's also real risk. We monitor 24/7 and we test every strategy against past crashes, COVID, FTX, Terra, but we can't guarantee returns, and anyone who says they can is lying.

We win when you win. We show you both sides, the opportunities AND the risks, always.
```

### Notes

- "We show you both sides, the opportunities AND the risks, always." is one of two permitted appearances of the brand promise. The other is in FAQ 4 (Is my money safe?).
- "anyone who says they can is lying" is intentionally direct. Do not soften.

---

## SECTION 6.5: HOW IT WORKS UNDER THE HOOD

### Layout

Expandable/collapsible section. COLLAPSED by default. Toggle label is visible. When expanded, shows technical content. This is the ONE exception zone where technical terms are permitted.

### Content

**Toggle label (always visible):**

```
Want the technical details?
```

**Expanded content:**

```
Architecture: diBoaS is built on open-source financial infrastructure. Your wallet is secured so that no one, including diBoaS, can access your funds. Only you can authorize transactions.

Your wallet: Every user gets their own personal wallet with their own private key. diBoaS never sees, holds, or has access to your key. If diBoaS disappeared tomorrow, your money would still be yours.

Security: Every strategy is tested against historical market crashes before it's offered to users. We monitor all positions 24/7. Transaction signing happens in milliseconds.

Transparency: All fees are disclosed upfront. All risks are stated plainly. No hidden mechanics.
```

**Link (at bottom of expanded content):**

```
See full technical documentation
```

Link target: /strategies

### Notes

- This section uses a UNIFIED version. No A/B variant needed. Both Privy (MPC) and Turnkey (TEE) are non-custodial, so all claims are accurate regardless of final wallet provider choice.
- The toggle should use a chevron or arrow icon indicating expand/collapse state.
- Technical terms (non-custodial, private key, open-source) are permitted ONLY in this section.
- This section should have a subtle visual distinction (slightly different background, border, or indent) to signal "optional deep dive."

---

## SECTION 7: INTERACTIVE DEMO

### Layout

Centered section with headline, sub-text, and two CTA buttons (primary and secondary). Transition hook above.

### Content

**Transition hook (from Under the Hood):**

```
Don't take our word for it.
```

**H2:**

```
What would your $100 do here?
```

**Sub:**

```
No signup. No real money. Just proof.
```

**CTA 1 (Primary button):**

```
Try it with $100 (practice money)
```

**CTA 2 (Secondary/smaller button):**

```
Start smaller? See what $5 could become.
```

### Notes

- CTA 1 launches the demo with $100 pre-filled.
- CTA 2 launches the demo with $5 pre-filled.
- "(practice money)" is intentional phrasing (not "fake money"). Keep it.
- Demo component itself is a separate implementation. This section is the entry point.

---

## SECTION 8: SOCIAL PROOF

### Layout

Centered section with headline, dynamic counter, sub-text, and CTA button.

### Content

**H2:**

```
The first 1,200.
```

**Counter (dynamic, real-time):**

```
[X] founding members. [Y] countries. [Z] spots remaining.
```

**Sub:**

```
We're starting small so we can take care of every person who joins.
```

**CTA Button:**

```
Get early access
```

### Notes

- Counter starts at 0 on launch day. No placeholder or fake numbers.
- Counter updates every 30 to 60 seconds via API call.
- [X] = number of founding members signed up.
- [Y] = number of unique countries represented.
- [Z] = 1200 minus [X].
- When [Z] reaches 0, this section's CTA should link to the post-cap waitlist (Section 9 Version B).
- CTA links to Section 9 (Waitlist).

---

## SECTION 8.5: ABOUT THE FOUNDER

### Layout

Two-column on desktop (photo left, text right). Stacked on mobile (photo top, text below). Warm, personal styling. Not corporate.

### Content

**Photo:** Use the image from `apps/web/public/assets/images/` (Bar's photo).

**Text:**

```
Built by Bar.

I grew up watching my grandmother Adelaide navigate a financial system that wasn't designed for her. She deserved better tools. So does everyone like her.

diBoaS is being established in Berlin, Germany, building for people in the US, EU, and Brazil. I've spent 20+ years working in Products and IT across Brazil, the US, Japan, and Germany. Now I'm building the financial tool I wish my grandmother had.

Questions? I read every email. bar@diboas.com
```

### Notes

- "bar@diboas.com" should be a clickable mailto link.
- Photo should be a professional but warm headshot. Not a corporate portrait.
- "Built by Bar." is the section header, not a traditional H2. Style it as a name/signature feel.
- This section should feel personal and human. Avoid corporate card/box styling.

---

## SECTION 9: WAITLIST

### Layout

Two versions. Version A displays when spots remain (counter > 0). Version B displays automatically when the 1,200 cap is reached. The system should swap versions based on the real-time counter.

### Version A: Before 1,200 cap is reached

**H2:**

```
Be one of the first 1,200.
```

**Sub:**

```
We're starting small so we can take care of every person who joins.
```

**Benefits list:**

```
Permanent Founding Member badge (#47 of 1,200)
Your name on the Founders Wall
5 personal invites
Future exclusive benefits for Founding Members only
```

**Counter:**

```
[Z] spots remaining
```

**Email input field** (placeholder: "Your email address")

**CTA Button:**

```
Get early access
```

**Below CTA (small text):**

```
No spam. Just your invite when we're ready.
```

**Privacy checkbox:**

```
I agree to the Privacy Policy
```

(Link "Privacy Policy" to /legal/privacy)

### Version B: After 1,200 cap is reached

**H2:**

```
Founding spots are full.
```

**Sub:**

```
Got an invite code? You're in as an Early Member, with your own badge and 5 invites.
No code? Join the priority list. We'll open more spots soon.
```

#### Path 1: Invite code entry

**Invite code input field** (placeholder: "Enter your invite code")

**CTA Button:**

```
Enter with my invite
```

#### Path 2: Priority waitlist

**Email input field** (placeholder: "Your email address")

**CTA Button:**

```
Join the priority list
```

**Below CTA (small text):**

```
No spam. Just your invite when we're ready.
```

### Notes

- Version A to Version B swap must be automatic based on the counter reaching 1,200.
- Founding Member numbers are assigned sequentially (#1 through #1,200) in order of signup.
- Each Founding Member gets exactly 5 invite codes generated on signup.
- Invite code validation happens on submit (Path 1, Version B).
- Benefits list uses line breaks, not bullet points or dashes.
- The counter in Version A should match the counter in Section 8.

---

## SECTION 10: FAQ

### Layout

Accordion style. Each question is a clickable header that expands to reveal the answer. All items collapsed by default. Only one item open at a time (clicking a new one closes the previous).

### Content

**H2:**

```
Before you decide.
```

#### FAQ 1: Is diBoaS a bank?

**Question:**

```
Is diBoaS a bank?
```

**Answer:**

```
No. diBoaS is a platform that helps you connect with financial opportunities. We don't manage your money or make decisions about your funds. Your wallet is secured so that only YOU can authorize transactions. We provide the tools, you make the decisions.
```

#### FAQ 2: Is diBoaS for everyone?

**Question:**

```
Is diBoaS for everyone?
```

**Answer:**

```
No. If you want someone else to make financial decisions for you, that's not us. If you want a traditional bank with branches and paper statements, that's not us either.

diBoaS is for people who want control over their own money, transparency about costs, and access to opportunities that used to require $10,000 minimums. You don't need to understand everything right now, that's what we're here for. You just need to be willing to learn.
```

#### FAQ 3: Can I withdraw my money anytime?

**Question:**

```
Can I withdraw my money anytime?
```

**Answer:**

```
Yes. Your money is yours. Withdraw to your bank account whenever you want. The fee is 0.48%, so cashing out $100 costs you 48 cents. There are no lock-up periods and no penalties. We process your withdrawal instantly. Bank transfer times may vary.
```

#### FAQ 4: Is my money safe?

**Question:**

```
Is my money safe?
```

**Answer:**

```
Your money is secured by you. Only you hold the keys, no one else can access your funds without your permission.

That said, this isn't a bank account. Crypto-assets aren't covered by deposit guarantee schemes. The value of your assets can fluctuate, and you could lose some or all of your investment.

We show you both sides, the opportunities and the risks, always.
```

#### FAQ 5: How is this possible without high fees?

**Question:**

```
How is this possible without high fees?
```

**Answer:**

```
By cutting out the middlemen, the branches, the executives, the legacy costs. New financial technology does the same job at a fraction of the price. We pass those savings to you. That's the entire model.
```

#### FAQ 6: What's the minimum amount to start?

**Question:**

```
What's the minimum amount to start?
```

**Answer:**

```
$5. That's a coffee. Most investment platforms require $500 to $10,000 just to open the door. We think that's part of the problem.
```

#### FAQ 7: Can I just use diBoaS for transfers?

**Question:**

```
Can I just use diBoaS for transfers?
```

**Answer:**

```
Yes. Absolutely. You can use diBoaS only for sending and receiving money, free, instant, worldwide. The investing and growth features are there when and if you ever want them. No pressure. No package deals.
```

#### FAQ 8: What if I don't understand investing?

**Question:**

```
What if I don't understand investing?
```

**Answer:**

```
That's exactly who we built this for. Our goal is to make it so simple that anyone can do it. No jargon. No complicated decisions. Just clear options and transparent information. Start with $5. Explore. Learn. We're here every step.
```

#### FAQ 9: What if something goes wrong?

**Question:**

```
What if something goes wrong?
```

**Answer:**

```
The technology we use carries real risk. Returns can go up or down. The systems aren't perfect, no system is. We monitor 24/7, and we test every strategy against past crashes (COVID, FTX, Terra) before we offer it. We'll always tell you what's happening. But we can't eliminate all risk, and anyone who says they can is lying.
```

#### FAQ 10: What happens to my money if diBoaS shuts down?

**Question:**

```
What happens to my money if diBoaS shuts down?
```

**Answer:**

```
Your money is in YOUR wallet. Not ours. If diBoaS disappeared tomorrow, you would still have your funds, accessible through your wallet keys. We never hold your money. We never can. That's not a feature we added. It's how the whole system was built.
```

#### FAQ 11: Has diBoaS been audited?

**Question:**

```
Has diBoaS been audited?
```

**Answer:**

```
We're a pre-launch platform. Our strategies are stress-tested against historical crashes and real-world scenarios, and we use audited, established protocols. As we grow, we plan to pursue independent third-party audits. For full details on the protocols and technology behind each strategy, visit our Strategies and Protocols pages.
```

Links: "Strategies" links to /strategies, "Protocols" links to /protocols.

#### FAQ 12: What happens after I sign up?

**Question:**

```
What happens after I sign up?
```

**Answer:**

```
You'll receive an email with your Founding Member badge and number, your personal invite link (5 invites to share), and instructions to get started.

From there, you set up your wallet, add funds, and you're in.
```

### Notes

- 13 FAQs total. Order is intentional and follows the reader's trust journey. Do not reorder.
- FAQ 4 contains the second (and final) appearance of the brand promise: "We show you both sides, the opportunities and the risks, always."
- FAQ 11 contains links to /strategies and /protocols. These pages must exist or the links should be placeholder anchors.
- Accordion must be accessible: keyboard navigable, aria-expanded attributes, proper focus management.

---

## SECTION 11: FOOTER

### Layout

Full-width footer. Contains mandatory legal disclosures, navigation links, and social links. Legal text must be rendered verbatim with no modifications.

### Mandatory Disclosures

#### MiCA Article 68: Risk Warning

**Applies to:** EN, DE, ES locales ONLY. Do NOT include in pt-BR.

**Text (verbatim, do not modify):**

```
The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes.
```

#### MiCA Article 7: Marketing Communication Disclaimer

**Applies to:** EN, DE, ES locales ONLY. Do NOT include in pt-BR.

**Text (verbatim, do not modify):**

```
This crypto-asset marketing communication has not been reviewed or approved by any competent authority in any Member State of the European Union. The offeror of the crypto-asset is solely responsible for the content of this crypto-asset marketing communication.
```

#### AI Disclosure

**Applies to:** ALL locales.

**Text (verbatim, do not modify):**

```
Certain content on this platform, including market analysis and educational materials, is generated or assisted by artificial intelligence. AI-generated content may contain errors or limitations. Users should verify information independently before making financial decisions.
```

### PT-BR Footer Requirements (for localization reference)

When building the pt-BR locale, include these three CVM warnings instead of MiCA text. They must have equal visual prominence to promotional content:

```
1. Retornos passados nao sao garantia de retorno futuro
2. Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido
3. Percentuais prospectivos refletem apenas a opiniao do autor, com base em informacoes disponiveis a epoca e consideradas confiaveis
```

Note: Proper Portuguese accents must be applied during pt-BR implementation.

### Additional Footer Elements

- Non-custodial / user autonomy language (brief one-liner)
- Fictional testimonial disclosure: "Testimonials on this page are illustrative examples and do not represent real users."
- Social links: Instagram, X, YouTube, LinkedIn
- Navigation links: About, Legal, Privacy Policy, Terms of Service, Cookie Policy, Help, Security
- Copyright: (c) 2026 diBoaS. All rights reserved.

### Locale-Specific Implementation Notes

| Locale | Action |
|--------|--------|
| EN | Include MiCA Article 68 + Article 7 + AI Disclosure |
| DE | Include MiCA Article 68 + Article 7 (in German) + AI Disclosure (in German). Remove any duplicate MiCA paragraph if present. |
| ES | Include MiCA Article 68 + Article 7 (in Spanish) + AI Disclosure (in Spanish). Remove any duplicate MiCA paragraph if present. |
| pt-BR | Remove ALL MiCA text. Add CVM 3-Warning (in Portuguese). Fix grammar: "Oportunidades justa" must be "oportunidades justas". Include AI Disclosure (in Portuguese). |

---

## TRANSITION HOOKS: COMPLETE MAP

| After Section | Hook Text | Leads To |
|---------------|-----------|----------|
| 1. Hero | Here's why I'm building this. | Origin Story |
| 2. Origin Story | I built it for you. | Persona Carousel |
| 2.5. Persona Carousel | And this is what it looks like. | Real-Life Scenarios |
| 3. Scenarios | Here's how it works. | Product Carousel |
| 4. Product Carousel | Now let's talk money. | Fee Table |
| 5. Fee Table | (natural flow) | What's the Catch |
| 6. What's the Catch | (natural flow) | Under the Hood |
| 6.5. Under the Hood | Don't take our word for it. | Demo |
| 7. Demo | (natural flow) | Social Proof |
| 8. Social Proof | (natural flow) | About the Founder |
| 8.5. About the Founder | (natural flow) | Waitlist |
| 9. Waitlist | (natural flow) | FAQ |
| 10. FAQ | (natural flow) | Footer |

### Implementation

- Transition hooks with text should be rendered as subtle lead-in elements between sections.
- "(natural flow)" means no explicit transition text. The sections flow into each other with normal spacing.
- Hooks should be visually lighter than headlines but heavier than body text.

---

## BRAND RULES

### The Adelaide Filter (Standing Rule)

Every word on this page must pass the Grandmother Test: would Bar's grandmother Adelaide understand it? If not, rewrite it.

### Banned Words on Main Page

Do NOT use these words anywhere on the page EXCEPT inside Section 6.5 (expandable Under the Hood):

- Blockchain
- DeFi
- Protocol(s)
- Stablecoin(s)
- Pegged
- On-ramp / Off-ramp
- Smart contract(s)
- Yield (use "returns" or "growth" instead)
- Non-custodial (use "you hold the keys" or "you control your funds" instead)
- Capital preservation (use "safest option" instead)
- High-growth (use "most adventurous" instead)

### Brand Promise

```
We show you both sides, the opportunities and the risks, always.
```

Maximum 2 appearances on the entire page:

1. Section 6: What's the Catch (last line)
2. FAQ 4: Is my money safe? (last line)

Do not add additional instances.

### Voice Rules

- Second person ("you"). The reader is always the subject.
- Warm but direct. Never corporate, never salesy.
- Honest about limitations. Risk disclosure is a brand feature, not a legal obligation.
- Simple sentences. If it needs a comma, consider splitting it.
- Zero emojis in body copy.
- No em-dashes. Use commas, periods, colons, or separate sentences.

---

## CTO IMPLEMENTATION CHECKLIST

These are the technical tasks required to bring this copy to production:

### Infrastructure

- [ ] Real-time counter: starts at 0, updates every 30 to 60 seconds, syncs between Section 8 and Section 9
- [ ] Invite code system: 5 codes per Founding Member, generated on signup, validated on submit
- [ ] Sequential Founding Member number assignment: #1 through #1,200
- [ ] Section 9 Version A to Version B automatic swap when counter reaches 1,200
- [ ] Email collection with privacy consent checkbox

### Components to Build

- [ ] Persona Carousel (Section 2.5): 3 slides, auto-rotation, manual nav, responsive
- [ ] Product Carousel (Section 4): 3 slides, merged format with quotes + descriptions
- [ ] Fee Table (Section 5): responsive table with mobile card fallback
- [ ] Expandable Section 6.5: collapsed by default, toggle with chevron
- [ ] Interactive Demo entry (Section 7): two CTAs linking to demo with different pre-fill amounts
- [ ] Social Proof counter (Section 8): dynamic, real-time
- [ ] About the Founder (Section 8.5): photo + text two-column layout
- [ ] Waitlist form (Section 9): two versions with automatic swap
- [ ] FAQ Accordion (Section 10): 13 items, single-open behavior
- [ ] Footer (Section 11): legal disclosures, locale-conditional rendering

### Locale Tasks

- [ ] EN: implement this document as-is
- [ ] DE: translate, include MiCA Article 68 + Article 7 in German, remove duplicate MiCA if present
- [ ] ES: translate, include MiCA Article 68 + Article 7 in Spanish, remove duplicate MiCA if present
- [ ] pt-BR: translate, remove ALL MiCA, add CVM 3-Warning, fix "oportunidades justas" grammar

### Fee Cascade

- [ ] Verify all fee percentages (0.39%, 0.48%) match across: Fee Table, What's the Catch, FAQ 3, FAQ 8, and any downstream documents

### Accessibility

- [ ] All carousels: keyboard navigable, pause on hover, aria labels
- [ ] FAQ accordion: aria-expanded, focus management
- [ ] Expandable section: aria-expanded, keyboard toggle
- [ ] All form inputs: proper labels, error states, focus indicators
- [ ] Color contrast: all text meets WCAG AA minimum

---

## POST-LAUNCH A/B TEST QUEUE

These tests are approved for implementation after launch. Do not run before launch.

| # | Test | Variant A (Default/Current) | Variant B |
|---|------|-----------------------------|-----------|
| 1 | Transition hook after carousel | "I built it for you." | "So who is it for?" |
| 2 | Hero sub-headline | Two-prop (free + growth) | Single-prop (free only) |
| 3 | Scenario cards | Anonymous (current) | Named personas |
| 4 | FAQ 12 format | Separate sentences (current) | Flowing single paragraph |

---

## DOCUMENT HISTORY

| Session | Changes | Key Decisions |
|---------|---------|---------------|
| 015 | 30 copy changes | Origin story, hero, section reorder, CTAs rewritten, brand promise established |
| 016 | 16 copy changes | CLO + Copywriter feedback, Adelaide Filter purge, persona validation |
| 017 | 7 copy changes | Final CLO + Copywriter approval, MiCA Article 7, AI disclosure, 0 blockers |
| 018 | 9 structural decisions | Merge sections 4+5, unified wallet copy, FAQ reorder, waitlist repositioned, $100 demo, CEO/CTO answers applied |

Total: 61 copy changes + 9 structural decisions across 4 sessions.

**Final approval: CLO Board, Copywriter, CMO Board, CEO. Zero blockers. Production ready.**
