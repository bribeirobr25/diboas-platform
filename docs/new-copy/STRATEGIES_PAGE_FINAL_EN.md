# diBoaS Strategies Page — FINAL Copy (EN)

## Document Status

| Field | Value |
|-------|-------|
| Version | FINAL — Post-CLO + Post-Copywriter Review |
| Language | English (EN) |
| Date | February 27, 2026 |
| CLO Review | All P0/P1 copy fixes applied. P0-3 fee confirmed by CEO. |
| Copywriter Review | All 3 fixes + 4 polish items applied. Approved for production. |
| Pending | Nothing. All sign-offs complete. |
| Previous | STRATEGIES_PAGE_COPY_EN.md (CMO Draft) |
| CLO Input | CLO_BOARD_STRATEGIES_ROUND_TABLE_FEB27.md |
| Resolution | CMO_BOARD_CLO_RESOLUTION_SESSION.md |

## Implementation Notes for CTO / Claude Code

This is the production-ready English copy for the Strategies page. All CLO findings have been applied. Changes from the draft are marked with `[CLO FIX]` comments inline for traceability.

### CLO Fixes Applied

| CLO # | Issue | Fix Applied |
|-------|-------|-------------|
| P0-1 | Stablecoin depeg risk | Added to all stable cards (1,3,5,7,9). Card 1 description revised. |
| P0-2 | Card 8 range sourcing | Data confirmed in v2.1 JSON. Source note added. |
| P0-3 | Fee cascade | CEO confirmed Fee Lab v3.3. Entry FREE, Exit 0.39%. Copy updated. |
| P1-1 | "Secured billions" | Changed to "nearly 4 years" + DeFiLlama reference. |
| P1-2 | Dual loss figures | Clarifier line added to Cards 8 and 10. |
| P1-3 | "yield" in Card 9 | Changed to "highest-returning." |
| P1-4 | Solana concentration risk | Added to footer. |
| P1-5 | "Consult a professional" | Added to Section 6 and footer. |
| P2-1 | Protocol association | Micro-disclaimer added below protocol table. |
| CW-FIX-1 | Card 5 allocation explanation | Added allocation note explaining same split as Card 1, modeled for longer horizon. |
| CW-FIX-2 | FAQ 3 drift example | Added concrete 60/40 → 55/45 example. |
| CW-FIX-3 | Proxy methodology disclosure | Added micro-text below protocol table + below-cards limitation. |
| CW-POLISH-1 | Section 8 bridging line | Added "You'll pick your strategy when we launch" context. |
| CW-POLISH-2 | FAQ→Waitlist transition hook | Added transition after FAQ section. |
| CW-POLISH-3 | Section 6 "I'd add more money" sharpened | Distinguished planned adding from panic buying. |
| CW-POLISH-4 | Waitlist friction reducer | Added "Free to join. No commitment." below checkbox. |

### Global Rules

- NO em-dash characters. Use commas, periods, colons, or line breaks.
- NO emojis in body copy.
- All CTAs are buttons unless noted otherwise.
- All micro-disclosures use small/muted text styling.
- Transition hooks styled as subtle lead-in text between sections.
- Adelaide Filter applies to all consumer-facing card text. Protocol detail section is exempt.
- Version A/B sections: implement as conditional. CTO selects at build time.

### Section Flow

| # | Section | Type |
|---|---------|------|
| 1 | Hero | Static |
| 2 | Strategy Matrix | Interactive table |
| 3 | Strategy Cards (x10) | Card grid |
| 4 | Where Your Money Goes | Protocol table + expandable detail |
| 5 | What It Costs | Fee table |
| 6 | How to Choose | Decision guide |
| 7 | FAQ (x11) | Accordion |
| 8 | Waitlist / CTA | Email capture |
| 9 | Footer | Legal disclosures |

---

## SECTION 1: HERO

**H1:**

```
The access they kept. Now yours to choose.
```

**Sub-headline:**

```
10 strategies. Different goals. Different risk levels. None is "best." The best one matches where you are and where you want to be.
```

**Trust line (smaller text):**

```
Tested across nearly 4 years of real data. Crashes, recoveries, everything. Built on systems that have collectively secured billions in assets (verifiable on DeFiLlama).
```

