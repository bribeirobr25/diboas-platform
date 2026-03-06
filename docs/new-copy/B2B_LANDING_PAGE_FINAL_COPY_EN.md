# diBoaS B2B Landing Page — Final Champion Copy (EN)

## Document Status

| Field | Value |
|-------|-------|
| Version | FINAL — Production Ready |
| Language | English (EN) |
| Approved By | CMO Board (Session 020), CLO Board (Follow-Up Review), Copywriter |
| Date | February 26, 2026 |
| Blockers | 0 |

## Implementation Notes for CTO / Claude Code

Complete, approved English copy for the diBoaS B2B landing page. Serves TWO audiences on ONE page: small/medium businesses (SMBs) and startups/larger companies. Readers self-select through the "Two Worlds" section.

### Key Differences from B2C

| Aspect | B2C | B2B |
|--------|-----|-----|
| Primary CTA | Waitlist (email) | Dual: waitlist (SMB) + cal.com booking (startup) |
| Main pain | Bank fees + no access to growth | Card processing fees (SMB) + idle treasury yield (startup) |
| Calculator | Demo with practice money | Two calculators: cashflow (SMB) + treasury (startup), both with 3-scenario range |
| Fee structure | Identical | Identical + FREE receive payments (B2B exclusive) |
| Minimum | $5 | $5 |
| Adelaide | Personal finance intelligence | Business intelligence, board-ready reports |
| New concept | N/A | Cashflow Investing (save fees then invest savings) |
| Wallet variants | Version A / Version B | Version A / Version B (matched to B2C) |

### Global Rules

- NO em-dash characters. Use commas, periods, colons, or line breaks.
- NO emojis in body copy.
- All CTAs are buttons unless noted otherwise.
- All micro-disclosures use small/muted text styling.
- Transition hooks styled as subtle lead-in text.
- Adelaide Filter applies: no jargon on main page.
- Version A/B sections: implement as conditional. CTO selects at build time.

### Section Flow

| # | Section | Type | Audience |
|---|---------|------|----------|
| 1 | Hero | Static | Both |
| 2 | Two Worlds | Two cards | Self-selection |
| 3 | Cashflow Calculator | Interactive (NEW) | SMB-first |
| 4 | Treasury Calculator | Interactive (refined) | Startup-first |
| 5 | Origin Story | Static | Both |
| 6 | How It Works | 4 steps | Both |
| 7 | Three Features | 3 cards | Both |
| 8 | Cashflow Investing | Explainer (NEW) | SMB-first |
| 9 | Fee Transparency | Table | Both |
| 10 | Fit Assessment | Two columns | Both |
| 11 | About the Founder | Static with photo | Both |
| 12 | Social Proof + Dual CTA | Counter + two paths | Both |
| 13 | FAQ | Accordion (10 items) | Both |
| 14 | Footer | Legal disclosures | Both |

---

## SECTION 1: HERO

**H1:**

```
The system isn't broken. It's designed to take a cut of everything you earn.
```

**Sub-headline:**

```
You're losing 2 to 3% on every card payment. And the cash in your bank? It's earning returns for everyone except you. That changes now.
```

**CTA Button:**

```
See what you're losing
```

CTA scrolls to: Section 2 (Two Worlds)

**Trust badges (below CTA):**

```
Your funds, your wallet | Board-ready reporting | Built on audited protocols
```

---

## SECTION 2: TWO WORLDS

Two cards side by side on desktop. Stacked on mobile (Card A first).

**H2:**

```
Two ways the system costs you.
```

### Card A: If you accept card payments

```
Every time a customer pays with a card, you lose 2 to 3%.

On $1,000 a day in sales, that's $600 to $900 a month. Gone. Then the money takes 3 to 5 business days to reach your account. Your money, sitting in someone else's pocket, earning them interest.

What if you kept all of it? When your customers pay through diBoaS, you keep 100% of every transaction. No card processor in between.
```

