# CEO Decision Record — Platform Audit Open Questions

**Date:** March 4, 2026
**Context:** Comprehensive platform audit (March 2-3, 2026) identified 8 open questions requiring CEO decisions. All answered in this session.
**Status:** ✅ ALL RESOLVED

---

## Decisions

### Q1: Font System
**Decision:** Dual-font approach
- **Geist Sans** → Display elements: headings, sub-headings, titles, sub-titles, CTAs, buttons, labels, menu links, footer links
- **Inter** → Body/content text: paragraphs, descriptions, FAQ answers, prose sections, dense content areas

**Action required:**
- Update `design-tokens.css` to define both `--font-family-display: 'Geist Sans'` and `--font-family-body: 'Inter'`
- Update `layout.tsx` to load both fonts
- Audit all components to apply the correct font variable based on element type

---

### Q2: FAQ Fee Contamination
**Decision:** P0 — Fix now, blocker before any launch

60+ translation strings across 4 locales (EN, DE, ES, PT-BR) contain legacy fee values (0.09% invest, 0.9% off-ramp). Corrected copy exists in `/docs/new-copy/`. Deploy immediately.

**Canonical fees (Fee Lab v3.4):**
| Action | diBoaS Fee |
|--------|-----------|
| Add Money (on-ramp) | 0.48% |
| Send | FREE |
| Buy / Invest / Strategy Entry | FREE |
| Sell / Close / Strategy Exit | 0.39% ($0.25 min, $25 max) |
| Cash Out (off-ramp) | 0.48% |
| Swap / Bridge | FREE |

**Action required:** Deploy corrected FAQ translations from `/docs/new-copy/` to all 4 locale files. Verify zero legacy fee references remain.

---

### Q3: Geo-blocking
**Decision:** Not required for V1

Rationale: Onramper handles all KYC across all markets. diBoaS positions as software provider/interface, not financial institution. Geo-blocking deferred to post-V1 or until external counsel advises otherwise.

**Action required:** None for V1. Document this decision for CLO Board reference.

---

### Q4: Locale Detection
**Decision:** Implement full detection chain — cookie → Accept-Language → default

Current middleware only does path-based detection (always defaults to `/en`). Users from Brazil, Germany, or Spain visiting the root URL should be detected and redirected to their locale.

**Action required:** Update `middleware.ts` to implement:
1. Check URL path for locale prefix (existing)
2. Check cookie for saved locale preference
3. Parse `Accept-Language` header using `@formatjs/intl-localematcher` + `negotiator` (both already in dependencies)
4. Fall back to `en`
5. Set locale cookie on first visit for persistence

---

### Q5: Marketing Route Group
**Decision:** Remove/hide for V1

The `(marketing)` route group contains pages for personal banking, investing, cryptocurrency, DeFi strategies, rewards, careers, etc. — all Story A content that doesn't exist in V1. These pages create confusion and could trigger regulatory scrutiny for marketing unavailable features.

**Action required:**
- Remove or gate the `(marketing)` route group
- Ensure no internal links point to these routes
- Keep source files in version control (don't delete, just remove from routing)
- Option: rename route group to `(marketing-v2)` and exclude from build, or add a redirect to the main landing page

---

### Q6: Strategy Board v2.1 vs v2.0 Reconciliation
**Decision:** Not yet resolved — needs attention

The three-version problem persists:
- Project knowledge references v2.1 (strategies_v2_1.json)
- Analytics pipeline uses v2.0 (strategies_v2_0.json)
- Some translation files reference outdated strategy names/allocations

**Action required:** Schedule Strategy Board session to reconcile. Determine which version is canonical and propagate to all surfaces.

---

### Q7: Smart Contract Audit
**Decision:** Launch without audit — audit after initial users

Rationale: Own smart contracts handle strategy routing and on-chain fee collection only. Contracts never hold user funds. This limits the blast radius of any vulnerability. Audit will be conducted after initial user onboarding validates the product-market fit.

**Risk acknowledgment:** Users bear protocol catastrophic loss risk (already disclosed in strategy pages). Contract routing bugs could result in failed transactions or incorrect fee collection, but not loss of custody.

**Action required:** None pre-launch. Add to Q3 2026 planning for post-launch audit engagement.

---

### Q8: Founding Member Cap Configuration
**Decision:** 1,200 confirmed, but must be configurable — NOT hardcoded

The cap value should be read from the `waitlist_counters` table in Neon (where `founding_member_cap` already exists) and/or overridable via environment variable. No magic numbers in source files.

**Action required:**
- Audit codebase for any hardcoded `1200` references
- Ensure `waitlist_counters.founding_member_cap` is the single source of truth
- Add `FOUNDING_MEMBER_CAP` env var as optional override (if set, takes precedence over DB value)
- Update waitlist store to read cap from DB/env rather than constants file

---

## Summary Matrix

| # | Question | Decision | Priority | Action Owner |
|---|----------|----------|----------|-------------|
| Q1 | Font system | Dual: Geist display + Inter body | P1 | CTO Board → Claude Code |
| Q2 | FAQ fee contamination | Fix now — P0 blocker | **P0** | CTO Board → Claude Code |
| Q3 | Geo-blocking | Not needed for V1 | Deferred | CLO Board (document) |
| Q4 | Locale detection | Full cookie → Accept-Language → default | P1 | CTO Board → Claude Code |
| Q5 | Marketing route group | Remove/hide for V1 | P1 | CTO Board → Claude Code |
| Q6 | v2.1 vs v2.0 reconciliation | Unresolved — needs Strategy Board session | P1 | Strategy Board |
| Q7 | Smart contract audit | Launch without, audit post-users | Deferred | Q3 2026 planning |
| Q8 | Founding member cap | 1,200 confirmed, env var configurable | P1 | CTO Board → Claude Code |

---

*Decisions recorded by CTO Board. March 4, 2026.*
*All decisions are CEO-confirmed and supersede any conflicting documentation.*