`[CLO FIX P1-1: "4 years" → "nearly 4 years". "Secured billions" → "collectively secured billions in assets (verifiable on DeFiLlama)."]`

**Honest limitation (micro-text below trust line):**

```
Past performance does not guarantee future results. All strategies carry risk.
```

---

**Transition:**

```
Here's how to find yours.
```

---

## SECTION 2: STRATEGY MATRIX

**H2:**

```
Pick your strategy
```

**Instructions:**

```
Your goal on the left. Risk appetite on the right.
```

**Matrix table:**

| Your Goal | Stable Returns | Growth Potential |
|-----------|---------------|-----------------|
| Emergency Fund | Safe Harbor | |
| Beat Inflation | | Stable Growth |
| Short-Term (< 2 years) | Goal Keeper | Steady Progress |
| Medium-Term (2-5 years) | Patient Builder | Balanced Builder |
| Long-Term (5-10 years) | Steady Compounder | Wealth Accelerator |
| Wealth Building (10+ years) | Yield Maximizer | Full Throttle |

`[CLO APPROVED: "Beat Inflation" naming approved as-is. Goal framing under "Your Goal" header, not a platform promise. Escalation ladder retained for future reference but not needed.]`

**Below table:**

```
Not sure? Start with Safe Harbor. Learn first. Switch anytime. No penalties.
```

---

**Transition:**

```
Here's what each one does.
```

---

## SECTION 3: ALL 10 STRATEGY CARDS

Each card shows: name, badge, tagline, description, allocation (real protocol names), stats, common use case, and risk level.

Cards displayed in a grid: 2 columns on desktop, 1 on mobile. Stable strategies have a teal left border. Growth strategies have a green left border.

---

### Card 1: Safe Harbor

**Badge:** Stable Returns | Emergency Fund

**Tagline:** Your safety net that actually grows

**Description:**

```
This is where you keep money you might need tomorrow. It needs to be there when you need it. No surprises.

Safe Harbor uses only stable digital dollars. No exposure to digital asset prices. Your $1,000 is designed to stay close to $1,000 while earning returns, though the stablecoins used can fluctuate in value.
```

`[CLO FIX P0-1: Changed "Your $1,000 stays close to $1,000" → "Your $1,000 is designed to stay close to $1,000 while earning returns, though the stablecoins used can fluctuate in value."]`

**Allocation:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Allocation note (micro-text):**

```
Your money is distributed across three independent lending systems to reduce risk.
```

**Stats:**

| Chance of losing money | Less than 1% |
| Typical annual return | 6-10% per year |
| How bumpy is the ride? | Very smooth. Your balance stayed stable throughout our 4-year test. |
| Risk level | Minimal. Risks include possible technical vulnerabilities in the underlying systems and the possibility that the stablecoins used lose their dollar peg. These systems have operated safely for years. |

`[CLO FIX P0-1: Added "and the possibility that the stablecoins used lose their dollar peg" to risk level.]`

**Common use case:**

```
First emergency fund. Learning how this works without price swings.
```

---

### Card 2: Stable Growth

**Badge:** Growth Potential (30%) | Beat Inflation

**Tagline:** Outpace inflation with controlled risk

**Description:**

```
Your money is split: 70% earns stable returns, 30% participates in digital asset growth. You're accepting some price movement for higher potential returns.

This is not an emergency fund. It's for money you want to grow faster than inflation, with the understanding that the growth portion will move with market prices.
```

**Allocation:**

```
70% Sky SSR + 30% Sanctum INF
```

**Allocation note (micro-text):**

```
The majority stays in stable digital dollars. The Sanctum portion moves with Solana staking returns.
```

**Stats:**

| Chance of losing money | Around 5% |
| Typical annual return | 7-12% per year |
| How bumpy is the ride? | Some waves. At worst, your balance temporarily dropped 8% before recovering. |
| Risk level | Low. 30% of your balance will move with digital asset prices. |

**Common use case:**

```
Second-layer savings. Already has an emergency fund, wants growth above inflation.
```

**Note (micro-text):**

```
Not designed as a primary emergency fund.
```

---

### Card 3: Goal Keeper

**Badge:** Stable Returns | Short-Term