**CTA Button:**

```
Calculate what you're losing
```

CTA scrolls to: Section 3

### Card B: If your company has cash sitting idle

```
You raised money. You're spending it carefully. But the cash you're not using right now? Your bank puts it to work, earns returns, and pays you almost nothing.

On $500,000 idle, the gap between what your bank pays and what's possible could be tens of thousands a year.

What if that money worked for you instead?
```

**CTA Button:**

```
Calculate what your bank is keeping
```

CTA scrolls to: Section 4

---

## SECTION 3: CASHFLOW CALCULATOR

**H2:**

```
What if you kept the 3%?
```

**Inputs:**

| Field | Label | Default |
|-------|-------|---------|
| Daily card revenue | Your daily card sales | $1,000 |
| Current gateway fee | Your current processing fee | 3% |

**Period toggle:** 1 month | 6 months | 1 year

**Disclaimer (ABOVE results):**

```
These projections are illustrative. Actual returns may be higher or lower. Past performance does not guarantee future results.
```

**Results (3-scenario range, calculated dynamically):**

For defaults ($1,000/day, 3%, 1 year):

| Scenario | Lost to gateway fees | With diBoaS (FREE) | You save | If you invest the savings |
|----------|---------------------|---------------------|----------|--------------------------|
| Conservative (4%) | $10,800 | $0 | $10,800 | $11,232 |
| Historical average (7%) | $10,800 | $0 | $10,800 | $11,556 |
| Optimistic (10%) | $10,800 | $0 | $10,800 | $11,880 |

**Adjustable slider:** Expected annual return (historical average: 7%). Range: 1% to 15%.

**Below results:**

```
That last column? That's the cashflow investing effect. You save on fees. Then you make the savings earn. Two wins from one change.

Returns aren't guaranteed. But the fee savings are real from day one.
```

**CTA Button:**

```
See the two-step effect
```

CTA scrolls to: Section 8

---

**Transition:**

```
That's for businesses that take payments. But what about cash that's already sitting there?
```

---

## SECTION 4: TREASURY CALCULATOR

**H2:**

```
What if your cash worked for you?
```

**Inputs:**

| Field | Label | Default |
|-------|-------|---------|
| Cash on hand | Cash on hand | $500,000 |
| Current interest rate | Current interest rate | 0.5% |

**Disclaimer (ABOVE results):**

```
These projections are illustrative. Actual returns may be higher or lower. Past performance does not guarantee future results. Your capital is at risk.
```

**Results (3-scenario range):**

| Scenario | Rate | Annual return | Your bank (0.5%) | The gap |
|----------|------|---------------|-------------------|---------|
| Conservative | 4% | $20,000/year | $2,500/year | $17,500/year |
| Historical average | 7% | $35,000/year | $2,500/year | $32,500/year |
| Optimistic | 10% | $50,000/year | $2,500/year | $47,500/year |

**Adjustable slider:** Expected annual return (historical average: 7%). Range: 1% to 15%.

**Below results:**

```
These are projections, not promises. But the gap between what your bank pays and what's possible? That's real.
```

**CTA Button:**

```
See what's possible
```

CTA scrolls to: Section 12

---

**Transition:**

```
Here's why this matters to me.
```

---

## SECTION 5: ORIGIN STORY

**H2:**

```
Her name was Adelaide.
```

**Body:**

```
My grandmother saved her whole life. Half of everything she earned. Did everything right.

It still wasn't enough.

The bank invested her savings, earned returns, and gave her almost nothing back. Sound familiar?

I've seen coffee shops lose $10,000 a year to card fees. I've seen startups with half a million in the bank earning less than $200 a month in interest. The system takes from everyone.

It wasn't built for people like her. It wasn't built for businesses like yours either, whether you run a coffee shop or a startup.

But now? Technology made it possible to cut out the middlemen. I just had to build the door.

I named it after her.
```

**Signature:**

```
Bar, Founder
```

