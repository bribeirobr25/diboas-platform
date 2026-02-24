# CLO Board — Revised B2C Landing Page Review (EN-US)

**Session:** CLO Board Review — Context-Corrected Assessment  
**Date:** February 17, 2026  
**Document Under Review:** `diBoaS_B2C_Landing_Page_EN_Final.md`  
**Reference Documents:** V1 Blueprint v1.2, Non-Custodial Platform Handover, CLO Board Session 020 Audit, Gate 4 Compliance Ruleset, Adelaide Philosophy Guidelines, Product Bibles (Platform + Analytics)  
**Status:** REVISED — Incorporates full documentation review

---

## EXECUTIVE SUMMARY

The initial CLO review flagged self-custody language ("You control your own funds," "Secured by you") as potentially misleading. **This was incorrect.** After comprehensive documentation review across both `diboas-platform` and `diboas-analytics` repositories, the platform is confirmed as **genuinely non-custodial** with MPC wallet architecture via Privy where the platform never accesses, holds, or controls user keys or funds.

However, the documentation review uncovered a **more serious issue** than originally identified: a fundamental fee structure conflict between the V1 Blueprint (which specifies free launch with opt-in platform fee) and the landing page copy (which quotes specific percentage fees of 0.12% and 0.75%). This requires CEO Board resolution before launch.

**Revised Verdict:** 5 P0 blockers remain (1 upgraded from original review), 3 items withdrawn as false flags, several recommendations still valid.

---

## CORRECTIONS TO INITIAL REVIEW

### Items Withdrawn (False Flags)

**1. "You control your own funds" — WITHDRAWN**

The initial review flagged this as potentially misleading given MPC wallet architecture. This was wrong. Per the V1 Blueprint Section 1.3, five non-negotiable core principles establish that diBoaS:

- Never retains funds (all assets stay in user's non-custodial wallet)
- Never touches fiat (on/off-ramps handled by licensed partners)
- Never accesses keys (MPC via Privy — platform never sees full key)
- Never auto-signs (user explicitly approves every transaction)
- Never hides fees (full breakdown before every action)

The Blueprint explicitly states: *"Violation of any principle converts the platform into a regulated financial service requiring licensing."*

Users can export private keys at any time (Settings → Security → Export Keys) in standard format (hex for EVM, base58 for Solana). The Blueprint calls this *"a non-negotiable crypto principle"* and notes *"Without export capability, you are a custodian regardless of architecture."*

The US acknowledgment Screen 3 (Section 10.4) itself uses the language: *"You control your own wallet and private keys"* and *"Only you can authorize transactions."*

**Conclusion:** "You control your own funds" is legally accurate. No change needed.

**2. "Secured by you" — WITHDRAWN**

Same reasoning. The non-custodial architecture means security genuinely rests with the user. The platform cannot access, freeze, or recover funds. This is accurately communicated.

**3. MPC Custody Disclaimer — WITHDRAWN**

The initial review suggested adding an "MPC custody model" disclaimer. This is unnecessary and potentially counterproductive — it could confuse retail users and introduce doubt about a system that genuinely gives them control. The existing self-custody acknowledgment screens (required for US users) adequately communicate the responsibility model.

---

## P0 BLOCKERS (Must Fix Before Launch)

### P0-001: AI Disclosure Missing — California SB 942 Violation

**Status:** CRITICAL — Platform has been non-compliant since January 1, 2026 (47 days)

**Issue:** Adelaide newsletter system generates AI-assisted content distributed across 6 channels. California SB 942 requires clear AI disclosure on all AI-generated content delivered to California residents.

**Required Text (CLO-approved, from AI Disclosure Implementation Spec):**

- **EN:** "This content was created with the assistance of artificial intelligence and reviewed for accuracy. It is intended for informational purposes only and should not be considered financial advice."
- **PT-BR:** "Este conteúdo foi elaborado com o auxílio de inteligência artificial e revisado quanto à precisão. Destina-se apenas a fins informativos e não deve ser considerado aconselhamento financeiro."

**Action:** Add approved AI disclosure text to all Adelaide newsletter outputs and any landing page sections that contain AI-generated content. Implement immediately.

### P0-002: Geo-Blocking Implementation Decision Required

**Status:** CRITICAL — ToS claims geo-blocking; implementation status unknown

**Issue:** The V1 Blueprint mandates geo-blocking for UK, OFAC-sanctioned countries (IR, CU, KP, SY), and sanctioned regions (Crimea, Donetsk, Luhansk). The UK block is based on FSMA Section 21 criminal liability for financial promotions. The landing page is currently accessible globally.

**Options:**
- A) Implement geo-blocking before launch (Vercel Edge geolocation + VPN detection as specified in Blueprint Section 3.6)
- B) Remove geo-blocking claims from ToS and accept increased UK/sanctions risk