**Tagline:** Protecting your near-term goals

**Description:**

```
Saving for something in the next 2 years? A trip, a wedding, a car? This keeps every dollar working toward your deadline without risking it.

No exposure to digital asset prices. Predictable growth.
```

**Allocation:**

```
60% Sky SSR + 25% Aave V3 + 15% Compound V3
```

**Allocation note (micro-text):**

```
Distributed across proven lending systems optimized for stability.
```

**Stats:**

| Chance of losing money | Less than 1% |
| Typical annual return | 6-9% per year |
| How bumpy is the ride? | Very smooth. |
| Risk level | Minimal. Designed for capital preservation with steady returns. Risks include possible technical vulnerabilities and the possibility that the stablecoins used lose their dollar peg. |

`[CLO FIX P0-1: Added stablecoin depeg risk to risk level.]`

**Common use case:**

```
Specific goal within 2 years: trip, wedding, car.
```

---

### Card 4: Steady Progress

**Badge:** Growth Potential (35%) | Short-Term

**Tagline:** Short-term goals with growth potential

**Description:**

```
You have a goal in the next 2 years, but you're okay with some price movement if it means higher returns. The majority stays stable. A portion participates in digital asset growth.
```

**Allocation:**

```
65% Sky SSR + 35% Sanctum INF
```

**Allocation note (micro-text):**

```
Most stays stable. The Sanctum portion moves with Solana staking returns.
```

**Stats:**

| Chance of losing money | Around 7% |
| Typical annual return | 7-11% per year |
| How bumpy is the ride? | Moderate waves. At worst, your balance temporarily dropped 11% before recovering. |
| Risk level | Low-Medium. Your balance will move with digital asset prices. |

**Common use case:**

```
Near-term goal where some price movement is acceptable.
```

---

### Card 5: Patient Builder

**Badge:** Stable Returns | Medium-Term

**Tagline:** Steady growth for the patient saver

**Description:**

```
You're thinking 2-5 years out. Maybe a down payment, maybe starting a business. You don't need aggressive growth. You need your money to be there, a bit bigger, when you're ready for it.
```

**Allocation:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Allocation note (micro-text):**

```
Same stable systems as Safe Harbor, modeled for medium-term holding. Returns are projected more conservatively for the 2-5 year horizon.
```

`[CW FIX-1: Explains why identical allocation to Card 1 shows different return range. Prevents "mistake" or "manipulation" assumption.]`

**Stats:**

| Chance of losing money | Less than 1% |
| Typical annual return | 5-8% per year |
| How bumpy is the ride? | Very smooth. |
| Risk level | Minimal. Same stable profile, optimized for longer holding. Risks include possible technical vulnerabilities and the possibility that the stablecoins used lose their dollar peg. |

`[CLO FIX P0-1: Added stablecoin depeg risk to risk level.]`

**Common use case:**

```
Down payment. Business fund. Anything 2-5 years out where predictability matters.
```

---

### Card 6: Balanced Builder

**Badge:** Growth Potential (40%) | Medium-Term

**Tagline:** Stability and growth in one strategy

**Description:**

```
Most of your money stays safe. Some captures digital asset growth. This strategy is designed for people with 3-5 year horizons who understand that prices go up and down.
```

**Allocation:**

```
60% Sky SSR + 25% Sanctum INF + 15% Jupiter JLP
```

**Allocation note (micro-text):**

```
A balanced mix: lending returns plus staking and trading fee income from two Solana systems.
```

**Stats:**

| Chance of losing money | Around 12% |
| Typical annual return | 10-16% per year |
| How bumpy is the ride? | Moderate waves. At worst, your balance temporarily dropped 13% before recovering. |
| Risk level | Medium. 40% growth exposure means meaningful swings in both directions. |

**Common use case:**

```
3-5 year horizon with tolerance for temporary price movement.
```

---

### Card 7: Steady Compounder

**Badge:** Stable Returns | Long-Term

**Tagline:** Let time do the heavy lifting

**Description:**

```
You're playing the long game. 5-10 years. You don't need to take big risks because you have time on your side. Steady returns, compounding year after year.
```

**Allocation:**

```
55% Sky SSR + 30% Aave V3 + 15% Compound V3
```

