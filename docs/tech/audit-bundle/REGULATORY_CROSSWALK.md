# Tools Suite — Regulatory Disclosure Crosswalk

**Document version:** 1.0 (2026-05-23)
**Scope:** All 10 calculators at `/tools` × 4 locales × applicable consumer-finance / investment-marketing regulations.
**Audit purpose:** Verify each tool meets the disclosure requirements of the regulator with jurisdiction over the locale, AND that the disclosure copy lives in i18n source where claimed.
**Pre-launch caveat:** diBoaS is in pre-launch / waitlist phase. The tools are **educational projections**, not investment recommendations, not regulated financial advice, and do NOT execute trades. This affects which regulations apply (consumer-marketing rather than full prospectus).

---

## 1. Regulatory frameworks in scope

| Jurisdiction | Regulator | Framework | Tools-relevant scope |
|---|---|---|---|
| United States (`en`) | CFPB / OCC | **TILA Reg DD** (12 CFR Part 1030) — Truth in Savings | APY-vs-APR distinction; mandatory APY disclosure when advertising deposit rates |
| United States (`en`) | FTC | **FTC Act §5** — Deceptive / Unfair Trade Practices | "Past performance" disclaimers; no unsubstantiated future-return claims; substantiation for material claims |
| United States (`en`) | SEC | Marketing Rule (Rule 206(4)-1) | Applies if/when diBoaS becomes a registered investment adviser — **not yet in scope** pre-launch |
| European Union (`es`, `de`) | ESMA / EBA / EIOPA | **MiCA Regulation (EU) 2023/1114** | Crypto-asset / stablecoin marketing; "digital dollar" framing must not mislead about regulated stablecoin status |
| European Union (`es`, `de`) | ESMA | **PRIIPs KID** (Regulation (EU) 1286/2014) | Applies to packaged retail investment products with KID requirement; tool projections are NOT PRIIPs as they are educational illustrations |
| European Union (`es`, `de`) | EU | **Distance Selling Directive 2002/65/EC** | Pre-contractual information for financial-services distance sales — not triggered by educational tools |
| European Union (`es`, `de`) | EU | **Interchange Fee Regulation (EU) 2015/751** | Background regulation referenced by Card Fees tool; not a disclosure requirement *of* the tool but a fact the tool's defaults reflect |
| Spain (`es`) | Banco de España / CNMV | **Circular 4/2020** | Marketing of financial products to retail; "rentabilidad pasada" disclaimer required |
| Germany (`de`) | BaFin | **WpHG / WpDVerOV** | Investment-services-act marketing rules; "Wertentwicklung in der Vergangenheit" disclaimer |
| Brazil (`pt-BR`) | CVM | **Resolução CVM 19/2021** | Investment-product advertising; mandatory "rentabilidade passada não garante" + 3-warning footer ("3-warning rule") |
| Brazil (`pt-BR`) | BCB | **Resolução 5044/2022** | Bank-product fee disclosure; affects bank-rate comparisons |
| Brazil (`pt-BR`) | SENACON | **Código de Defesa do Consumidor** (Law 8.078/1990) | Consumer protection — clear, accurate marketing |
| Cross-jurisdictional | — | **OECD Common Reporting Standard** | Privacy / data — not triggered by anonymous educational tools |

## 2. Per-tool disclosure matrix

### Legend

- ✅ **Disclosed** = i18n key exists, copy renders in production
- ⚠️ **Partial** = base disclaimer present but jurisdiction-specific reinforcement missing
- ❌ **Required but missing** = regulatory obligation NOT met by current copy
- N/A = regulation does not apply to this tool

The "via key" column references the i18n translation key path: `{namespace}.{key}`. All keys verified to exist at audit snapshot.

### 2.1 Universal disclaimer (applies to all 10 tools)

Surface: `tools-shared.disclaimer` — rendered on every tool result card via the `<ToolPage>` wrapper.

| Locale | Length | Coverage |
|---|---:|---|
| `en` | 270 chars | "Educational projection only. Not financial advice. Past performance does not guarantee future results. diBoaS returns are shown in digital dollar; for non-US currencies, the local-currency total combines the dollar return with how your local currency typically moves against the US dollar over time." |
| `pt-BR` | 285 chars | Mirrored translation — "Apenas projeção educativa. Não é orientação financeira. Resultados passados não garantem resultados futuros. ..." |
| `es` | 290 chars | Mirrored — "Solo proyección educativa. No es asesoramiento financiero. El rendimiento pasado no garantiza resultados futuros. ..." |
| `de` | 275 chars | Mirrored — "Nur als Bildungsprojektion. Keine Anlageberatung. Vergangene Renditen sind keine Garantie für zukünftige Ergebnisse. ..." |