**CLO Recommendation:** Option A. UK criminal liability exposure is not acceptable. The Blueprint's assessment is correct — this is criminal, not civil, liability.

**Action:** CEO Board decision required. If Option A, CTO must implement before launch.

### P0-003: CVM 3-Warning Missing from PT-BR Landing Page

**Status:** CRITICAL — Required for Brazil market launch

**Issue:** Brazilian CVM regulations require a 3-part risk warning on all crypto-related marketing materials. The PT-BR landing page does not include:

1. "Criptoativos não são protegidos por garantias governamentais"
2. "Você pode perder todo o capital investido"
3. "Consulte um profissional habilitado antes de investir"

**Action:** Add CVM 3-warning to PT-BR landing page footer. Non-negotiable for Brazil market entry.

### P0-004: MiCA Article 68 Disclaimer Not Verbatim

**Status:** CRITICAL — Required for EU market launch

**Issue:** EU landing pages paraphrase MiCA Article 68 language rather than using verbatim text. MiCA requires the exact formulation:

*"The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes."*

**Action:** Replace paraphrased disclaimer with verbatim MiCA Article 68 text on all EU-facing pages (EN, DE, ES).

### P0-005: Fee Structure Conflict — UPGRADED to CRITICAL

**Status:** CRITICAL — Three conflicting fee structures exist across documentation

**Issue:** This is more serious than initially flagged. There are now **three** contradictory fee structures:

| Source | Fees Stated |
|--------|-------------|
| **Landing Page** | 0.12% sell/close position, 0.75% withdraw/transfer out |
| **fees.md / 00-ideation-itro.md** | 0.5% deposit, $1.99 withdrawal, 0.25% crypto trade, 0.5% APY management |
| **V1 Blueprint Section 20** | Phase 1: FREE (no platform fee, users pay only network fees). Phase 2: Opt-in $0.10 platform fee (default unchecked). Phase 3: Premium subscriptions |

The V1 Blueprint — the authoritative development specification dated January 2026 — explicitly designs a **free launch** with an optional opt-in fee. The landing page quotes specific percentage-based fees that appear nowhere in the Blueprint.