---

**Transition:**

```
Here's how it works.
```

---

## SECTION 6: HOW IT WORKS

**H2:**

```
Four steps. Two minutes.
```

**Step 1: Connect your business**

```
Link your business account. Two-minute setup. No technical integration needed. No developer. No downtime. You do it during your morning coffee.
```

**Step 2: You set the rules**

```
Tell us your floor. "Always keep $50,000 available." Everything above that? Put it to work. You set the rules. You change them anytime.
```

**Step 3: Your money works**

```
Your idle cash starts earning. Payments arrive in seconds, not days. Your processing fees drop from 3% to zero. And you didn't have to think about any of it.
```

**Step 4: Access anytime**

```
Need cash? One tap. No lock-ups. No penalties. Processed instantly. Bank transfer times may vary.
```

---

**Transition:**

```
That's the process. Here's what you actually get.
```

---

## SECTION 7: THREE FEATURES

**H2:**

```
What your business gets.
```

### Get paid without the cut

```
When your customers pay through diBoaS, you receive the full amount. No cut. No card processor taking 2 to 3%. No waiting 3 to 5 business days. Money in your account, instantly.

That 3% you've been losing? Every cent of it stays in your account now.
```

### Pay anyone, anywhere, instantly

```
Contractors, suppliers, freelancers. Anywhere in the world. Real exchange rate. Free. No $25 to $50 wire fees. No 2 to 3 day waits.

Your designer in Sao Paulo gets paid before the meeting ends. At the real rate. For $0 in fees.
```

### Adelaide watches your money

```
Market intelligence built for business owners, not Wall Street. What's happening with your money. What it means. What you could do. Clear language, board-ready reports, no jargon.

Market intelligence that speaks plain English. No $500-an-hour advisor needed.
```

---

**Transition:**

```
But here's the part nobody else is doing.
```

---

## SECTION 8: CASHFLOW INVESTING

**H2:**

```
Cashflow investing. Two wins from one change.
```

### Save it.

```
Today, every $100 that flows through your business costs you $2 to $3 in processing fees. With diBoaS, receiving payments costs nothing.

That difference adds up. Fast.

A coffee shop doing $1,000 a day in card sales? That's over $10,000 a year back in your pocket.
```

### Grow it.

```
The money you save doesn't have to sit there. But it can. The fee savings are yours whether you invest or not.

If you choose to put it to work: starting at $5. Choose your approach, from the safest to the most adventurous. Adelaide keeps watch.
```

**Micro-example:**

```
Save $10,800 in fees. Invest it. End the year with between $11,232 and $11,880, depending on market conditions. That's not a cost cut. That's a new revenue line.
```

**Honest limitation + Brand promise:**

```
The savings are certain. The growth is not. That's the honest math. We show you both sides, the opportunities and the risks, always.
```

**CTA Button:**

```
Run your numbers
```

CTA scrolls to: Section 3

**Micro-disclosure (small text):**

```
Example based on $1,000/day in card sales at 3% processing fee, with savings invested at a range of 4% to 10% annual return. Projected returns are illustrative. Actual results may vary.
```

---

## SECTION 9: FEE TRANSPARENCY TABLE

**H2:**

```
What it costs. All of it.
```

**Intro:**

```
No hidden fees. No minimum balances. No monthly charges. Here's every fee, on the table.
```

| Action | diBoaS | Typical Providers | Example |
|--------|--------|-------------------|---------|
| Business Account | Free forever | $10 to $50/month | Your account: $0. Always. |
| Receive Payments | FREE | 2 to 3% (card processors) | Receive $1,000: costs $0 (not $20 to $30) |
| Send / Pay | FREE* | $1.50 to $50 (wires) | Pay a contractor $500: $0 |
| Add Money | 0.48% | 0 to 1.5% | Add $10,000: costs $48 |
| Invest / Grow | FREE | 0.5 to 2% (advisors, platforms) | Invest $10,000: $0. Free to start. |
| Sell / Close | 0.39% | 0.5 to 2% | Sell $10,000: costs $39 |
| Swap | FREE* | 0.5 to 2% spread | Swap $10,000: $0 |
| Cash Out | 0.48% | 1 to 3% plus delays | Cash out $10,000: costs $48 |