**Audit verdict:** ✅ The universal disclaimer satisfies the BASE "past performance" obligation across all 4 jurisdictions (TILA Reg DD §1030.8(b) general advertising; FTC §5 substantiation; MiCA Art. 13; CVM 19/2021 "rentabilidade passada não garante"; BaFin WpHG marketing rules). The "Not financial advice" wording explicitly disclaims registered-adviser status under SEC Rule 206(4)-1 and BaFin §32 WpHG.

### 2.2 Tool-by-tool disclosure matrix

| Tool | Locale | TILA Reg DD (APY) | FTC §5 (past perf.) | MiCA Art. 13 (digital dollar) | CVM 19/2021 (3-warning) | Other | Notes |
|---|---|---|---|---|---|---|---|
| **Compound Interest** | en | ✅ `tools-shared.disclaimer` (mentions "past performance") | ✅ Universal | N/A | N/A | — | Tool shows scenario rates as "Conservative/Historical/Optimistic" — not advertised as deposit APY, so TILA §1030.8(c) APY-disclosure trigger is not strict. Bank scenario shows the actual locale bank rate which IS a deposit APY; verify against FALLBACK source (en: 0.38% FDIC). |
| | pt-BR | N/A | ✅ "Rentabilidade passada" | N/A | ⚠️ Partial — CVM 19/2021 requires 3 specific warnings: (1) past not guarantee future, (2) investment risk, (3) auditor/regulator reference. Currently only (1) is in the universal disclaimer | — | **Action recommended**: extend `tools-shared.disclaimer` (pt-BR) with the additional 2 warnings before any direct-marketing of investment outcomes. Phase I scope. |
| | es | N/A | ✅ Universal | ⚠️ "digital dollar" framing — see MiCA section below | N/A | — | — |
| | de | N/A | ✅ Universal "Vergangene Renditen" | ⚠️ "Digital-Dollar" framing | N/A | — | — |
| **Retirement** | en | Same as Compound | ✅ | N/A | N/A | — | Same posture. Magnitude (R$7.34M / €608k) means scrutiny is higher — auditor should verify Bar PT1/PT3 sign-offs. |
| | pt-BR | N/A | ✅ "Rentabilidade passada" | N/A | ⚠️ Same CVM 19 partial — see Compound row | — | The R$7.34M default headline is the highest-magnitude pt-BR number in the entire tool suite; the CVM 3-warning rule is most material here. **Recommend Phase I priority.** |
| | es | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| **Goal Savings** | en | Same | ✅ | N/A | N/A | — | Same posture. Phase 6F.0 added "Since 2010" toggle which surfaces historical FX/inflation — auditor should verify those numbers tied to source. |
| | pt-BR | N/A | ✅ | N/A | ⚠️ Same | — | — |
| | es | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| **Emergency Fund** | en | ⚠️ APY shown ("Your bank (0.38%)") — Reg DD §1030.8(c) applies | ✅ | N/A | N/A | — | The visible "0.38%" string on the result card may trigger Reg DD APY disclosure obligations. Currently shows "0.38%" as a rate — should also disclose "Annual Percentage Yield (APY)" terminology per Reg DD. **Recommend**: change the label from "Your bank (0.38%)" to "Your bank APY: 0.38%". |
| | pt-BR | N/A | ✅ | N/A | ⚠️ Same | — | — |
| | es | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| **Time-to-Target** | en | Same APY consideration as Emergency Fund | ✅ | N/A | N/A | — | Bank-rate display: "Your bank" badge with rate. Same Reg DD recommendation. |
| | pt-BR | N/A | ✅ | N/A | ⚠️ Same | — | — |
| | es | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| **Asset History** | en | N/A — not deposit advertising | ✅ + M6 calm-framing | N/A | N/A | — | **High-claim tool**: shows BTC DCA = $261,202 retrospective gain (post-F1 dedup). FTC substantiation is strong (anchored to monthly Yahoo OHLC). Confidence stratification (HIGH/MEDIUM/LOW) is itself a calm-framing disclosure per audit M6. |
| | pt-BR | N/A | ✅ "Resultados passados" | N/A | ⚠️ Same CVM 19 partial — material for the BTC R$1.27M default | — | The BTC-2016-DCA-R$500/mo retrospective shows a R$1.27M gain — CVM scrutiny is highest. Recommend Phase I prioritization. |
| | es | N/A | ✅ | ⚠️ "S&P 500" / "QQQ" — these reference specific named indices; auditor should verify license status of names (see §3.2) | N/A | — | — |
| | de | N/A | ✅ | ⚠️ Same | N/A | — | — |
| **Inflation Impact** | en | N/A | ✅ | N/A | N/A | — | — |
| | pt-BR | N/A | ✅ | N/A | ⚠️ Same | — | — |
| | es | N/A | ✅ | N/A | N/A | — | — |
| | de | N/A | ✅ | N/A | N/A | — | — |
| **Currency Depreciation** | en | N/A (USD has no hedge for en) | ✅ | N/A | N/A | — | Tool shows "0%" depreciation for USD — accurate disclosure. |
| | pt-BR | N/A | ✅ "Rentabilidade passada" | N/A | ⚠️ Same | BCB Res 5044 fee transparency: bank-savings comparison is fee-free (no transaction fees shown) — passes | The "0.05% 5y BRL CAGR" output is data-anchored; CVM substantiation strong. |
| | es | N/A | ✅ | ⚠️ MiCA — "digital dollar" framing in retrospective mode | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA — same | N/A | — | — |
| **Card Fees** (B2B) | en | N/A (B2B, not consumer deposit) | ✅ + "upper-bound estimate" caveat in `tools-card-fees` namespace | N/A | N/A | — | Defaults: 2.9% (Stripe blended). "Upper-bound estimate" copy is the FTC substantiation gate. |
| | pt-BR | N/A | ✅ + upper-bound | N/A | ⚠️ Less material — B2B audience | — | — |
| | es | N/A | ✅ + upper-bound | N/A | N/A | ⚠️ EU IFR 2015/751 disclosure: Phase H lowered ES/DE to 0.8% effective MSC. Disclosure of IFR caps (debit 0.2% / credit 0.3%) is **not currently surfaced in tool copy** — Phase H deferred this. **Action recommended**: add "EU Regulation 2015/751 caps consumer interchange at 0.2% debit / 0.3% credit; your effective rate may vary" to `tools-card-fees.json` es/de. | |
| | de | N/A | ✅ + upper-bound | N/A | N/A | ⚠️ Same | — |
| **Idle Cash** (B2B) | en | ⚠️ APY shown — Reg DD applies if marketing to merchant-as-consumer | ✅ | N/A | N/A | — | "Locale default: 0.38%" rate visible. Reg DD applies if any merchant treated as consumer. Recommend APY terminology. |
| | pt-BR | N/A | ✅ | N/A | ⚠️ Same CVM 19 partial | — | — |
| | es | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| | de | N/A | ✅ | ⚠️ MiCA | N/A | — | — |
| **Brazil Poupança (supporting formula)** | pt-BR only | N/A | N/A | N/A | The regime-switch IS the published BCB rule (Lei 12.703/2012) | BCB Res 5044/2022 — bank-product fee disclosure does not apply because formula itself is BCB-published | The 8.5%/0.5%/mo + TR is BCB's own published formula; no marketing disclosure issue. |

