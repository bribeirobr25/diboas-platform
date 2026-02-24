# 🎯 CMO BOARD — SESSION 015: B2C LANDING PAGE CHAMPION COPY
## Triple Audit Review + Champion Copy Development

**Date:** February 23, 2026 | **Time:** 16:30 CET  
**Chair:** David Ogilvy  
**Type:** Free Roundtable — Full 12-Persona Creative Session  
**Session Trigger:** Completion of 3 independent B2C landing page audits  

---

### Board Members Present

| # | Persona | Domain |
|---|---------|--------|
| 1 | **David Ogilvy** (Chair) | Advertising, Brand Strategy |
| 2 | **Don Draper** | Creative Direction, Storytelling |
| 3 | **Seth Godin** | Permission Marketing, Authenticity |
| 4 | **Gary Vaynerchuk** | Social Media, Hustle Culture |
| 5 | **Sean Ellis** | Growth Hacking, Metrics |
| 6 | **Brian Chesky** | Platform Building, Trust |
| 7 | **Cristina Junqueira** | FinTech, Brazil Market |
| 8 | **Emily Weiss** | Direct-to-Consumer, Community |
| 9 | **Malala Yousafzai** | Inclusion, Education, Access |
| 10 | **Bono** | Social Impact, Global Reach |
| 11 | **Oprah Winfrey** | Emotional Connection, Storytelling |
| 12 | **Ann Handley** | Content Strategy, Writing Excellence |

**Input Documents:**
- `B2C_LANDING_PAGE_VISUAL_AUDIT.md` — Playwright automated testing, all 4 locales
- `GROUP1_B2C_LANDING_PAGE_AUDIT.md` — CLO Board compliance review
- `b2c-landing-page-copy-audit.md` — Copywriter skill, direct response analysis
- `TRIPLE_AUDIT_COMPARISON.md` — Cross-reference of all 3 audits

---

## SESSION OPENING

**David Ogilvy** *(adjusts spectacles, places three thick audit documents on the table)*

"Good afternoon, everyone. We have an unusual session today. Three independent audits — visual, legal, and direct response — have each examined our B2C landing page. They agree on some things. They disagree on others. And the copywriter found eleven things neither the CLO nor the visual audit was even looking for.

Our job today is not just to triage the bugs. Our job is to take a good landing page and turn it into a champion. The kind of page that, ten years from now, fintech founders study the way they study our classic campaigns.

Before we begin — I want to be clear about process. We will address the P0 blockers first, because nothing else matters if we can't launch. Then we move to copy. Ann, I'm going to lean on you for structure. Don, I need your storytelling instinct. Cristina, you're our gut-check for Brazil. Everyone else — interrupt freely. That's what this table is for.

Let's begin."

---

## PART 1: P0 TRIAGE — LAUNCH BLOCKERS

**David Ogilvy:** "Three P0 items. Let's handle them fast so we can spend our time on the creative work."

### P0-1: crypto.randomUUID Polyfill

**Sean Ellis:** "This is a CTO ticket, not a CMO ticket. Polyfill or fallback. It's a 20-minute fix. Let's note it, move on."

**David Ogilvy:** "Agreed. CTO action item. Next."

### P0-2: Fee Table Material Change Without CLO Re-Approval

**Brian Chesky:** "Wait — the fees changed from the CLO-reviewed version? That's a governance issue. The CLO reviewed one set of numbers, and the live site shows different numbers. 0.75% became 0.48%? 0.12% became 0.39%? When did this happen?"

**Seth Godin:** "More importantly — the new fee structure is actually *better* for the story. The old table was six rows. The new one is eight rows with competitor comparison. That comparison column is powerful. But it doesn't matter if CLO hasn't signed off."

**Cristina Junqueira:** "In Brazil, fee disclosures are the single most regulated element on any financial platform page. CVM has fined companies for less than this. The CLO is right to flag it as P0."

**David Ogilvy:** "Resolution: The current fee table stays as-is in code, but we mark it as requiring CLO re-certification before launch. The fee structure itself is good — the copywriter liked it. We just need the legal stamp. CTO submits to CLO for re-review. Non-negotiable."

### P0-3: FAQ 3 Missing Risk Disclosure

**Don Draper:** "This is interesting because three different people found the same problem for three different reasons. The CLO says it's a MiCA violation. The visual audit says it's a missing disclosure. And the copywriter says 'no honest limitations reduces believability.' Same gap, three lenses."

**Ann Handley:** "And the copywriter is right about the believability angle. 'Is my money safe?' is the question that keeps people up at night. If you answer it with only reassurance and no honesty about risk, you sound like every scam that ever existed."

**Gary Vaynerchuk:** "Facts. The CLO wants the legal language. The copywriter wants honest limitations. What if the answer does both?"

**Oprah Winfrey:** "Let me try something. The current answer is: 'Your money is secured by you. We use security technology, with industry-leading partners, but ultimately you're in control. That's the point — no one else can access your funds without your permission.'

That's fine. But it's incomplete. What about: 

'Your money is secured by you. Only you hold the keys — no one else can access your funds without your permission. That said, crypto-assets are not covered by deposit guarantee schemes like a bank account. The value of your assets can fluctuate, and you could lose some or all of your investment. We show you both sides — always.'

You get the empowerment AND the honesty. The CLO gets their MiCA language. And the reader trusts you more because you told the truth."

**Brian Chesky:** "That's good. The 'We show you both sides — always' is the bridge. It positions the risk disclosure as a feature of the brand, not a legal footnote."

**Seth Godin:** "I'd push further. 'We show you both sides — always.' is the line. That should echo across the whole site. It's your brand promise."

