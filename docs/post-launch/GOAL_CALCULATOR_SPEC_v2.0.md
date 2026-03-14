# SECTION 3: GOAL CALCULATOR — SPECIFICATION v2.0
**Date:** March 14, 2026
**Status:** Updated with CMO Board recommendations
**Changes from v1.0:** Historical bad-case per tier, locale-specific amounts, n=0 edge case, Emergency Fund + Just Make It Grow formulas, CLO review flags

---

## Headline

**What are you building?**

## Goal tabs

**Christmas Bonus | Emergency Fund | Vacation Money**

*(Default selected: Christmas Bonus)*

---

## Inputs

### Field 1: Goal-specific input

**For Christmas Bonus:**
- Label: What do you earn per year?
- Helper: Before taxes is fine. We don't store this.
- Target = Field 1 / 12

**For Emergency Fund:**
- Label: What do you spend per month?
- Helper: Rent, food, bills — a rough number is fine.
- Target = Field 1 × coverage months
- Coverage selector: 3 months | 4 months | 6 months (default: 3 months)

**For Vacation Money:**
- Label: How much do you want to save?
- Helper: Pick a number that feels like a real trip.
- Target = user-entered amount
- Date selector: user picks target month/year (default: 6 months from today)

---

### Field 2: How much can you start with?

**Helper:** You can change this later.

- Users can edit this freely.
- Default value: **0**
- This field should **not** be auto-filled from salary or expenses.

**Variable name:**
**Initial Deposit = I**

---

### Field 3: How much can you add each month?

**Helper:** We'll suggest a monthly amount based on your goal.

- This field is **auto-calculated** based on:
  - Target
  - Initial Deposit
  - Months remaining until target date
  - Selected risk option / expected APY
- Users can **override** the suggested amount freely.
- If user edits this field manually, the result card shows projected final value instead of the target.

**Variable name:**
**Monthly Deposit = M**

---

### Field 4: How much movement feels okay?

**UI:** Slider or segmented control

Options:

| Option | Label | Expected APY | CLO Status |
|--------|-------|-------------|------------|
| 1 | Keep it careful | 7% | ✅ Within Safe Harbor range (4-8%) |
| 2 | A little more upside | 10% | ⚠️ CLO review recommended before go-live |
| 3 | I can handle more movement | 15% | ⚠️ CLO review required before go-live |

**Default:** Keep it careful

**Variable name:**
**Selected APY = y**

**Note:** APY tiers reduced from original (7/12/18) to (7/10/15). Rationale: 18% is historically inconsistent and creates expectation risk on a landing page calculator. 15% is at the high end of documented DeFi performance but defensible with historical data. 10% replaces 12% as a moderate option that sits comfortably within the Steady Growth strategy range. All tiers require Strategy Board + CLO sign-off before production deployment.

---

## Timeline Logic

### Christmas Bonus
**Target Date = December 1 of current year**

If today is after December 1:
**Target Date = December 1 of next year**

### Emergency Fund
**Target Date = today + 12 months** (default)
User can adjust via: 6 months | 9 months | 12 months | 18 months

### Vacation Money
**Target Date = user-selected month/year**
Minimum: 3 months from today.

### Months remaining
**n = number of full monthly contribution periods between today and Target Date**

Do **not** hardcode months. Calculate dynamically.

### Edge case: n = 0
If the target date has passed or is within the current month:
- For Christmas Bonus: roll to December 1 of next year. Show: "Your next Christmas Bonus: December 1, [next year]."
- For Emergency Fund: show a minimum of n = 1.
- For Vacation Money: show message: "Pick a date at least 3 months away so your money has time to work."

### Edge case: n = 1
If only 1 month remains, auto-select "Keep it careful" and disable riskier options. Show: "With only 1 month, we recommend keeping it careful."

---

## Rate Conversion

Because APY is annual, convert to a monthly rate:

**r = (1 + y)^(1/12) - 1**

Where:
- **y** = selected APY (as decimal, e.g. 0.07 for 7%)
- **r** = monthly growth rate

---

## Monthly Deposit Formula (auto-calculation)

When the target is fixed and the user enters an initial deposit, the suggested monthly deposit is:

**M = (Target - I × (1 + r)^n) / (((1 + r)^n - 1) / r)**

If **r = 0**, then:

**M = (Target - I) / n**

If this result is **negative**, set:

**M = 0**

(Negative means the initial deposit plus expected growth already exceeds the target.)

If this result **exceeds 50% of monthly income** (for Christmas Bonus, where salary is known):

Show helper text: "That's a big commitment. You can start smaller and adjust later."

---

## CTA

**[Show me my plan]**

---

# RESULT CARD

## Result headline

**Your Christmas Bonus: $VALUE by December 1st.**

Where:

**VALUE = Expected Final Value (RETURN-2)**

For Emergency Fund:
**Your Emergency Fund: $VALUE — [X] months of breathing room.**

For Vacation Money:
**Your Vacation Fund: $VALUE by [Target Date].**

---

## Expected Final Value Formula

Assuming:
- the **initial deposit happens today**
- the **monthly deposits happen at the end of each month**

Then:

**Final Value = I × (1 + r)^n + M × (((1 + r)^n - 1) / r)**

If **r = 0**, then:

**Final Value = I + (M × n)**

---

## Plan line

**Set aside $MONTHLY/month starting today. Your money earns while it waits.**

Where:

**MONTHLY = M** (formatted to local currency, rounded to nearest whole number)

---

# Scenario Table

| Scenario          | What you'll have |
| ----------------- | ---------------- |
| If things go well | $RETURN-1        |
| Expected          | $RETURN-2        |
| In a bad year     | $RETURN-3        |

---

## Scenario APYs — Historical-Based Per Tier

Instead of a flat multiplier, each tier uses historically grounded scenario rates:

| Tier | Expected APY | Good case APY | Bad case APY | Bad case basis |
|------|-------------|---------------|-------------|----------------|
| Keep it careful | 7% | 8.5% | 3% | 2023 DeFi lending trough |
| A little more upside | 10% | 12% | 2% | 2022 mixed portfolio floor |
| I can handle more movement | 15% | 18% | -15% | 2022 crypto crash (principal loss) |

**Note on negative bad-case:** For the aggressive tier, the bad case is **negative**. This means the result card will show the user LOSING money in a bad year. This is honest and aligns with the "we show both sides" philosophy. The calculator must handle negative returns correctly in the display.

**Rationale for change from v1.0:** The original spec used a flat 0.5× multiplier for all tiers (e.g., 18% → 9% bad case). This was too optimistic for aggressive strategies. In 2022, portfolios with 50-85% crypto exposure didn't just "earn less" — they lost 30-70% of principal. Showing 9% as the "bad year" for an aggressive strategy is misleading. Historical worst-case numbers are more honest and more defensible if challenged.

---

## Scenario Formulas

### RETURN-1 (Good case)

Let:
**y_good** = good case APY from tier table above
**r_good = (1 + y_good)^(1/12) - 1**

Then:

**RETURN-1 = I × (1 + r_good)^n + M × (((1 + r_good)^n - 1) / r_good)**

If **r_good = 0**, then:

**RETURN-1 = I + (M × n)**

---

### RETURN-2 (Expected case)

Let:
**y_expected** = expected APY from tier table above
**r_expected = (1 + y_expected)^(1/12) - 1**

Then:

**RETURN-2 = I × (1 + r_expected)^n + M × (((1 + r_expected)^n - 1) / r_expected)**

If **r_expected = 0**, then:

**RETURN-2 = I + (M × n)**

---

### RETURN-3 (Bad case)

Let:
**y_bad** = bad case APY from tier table above

**If y_bad >= 0:**
**r_bad = (1 + y_bad)^(1/12) - 1**

**If y_bad < 0 (principal loss):**
**r_bad = -(1 - (1 + y_bad)^(1/12))**

In both cases:

**RETURN-3 = I × (1 + r_bad)^n + M × (((1 + r_bad)^n - 1) / r_bad)**

If **r_bad = 0**, then:

**RETURN-3 = I + (M × n)**

**Display note:** If RETURN-3 < total deposits (I + M × n), the user is losing money. Display in a visually distinct way (e.g., amber text, not red — red implies error). Add microcopy: "In a bad year, you could lose some of what you put in. That's the tradeoff for higher potential growth."