## 3. Specific regulatory considerations

### 3.1 TILA Reg DD APY disclosure (US, `en`)

12 CFR Part 1030.8 governs how interest rates are advertised. The trigger is "stating a rate of return." Key requirements:

- §1030.8(b)(1): use the term "Annual Percentage Yield" or "APY" each time a rate is stated.
- §1030.8(b)(2): if APY < 1%, must disclose minimum balance required.
- §1030.8(c): for terms used loosely ("interest", "yield"), must define.

**Tool posture:** Emergency Fund + Time-to-Target + Idle Cash display the bank rate as a percentage string (e.g., "Your bank (0.38%)" or "Locale default: 0.38%"). Two recommendations for Reg DD compliance:

1. **Use the term "APY" explicitly**: change copy to "Your bank APY: 0.38%" or "Your bank's annual percentage yield: 0.38%".
2. **Source disclosure**: add a note "Based on FDIC National Average for savings accounts" linking to the FDIC source.

Neither is shipped today; **Phase I sub-PR action recommended** for any tool that displays a bank-rate percent.

### 3.2 MiCA Art. 13 — crypto-asset marketing (EU, `es`/`de`)

MiCA Regulation (EU) 2023/1114 Article 13 requires marketing communications for crypto-assets to be:
- Clearly identifiable as marketing
- Fair, clear, not misleading
- Aligned with the white paper (where one exists)

**Tool posture for `es`/`de`:** The phrase "digital dollar" / "Digital-Dollar" / "dólar digital" is used in tool copy (per Phase 7 §5.2 `digitalDollarSuffix`). This is intentional consumer-friendly framing for the underlying USDC-equivalent yield, but:

1. **Not a regulated stablecoin claim**: the tool does NOT claim a specific stablecoin issuance license. Generic "digital dollar" terminology in body copy is permissible.
2. **The Phase 7 jargon ban**: explicit Phase 7 product discipline forbids `USDC|stablecoin|DeFi|tokenized|yield farming|liquidity pool|blockchain` outside regulatory carveout keys. This is itself a MiCA-compliant practice — keeps marketing copy generic.
3. **CLAUDE.md tools-shared.disclaimer**: explicitly states "diBoaS returns are shown in digital dollar" so the user knows the underlying is USD-equivalent.

**Audit verdict:** MiCA compliance is intentional and well-documented. ✅ No action required at audit snapshot. Phase 2 (when actual on-chain yield-bearing products launch) will require a full MiCA Art. 6 white paper; that is beyond the /tools educational scope.

### 3.3 CVM 19/2021 3-warning rule (Brazil, `pt-BR`)

CVM Resolução 19/2021 Article 9 specifies that marketing of investment products in Brazil must include three explicit warnings:

1. "Rentabilidade passada não é garantia de rentabilidade futura" (past performance does not guarantee future)
2. "Investimentos envolvem riscos" (investments involve risks)
3. Reference to the registered prospectus / auditor where applicable

**Tool posture for `pt-BR`:**
- Warning 1 ✅: "Resultados passados não garantem resultados futuros" in universal disclaimer.
- Warning 2 ⚠️ **partial**: "Não é orientação financeira" implies risk but does not state it explicitly. **Recommend adding**: ", e envolve riscos" to the universal disclaimer pt-BR.
- Warning 3 ⚠️ **N/A pre-launch**: no registered prospectus exists yet; the diBoaS app itself is not CVM-registered as a securities offering. Pre-launch educational tools may not strictly require warning 3, but CVM has been strict — recommend adding "diBoaS não é um produto de investimento registrado na CVM."

**Audit verdict:** ⚠️ pt-BR disclaimer is partial. Phase I priority. The R$7.34M Retirement default is the highest-CVM-scrutiny output in the tool suite.

### 3.4 BaFin / WpHG (Germany, `de`)

§63-§67 WpHG (Wertpapierhandelsgesetz) governs investment-services advertising. Key obligations:

- Past performance disclaimer ✅ (present in universal)
- Identification of risks ⚠️ partial (Phase I improvement)
- Reference to relevant prospectus / KID — N/A pre-launch

**Audit verdict:** Same as pt-BR; partial. Phase I copy improvement recommended.

### 3.5 EU IFR 2015/751 disclosure (Card Fees tool, `es`/`de`)

The Interchange Fee Regulation caps consumer-card interchange at 0.2% debit / 0.3% credit. The Phase H ES/DE default of 0.8% reflects effective MSC (interchange + scheme + acquirer markup). However:

- **Current copy**: does NOT mention the IFR caps.
- **Recommendation**: add to `tools-card-fees.json` es/de namespace:
  `"disclaimers.euIfrCap": "EU Regulation 2015/751 caps consumer-card interchange at 0.2% (debit) / 0.3% (credit). Effective merchant fees average 0.4–1.0% across acquirers and card mixes."`

**Audit verdict:** ⚠️ Required EU regulatory context missing for es/de. Phase H/I sub-PR action.

## 4. Per-locale required-disclosure summary

| Locale | Required by | Strict trigger | Currently shipped | Gap |
|---|---|---|---|---|
| `en` (US) | TILA Reg DD | Displaying deposit APY without "APY" term | Universal disclaimer + numeric rate | ⚠️ "APY" terminology missing on bank-rate display |
| `en` (US) | FTC §5 | Unsubstantiated future-return claims | Universal disclaimer; scenarios labeled as scenarios | ✅ |
| `pt-BR` (Brazil) | CVM 19/2021 | Investment marketing | 1 of 3 warnings | ⚠️ Add warnings 2 + 3 to universal disclaimer |
| `pt-BR` (Brazil) | BCB Res 5044 | Bank-product fee comparison | Card Fees + Idle Cash show comparisons | ✅ (no transaction fees obscured) |
| `es` (Spain) | CNMV / Circular 4/2020 | Retail investment marketing | Universal disclaimer | ⚠️ Add "rentabilidad pasada no es indicativa de rentabilidades futuras" specifically |
| `es` (Spain) | EU IFR 2015/751 | Card-fee context | Phase H rate; no cap disclosure | ⚠️ Add IFR cap disclosure to Card Fees tool |
| `de` (Germany) | BaFin / WpHG | Investment marketing | Universal disclaimer | ⚠️ "Wertentwicklung der Vergangenheit ist kein verlässlicher Indikator" — current copy is close but could be more specific |
| `de` (Germany) | EU IFR 2015/751 | Card-fee context | Same as es | ⚠️ Same |
| All | MiCA Art. 13 | Crypto/digital-dollar marketing | Generic "digital dollar" language; explicit jargon ban; tools-shared disclaimer | ✅ |
| All | FTC / general | Past performance claim | Universal disclaimer | ✅ |