**David Ogilvy:** "I like it. Let's workshop the exact wording later in the session. For now — principle approved: FAQ 3 must combine user empowerment + risk disclosure + brand promise. CLO gets their required language. We get our brand voice. Next topic."

---

## PART 2: COPYWRITER FINDINGS — THE BIG FIVE

**David Ogilvy:** "Now. The copywriter audit found five cross-cutting issues that neither the CLO nor the visual audit could see. I want to discuss each one, because these are the difference between a competent page and a champion page."

### Issue 1: Zero Pain Quantification

**Ann Handley:** "This is the biggest gap on the entire page. The copywriter is right — we never make the reader feel the cost of doing nothing. We talk about what diBoaS offers, but we never say what the current system *costs* people. No numbers. No contrast. No urgency."

**Gary Vaynerchuk:** "You know what kills me? We HAVE the numbers. The fee table literally shows competitor prices. But we don't do the math for people. 'The average person loses $300-$500/year to bank fees, transfer charges, and hidden spreads' — that's a line that belongs in the hero section."

**Don Draper:** "Not the hero. The hero is about identity, not math. The math goes in the fee table introduction. You earn the right to show numbers after you've earned emotional engagement."

**Cristina Junqueira:** "For Brazil it's even more powerful. Brazilian banks charge monthly 'cesta de serviços' — sometimes R$30-50/month just to maintain a checking account. Maria, our persona, she can feel that number. That's her electricity bill."

**Malala Yousafzai:** "And this connects directly to the mission. When we say 'the system wasn't built for people like her' — we need to make people feel what that exclusion costs in real money. Not metaphorically. In reais, in dollars, in euros."

**Sean Ellis:** "From a conversion standpoint, pain quantification is probably worth more than any CTA change. People don't act on features. They act when they feel the cost of inaction. We need pain math in at least two locations."

**David Ogilvy:** "Where?"

**Ann Handley:** "Two places: the fee table intro and the real-life scenarios. The fee table intro should say something like: 'The average person pays $300-$500 a year in bank fees, transfer charges, and hidden spreads. Here's what that looks like with us.' And the real-life scenarios should have one cost comparison per card — 'That $50 to Mom? Western Union: $9.99 + 3 days. diBoaS: $0, instant.'"

**Don Draper:** "The Western Union comparison is devastating. Use it."

**David Ogilvy:** "Approved in principle. Pain quantification in fee table intro + one cost comparison per real-life scenario card. Cristina — you adapt the numbers for Brazil. Let's draft exact copy later in this session. Next issue."

### Issue 2: All CTAs Are Command-Oriented

**Emily Weiss:** "This one resonated with me. Every CTA on the page tells you what to DO: 'Try Demo,' 'Join Waitlist,' 'Try Full Demo.' None of them tell you what you GET. That's 2015 fintech copy. We're better than that."

**Gary Vaynerchuk:** "The copywriter suggested 'See your money in action' instead of 'Try Demo.' I like it. But I'd go further. What about 'Watch $100 grow in 60 seconds'? That's specific. That's a promise. That's clickable."

**Seth Godin:** "Be careful with 'grow.' That's an implied return promise. CLO will flag it."

**Brian Chesky:** "'See how it works — no signup needed' is safe and clear. The friction reducer does the heavy lifting: 'No signup. No real money. 30 seconds.'"

**Ann Handley:** "Let's map all five CTAs and their replacements right now."

**Don Draper:** "Here's what I'd do:

| Location | Current | Proposed |
|----------|---------|----------|
| Hero | 'Try Demo' | 'See your money in action' |
| Below Hero CTA | *(nothing)* | 'No signup. No real money. 30 seconds.' |
| Demo Section CTA 1 | 'Try Full Demo' | 'Play with $1,000 (it's fake)' |
| Demo Section CTA 2 | 'Future You' | 'See what $100 could become' |
| Social Proof | 'Join the Waitlist' | 'Get early access' |
| Waitlist Section | 'Join Waitlist' | 'Save my spot' |

The hero CTA is the most important. 'See your money in action' tells you exactly what happens when you click, and it implies ownership — 'your money.'"

**Seth Godin:** "'Play with $1,000 (it's fake)' is brilliant. It disarms skepticism and creates curiosity simultaneously."

**Emily Weiss:** "I love 'Save my spot' for the waitlist. It implies scarcity without faking it."

**Sean Ellis:** "Quick note on 'Future You' — I've watched people on demo pages. Nobody clicks buttons they don't understand. 'Future You' is clever but opaque. 'See what $100 could become' is instantly clear."

**Cristina Junqueira:** "For pt-BR, 'Veja seu dinheiro em ação' works perfectly. And 'Guardar meu lugar' for the waitlist has a nice warm feeling in Portuguese."

**David Ogilvy:** "I'm satisfied. Let's approve this CTA map. Ann, capture it. Don — one note. 'See what $100 could become' rather than 'See what $100 becomes.' The conditional protects us legally."

**Don Draper:** "Good catch."

### Issue 3: "What's the Catch?" — Honest Limitations

**Oprah Winfrey:** "This is where I have strong feelings. The current answer to 'What's the Catch?' starts with 'There isn't one!' — and I understand why it was written that way. It's disarming. But the copywriter is right. 'There is no catch' is what every scam says. It's what Madoff would say."

**Seth Godin:** "And this connects to the FAQ 3 issue we just discussed. The entire page currently presents diBoaS as perfect. No risk. No limitations. No downsides. That's not trustworthy. It's suspicious."

**Don Draper:** "The copywriter wrote a suggested rewrite that I actually think is close to right. Let me read the key line: 'Is there risk? Yes. Your money is in DeFi protocols, not a bank vault. Returns can fluctuate. We show you both sides — always.'