```
*diBoaS fee shown. Third-party network fees may apply (typically less than $0.01).
```

```
Pricing comparisons based on publicly available rates as of February 2026. Ranges reflect common pricing across major providers. Actual competitor pricing varies by provider, volume, and agreement terms.
```

**Summary:**

```
Receive $1,000 in payments: you keep $1,000 in your diBoaS account. Cash out to your bank: $995.20 (after 0.48% cash-out fee). Still cheaper than the $970 to $980 a card processor leaves you.
```

**Footer line:**

```
Every fee. On the table. Nothing else.
```

---

**Transition:**

```
Still reading? Good. Let's make sure this actually fits.
```

---

## SECTION 10: FIT ASSESSMENT

**H2:**

```
Is this right for your business?
```

### Good Fit

```
Your business accepts card payments and you're tired of the 2 to 3% cut.

Your company has cash sitting idle earning almost nothing.

You want full control over your money.

You're comfortable with a different kind of risk for better returns.
```

### Not a Fit

```
You need government deposit insurance above everything else.

You have zero tolerance for any risk.

You prefer traditional banks even if they cost more.

You need someone else to manage your money for you.
```

---

## SECTION 11: ABOUT THE FOUNDER

*(Photo of Bar)*

### Version A: Company Registered

```
Built by Bar.

I grew up watching my grandmother Adelaide navigate a financial system that wasn't designed for her. She deserved better tools. So does every business owner like you.

diBoaS is headquartered in Berlin, Germany, building for businesses in the US, EU, and Brazil. I've spent 20+ years working in Products and IT across Brazil, the US, Japan, and Germany. Now I'm building the financial tool I wish every small business and startup had.

Questions? I read every email. bar@diboas.com
```

### Version B: Company in Registration

```
Built by Bar.

I grew up watching my grandmother Adelaide navigate a financial system that wasn't designed for her. She deserved better tools. So does every business owner like you.

diBoaS is being established in Berlin, Germany, building for businesses in the US, EU, and Brazil. I've spent 20+ years working in Products and IT across Brazil, the US, Japan, and Germany. Now I'm building the financial tool I wish every small business and startup had.

Questions? I read every email. bar@diboas.com
```

### Version C: Pre-Registration

```
Built by Bar.

I grew up watching my grandmother Adelaide navigate a financial system that wasn't designed for her. She deserved better tools. So does every business owner like you.

We're building diBoaS from Berlin, Germany, for businesses in the US, EU, and Brazil. I've spent 20+ years working in Products and IT across Brazil, the US, Japan, and Germany. Now I'm building the financial tool I wish every small business and startup had.

Questions? I read every email. bar@diboas.com
```

**CEO: Confirm which version (A, B, or C). Default: Version B.**

---

## SECTION 12: SOCIAL PROOF + DUAL CTA

**H2:**

```
Join the businesses that are done overpaying.
```

**Counter:**

```
[X] businesses exploring diBoaS. [Y] countries.
```

### Path A: Get early access.

```
Drop your email. We'll let you know when your business can start saving.
```

**Email input:** "Your business email"

**CTA Button:**

```
Get early access
```

```
No spam. Just your invite when we're ready.
```

**Privacy checkbox:** I agree to the Privacy Policy (/legal/privacy)

### Path B: Let's look at your numbers.

*For businesses with significant cash flow or reserves.*

```
15 minutes. No commitment. No pitch deck. Just math.
```

**CTA Button:**

```
Book a conversation
```

Links to: https://cal.com/diboas/treasury-conversation (new tab)

```
Or email bar@diboas.com
```

---