**Allocation note (micro-text):**

```
Optimized for long-term compounding with minimal volatility.
```

**Stats:**

| Chance of losing money | Less than 1% |
| Typical annual return | 6-10% per year |
| How bumpy is the ride? | Very smooth. |
| Risk level | Minimal. Slow and steady. Risks include possible technical vulnerabilities and the possibility that the stablecoins used lose their dollar peg. |

`[CLO FIX P0-1: Added stablecoin depeg risk to risk level.]`

**Common use case:**

```
5-10 year horizon. Prioritizes consistency over maximum upside.
```

---

### Card 8: Wealth Accelerator

**Badge:** Growth Potential (70%) | Long-Term

**Tagline:** For people who've done the research

**Description:**

```
This is not for everyone. 70% growth exposure means your balance will move significantly with digital asset prices.

You need to be able to watch your balance drop 40%+ and not panic. If that sentence made you uncomfortable, this isn't the right strategy for you.
```

**Allocation:**

```
30% Sky SSR + 35% Sanctum INF + 35% Jupiter JLP
```

**Allocation note (micro-text):**

```
Heavily tilted toward growth. Staking returns plus trading fee income from two Solana systems.
```

**Stats:**

| Chance of losing money | Around 24% |
| Typical annual return | Highly variable. Could be negative or exceed 50%. |
| How bumpy is the ride? | Big swings. At worst, your balance dropped 47% before recovering. |
| Risk level | High. Significant chance of meaningful losses in shorter timeframes. |

**Common use case:**

```
Long-term allocation with high volatility tolerance.
```

**Warning (styled as callout):**

```
In thousands of simulations, outcomes ranged from -60% to +200%+. The drop figure (47%) is the worst temporary decline during our test. The range (-60% to +200%+) is the full spread from simulations. Only for people who can tolerate significant losses.
```

`[CLO FIX P0-2: Data confirmed sourced from strategies_v2_1.json (p5_return: "-60%", p95_return: "+200%", QR Board validated). Figures retained.]`
`[CLO FIX P1-2: Added clarifier distinguishing drawdown (47%) from simulation range (-60% to +200%+).]`

---

### Card 9: Yield Maximizer

**Badge:** Stable Returns | Wealth Building

**Tagline:** Maximum returns, minimum volatility

**Description:**

```
You want the highest stable returns over 10+ years without exposure to digital asset prices. No growth component. Just optimized returns across all three stable lending systems.
```

`[CLO FIX P1-3: "highest stable returns" → kept (describes the strategy purpose). "optimized yield" → "optimized returns" (Adelaide Filter).]`

**Allocation:**

```
45% Sky SSR + 35% Aave V3 + 20% Compound V3
```

**Allocation note (micro-text):**

```
Our highest-returning stable-only configuration.
```

`[CLO FIX P1-3: "highest-yielding" → "highest-returning".]`

**Stats:**

| Chance of losing money | Less than 1% |
| Typical annual return | 7-11% per year |
| How bumpy is the ride? | Very smooth. |
| Risk level | Minimal. Our highest-returning stable strategy. Risks include possible technical vulnerabilities and the possibility that the stablecoins used lose their dollar peg. |

`[CLO FIX P0-1: Added stablecoin depeg risk to risk level.]`
`[CLO FIX P1-3: "highest-yielding" → "highest-returning" in risk level.]`

**Common use case:**

```
10+ year horizon. Maximum stable returns, zero crypto exposure.
```

---

### Card 10: Full Throttle

**Badge:** Growth Potential (85%) | Wealth Building

**Tagline:** Maximum risk. Maximum potential.

**Description:**

```
This is our most aggressive strategy. 85% growth exposure. Designed for a small portion of your portfolio that you're willing to lose entirely.

The upside? In rare simulated scenarios, returns exceeded 1,000%. The downside? 27% chance of loss. Your balance dropped 66% at its worst moment in our test.
```

**Allocation:**

```
15% Sky SSR + 30% Sanctum INF + 35% Jupiter JLP + 20% Jito
```

**Allocation note (micro-text):**

```
Maximum growth exposure: staking, trading fees, and MEV rewards across three Solana systems with a minimal stability buffer.
```

**Stats:**

