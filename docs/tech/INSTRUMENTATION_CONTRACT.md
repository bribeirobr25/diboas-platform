# Instrumentation Contract — the app (`apps/sandbox`, app.diboas.com)

**Status:** DOCUMENTATION ONLY (registered 2026-09-07 at repository canonization). The app currently ships **no analytics** (no PostHog, GA4 or Sentry client; nothing fires). This contract is what the instrumentation runtime must satisfy when the implementation phase authorises it. It closes the D-19 gap from the canon reconciliation (`docs/full-view/canon/output/…_r3.md`, local-only).
**Companions:** `MONITORING_OPS.md` (website stack, operating invariants) · `engineering-gates.md` § Canon intake 2026-09-07 (G-02, G-07, G-08, LB-05, LB-06) · `implementation-notes.md` § Canon intake 2026-09-07.
**Sources (local-only, `docs/full-view/canon/`):** Growth CC-B (data / attribution seam), GEX-02/03 (quality exclusions), Growth measurement contract (Goal-count neutrality); Legal LC-PUI-02 §9 + LC-TD-02 §4 (consent gating, Goal-data exclusion, evidence); Token & Rewards guardrails §4 (`reward_qualifying`); Monetization & Economics `METRIC_DICTIONARY` (`pricing_version`).

## 1. Loading and gating

- Analytics libraries load only by dynamic `import()` after the affirmative `LEGAL-ANALYTICS` choice (same pattern as `apps/web`'s consent-gated PostHog provider). Static imports of analytics SDKs are prohibited in `apps/sandbox`.
- **No consent-dependent tag fires before the choice.** Refusal or later withdrawal never blocks core Practice. The choice is changeable in settings; every change is evidenced (§4).
- Sentry error transport, if added, follows the website's same-origin tunnel + `beforeSend` scrub pattern and carries no Goal content (§3).
- Sabotage test required at build: a network trace with analytics refused must show zero analytics calls.

## 2. Event envelope (every event)

| Field | Values / rule |
| --- | --- |
| `event_name` | stable, documented in code next to the emitter (the existing KPI-taxonomy rule) |
| `mode` | `PRACTICE` \| `REAL_MONEY` \| `NEUTRAL` (pre-mode surfaces: Welcome, Account Access, readiness) — never omitted, never inferred |
| `ledger_scope` | `sandbox` \| `real` (the scope column of the ledger, when the scope layer exists) |
| `reward_qualifying` | **always `false` when `mode = PRACTICE`** (Token & Rewards guardrails §4); the field exists even though no Rewards system exists, so the invariant is testable |
| `pmf_entry_scenario_id` | preserved verbatim from the Money Jobs → Practice bridge hand-off when present; `UNKNOWN` otherwise (never guessed) |
| `pricing_version` | required on any Real Money cohort event exposed to a pricing schedule (`FE-1` today); absent in Practice |
| `session_class` | `USER` \| `INTERNAL` \| `BOT` \| `SYNTHETIC` — internal, bot and synthetic traffic is excluded from every product metric (GEX-QA-004) |
| `data_quality` | `OK` \| `UNKNOWN` \| `INCONCLUSIVE` — **fail closed**: broken or missing critical data marks the event `UNKNOWN`; it is never silently coerced |
| `locale`, `document_version` | locale of the surface; version of any legal document or notice the event references |
| `correlation_id` | rides on tags (never `extra`), matching the website's Sentry rule |

Dedupe: R1 primary activation is counted **once per user**, never per device or session.

## 3. What must never leave the device in analytics

Raw Goal text, Goal images, purpose text, exact financial amounts, Decision Memory / DecisionRecord contents, and any free-text field — in event payloads, properties, URLs, query strings, UTM parameters or referrers (LC-PUI-02 §9; LC-TD-02 PN-05). Amounts may travel only as **bucketed ranges** defined in the emitter; Goal identity travels as an opaque id. Gate G-07 asserts this on the emitter surface.

## 4. Evidence records (not analytics — the consent/notice ledger)

For `LEGAL-TERMS` and `LEGAL-AGE`: user/account id · control id · locale · document version · timestamp · resulting state. For `LEGAL-ANALYTICS` additionally: purpose/category · affirmative or negative choice · withdrawal/change timestamp and current state (LC-TD-02 §4.3). These records are first-party, server-side once accounts exist, and never sent to an analytics vendor.

## 5. Metrics discipline

- **Goal count is never a success metric** (Growth measurement contract §2 "Goal count neutrality"). A goal-count-as-success lint is a PLANNED gate.
- Activation (CA4), AE-v0 and the Weekly cycle follow Growth's definitions; AE-v0 belongs to a later eligible Weekly cycle after CA4.
- S2 (Hesitant Contemplator) is an **analytical cut only** — never a targeting, eligibility, pricing or Rewards input, and never inferred as a sensitive attribute.
- Practice metrics never imply value, return or reward; "you earned" phrasing is prohibited in any surfaced metric copy.

## 6. Transport decision (open, technical)

PostHog (consent-gated, `person_profiles: 'identified_only'`, opaque ids — the website's proven configuration) vs an event-bus-only first-party store. Decided in the implementation plan and logged in `docs/audit/PENDING_ALL.md` with problem / solution / reason.