## SECTION 13: FAQ

**H2:**

```
Before you decide.
```

### FAQ 1: What's the catch?

```
We charge small fees when money moves. Free when you receive payments. Free when you invest. 0.39% when you sell or close a position. 0.48% when you cash out.

If you receive $10,000 in payments, we keep $0. If you invest $10,000, we keep $0. If you sell $10,000, we keep $39. If you earn nothing and send nothing, we earn nothing.

No hidden fees. No minimum balances. No monthly charges. No catch.
```

### FAQ 2: Is this for small businesses or startups?

```
Both. If you're a coffee shop losing 3% on every card payment, we help you keep that money. If you're a startup with $500,000 idle in the bank earning 0.5%, we help it earn more.

The tools are the same. The math just looks different.
```

### FAQ 3: Is my money safe?

#### Version A (Non-Custodial)

```
Your money is secured by you. Your wallet, your keys. No one at diBoaS can access your funds without your authorization.

That said, this isn't a bank account. Your funds work through new technology. The value can fluctuate, and you could lose some or all of your investment. There is no deposit insurance.

We show you both sides, the opportunities and the risks, always.
```

#### Version B (MPC)

```
Your money is protected by multi-party security. Your authorization is required for every transaction. DiBoaS holds a partial key share for recovery purposes, but cannot unilaterally move your funds.

That said, this isn't a bank account. Your funds work through new technology. The value can fluctuate, and you could lose some or all of your investment. There is no deposit insurance.

We show you both sides, the opportunities and the risks, always.
```

### FAQ 4: Can I access my money anytime?

```
Yes. No lock-ups. You set the floor: "always keep $50,000 liquid." We only deploy what's above that.

Need cash? One tap. We process it instantly. Bank transfer times may vary. No penalties. No questions.
```

### FAQ 5: How do instant payments work?

```
Traditional wire transfers go through correspondent banks. Your bank, their bank, maybe another bank, then the recipient's bank. Each step takes time and charges fees.

With diBoaS, payments go direct. Your wallet to their wallet. Done.

Your freelancer in Buenos Aires gets paid in seconds, at the real exchange rate, for free. Not $25 to $50 and 3 business days.
```

### FAQ 6: What about compliance and tax reporting?

```
We built diBoaS for real businesses with real compliance needs.

Monthly statements formatted for your accounting software. Transaction history with full audit trail. Tax documentation at year end. Board-ready reports your CFO will actually understand.

We know you're going to get audited eventually. We make sure you're ready.
```

### FAQ 7: Where does my money actually go?

```
Your money is placed into established financial systems that have operated for 3+ years, survived multiple market crashes, and are independently audited for security.

Full details, including names, track records, and our selection criteria, are published on our Strategies page. No signup required.

We chose these systems because they're transparent, battle-tested, and you can see exactly where your funds are at any time.
```

"Strategies page" links to /strategies

### FAQ 8: Why can't diBoaS touch my money?

#### Version A (Non-Custodial)

```
This is the whole point of how we're built.

Traditional finance: you deposit money, it becomes the bank's money, and they owe you a balance.

diBoaS: your money stays in your own wallet. We provide the software that helps you deploy it to earning systems. But we never have access to move it ourselves.

If diBoaS goes bankrupt, your money is still yours. No one at diBoaS can move your funds. Every transaction requires your approval.

More control for you. Less risk from us.
```

#### Version B (MPC)

```
This is a core part of how we're built.

Traditional finance: you deposit money, it becomes the bank's money, and they owe you a balance.

diBoaS: your money is protected by multi-party security. We hold a partial key share for account recovery purposes, but every transaction requires your explicit approval. We cannot unilaterally move your funds.

If diBoaS experiences issues, your funds remain protected by the multi-party security system. Every transaction requires your authorization.

More protection for you. Less risk from us.
```

### FAQ 9: What's the actual risk?