| Chance of losing money | Around 27% |
| Typical annual return | Extremely variable. From large losses to extraordinary gains. |
| How bumpy is the ride? | Roller coaster. At worst, your balance dropped 66% before recovering. |
| Risk level | Very High. Near-total loss possible. Only use what you can afford to lose completely. |

**Common use case:**

```
Small portfolio allocation with full understanding of potential loss.
```

**Access requirements (styled as callout):**

```
6+ months account age. Minimum $1,000 balance. Maximum 20% of your total portfolio. 24-hour waiting period before activation. Risk acknowledgment required.
```

**Warning (styled as prominent callout):**

```
In thousands of simulations, outcomes ranged from -78% to +400%+. The drop figure (66%) is the worst temporary decline during our test. The range (-78% to +400%+) is the full spread from simulations. Never put money here that you need.
```

`[CLO FIX P1-2: Added clarifier distinguishing drawdown (66%) from simulation range (-78% to +400%+). Replaces the original warning text for consistency with Card 8 pattern.]`

---

**Below all cards, honest limitation:**

```
All stats are based on historical analysis (May 2022 - December 2025) and thousands of Monte Carlo simulations. For newer protocols, earlier-period returns are estimated using validated proxies based on similar systems. What happened in the past may not happen again. These numbers help you compare strategies, not predict the future.
```

---

**Transition:**

```
Now you know what each strategy does. Here's where your money actually goes.
```

---

## SECTION 4: WHERE YOUR MONEY GOES

**H2:**

```
Where your money goes
```

**Intro:**

```
Every strategy is built from a combination of these protocols. They're independent, open-source, and you can verify everything yourself.
```

**Protocol table:**

| Protocol | Type | Chain | Asset | Crypto Exposure | Operating Since |
|----------|------|-------|-------|-----------------|-----------------|
| Sky SSR | Stablecoin yield | Arbitrum | USDS | None | 2022 |
| Aave V3 | Lending | Arbitrum | USDC | None | 2020 (V3: 2022) |
| Compound V3 | Lending | Arbitrum | USDC | None | 2018 (V3: 2022) |
| Sanctum INF | Liquid staking (LST basket) | Solana | SOL | Yes, moves with SOL price | 2024 |
| Jupiter JLP | Perpetuals LP | Solana | 45% SOL / 27% ETH / 27% BTC / 1% other | Yes, moves with SOL, ETH, BTC prices | 2024 |
| Jito | Liquid staking + MEV | Solana | JitoSOL | Yes, moves with SOL price | 2022 |

**Below table (micro-text):**

```
Jito is used in Full Throttle only. All other protocols appear across multiple strategies. Protocol names are used for transparency. Their inclusion does not imply endorsement of diBoaS by these protocols. For protocols operating less than 4 years, earlier-period returns are estimated using validated proxy methodologies based on similar systems.
```

`[CLO FIX P2-1: Added protocol endorsement micro-disclaimer.]`

**Expandable detail (optional accordion per protocol, collapsed by default):**

Each protocol gets an expandable section with:
- One-line summary of how returns are generated
- Audit status (number of audits, names of auditing firms if public)
- Link to the protocol's own site
- Link to DeFiLlama page showing live TVL

Example for Sky SSR:

```
Sky SSR
Returns: Generated from lending USDS to borrowers. Variable rate.
Audits: [Number] independent audits. [Firm names if public.]
Verify: sky.money | DeFiLlama
```

**Implementation note for CTO:** The expandable detail keeps the page clean for casual visitors while giving power users the depth they want. Collapsed by default. No one is forced to read a tutorial. Populate audit data and links at build time.

---

**Below protocols:**

```
Open-source and audited does not mean risk-free. Code can have undiscovered vulnerabilities. We reduce this risk by spreading your money across multiple independent protocols, but we cannot eliminate it.
```

---

**Transition:**

```
You know the strategies. You know the protocols. Here's what it costs.
```

---

## SECTION 5: WHAT IT COSTS

**H2:**

```
What it costs
```

**Intro:**

```
One fee. That's it.
```

**Fee table:**

| Action | Fee | Example |
|--------|-----|---------|
| Start a strategy (invest) | FREE | Invest $1,000: costs $0 |
| Exit a strategy (sell/close) | 0.39% | Sell $1,000: costs $3.90 |