That's the voice of a brand that respects its audience. That's the kind of honesty that makes everything else on the page more believable."

**Brian Chesky:** "At Airbnb, the turning point for trust wasn't hiding our problems. It was when we started saying 'here's what could go wrong, and here's what we do about it.' People respect honesty about limitations more than claims of perfection."

**Malala Yousafzai:** "And for our audience — people who've been burned by financial institutions before — this honesty is even more important. They've heard promises. They want someone who'll tell them the truth."

**Ann Handley:** "Let me propose a structure for the rewrite:

1. Direct answer to the question (not 'there isn't one' — instead, acknowledge it's fair to ask)
2. Explain the business model transparently (we charge X, that's it)
3. Acknowledge the risk honestly (DeFi ≠ bank vault)
4. Close with the brand promise ('We show you both sides')

Something like:

'Fair question. Here's the real answer:

We charge a small fee when you invest — 0.39%. That's it. If you put in $100, we make 39 cents. The only way we earn more is if your money grows.

No monthly fees. No hidden spreads. No withdrawal penalties.

How? Open financial technology removed the branches, the executives, and the legacy costs. We pass those savings to you.

Is there risk? Yes. Your money is in DeFi protocols, not a bank vault. Yields can fluctuate. We monitor 24/7 and battle-test strategies against past crashes — but we can't guarantee returns, and anyone who says they can is lying.

We win when you win. We show you both sides — always.'"

**Gary Vaynerchuk:** "THAT is content. That's the kind of answer that gets screenshotted and shared on X. 'Anyone who says they can is lying' — that's a line."

**Cristina Junqueira:** "One concern. 'Your money is in DeFi protocols, not a bank vault' — for Brazilian users, this needs careful handling. In Brazil, 'DeFi' isn't widely understood. Can we say 'protocolos financeiros descentralizados' or better yet, just 'protocolos digitais'?"

**Seth Godin:** "Also — 'battle-test strategies against past crashes' is a powerful proof point that's currently buried in technical documentation. Can we surface that? 'We test every strategy against COVID, FTX, and every major crash of the last decade' is visceral."

**David Ogilvy:** "I notice the copywriter also recommended removing 'Blockchain' from this section. I agree. The word triggers skepticism in the very audience we're trying to reach. 'Open financial technology' or 'open-source financial infrastructure' communicates the same mechanism without the baggage. Let's adopt that across the page. The word 'blockchain' appears twice currently — both need to go."

**Don Draper:** "Three times actually. Product Carousel mentions 'stablecoins,' 'What's the Catch' says 'Blockchain,' and FAQ Q2 says 'Blockchain.' All three should use outcome language instead of mechanism language."

**David Ogilvy:** "Noted. Resolution: all three instances replaced. Exact replacement language to be drafted in Part 3. Next issue."

### Issue 4: Adelaide's Name Missing from Origin Story

**Oprah Winfrey:** *(leans forward)* "This is the one that bothers me the most. The entire platform is named after Bar's grandmother Adelaide. The origin story talks about 'my grandmother' but never says her name. Never says 'Adelaide.' That's like naming your company after your mother and then not introducing her."

**Don Draper:** "The copywriter suggested making the section heading 'Her name was Adelaide.' instead of 'Why diBoaS?'. I think that's one of the single best suggestions in the entire audit."

**Bono:** "It's more than a headline change. It's a storytelling decision. Right now, the origin story is good but generic — 'my grandmother didn't have access.' A thousand founders could say that. But only Bar can say 'My grandmother Adelaide never had access to the financial tools that could have changed her life. I named this after her.' That's singular. That's un-copyable."

**Emily Weiss:** "And it creates an instant emotional bond with the product name. Every time someone sees 'diBoaS' or 'Adelaide' after reading that story, they think of the grandmother. The brand becomes a person."

**Malala Yousafzai:** "In many cultures — and certainly in Brazil — naming something after a matriarch is deeply meaningful. This isn't just marketing. It's cultural identity."

**Cristina Junqueira:** "Absolutely. In Brazil, 'vovó' is sacred. If Brazilians read 'I named it after my grandmother Adelaide' — they're in. That's it. Game over. They trust you."

**Seth Godin:** "And the current last line is 'This is diBoaS.' but the CLO-approved version was 'I called it Adelaide.' — which one is actually live?"

**Ann Handley:** "According to the visual audit, the live version says 'This is diBoaS.' The CLO audit didn't flag a discrepancy. But the copywriter recommended 'I named it after her.' as the closing line."

**Don Draper:** "All three work, but they hit differently:
- 'This is diBoaS.' — Corporate. Product launch. Declarative.
- 'I called it Adelaide.' — Personal. Intimate. The reveal.
- 'I named it after her.' — Even more personal. The dedication.

I'd go with 'I named it after her.' because it completes the emotional arc. You start with the problem, you tell the grandmother's story, and you end with: this whole thing exists because of her."

**Oprah Winfrey:** "Unanimous from me."

**David Ogilvy:** "I'm hearing strong consensus. The origin story heading becomes 'Her name was Adelaide.' and the closing line becomes 'I named it after her.' But this is a CEO decision — it's his grandmother, his story. We'll present our recommendation and let Bar decide."

**Gary Vaynerchuk:** "One more thing — the copywriter also suggested adding a concrete number to the grandmother's story. Like 'She had R$2,000 in savings. The bank offered her 0.5% interest and charged R$35/month in fees. She was losing money by saving.' That makes the abstract concrete."

**Ann Handley:** "That's powerful, but only if it's true. We need to check with Bar whether there's a specific number from his grandmother's actual experience, or whether this would be fictionalized."

**David Ogilvy:** "Good point. We'll flag it as a question for Bar: Is there a real number from Adelaide's experience we can use? If yes, it goes in. If not, we keep it general rather than fabricate."

### Issue 5: No Disqualification

**Seth Godin:** "This is my territory. The page never says who diBoaS is NOT for. That's a fundamental trust failure. Every great brand excludes someone. Apple isn't for people who want cheap. Patagonia isn't for people who want fast fashion. Who is diBoaS NOT for?"

**Emily Weiss:** "The copywriter suggested a disqualification FAQ: 'Is diBoaS for everyone?' → 'No.' That's clean. That's honest. And it pre-filters the wrong users."

**Brian Chesky:** "I'd want to be specific. 'diBoaS is NOT for you if you want someone else to manage your money, or if you're looking for a traditional bank with branches and paper statements.' That's clear differentiation."

**Gary Vaynerchuk:** "And add: 'If you're not willing to learn something new, we're probably not your thing.' That's actually our qualifying question. We're a platform for people who want to LEARN and GROW."

**Malala Yousafzai:** "But let's be careful not to gatekeep on knowledge. We should exclude on mindset, not on current education level. 'If you're not *willing to learn*' is different from 'if you don't understand.' Our whole mission is to make this accessible to people who DON'T understand yet."

**Seth Godin:** "Perfect distinction. The disqualification should be about attitude, not aptitude."

**Ann Handley:** "Proposed FAQ 6:

**'Is diBoaS for everyone?'**

'No. If you want someone else to make financial decisions for you — that's not us. If you want a traditional bank with branches and paper statements — that's not us either.

diBoaS is for people who want control over their own money, transparency about costs, and access to opportunities that used to require $10,000 minimums. You don't need to understand everything right now — that's what we're here for. You just need to be willing to learn.'"

**Don Draper:** "That's strong. The last line — 'You don't need to understand everything right now — that's what we're here for. You just need to be willing to learn.' — that's the entire brand in two sentences."

**David Ogilvy:** "Approved as proposed. This becomes FAQ 6. Let's also discuss FAQ 7 — the copywriter suggested 'What if something goes wrong?' which ties back to the honest limitations theme."

**Ann Handley:** "Right. Proposed FAQ 7:

**'What if something goes wrong?'**

'DeFi protocols carry real risk. Yields fluctuate. Smart contracts can have bugs. We monitor 24/7, and we test every strategy against past crashes — COVID, FTX, Terra — before we offer it. We'll always tell you what's happening. But we can't eliminate all risk, and anyone who says they can is not being honest with you.'"

**Brian Chesky:** "'Anyone who says they can is not being honest with you' — that's better than the earlier 'is lying.' Less aggressive, same message."

**Seth Godin:** "I actually prefer 'is lying.' It's direct. It's internet-native. It's the kind of thing people share."

**Gary Vaynerchuk:** "Keep 'is lying.' Trust me."

**Cristina Junqueira:** "For Brazil: 'está mentindo para você.' Very direct. Very effective. Brazilians respect straight talk from brands."

**David Ogilvy:** "We'll use 'is lying.' Don, you're smiling."

**Don Draper:** "It's a good line. It works because you've earned the right to say it by being honest about your own risks first. You can't call others liars if you haven't been truthful yourself. The structure makes it land."

---

## PART 3: SECTION-BY-SECTION CHAMPION COPY

**David Ogilvy:** "Now let's get to the creative work. We're going to go section by section and produce champion copy. Not theoretical suggestions — actual draft copy that CTO can implement."

### HERO SECTION

**Don Draper:** "The headline is untouchable. 'The system isn't broken. It's working exactly as designed. Just not for you.' That's one of the best fintech headlines I've seen. Don't change a word."

**Ann Handley:** "Agreed. The problem is the sub-headline. Currently it's: 'Money should move free and instant. Savings should grow. Your money should work while you sleep.' Three ideas. No specificity. And 'should' is passive."

**Gary Vaynerchuk:** "Pick one idea and make it concrete. What's diBoaS's primary value prop? Free transfers."

**Emily Weiss:** "So the sub should lead with free transfers, then tease growth."

**Don Draper:** "How about: 'Send money anywhere. Instantly. For free. Then make it grow while you sleep.'"

**Seth Godin:** "Clean. Two promises, clear hierarchy. Primary: free instant transfers. Secondary: growth."

**Ann Handley:** "I'd make it even more specific: 'Send $500 to São Paulo in 4 seconds. Fee: $0.00. Then watch it grow while you sleep.'"

**Cristina Junqueira:** "São Paulo for the English page? Shouldn't it be globally relevant?"

**Ann Handley:** "Good point. 'Send money anywhere in seconds. Fee: $0.00. Then watch it grow while you sleep.'"

**Sean Ellis:** "The '$0.00' is key. Specificity beats generality every time."

**Don Draper:** "Final hero block:

> **H1:** 'The system isn't broken. It's working exactly as designed. Just not for you.'
>
> **Sub:** 'Send money anywhere in seconds. Fee: $0.00. Then make it grow while you sleep.'
>
> **CTA:** 'See your money in action'
>
> **Friction reducer:** 'No signup. No real money. 30 seconds.'"

**David Ogilvy:** "I'm satisfied. One craft note — 'make it grow' rather than 'watch it grow.' 'Make' implies agency. 'Watch' implies passivity. Our users take action."

**Don Draper:** "Updated."

### ORIGIN STORY

**Don Draper:** "Here's my draft, incorporating everything we discussed:

> **H2:** 'Her name was Adelaide.'
>
> 'My grandmother never had access to the financial tools that could have changed her life.
>
> The system wasn't broken. It was working exactly as designed.  
> Just not for people like her. Like me. Like you.
>
> Access was locked behind high minimums, complicated words, and big financial institutions that didn't care about people with small savings.
>
> New technology made it possible to bypass the gatekeepers.  
> I just had to build the door.
>
> I named it after her.'

Note: I'm echoing the hero headline deliberately — 'The system wasn't broken. It was working exactly as designed.' — it creates a callback. The hero says it generally. The origin story makes it personal."

**Oprah Winfrey:** "I have chills. 'I just had to build the door.' That's the line. That's the poster. That's the billboard."

**Bono:** "And 'Access was locked behind high minimums, complicated words, and big financial institutions that didn't care about people with small savings' — that's the three locks. High minimums. Complicated words. Big institutions. Each one is a door that diBoaS opens."

**Emily Weiss:** "Should we add the specific number about the grandmother's bank experience? The R$2,000 savings, 0.5% interest, R$35/month fees?"

**Don Draper:** "Only if it's real. If Bar confirms a real number from Adelaide's experience, we add it between the first and second paragraphs. If not, the general version is already powerful."

**David Ogilvy:** "Flagged for Bar: Can you share a real financial detail from Adelaide's experience? If yes, it strengthens the story significantly."

**Ann Handley:** "Also noting — the copywriter's suggested bridge line 'New technology made it possible to bypass the gatekeepers. I just had to build the door.' replaces the current 'I'm building this for her and for everyone she represents who deserves better and never got it.' I think Don's version is better — more active, more visual, more memorable."

**Seth Godin:** "The current version tells you how the founder FEELS. Don's version tells you what the founder DID. Action beats emotion in landing page copy."

**David Ogilvy:** "Approved. Moving on."

### SECTION ORDER — The Awareness Escalation Question

**Ann Handley:** "Before we write more section copy, we need to address the copywriter's structural recommendation. They suggest moving Real-Life Scenarios before the Product Carousel. The argument is awareness escalation: show the DESIRE first (what life looks like with diBoaS), then show the MECHANISM (how the product works).

Current order: Hero → Origin → Product Carousel → Scenarios → Features → Fees → Catch → Demo → Social Proof → FAQ → Waitlist

Proposed: Hero → Origin → Scenarios → Product Carousel → Features → Fees → Catch → Demo → Social Proof → FAQ → Waitlist"

**Don Draper:** "The copywriter is right. Right now, the jump from the origin story (emotional, identity) to the product carousel (feature-heavy, mechanism) is too abrupt. The scenarios are the bridge. They show what the product FEELS like in real life before you explain how it works."

**Sean Ellis:** "From a conversion standpoint, this is the correct order. You want: Problem → Desire → Solution → Proof → Action. Scenarios create desire. Carousel explains solution."

**Brian Chesky:** "At Airbnb, we learned this the hard way. We used to show the product first — 'here's how it works.' Conversion tripled when we started with the story — 'imagine arriving in Paris and having a local welcome you home.' Desire before mechanism. Always."

**Seth Godin:** "But there's a counterargument. The current order lets the product carousel establish context before the scenarios. If you show scenarios first, people might not understand what's making those scenarios possible."

**Ann Handley:** "That's valid. But the scenarios are self-explanatory: 'Splitting dinner in San Francisco' doesn't need product context. The user thinks: 'Oh, I can split a bill? I can send money to Mom at 3 AM? I want that.' THEN the carousel explains how."

**Don Draper:** "The copywriter also suggested adding transition hooks between sections — bucket brigades. If we reorder AND add transitions, the flow becomes:

Hero → 'Here's why I'm building this.' → Origin → 'And this is what it looks like.' → Scenarios → 'Here's how it works.' → Product Carousel → 'Now let's talk money.' → Fees..."

**Gary Vaynerchuk:** "The transition hooks are fire. 'And this is what it looks like' after the origin story is literally pulling the curtain back. The reader HAS to keep scrolling."

**David Ogilvy:** "I'm hearing consensus for the reorder. Any objections?"

*(Silence)*

**David Ogilvy:** "Approved. Scenarios move to position 3. Product Carousel to position 4. Ann — make sure the transition hooks are included in the final copy document."

### REAL-LIFE SCENARIOS (Now Position 3)

**Don Draper:** "The copywriter said this is already the best-written section on the page. I agree. The rhythm is excellent. But we approved adding cost comparisons. Let me draft:

**Card 1 — 'Splitting dinner in San Francisco'**
> 'Four friends. One tap. Done before the waiter brings the check.'
> *Venmo charges $0.25-$1.75 per instant transfer. diBoaS: $0.*

**Card 2 — 'Paying a designer in Dubai'**
> 'They're in the Middle East. You're in America. The money arrives before the meeting ends.'
> *Wire transfer: $25-$50 + 2-3 days. diBoaS: $0 + instant.*

**Card 3 — 'Emergency money to Mom'**
> '3 AM. She needs it now. Not during "business hours."'
> *Western Union: $9.99 + arrives tomorrow. diBoaS: $0 + arrives now.*"

**Cristina Junqueira:** "For pt-BR, the 'Emergency money to Mom' card is the killer. In Brazil, the comparison isn't Western Union — it's TED/DOC bank transfers which close after hours and charge R$10-20. With PIX being free, our comparison needs to be about international transfers or about growth/investment access, not domestic transfers."

**Ann Handley:** "Good catch. The pt-BR scenarios need localized pain comparisons. What are the real pain points for Brazilian users?"

**Cristina Junqueira:** "For Brazil:
1. International transfers — sending money abroad is expensive (R$100+ in fees through banks) and slow
2. Investment minimums — most Brazilian brokerages require R$1,000+ to start
3. Dollar access — buying USDT/dollar-denominated assets through Brazilian banks involves IOF tax + spread

So the pt-BR scenarios should emphasize international transfer and investment access, not domestic payments which PIX already handles well."

**David Ogilvy:** "Excellent insight. The localization isn't just translation — it's different pain points. The EN page can compare to Venmo/Western Union. The pt-BR page needs to compare to bank international transfers and high investment minimums."

**Bono:** "And for the German page?"

**Don Draper:** "SEPA is already fast and relatively cheap within Europe. The DE pain points would be: international transfers outside SEPA zone (expensive), investment access (German banks charge high commissions), and savings rates (German savings accounts pay nearly nothing while inflation erodes purchasing power)."

**David Ogilvy:** "This becomes a localization task for each market. Core structure stays the same. Pain comparisons are locale-specific. CTO implements per locale."

### PRODUCT CAROUSEL (Now Position 4)

**Emily Weiss:** "The copywriter flagged that the quotes in each slide stop at functional benefits without reaching emotional payoffs. 'I had $200 sitting in my account doing nothing. Now it's growing.' — growing how much? What does that MEAN for the person?"

**Ann Handley:** "The So-What chain framework says: Feature → Functional → Emotional/Financial payoff. Currently we stop at functional. Let me add the missing layer:

**Slide 1 (Send):** 'I sent $200 to my brother. It arrived before I put my phone down.' → *So what?* → 'No more 3-day waits wondering if it went through.'

**Slide 2 (Invest):** 'I had $200 sitting doing nothing. Now it's earning more than my bank offered in 5 years.' → *So what?* → 'That's an extra $14 this month I didn't have to do anything for.'

**Slide 3 (Adelaide):** 'My money earns while I sleep. Adelaide — the AI that runs it all — tells me exactly how it's doing.' → *So what?* → 'I check once a day. Less stress. More life.'"

**Seth Godin:** "Wait — '$14 this month' is a specific return claim. CLO will flag that."

**Ann Handley:** "You're right. How about: 'That's growth I didn't have to think about.' — same emotional payoff, no specific number."

**Don Draper:** "Or — since this is a demo context and we're using 'I had $200' as a hypothetical scenario — we note it's illustrative. But safer to keep it general."

**Brian Chesky:** "The Adelaide context in Slide 3 is important. The copywriter flagged that Adelaide is mentioned with no context. Adding 'the AI that runs it all' is too much. How about: 'Adelaide — your financial guide — tells me exactly how it's doing.'"

**Cristina Junqueira:** "Or for warmth: 'Adelaide — she watches your money so you don't have to.'"

**Oprah Winfrey:** "I love that. 'She watches your money so you don't have to.' That's the grandmother spirit. Adelaide the grandmother would have done that for Bar if she could."

**David Ogilvy:** "Beautiful connection to the origin story. Let's use that phrasing: 'Adelaide — she watches your money so you don't have to.'"

**Ann Handley:** "And the stablecoin explanation in Slide 1 currently says 'stable cryptocurrencies (stablecoins) worth 1:1 with the dollar.' We agreed to remove crypto jargon. Replacement: 'Your money is stored as digital dollars — always worth exactly $1.'"

**David Ogilvy:** "Clean. Approved."

### FEE TABLE

**Don Draper:** "Three things here. First — the H2. The CMO Board previously approved 'What It Costs. All of It.' and the current live version is 'Your money. Your rules. No surprises.' We should revert to the approved version."

**Seth Godin:** "'What It Costs. All of It.' is superior on every metric. It's more direct. More bold. More internet-native. And it's a promise — we're showing ALL of it."

**Ann Handley:** "Second — the pain quantification intro we discussed:

'The average person pays $300-$500 a year in bank fees, transfer charges, and hidden spreads. Here's what it looks like with us.'

This goes above the table."

**Sean Ellis:** "Third — the copywriter flagged that some 'Difference' column entries aren't quantified. 'Send globally, instantly, free' should be 'Save $5-$50 per transfer.' 'Earn while you sleep' should be 'Potential yield vs 0% at your bank.' The column should always quantify the delta."

**Don Draper:** "And the footer. Currently it says 'No monthly fees. No minimum balance. No hidden spreads. No surprises.' — but the H2 already says 'No surprises.' Don't repeat. Change the footer to: 'Every fee. On the table. Nothing else.'"

**David Ogilvy:** "Summary for fee table:
1. H2 reverts to 'What It Costs. All of It.'
2. Pain quantification intro added above table
3. Difference column entries quantified
4. Footer changed to 'Every fee. On the table. Nothing else.'
5. Fee structure submitted to CLO for re-certification (P0)

Approved."

### DEMO SECTION

**Don Draper:** "CTAs already handled. The H2 should change from 'Try It. No Signup Needed.' to something that creates curiosity."

**Ann Handley:** "Copywriter suggested 'What would your money do here?' — it's a question that demands an answer. You have to click to find out."

**Emily Weiss:** "I like it, but it's slightly abstract. What about: 'What would your $100 do here?' — the specific number grounds it."

**Sean Ellis:** "Even better: 'What happens when you put $100 to work?' — it implies action and outcome."

**Don Draper:** "'What would your $100 do here?' — Emily's is cleanest. And the sub becomes: 'No signup. No real money. Just proof.'"

**David Ogilvy:** "Approved."

### SOCIAL PROOF

**Emily Weiss:** "847 people, 12 countries. The copywriter is right — this could signal 'too early' for risk-averse users. We need to frame it as exclusivity, not smallness."

**Gary Vaynerchuk:** "Add velocity. '847 people. 12 countries. 43 joined this week.' — that shows momentum."

**Seth Godin:** "Or: '847 founding members. 12 countries. By invitation only.' — the frame shifts from 'we're small' to 'we're selective.'"

**Brian Chesky:** "I'd add a third metric. '847 people. 12 countries. 3 continents.' — or whatever the real number is."

**Sean Ellis:** "The CTA we already changed to 'Get early access.' The H2 should shift from 'The movement is growing' to something that creates FOMO. 'The first 1,000 get in first.' works if we're actually capping it."

**David Ogilvy:** "Bar — question: Is there an actual cap on early access? If yes, we use scarcity. If no, we use exclusivity framing without fake urgency."

### WAITLIST SECTION

**Emily Weiss:** "The copywriter asked: what do people GET for joining? Just 'early access'? Or something more?"

**Ann Handley:** "Proposed rewrite:

> **H2:** 'Be among the first.'
> **Sub:** 'We're opening to a small group first. Drop your email — we'll let you know when it's your turn.'
> **CTA:** 'Save my spot'
> **Below CTA:** 'No spam. Just your invite when it's ready.'

But if there IS a real incentive — founding member status, locked-in free transfers, priority access — that should be stated here."

**David Ogilvy:** "Another question for Bar: Is there a tangible benefit for waitlist joiners? Founding member status? Locked-in pricing? If yes, it goes here."

### FAQ SECTION

**Ann Handley:** "We've already drafted FAQ 6 (disqualification) and FAQ 7 (honest risk). Plus the rewrite of FAQ 3 (risk disclosure). Let me compile the full FAQ set:

**FAQ 1 — 'Is diBoaS a bank?'**
Current: Good. Add 'non-custodial' in next copy cycle (P2 per CLO).

**FAQ 2 — 'How is this possible without high fees?'**
Replace 'Blockchain' with 'open financial technology that costs a fraction of what traditional finance charges.' Everything else stays.

**FAQ 3 — 'Is my money safe?'**
Rewrite incorporating user empowerment + risk disclosure + brand promise (as discussed earlier).

**FAQ 4 — 'What if I don't understand investing?'**
Current: Strong. The 'That's exactly who we built this for' opener is excellent. Keep it. Maybe add: 'Start with $5. Explore. Learn. We're here every step.'

**FAQ 5 — 'What's the minimum to start?'**
Expand from '$5. No minimum balance requirements.' to: '$5. That's a coffee. Most investment platforms require $500-$10,000 just to open the door. We think that's part of the problem.'

**FAQ 6 — 'Is diBoaS for everyone?' (NEW)**
As drafted above — disqualification.

**FAQ 7 — 'What if something goes wrong?' (NEW)**
As drafted above — honest risk."

**Don Draper:** "And the section H2 — 'Questions? We've got answers.' is weak. How about: 'Before you decide.' — it implies they're ABOUT to decide, which is a psychological nudge toward action."

**Seth Godin:** "Or: '7 things you're probably wondering.' — specific, self-interest, curiosity."

**Ann Handley:** "'Before you decide.' is more elegant. Less clickbait."

**David Ogilvy:** "Agreed. 'Before you decide.' Approved."

---

## PART 4: LOCALIZATION STRATEGY

**Cristina Junqueira:** "I need to raise a flag. The copywriter only audited EN. Every copy change we're making today needs to propagate to DE, ES, and pt-BR. And it's not just translation — some changes require cultural adaptation."

**Bono:** "Which changes are pure translation vs. which need cultural rework?"

**Cristina Junqueira:** "Let me categorize:

**Pure translation** (same message, different language):
- CTA changes ('See your money in action' → direct translation)
- FAQ 6 and 7 (new content, same structure)
- Fee table H2 and footer changes
- Friction reducer copy

**Cultural adaptation needed:**
- Pain quantification numbers (US = Western Union comparisons, Brazil = bank international transfer fees, Germany = savings account rates, Spain = similar to Germany)
- Real-life scenario cost comparisons (locale-specific competitors)
- 'Blockchain' replacement phrasing (may vary by market sophistication)
- Hero sub-headline (the '$0.00' fee reference works globally, but the scenarios might need different anchoring)

**Requires separate review:**
- pt-BR footer fixes (MiCA removal, grammar fix — already flagged as P1)
- DE/ES footer MiCA deduplication (already flagged as P1)"

**Ann Handley:** "This is significant scope. Who owns the 4-locale propagation?"

**David Ogilvy:** "CTO implements with CMO oversight. Cristina reviews pt-BR. We need someone for DE and ES."

**Cristina Junqueira:** "I can review pt-BR. For DE and ES, I'd suggest we invite a localization specialist for the next session if needed. For now, the EN champion copy is the master — the localized versions follow."

**David Ogilvy:** "Agreed. EN first, then propagate."

---

## PART 5: COMPLIANCE BRIDGE

**Ann Handley:** "Before we close, I want to address something the triple audit comparison highlighted. There's a tension between the CLO's compliance requirements and the copywriter's direct response recommendations. Specifically:

1. The CLO wants formal legal language in FAQ 3. The copywriter wants conversational honesty. **Resolution: we do both. Conversational language that contains the required legal elements.**

2. The CLO hasn't reviewed the current fee table. The copywriter loves the fee table. **Resolution: submit current table to CLO. Don't change the table until CLO reviews.**

3. The CLO wants 'non-custodial' terminology. The copywriter wants accessible language. **Resolution: use 'non-custodial' in the footer (legal context) and accessible paraphrasing in the FAQ (user context).**

4. The copywriter wants to add return/growth language for emotional impact. The CLO requires hypothetical framing. **Resolution: all growth references use conditional language ('could,' 'potential') and the demo context (fake money) provides safe harbor.**

These aren't conflicts — they're complementary constraints that make the copy better. Legal requirements force precision. Direct response frameworks force clarity. Together, they produce copy that's both trustworthy and persuasive."

**Seth Godin:** "That's the insight. Compliance doesn't kill good copy. It kills lazy copy. Good copy finds a way to be honest, legally compliant, AND emotionally resonant."

**David Ogilvy:** "Well said. That's the standard for everything we produce."

---

## SESSION SUMMARY & ACTION ITEMS

### Approved Copy Changes (Ready for Implementation)

| # | Section | Change | Priority |
|---|---------|--------|----------|
| 1 | Hero sub-headline | → 'Send money anywhere in seconds. Fee: $0.00. Then make it grow while you sleep.' | HIGH |
| 2 | Hero CTA | → 'See your money in action' | HIGH |
| 3 | Hero friction reducer | ADD: 'No signup. No real money. 30 seconds.' | HIGH |
| 4 | Origin H2 | → 'Her name was Adelaide.' | HIGH (CEO approval needed) |
| 5 | Origin closing line | → 'I named it after her.' | HIGH (CEO approval needed) |
| 6 | Section reorder | Move Scenarios to position 3, Carousel to position 4 | HIGH |
| 7 | Transition hooks | Add bucket brigades between all sections | MEDIUM |
| 8 | Scenario cards | Add locale-specific cost comparisons | HIGH |
| 9 | Product Carousel quotes | Extend to emotional payoffs (So-What chains) | MEDIUM |
| 10 | Product Carousel stablecoins | → 'digital dollars — always worth exactly $1' | HIGH |
| 11 | Product Carousel Adelaide | → 'Adelaide — she watches your money so you don't have to.' | MEDIUM |
| 12 | Fee Table H2 | → 'What It Costs. All of It.' | HIGH |
| 13 | Fee Table intro | ADD pain quantification paragraph | HIGH |
| 14 | Fee Table footer | → 'Every fee. On the table. Nothing else.' | MEDIUM |
| 15 | Fee Table difference column | Quantify all entries | MEDIUM |
| 16 | What's the Catch | Full rewrite with honest limitations + business model transparency | HIGH |
| 17 | Remove 'Blockchain' | Replace all 3 instances with outcome language | HIGH |
| 18 | Demo H2 | → 'What would your $100 do here?' | MEDIUM |
| 19 | Demo sub | → 'No signup. No real money. Just proof.' | MEDIUM |
| 20 | Demo CTA 1 | → 'Play with $1,000 (it's fake)' | MEDIUM |
| 21 | Demo CTA 2 | → 'See what $100 could become' | MEDIUM |
| 22 | Social Proof | Add exclusivity framing + velocity metric | MEDIUM |
| 23 | Social Proof CTA | → 'Get early access' | MEDIUM |
| 24 | Waitlist H2 | → 'Be among the first.' | MEDIUM |
| 25 | Waitlist CTA | → 'Save my spot' | MEDIUM |
| 26 | FAQ H2 | → 'Before you decide.' | MEDIUM |
| 27 | FAQ 3 | Rewrite with risk disclosure + brand promise | HIGH (CLO required) |
| 28 | FAQ 5 | Expand with cost comparison | MEDIUM |
| 29 | FAQ 6 | ADD: 'Is diBoaS for everyone?' (disqualification) | HIGH |
| 30 | FAQ 7 | ADD: 'What if something goes wrong?' (honest risk) | HIGH |

