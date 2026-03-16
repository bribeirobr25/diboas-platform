# diBoaS Review Rules — Quick Reference

Canonical reference for all review invariants. Supplements CLAUDE.md with examples,
test matrices, approved/rejected term lists, and false-positive guidance.

---

## Fee Constants — Canonical Values

```typescript
// The only acceptable fee constants
export const FEES = {
  ON_RAMP_RATE: 0.0048,       // 0.48%
  BUY_RATE: 0.0039,           // 0.39%
  INVEST_RATE: 0.0039,        // 0.39%
  SELL_RATE: 0.0039,          // 0.39%
  CLOSE_RATE: 0.0039,         // 0.39%
  P2P_RATE: 0,                // Free
  MAX_FEE_USD: 25,            // Cap
  MIN_TX_EN: 5,               // $5 USD
  MIN_TX_ES_DE: 5,            // €5 EUR
  MIN_TX_PT_BR: 10,           // R$10 BRL
} as const;

// The only acceptable fee formula for buy/sell/invest/close:
const calculateFee = (amount: number, rate: number): number =>
  Math.min(amount * rate, FEES.MAX_FEE_USD);
```

**Any other value is wrong. Any other formula is wrong.**

---

## Fee Test Matrix

| Amount | Operation | Expected | Notes |
|---|---|---|---|
| $100 | Buy | $0.39 | Basic |
| $100 | On-ramp | $0.48 | Different rate |
| $100 | P2P | $0.00 | Always free |
| $6,410.26 | Buy | $25.00 | At cap exactly |
| $6,410.27 | Buy | $25.00 | Over cap |
| $10,000 | Buy | $25.00 | Cap enforced |
| $4.99 | Buy (EN) | REJECT | Below $5 min |
| $5.00 | Buy (EN) | $0.02 | At minimum |
| €4.99 | Buy (DE) | REJECT | Below €5 min |
| R$9.99 | Buy (PT-BR) | REJECT | Below R$10 min |

---

## CLO Compliance — Exact Required Text

### EU/MiCA Block (verbatim, EN and DE pages)

```
Crypto assets are highly volatile. The value of your investment can go up or down.
You may lose some or all of your investment. Past performance is not indicative of
future results.
```

### CVM 3-Warning (PT-BR, all three required)

```
1. Este produto não é garantido pelo Fundo Garantidor de Créditos (FGC)
2. Rentabilidade passada não representa garantia de rentabilidade futura
3. Investimentos envolvem riscos, incluindo perda do valor investido
```

### US FTC
- Hypothetical performance → label it "Hypothetical performance" or "For illustration only"
- Risk disclosures must not be buried below the fold

---

## Adelaide Filter — Approved vs Rejected

**APPROVED (consumer pages):**
- "your money earns while it sits"
- "you own your money — we can never touch it"
- "starts from $5"
- "send money instantly, for free"
- "grows over time"
- "put idle money to work"
- "the money you don't need right now"

**REJECTED (consumer pages only):**
| Rejected | Use instead |
|---|---|
| "yield-generating strategies" | "strategies that earn" |
| "non-custodial wallet" | "a wallet only you control" |
| "stablecoin" | "digital dollars" |
| "DeFi protocol" | never in consumer copy |
| "APY" | "annual rate" or "earns X% per year" |
| "liquidity" | never |
| "on-chain" | never |
| "smart contract" | never |
| "tokenized assets" | "digital versions of gold/stocks" |

---

## Prohibited Terms — Complete List

Never appear in any user-facing string, any locale:

```
guaranteed returns
guaranteed yield
guaranteed income
risk-free
risk free
no risk
zero risk
FDIC insured
FDIC-insured
deposit insured
deposit guarantee
deposit insurance
bank account
bank accounts
banking services
we are regulated
licensed and regulated
regulated platform
registered with [any regulator]
```

---

## Non-Custodial Language

**APPROVED:**
- "You own your money — we can never touch it"
- "If diBoaS disappeared tomorrow, your money would still be yours"
- "Your wallet is yours alone"
- "We hold zero key shares"
- "Only you can authorize transactions"

**REJECTED:**
- "We safeguard your assets" → implies custody
- "Your funds are secure with us" → implies we hold them
- "diBoaS keeps your funds safe" → implies custody
- "We protect your money" → implies custody

---

## Anti-Bank Positioning

**WRONG (P1):**
- "Use diBoaS alongside your bank"
- "The smart supplement to traditional banking"
- "Keep your bank for everyday spending"
- "Your bank handles X, diBoaS handles Y"

**CORRECT:**
- "The system wasn't built for you"
- "Your bank keeps you tight. Free your money."
- "What your money has been missing"
- "diBoaS is where idle money goes to work"

---

## Strategy Names

| Strategy | Approved | Never use |
|---|---|---|
| Strategy 1 | Safe Harbor | — |
| Strategy 2 | Beat Inflation | Steady Growth |
| Strategy 3 | Long Game | — |

---

## Architecture Quick Reference

For reviewers unfamiliar with the stack:

**Stack:** Next.js (Turborepo monorepo, `apps/web`), Neon (database), Resend (email),
Cloudflare DNS, Vercel deployment

**Wallet infrastructure:** Turnkey (MPC, zero diBoaS key shares)
→ All wallet operations must go through the established Turnkey API wrapper.
→ diBoaS never has access to private keys.

**On-ramp/KYC:** Onramper

**Base asset:** USDC (displayed as fiat equivalents to users)

**Whitelisted protocols:** Sky (sUSDS), Aave, Compound, Jito, Sanctum, Jupiter JLP

**Chains:** Arbitrum + Solana

**Never in consumer copy:** Solana, USDC, Aave, Compound, Jito, Sanctum, Jupiter, DeFi,
blockchain, smart contract, stablecoin, on-chain, TVL

---

## Security False-Positive Reference

When in doubt whether a finding is real, check:

1. **React/Next.js is XSS-safe.** Don't flag XSS in `.tsx` unless `dangerouslySetInnerHTML`.
2. **Client-side auth gaps are expected.** Backend validates. Don't flag missing auth in client code.
3. **UUIDs are unguessable.** No need to validate as a security measure.
4. **Env vars are trusted.** Attacks requiring env var control are invalid.
5. **Logging non-PII is fine.** Only flag if secrets, passwords, or PII are logged.
6. **DoS is excluded.** Never report resource exhaustion or rate limiting absence.
7. **Shell scripts don't get untrusted input.** Only flag command injection with a concrete path.
8. **Markdown files.** Never flag findings in documentation.