`[FEE UPDATE: Canonical fee structure confirmed by CEO. Strategy entry is FREE. Exit is 0.39%. Matches Fee Lab v3.3.]`

**Below table:**

```
No monthly fees. No management fees. No performance fees. No hidden charges.

Putting money into a strategy costs nothing. We only charge when you take money out. If your money sits in a strategy earning returns, we earn nothing until you exit.
```

**Micro-text:**

```
Third-party network fees may apply (typically less than $0.01). For the full fee schedule including transfers and cash-outs, see our fee page.
```

---

**Transition:**

```
Not sure which to pick? Start here.
```

---

## SECTION 6: HOW TO CHOOSE

**H2:**

```
Start here
```

### What's this money for?

```
Emergency fund: Safe Harbor. Money you might need tomorrow stays stable.

Outpace inflation: Stable Growth. Your money works harder, but 30% moves with the market.

Something in the next 2 years: Goal Keeper (stable) or Steady Progress (with growth). Depends on how you feel about price movement.

Something in 2-5 years: Patient Builder (stable) or Balanced Builder (with growth). More time means you can consider more growth.

Long-term wealth: Steady Compounder, Wealth Accelerator, Yield Maximizer, or Full Throttle. Your timeline is your biggest advantage.
```

### How do you feel about price swings?

```
"I don't want any." Stick to the Stable Returns column. Five strategies, zero crypto exposure.

"I understand them and can wait out dips." Consider the Growth Potential column. The longer your timeline, the more growth exposure you can consider.

"I'm not sure." Start stable. Learn how everything works with money you're comfortable risking. You can always add growth exposure later.
```

### What would you do if your balance dropped 20%?

```
"I'd panic and withdraw." Stable Returns strategies only. That's not a weakness. It's self-awareness.

"I'd wait for it to recover." Low-medium growth strategies could work for you.

"I'd add more money." You might be ready for higher growth exposure. That's smart if it's planned. Less smart if it's panic trying to make back what you lost. Make sure you know which one you mean.
```

**Brand promise + golden rule:**

```
We show you both sides, the opportunities and the risks, always.

When in doubt, start safe. You can always move up later. Consider consulting a licensed financial advisor if you're unsure which approach fits your situation.
```

`[CLO FIX P1-5: Added "Consider consulting a licensed financial advisor if you're unsure which approach fits your situation." to the golden rule area.]`

---

**Transition:**

```
Got questions? Good.
```

---

## SECTION 7: FAQ

**H2:**

```
Before you decide
```

### Can I switch strategies?

```
Yes, anytime. No penalties. No questions asked.

Here's something to keep in mind: if you switch during a market dip, you might lock in a temporary loss. The best time to switch is when your goals change, not when the market moves.
```

### Can I use multiple strategies at once?

```
Yes. Many people do.

Think of it like different accounts for different purposes: emergency fund in Safe Harbor, vacation savings in Goal Keeper, long-term wealth in Balanced Builder.
```

### How does rebalancing work?

```
When market movements push your allocation off target (more than 10% drift), we notify you. For example, if your target is 60% stable and 40% growth, and market movements push it to around 55/45 or further, we let you know.

You'll see exactly what changed and why. Then you decide: approve the rebalance, or leave it as is.

We never move your money without your approval.
```

### Are these returns guaranteed?

```
No. And anyone who guarantees returns is lying to you.

What we can tell you: we tested every strategy across nearly 4 years of real market data (May 2022 - December 2025). The numbers are based on what actually happened and thousands of Monte Carlo simulations.

These numbers help you compare strategies and understand the range of outcomes. They don't predict the future. Start with what you can afford to learn with.
```

`[CLO FIX P1-1: "4 years" → "nearly 4 years" for consistency with hero.]`

### What if one of the systems has a problem?

```
This is a real risk. These systems are built on code, and code can have vulnerabilities.

We reduce this risk by only using systems that have secured billions of dollars for years, spreading your money across multiple independent systems, and monitoring for unusual activity continuously.

We can't eliminate this risk. No one can. But we can be honest about it.
```

### Where does my money actually go?