### Questions for Bar (CEO Decisions Required)

| # | Question | Context |
|---|----------|---------|
| 1 | Approve origin story H2 'Her name was Adelaide.' and closing 'I named it after her.'? | Board recommendation is unanimous YES |
| 2 | Is there a real financial detail from Adelaide's experience we can use? | Strengthens origin story if true; skip if fictional |
| 3 | Is there an actual cap on early access / waitlist? | Determines scarcity framing (real vs. exclusivity) |
| 4 | Is there a tangible benefit for waitlist joiners? | Founding member status? Locked-in pricing? |

### Cross-Board Dependencies

| Board | Action Needed |
|-------|--------------|
| **CLO** | Re-certify current fee table before launch (P0) |
| **CLO** | Review FAQ 3 rewrite for MiCA compliance |
| **CLO** | Review FAQ 7 risk language for regulatory adequacy |
| **CTO** | Implement crypto.randomUUID polyfill (P0) |
| **CTO** | Remove MiCA paragraph from pt-BR footer (P1) |
| **CTO** | Remove duplicate MiCA from DE/ES footers (P1) |
| **CTO** | Fix pt-BR grammar (P1) |
| **CTO** | Implement all 30 approved copy changes |
| **CTO** | Propagate copy to all 4 locales |

### Session Documents Generated

1. `TRIPLE_AUDIT_COMPARISON.md` — Cross-reference of all 3 audits
2. `CMO_BOARD_SESSION_015_CHAMPION_COPY.md` — This document

---

**David Ogilvy:** "Good work, everyone. We came in with three audits and a competent landing page. We're leaving with a champion brief. The copy changes are significant but implementable — the copywriter estimated 6 hours for the high-priority items, and I think that's about right with the localization overhead.

Two things I want to emphasize:

First — the honest limitations approach. 'We show you both sides — always.' This is the brand promise that emerged from today's session. It should permeate everything we do.

Second — the grandmother's name. Using Adelaide's name in the origin story is not a copywriting technique. It's a truth. The strongest brands are built on truth that can't be copied.

Bar — the board awaits your answers on the four questions. Once we have those, the champion copy can be finalized and sent to CTO for implementation.

Session adjourned."

---

*CMO Board Session 015 — Complete*  
*Next trigger: CEO response on 4 open questions + CLO fee table re-certification*