This creates multiple risks:
- **Legal:** Publishing fees you may not charge (or charging fees you didn't disclose) violates consumer protection law in all three markets
- **Regulatory:** Fee discrepancy between marketing materials and actual product behavior invites regulatory scrutiny
- **Trust:** Core brand promise of transparency is undermined by internal inconsistency

**Action:** CEO Board must confirm the canonical fee structure. Once confirmed:
1. Update landing page copy across all 4 locales
2. Update fees.md
3. Update 00-ideation-itro.md or mark as deprecated
4. Ensure in-app fee display matches exactly
5. Document the authoritative source and version

---

## P1 RECOMMENDATIONS (Should Fix Before Launch)

### R-001: Fictional Testimonials — FTC Compliance Review

**Issue:** Landing page includes testimonials from "Maria S., São Paulo" and "Thomas K., Berlin." If these are fictional personas, FTC guidelines (16 CFR Part 255) require clear disclosure that endorsements are illustrative. Similar requirements exist under EU Unfair Commercial Practices Directive.

**Recommendation:** Either (a) use real testimonials from beta users with consent, or (b) add clear disclosure such as "These profiles are illustrative examples and do not represent real users."

### R-002: "No Penalties, No Lock-ins" vs. 0.75% Withdrawal Fee

**Issue:** The landing page states "No penalties. No lock-ins. No minimums." If the canonical fee structure includes a 0.75% withdrawal fee, this creates tension. A withdrawal fee could be characterized as a "penalty" for leaving the platform.

**Recommendation:** If withdrawal fees exist, qualify the "no penalties" language: "No lock-in periods. No minimum balance requirements." Avoid the word "penalties" if fees apply to withdrawals.

If the Blueprint's free-launch model is confirmed, this issue resolves itself for V1.

### R-003: "Small Network Fee" Vagueness

**Issue:** Landing page references "a small network fee" without specifics. The V1 Blueprint requires every fee to be itemized as a separate line item. Marketing language should be consistent with the transparency principle.

**Recommendation:** Either quantify ("Network fees typically under $0.10 on Arbitrum") or reference the in-app fee calculator ("exact fees shown before every transaction").

### R-004: "Same Opportunities as the Wealthy" — Aspiration vs. Promise

**Issue:** The claim "We believe everyone deserves the same financial opportunities as the wealthy" is a mission statement, not a product claim. However, in a regulatory context, it could be interpreted as implying performance or access parity with institutional investors.

**Recommendation:** Frame as aspiration: "We're building tools to make sophisticated financial strategies accessible to everyone" rather than implying outcome equivalence.

### R-005: US-Specific Landing Page Elements

**Issue:** The V1 Blueprint requires three acknowledgment screens before a US user's first transaction (Sections 10.2-10.4). The landing page should set expectations for this flow.

**Recommendation:** Add brief mention in FAQ or signup flow: "US users will see additional regulatory disclosures before their first transaction."

---

## VALIDATED ITEMS (No Changes Needed)

The following landing page elements are **confirmed compliant** after documentation review:

- **Self-custody language** — Accurate per non-custodial architecture
- **"Your keys, your crypto"** implied messaging — Accurate per MPC + key export
- **Multi-locale support** — Infrastructure confirmed (react-intl, 4 locales)
- **Stablecoin references** — USDC primary, USDT supported per Blueprint Section 5.3
- **"Send money like a message"** — Accurate aspiration for payments-first V1
- **DeFi yield references** — NOTE: DeFi is explicitly excluded from V1 scope. If landing page references yield strategies, these must be clearly marked as "coming soon" or "V2" to avoid misleading users about current capabilities

---

## CRITICAL OBSERVATION: V1 SCOPE vs. LANDING PAGE SCOPE

The V1 Blueprint is explicit: **"V1 is payments-first."** V1 does NOT include DeFi yield strategies, RWA access, trading/swaps as a primary feature, or B2B treasury management. These are all V2+ features.

The landing page copy references several features that are V2+ scope:
- DeFi yield strategies / "Beat Inflation" strategy positioning
- B2B treasury services
- Investment management
- Portfolio optimization

**Recommendation:** Audit every landing page claim against V1 Feature Spec (Blueprint Section 6). Any feature not in V1 P0/P1 must be clearly labeled as upcoming. Making available claims about unavailable features violates consumer protection regulations in all three launch markets.

---

## SUMMARY: ACTION ITEMS BY OWNER

| Item | Priority | Owner | Action |
|------|----------|-------|--------|
| Fee structure resolution | P0 | CEO Board | Confirm canonical fee schedule |
| AI disclosure | P0 | CTO + CMO | Implement SB 942 text on all outputs |
| Geo-blocking decision | P0 | CEO Board | Implement or remove ToS claims |
| CVM 3-warning | P0 | CMO (PT-BR) | Add to PT-BR landing footer |
| MiCA verbatim | P0 | CMO (EU) | Replace paraphrased disclaimers |
| Testimonial disclosure | P1 | CMO | Add FTC-compliant disclosure |
| "No penalties" qualification | P1 | CMO | Adjust if withdrawal fees confirmed |
| Network fee specifics | P1 | CMO | Quantify or reference calculator |
| V1 scope audit | P1 | CMO + Product | Flag V2+ features on landing page |

---

## APPENDIX: KEY DOCUMENTS REVIEWED

| Document | Location | Relevance |
|----------|----------|-----------|
| V1 Blueprint v1.2 | `diboas-platform/docs/blueprint/diBoaS-V1-Blueprint-FINAL-v1.2.md` | Authoritative product specification |
| Non-Custodial Handover | `diboas-platform/docs/blueprint/non_custodial_platform_handover.md` | Custody architecture confirmation |
| CLO Board Session 020 | `diboas-platform/docs/audit/CLO_BOARD_UNIFIED_AUDIT_REPORT_FEB2026.md` | Prior CLO audit findings |
| Gate 4 Compliance Ruleset | `diboas-analytics/docs/archive/v4/08_gate4_compliance_ruleset_v1.md` | Adelaide content compliance |
| AI Disclosure Spec | `diboas-analytics/docs/archive/all_boards/CLO_AI_DISCLOSURE_IMPLEMENTATION_SPEC.md` | Approved AI disclosure text |
| fees.md | `diboas-platform/docs/fees.md` | Outdated fee schedule |
| Product Bible (Platform) | `diboas-platform/docs/full-view/PRODUCT_BIBLE_PLATFORM.md` | Platform overview |
| Product Bible (Analytics) | `diboas-analytics/docs/full-view/PRODUCT_BIBLE_ANALYTICS.md` | Analytics pipeline overview |

---

*This review supersedes the initial CLO dual-review dated February 17, 2026. The primary correction is the withdrawal of custody-related flags and the upgrade of the fee structure conflict to P0 critical status.*