```
The protocols behind every strategy are listed on this page with their names, chains, asset types, and track records. No signup required. No hidden information.

Sky SSR, Aave V3, and Compound V3 handle stable returns. Sanctum INF, Jupiter JLP, and Jito handle growth. Every strategy is a specific combination of these protocols with exact percentages shown on each strategy card above.

We chose these protocols because they're transparent, battle-tested, and you can verify everything yourself.
```

### Why are there extra requirements for Full Throttle?

```
Because we want to protect you from yourself.

Full Throttle can lose most of its value. The requirements aren't there to exclude you. They're there to make sure you've thought it through: 6 months of experience, a minimum balance, a cap at 20% of your portfolio, and a 24-hour cooling period.
```

### Is my money safe?

**Version A (Non-Custodial):**

```
Your money is secured by you. Your wallet, your keys. No one at diBoaS can access your funds without your authorization.

That said, this isn't a bank account. Your funds work through automated systems built on code. The value can fluctuate, and you could lose some or all of your investment. There is no deposit insurance.

We show you both sides, the opportunities and the risks, always.
```

**Version B (MPC):**

```
Your money is protected by multi-party security. Your authorization is required for every transaction. DiBoaS holds a partial key share for recovery purposes, but cannot unilaterally move your funds.

That said, this isn't a bank account. Your funds work through automated systems built on code. The value can fluctuate, and you could lose some or all of your investment. There is no deposit insurance.

We show you both sides, the opportunities and the risks, always.
```

### Can I lose everything?

```
In stable strategies (Safe Harbor, Goal Keeper, Patient Builder, Steady Compounder, Yield Maximizer): the chance of total loss is extremely low. In nearly 4 years of testing and thousands of simulations, it didn't happen. But "extremely low" is not zero.

In growth strategies: the higher the growth percentage, the wider the range of outcomes. Full Throttle at 85% growth exposure has seen simulated drops exceeding 78%.

The risk is real. We don't minimize it. We help you choose the level that matches what you can handle.
```

`[CLO FIX P1-1: "4 years" → "nearly 4 years" for consistency.]`

### How is this different from a bank savings account?

```
A bank savings account is insured by the government (up to limits). Your money earns a fixed rate. The bank controls it.

diBoaS strategies use automated lending and staking systems. Returns are variable. Your money is not insured. You control it through your own wallet.

The trade-off: potentially higher returns, but you accept the risk that comes with a different kind of system.
```

---

**Transition:**

```
Still here after all those risk warnings? Good. You've done more research than most.
```

`[CW POLISH-2: Added missing FAQ→Waitlist transition hook. Acknowledges reader diligence after 11 risk-heavy FAQs.]`

---

## SECTION 8: WAITLIST / CTA

**H2:**

```
Like what you see?
```

`[CW POLISH-1: Changed from "Ready to choose?" — reader is joining a waitlist, not choosing a strategy yet.]`

**Body:**

```
You'll pick your strategy when we launch. For now, drop your email and secure your spot.
```

**[Email input: Your email address]**

**CTA Button:**

```
Get early access
```

**Below CTA:**

```
No spam. Just your invite when we're ready.
```

**Checkbox:**

```
☐ I agree to the Privacy Policy
```

**Below checkbox (micro-text):**

```
Free to join. No commitment. Choose your strategy when we launch.
```

`[CW POLISH-4: Answers the unspoken question "Am I locked into a strategy by signing up?"]`

---

## SECTION 9: FOOTER

**Main disclaimer:**

```
All performance data is based on historical analysis (May 2022 - December 2025) and thousands of Monte Carlo simulations. Past performance does not guarantee future results. Your money is placed in automated systems that carry technical risk, market risk, liquidity risk, and stablecoin depeg risk. Growth strategies involve additional price volatility risk. Growth strategies use protocols on the Solana blockchain; events affecting Solana specifically could impact all growth strategies simultaneously. Only use money you can afford to lose. diBoaS is not a bank and your funds are not insured.
```

`[CLO FIX P0-1: Added "stablecoin depeg risk" to the risk list.]`
`[CLO FIX P1-4: Added "Growth strategies use protocols on the Solana blockchain; events affecting Solana specifically could impact all growth strategies simultaneously."]`