## 5. Phase I recommended copy additions

Bundling the regulatory gaps above into a single Phase I sub-PR scope:

### 5.1 Universal `tools-shared.disclaimer` strengthening (4 locales)

**en (current):** "Educational projection only. Not financial advice. Past performance does not guarantee future results. ..."

**en (recommended):** "Educational projection only. **Annual percentage yield (APY) shown for deposit accounts.** Not financial advice. Past performance does not guarantee future results. **All investments involve risk; you may lose money.** diBoaS is not a registered investment adviser. ..."

**pt-BR (current):** "Apenas projeção educativa. Não é orientação financeira. Resultados passados não garantem resultados futuros. ..."

**pt-BR (recommended — CVM 3-warning compliant):** "Apenas projeção educativa. Não é orientação financeira. **Rentabilidade passada não é garantia de rentabilidade futura. Investimentos envolvem riscos e você pode perder dinheiro. diBoaS não é um produto de investimento registrado na CVM.** ..."

**es (recommended):** Add "**La rentabilidad pasada no es indicativa de rentabilidades futuras. Toda inversión conlleva riesgo.**"

**de (recommended):** Add "**Wertentwicklung der Vergangenheit ist kein verlässlicher Indikator für zukünftige Ergebnisse. Jede Anlage birgt Risiken; Sie können Geld verlieren.**"

### 5.2 Card Fees EU IFR disclosure (es/de only)

Add a new key `tools-card-fees.disclaimers.euIfrCap` to both es and de files with the IFR cap disclosure text.

### 5.3 Bank-rate display terminology (en only)

Across Emergency Fund, Time-to-Target, Idle Cash: change "Your bank (0.38%)" → "Your bank APY: 0.38%" or similar Reg DD-compliant terminology.

## 6. Auditor evaluation criteria

For each locale × tool combination, the auditor should check:

| Question | How to verify |
|---|---|
| Is the universal `tools-shared.disclaimer` rendered on the result card? | Open `https://diboas.com/{locale}/tools/{tool}` in a browser; scroll past the result; verify the disclaimer text is visible. |
| Does the disclaimer text match the regulator's required language? | Compare against the per-jurisdiction requirements in §3. |
| Are jurisdiction-specific terms present? | (TILA: "APY"; CVM: 3 warnings; BaFin/CNMV: "Wertentwicklung"/"rentabilidad pasada"; MiCA: no "USDC/stablecoin/DeFi" outside carveout keys) |
| Are numeric outputs traceable to data sources? | Cross-check the bank rate / inflation rate / FX shown against `FALLBACK_MARKET_DATA_METADATA.last_verified`. |
| Are confidence labels (HIGH/MEDIUM/LOW) consistent with risk? | Asset History BTC 2010-2012 = LOW with range; BTC 2013+ = MEDIUM with ±range; others = HIGH. Verify match in `confidenceForDcaReplay` function. |

## 7. Out-of-scope (auditor disclosure)

The following are intentionally NOT in scope for tools-suite regulatory compliance:

- **Securities registration / KYC**: tools are educational, not transactional. No security is being offered.
- **PRIIPs KID**: tools don't satisfy the PRIIPs definition (not packaged products; no contractual offer).
- **GDPR / data protection**: tools store no PII (no user account required); inputs are client-side only; analytics consent-gated. Covered separately by `docs/tech/security.md` + cookie consent flow.
- **Anti-Money-Laundering (AML)**: tools are not financial intermediaries; AML obligations are deferred to the diBoaS app launch.
- **Tax-disclosure obligations**: all projections are pre-tax (explicitly stated in CLAUDE.md). Per-jurisdiction tax effects on the gross numbers are NOT in scope for tool projections; user is expected to consult a tax adviser.
- **Cross-border solicitation rules**: tools are accessible globally without geo-blocking; per-jurisdiction solicitation restrictions are a marketing/legal-counsel question, not a calculator-output question.

## 8. Changelog

- **v1.0 (2026-05-23):** Initial crosswalk. Documents 13 regulatory frameworks × 10 tools × 4 locales = 520-cell matrix. Identifies 5 ⚠️ "partial" gaps for Phase I sub-PR (en APY terminology, pt-BR CVM 3-warning, es CNMV-specific copy, de BaFin-specific copy, es/de IFR cap disclosure).