```
Let's be honest.

The systems your money goes into are built on code. Code can have vulnerabilities. We reduce this by only using systems with significant total value secured, multiple independent security audits, years of track record through market events, and by spreading your money across multiple independent systems.

Zero risk? No. Nothing is, including your bank.

The real question: are better returns worth a different risk profile? For some businesses, yes. For others, no. Both are valid.
```

### FAQ 10: Has diBoaS been audited?

```
We're a pre-launch platform. Our strategies are stress-tested against historical crashes and real-world scenarios, and we use audited, established protocols. As we grow, we plan to pursue independent third-party audits.

For full details on the systems and technology behind each strategy, visit our Strategies and Protocols pages.
```

"Strategies" links to /strategies, "Protocols" links to /protocols.

---

## SECTION 14: FOOTER

### Risk Disclaimer (ALL locales)

```
diBoaS connects you to decentralized finance systems. Returns are not guaranteed. Past performance does not predict future results. Involves risks including code vulnerabilities, market fluctuations, and access challenges. Only use funds you can afford to risk. diBoaS is not a bank. No deposit insurance applies.
```

### MiCA Article 68 (EN, DE, ES only)

```
The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes.
```

### MiCA Article 7 (EN, DE, ES only)

```
This crypto-asset marketing communication has not been reviewed or approved by any competent authority in any Member State of the European Union. The offeror of the crypto-asset is solely responsible for the content of this crypto-asset marketing communication.
```

### AI Disclosure (ALL locales)

```
Certain content on this platform, including market analysis and educational materials, is generated or assisted by artificial intelligence. AI-generated content may contain errors or limitations. Users should verify information independently before making financial decisions.
```

### US Disclosure (EN only)

```
US Disclosure: diBoaS is a non-custodial interface providing access to decentralized finance protocols. diBoaS is not registered with the SEC, CFTC, FinCEN, or any state regulatory agency. US regulatory treatment of DeFi is evolving. You are responsible for determining whether your use of this interface complies with applicable laws.
```

### Fictional Results Disclosure (ALL locales)

```
Examples on this page are illustrative and do not represent real businesses or actual results. Calculator projections are based on hypothetical scenarios and historical averages. Actual results will vary.
```

### Additional Footer Elements

- Social links: Instagram, X, YouTube, LinkedIn
- Navigation: About, Legal, Privacy Policy, Terms of Service, Cookie Policy, Help, Security
- Copyright: (c) 2026 diBoaS. All rights reserved.

---

## TRANSITION HOOKS MAP

| After | Hook | To |
|-------|------|----|
| 1. Hero | (CTA scrolls) | Two Worlds |
| 2. Two Worlds | (CTAs scroll to calculators) | Calculators |
| 3. Cashflow Calc | "That's for businesses that take payments. But what about cash that's already sitting there?" | Treasury Calc |
| 4. Treasury Calc | "Here's why this matters to me." | Origin Story |
| 5. Origin Story | "Here's how it works." | How It Works |
| 6. How It Works | "That's the process. Here's what you actually get." | Three Features |
| 7. Three Features | "But here's the part nobody else is doing." | Cashflow Investing |
| 8. Cashflow Investing | (natural flow) | Fee Table |
| 9. Fee Table | "Still reading? Good. Let's make sure this actually fits." | Fit Assessment |
| 10-14 | (natural flow) | Sequential |

---

## BRAND RULES

### Adelaide Filter — Banned Words

Blockchain, DeFi, Protocol(s) (except FAQ 10 link), Stablecoin(s), Pegged, On-ramp/Off-ramp, Smart contract(s), Yield, Non-custodial, TVL, APY/APR

### Brand Promise (max 2 appearances)

```
We show you both sides, the opportunities and the risks, always.
```

1. FAQ 3 (last line)
2. Section 8 (after honest limitation)

### Voice

- Second person ("you")
- Warm but direct
- Honest about limitations
- No em-dashes, no emojis
- Speaks to bakery owner AND startup CFO