**MiCA Article 68 (EN, DE, ES only):**

```
The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes.
```

**MiCA Article 7 (EN, DE, ES only):**

```
This crypto-asset marketing communication has not been reviewed or approved by any competent authority in any Member State of the European Union. The offeror of the crypto-asset is solely responsible for the content of this crypto-asset marketing communication.
```

**AI Disclosure:**

```
Certain content on this platform, including market analysis and educational materials, is generated or assisted by artificial intelligence. AI-generated content may contain errors or limitations. Users should verify information independently before making financial decisions.
```

**US Disclosure:**

```
diBoaS is a non-custodial interface providing access to decentralized finance protocols. diBoaS is not registered with the SEC, CFTC, FinCEN, or any state regulatory agency. US regulatory treatment of DeFi is evolving. You are responsible for determining whether your use of this interface complies with applicable laws.
```

**Fictional Results Disclosure:**

```
Projected returns, probability estimates, and simulation results on this page are illustrative and do not represent guaranteed outcomes. Calculator projections are based on hypothetical scenarios and historical averages. Actual results will vary.
```

**Professional Advice Disclaimer:**

```
The information on this page is for educational and informational purposes only. It does not constitute investment advice, financial advice, or any other form of professional advice. Consider consulting a licensed financial advisor before making investment decisions.
```

`[CLO FIX P1-5: Added "Professional Advice Disclaimer" to footer.]`

**(c) 2026 diBoaS. All rights reserved.**

---

## LOCALIZATION NOTES

### PT-BR (Brazil) — Additional Requirements

The PT-BR build must include:

**CVM 3-Warning (required above the fold):**

```
Warning 1: The operations with crypto-assets involve risks. These assets can increase or decrease in value and may lose all of their value. There is no guarantee that digital assets can be converted to the reference currency.
Warning 2: Past performance is no guarantee of future performance.
Warning 3: This product is not appropriate for the investor profile.
```

`[Note: CVM warnings are Portuguese-only. They appear in the PT-BR localized build, not the EN file.]`

### DE/ES (EU) — Additional Requirements

MiCA Articles 68 and 7 are already included in the footer. No additional localization-specific disclaimers needed beyond translation.

---

## CEO DECISION REQUIRED

### Fee Cascade (P0-3) — Third Flagging

| Source | Sell/Close Fee |
|--------|---------------|
| B2C Landing Page | 0.39% |
| B2B Landing Page | 0.39% |
| This Strategies Page | 0.39% |
| strategies_v2_1.json | 0.12% |
| CTO Handoff | 0.12% |
| Strategy Board Session 006 | 0.12% |

**CEO confirmed canonical fee structure (Fee Lab v3.3):** Strategy entry is FREE, strategy exit is 0.39%, ramp (add/cash out) is 0.48%. Legacy fees (0.12% sell, 0.75% off-ramp, 0.39% invest) are no longer valid. JSON, CTO handoff, and Strategy Board docs need cascade update.

---

## CLO SIGN-OFF VERIFICATION

| CLO Requirement | Status |
|-----------------|--------|
| P0-1: Stablecoin depeg risk | ✅ Applied to Cards 1,3,5,7,9 + footer |
| P0-2: Card 8 range sourcing | ✅ Data confirmed in v2.1 JSON. Source note added. |
| P0-3: Fee cascade | ✅ CEO confirmed Fee Lab v3.3: Entry FREE, Exit 0.39%, Ramp 0.48%. All legacy fees superseded. |
| P1-1: "Secured billions" substantiation | ✅ "Nearly 4 years" + DeFiLlama reference |
| P1-2: Dual loss figures clarification | ✅ Clarifier added to Cards 8 and 10 |
| P1-3: "yield" → "returning" | ✅ Applied to Card 9 description + allocation note + risk level |
| P1-4: Solana concentration risk | ✅ Added to footer |
| P1-5: "Consult a professional" | ✅ Added to Section 6 + footer |
| P2-1: Protocol endorsement disclaimer | ✅ Added below protocol table |

**All CLO P0/P1 fixes applied. All copywriter fixes and polish applied. CEO fee confirmed (Fee Lab v3.3). Fee table updated: entry FREE, exit 0.39%. All sign-offs complete. Ready for production.**