---

## Risk Disclaimer

**We're showing you a range, not a promise.**

---

## Primary CTA

**[Start this goal]**

## Secondary links

**How does this work? | What are the risks?**

---

# Start Smaller Toggle

**Don't want to commit to $MONTHLY/month?**

**[See what happens if you start with less]**

When the user clicks:

**Locale-specific default "smaller" amount:**

| Locale | Smaller amount |
|--------|---------------|
| EN (US) | $50/month |
| DE | €50/month |
| ES | €50/month |
| PT-BR | R$100/month |

Behavior:
- Set **Field 3 = locale smaller amount**
- Keep **Field 2 unchanged**
- Recalculate:
  - Expected final value
  - Good / expected / bad scenarios
- If the new final value is **below the target**, show:

  "With $50/month, you'd reach about $[VALUE] by [DATE]. That's [X]% of your goal. You can always increase later."

- If the new final value **meets or exceeds the target**, show the standard result card.

---

# Demo Link

**Want to try before you start? [Demo with practice money →]**

---

# Microcopy

**Locale-specific minimum amounts:**

| Locale | Microcopy |
|--------|-----------|
| EN (US) | Start from $5. Change your plan anytime. |
| DE | Ab 5 EUR. Jederzeit änderbar. |
| ES | Desde 5 EUR. Cambia tu plan cuando quieras. |
| PT-BR | A partir de R$10. Mude seu plano quando quiser. |

---

# Number Formatting

All displayed amounts must follow locale conventions:

| Locale | Decimal | Thousands | Currency | Example |
|--------|---------|-----------|----------|---------|
| EN (US) | . | , | $ prefix | $2,960.00 |
| DE | , | . | € suffix | 2.960,00 € |
| ES | , | . | € suffix | 2.960,00 € |
| PT-BR | , | . | R$ prefix | R$ 2.960,00 |

Round displayed amounts to **nearest whole number** for cleanliness (no cents in the result card). Exception: fee examples in the fee table keep cents for precision.

---

# Assumptions and Limitations

This calculator is a **simple landing-page simulator** assuming:

- Initial deposit is made today
- Monthly deposits happen at the end of each month (ordinary annuity)
- APY is used as a planning assumption, not a guaranteed return
- No fees are deducted in the simulation (fees apply only on exit, per the fee table)
- No compounding of fees
- No inflation adjustment
- No tax impact shown

These limitations should be documented but NOT shown to the user in the main flow. They belong in the expandable technical details section or in the FAQ.

---

# CLO Review Required Before Production

| Item | Status | Notes |
|------|--------|-------|
| APY tier: 7% (careful) | ✅ Defensible | Within documented Safe Harbor range |
| APY tier: 10% (moderate) | ⚠️ Review needed | At moderate end of Steady Growth range |
| APY tier: 15% (aggressive) | ⚠️ Review required | Must be substantiated with historical data |
| Bad-case: -15% for aggressive | ⚠️ Review required | Honest but creates negative return display |
| "Projected growth" language | ⚠️ Review needed | Must not constitute investment advice |
| Scenario table framing | ⚠️ Review needed | "If things go well" — is this a forward-looking statement? |
| Disclaimer adequacy | ⚠️ Review needed | "A range, not a promise" — sufficient per jurisdiction? |

---

# Implementation Notes for CTO

1. **All formulas use geometric compounding** — do not simplify to arithmetic (y/12).
2. **The monthly deposit auto-calculation runs on every input change** — no "Calculate" button needed for Field 3. Only "Show me my plan" triggers the full result card.
3. **The result card should animate in** — 200-300ms fade/slide. Not instant snap.
4. **Field validation:** gentle, on blur, not while typing. Messages: "Enter a yearly salary above 0" — not "Invalid input."
5. **The "Start smaller" toggle recalculates in-place** — no page reload, no modal.
6. **Mobile:** single-column stacked. Result card should be sticky when scrolling slightly so CTA remains accessible.
7. **Accessibility:** labels above inputs, strong contrast, large tap targets, keyboard-friendly, screen reader compatible (announce results as "Expected value is two thousand nine hundred sixty dollars").
