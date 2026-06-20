# Analytics Integration Guide

> ⚠️ **Drift notice (2026-05-25, updated 2026-05-26):** the event-table sections below were authored pre-Phase-6 and pre-PreDream refactor. The current event constants live at:
>
> - `apps/web/src/lib/compound-interest/constants.ts` → `CALCULATOR_EVENTS` (6 fields: `OPENED`, `AMOUNT_CHANGED`, `CADENCE_CHANGED`, `YEARS_CHANGED`, `SCENARIO_FOCUSED`, `COMPUTATION_COMPLETED`)
> - `apps/web/src/lib/events/applicationEventTypes.ts` → `ApplicationEventType` enum (includes `PRE_DREAM_STARTED`, `PRE_DREAM_SHARE_INITIATED`, `PRE_DREAM_SHARE_COMPLETED` — the former `DREAM_MODE_EVENTS` were superseded by PreDream; `src/lib/dream-mode/constants.ts` no longer exists)
> - `apps/web/src/lib/waitingList/constants.ts` → `WAITING_LIST_EVENTS` (includes the `SHARE_MODAL_OPENED`/`SHARE_INITIATED`/`SHARE_COMPLETED` nested keys — there is no separate `SHARE_EVENTS` constant; `src/lib/share/constants.ts` still exists but now exports only `OG_DIMENSIONS` — the share-event constants were dead-code-removed 2026-04-04)
>
> **`ApplicationDomain` + `ApplicationEventType` additions (2026-05-26 — the tools-defects fix plan v1.3 execution):**
>
> - **`ApplicationDomain` adds `'tools'`** — emitted by tool-suite components for tool-specific events.
> - **`ApplicationEventType.CALCULATOR_UNEXPECTED_ERROR` (`'tools:calculatorUnexpectedError'`)** — emitted by `AssetHistoryCalculator` `Default.tsx` when an unexpected (non-`AssetHistoryDataError`) error escapes the engine. Routed via `applicationEventBus.emit(CALCULATOR_UNEXPECTED_ERROR, { domain: 'tools', source: 'asset-history', severity: 'high', context: {…PII-free…} })` + a parallel `errorReportingService.captureException(...)` for Sentry visibility. C21 close. Pattern is reusable for other tools' future unexpected-error reporting; the asset-history wiring is the canonical example.
> - **`ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED` (`'tools:calculatorDepreciationClamped'`)** — emitted by `applyEffectiveRateClamp` in `lib/market-data/formulas/currencyHedge.ts` when an effective-rate computation `(1 + usdYield)(1 + d) - 1` would drop to ≤ -0.99 (catastrophic depreciation case, not reachable with current data but observable for future SDK responses). C3 close. Payload includes `originalEffectiveRate`, `clampedTo`, `usdYield`, `depreciation` for debugging. Seven hedge sites emit this event under distinct `source` discriminators (`calculateWithCurrencyHedge`, `calculateMonthlyWithCurrencyHedge`, `calculateCompoundProjectionHedged`, `calculateEmergencyFundTimeline`, `calculateTimeToTargetTimeline`, `currencyDepreciation.forward`, and `comparisonTable.chart` — the last via `buildHedgedMonthlyValuePath` for the redesign "data as hero" chart).
>
> The Overview, Event Naming Conventions, How-to-Add-New-Events, Dashboard Locations, and Privacy & Consent sections remain accurate. A full rewrite of the event tables is tracked in `docs/audit/PENDING_ALL.md` Track 3 — until then, the source constants files are the authoritative event reference.

This document provides comprehensive documentation for analytics tracking in the diBoaS platform.

## Table of Contents

1. [Overview](#overview)
2. [Event Naming Conventions](#event-naming-conventions)
3. [All Tracked Events](#all-tracked-events)
4. [Event Details by Category](#event-details-by-category)
5. [How to Add New Events](#how-to-add-new-events)
6. [Dashboard Locations](#dashboard-locations)
7. [Privacy & Consent](#privacy--consent)

---

## Overview

The diBoaS platform uses a dual-layer analytics system:

1. **`analyticsService`** - Client-side analytics for user behavior tracking (Google Analytics 4 compatible)
2. **`ApplicationEventBus`** - Server-side event bus for audit logging, monitoring, and future webhook integrations

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  analyticsService.track()    │   applicationEventBus.emit() │
│  (Client-side analytics)     │   (Audit & monitoring)       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Google Analytics 4    │     │   Event History Store   │
│   (or custom endpoint)  │     │   (Audit Trail)         │
└─────────────────────────┘     └─────────────────────────┘
```

### Key Files

| File                                    | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| `src/lib/analytics/service.ts`          | Main analytics service implementation      |
| `src/lib/analytics/types.ts`            | TypeScript interfaces for analytics        |
| `src/lib/events/ApplicationEventBus.ts` | Server-side event bus for audit/monitoring |
| `src/lib/*/constants.ts`                | Event name constants by feature            |

---

## Event Naming Conventions

The codebase uses **two parallel naming conventions** for two different layers of the analytics stack. Both are intentional — they target different audiences and tooling.

### Format A — `analyticsService.track()` event names (`snake_case`)

Client-side analytics names that flow into Google Analytics 4 (which has tooling expectations around `snake_case` event names). Follows the pattern `{feature_area}_{specific_action}`:

**Examples:**

- `pre_dream_started`
- `waitlist_form_submitted`
- `calculator_input_changed`
- `share_card_generated`

**Rules:**

1. **Lowercase with underscores** — All event names use `snake_case`
2. **Feature prefix** — Start with the feature area (`pre_dream_`, `waitlist_`, `calculator_`, `share_`)
3. **Action suffix** — End with the action performed (`_started`, `_completed`, `_clicked`, `_changed`)
4. **Past tense for completed actions** — Use `submitted`, `completed`, `clicked` (not `submit`, `complete`, `click`)

### Format B — `ApplicationEventType` enum values (`[domain]:[entityAction]`)

Internal server-side event bus names that feed audit logging + cross-component subscribers + future webhook integrations. Domain-scoped + camelCase action to match the `ApplicationDomain` typed contract:

**Examples:**

- `waitlist:signupCompleted`
- `share:initiated`
- `preDream:shareCompleted`
- `application:error`
- `tools:calculatorUnexpectedError`
- `tools:calculatorDepreciationClamped`

**Rules:**

1. **Format is `{domain}:{entityAction}`** — colon separator, camelCase verb-phrase after the colon
2. **`domain` must be one of `ApplicationDomain`** — `waitlist`, `share`, `consent`, `preDemo`, `preDream`, `analytics`, `monitoring`, `application`, `tools`
3. **`entityAction` is past-tense camelCase** — e.g. `signupCompleted`, `shareInitiated`, `calculatorUnexpectedError`
4. **Add to `EVENT_VALIDATION_SCHEMA`** when defining a new entry — required-fields list per event type

### Which convention to use

| Layer                                                       | Convention                           | When to use                                                                                     |
| ----------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `analyticsService.track({ name: '…' })`                     | Format A (`snake_case`)              | User-behavior analytics destined for GA4 / custom analytics endpoint                            |
| `applicationEventBus.emit(ApplicationEventType.X, payload)` | Format B (`[domain]:[entityAction]`) | Cross-component pub/sub, audit logging, error reporting via Sentry, future webhook integrations |

The two layers are NOT mirrors of each other — a single user action may emit one, the other, or both. The `analyticsService` is what GA4 sees; the `applicationEventBus` is what the rest of the application reacts to.

### Common Action Suffixes

| Suffix        | When to Use                         |
| ------------- | ----------------------------------- |
| `_started`    | User initiates a flow or process    |
| `_completed`  | User successfully finishes a flow   |
| `_failed`     | An error occurred                   |
| `_cancelled`  | User explicitly cancelled an action |
| `_clicked`    | User clicked a button/link          |
| `_changed`    | User modified an input value        |
| `_viewed`     | User viewed a screen/section        |
| `_copied`     | User copied content to clipboard    |
| `_shared`     | User shared content to a platform   |
| `_downloaded` | User downloaded a file/image        |

---

## All Tracked Events

> ⛔ **STALE — do not trust the event tables in this section.** The tables below (event names, constants, and per-category details through "Event Details by Category") were authored pre-Phase-6 and reference constants that have since been renamed, moved, or deleted (e.g. `DREAM_MODE_EVENTS` → PreDream `ApplicationEventType`; no `SHARE_EVENTS` — `src/lib/share/constants.ts` now exports only `OG_DIMENSIONS`). **The source constants files are the single authoritative event reference** — see the drift notice at the top of this file for the exact file paths (`apps/web/src/lib/*/constants.ts` and `apps/web/src/lib/events/applicationEventTypes.ts`). The ARCHITECTURE description (Overview, Event Naming Conventions, How-to-Add, Privacy & Consent) above and below remains accurate; only these enumerated tables are stale. Full table rewrite tracked in `docs/audit/PENDING_ALL.md` Track 3.

### Dream Mode Events

| Event Name                      | Constant                                 | Description                          |
| ------------------------------- | ---------------------------------------- | ------------------------------------ |
| `dream_mode_started`            | `DREAM_MODE_EVENTS.STARTED`              | User enters Dream Mode               |
| `dream_mode_screen_view`        | -                                        | User views a Dream Mode screen       |
| `dream_disclaimer_accepted`     | `DREAM_MODE_EVENTS.DISCLAIMER_ACCEPTED`  | User accepts CLO disclaimer          |
| `dream_path_selected`           | `DREAM_MODE_EVENTS.PATH_SELECTED`        | User selects investment path         |
| `dream_amount_set`              | `DREAM_MODE_EVENTS.AMOUNT_SET`           | User sets investment amount          |
| `dream_timeframe_changed`       | `DREAM_MODE_EVENTS.TIMEFRAME_CHANGED`    | User changes timeframe               |
| `dream_simulation_started`      | `DREAM_MODE_EVENTS.SIMULATION_STARTED`   | Simulation begins                    |
| `dream_mode_simulation_started` | -                                        | Alternative simulation start event   |
| `dream_simulation_completed`    | `DREAM_MODE_EVENTS.SIMULATION_COMPLETED` | Simulation completes                 |
| `dream_mode_share`              | -                                        | User initiates share from Dream Mode |
| `dream_mode_try_again`          | -                                        | User clicks "Try Again"              |
| `dream_mode_completed`          | `DREAM_MODE_EVENTS.COMPLETED`            | User completes entire flow           |

### Waitlist Events

| Event Name                        | Constant                                   | Description               |
| --------------------------------- | ------------------------------------------ | ------------------------- |
| `waiting_list_modal_opened`       | `WAITING_LIST_EVENTS.MODAL_OPENED`         | Waitlist modal opens      |
| `waiting_list_modal_closed`       | `WAITING_LIST_EVENTS.MODAL_CLOSED`         | Waitlist modal closes     |
| `waiting_list_form_submitted`     | `WAITING_LIST_EVENTS.FORM_SUBMITTED`       | Form submission started   |
| `waiting_list_submission_success` | `WAITING_LIST_EVENTS.SUBMISSION_SUCCESS`   | Signup successful         |
| `waiting_list_submission_failure` | `WAITING_LIST_EVENTS.SUBMISSION_FAILURE`   | Signup failed             |
| `waiting_list_signup_success`     | -                                          | Alternative success event |
| `waiting_list_signup_error`       | -                                          | Signup error occurred     |
| `waitlist_referral_link_copied`   | `WAITING_LIST_EVENTS.REFERRAL_LINK_COPIED` | User copies referral link |
| `waitlist_referral_link_shared`   | `WAITING_LIST_EVENTS.REFERRAL_LINK_SHARED` | User shares referral link |
| `waitlist_share_modal_opened`     | `WAITING_LIST_EVENTS.SHARE_MODAL_OPENED`   | Share modal opens         |

### Share Events

| Event Name               | Constant                        | Description                  |
| ------------------------ | ------------------------------- | ---------------------------- |
| `share_card_generated`   | `SHARE_EVENTS.CARD_GENERATED`   | Share card image generated   |
| `share_initiated`        | `SHARE_EVENTS.SHARE_INITIATED`  | User initiates share action  |
| `share_completed`        | `SHARE_EVENTS.SHARE_COMPLETED`  | Share completed successfully |
| `share_failed`           | `SHARE_EVENTS.SHARE_FAILED`     | Share action failed          |
| `share_cancelled`        | `SHARE_EVENTS.SHARE_CANCELLED`  | User cancelled share         |
| `share_link_copied`      | `SHARE_EVENTS.LINK_COPIED`      | Link copied to clipboard     |
| `share_image_downloaded` | `SHARE_EVENTS.IMAGE_DOWNLOADED` | Image downloaded             |

### Calculator Events

| Event Name                     | Constant                              | Description                   |
| ------------------------------ | ------------------------------------- | ----------------------------- |
| `calculator_opened`            | `CALCULATOR_EVENTS.CALCULATOR_OPENED` | Calculator component loads    |
| `calculator_input_changed`     | `CALCULATOR_EVENTS.INPUT_CHANGED`     | User changes input value      |
| `calculator_timeframe_changed` | `CALCULATOR_EVENTS.TIMEFRAME_CHANGED` | User changes timeframe        |
| `calculator_share_result`      | `CALCULATOR_EVENTS.SHARE_RESULT`      | User shares calculator result |
| `calculator_cta_clicked`       | `CALCULATOR_EVENTS.CTA_CLICKED`       | User clicks CTA button        |

### Navigation & System Events

| Event Name               | Description                        |
| ------------------------ | ---------------------------------- |
| `page_view`              | User views a page                  |
| `page_performance`       | Web Vitals metric recorded         |
| `navigation_interaction` | User interacts with navigation     |
| `navigation_error`       | Navigation error occurred          |
| `section_interaction`    | User interacts with a page section |

### Redesign Funnel Events (V2)

The "value-first → earned signup" thesis is measured by the **north-star: waitlist
signups attributable to a tool/demo interaction, per market.** The funnel reuses the
existing event sets above; only two genuinely-new impression events were added (both
Format-A, fired via `analyticsService.track()` — they are NOT registered in
`EVENT_VALIDATION_SCHEMA`, which is Format-B only):

| Event Name          | Where it fires                                                                 | Parameters | Description                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `wedge_shown`       | `Sections/WedgeSection` (impression, `useImpressionTracking`)                  | `market`, `metric` | The per-market wedge (live market-truth figure + lead-tool CTA) entered view. `metric` is the wedge's data dimension (e.g. bank-rate / inflation / currency-depreciation). |
| `hero_proof_viewed` | `Sections/ComparisonTable` — on the "data as hero" `DivergenceChart` (≥50% in view) | `market`   | The user actually saw the live bank-vs-diBoaS proof viz. Sharper than the section-level `comparison_visible` (0.3 threshold, whole section). |

**Funnel stages (slice every stage by `market`/`source`):**

1. `section_viewed` / `wedge_shown` / `hero_proof_viewed` — value surfaces seen.
2. `calculator_opened` → `calculator_computation_completed` — tool engagement (the attributable interaction).
3. `share_initiated` → `share_completed` (`source` incl. `adelaide_daily`) — proof artifact shared.
4. `waitlist_signup_completed` (+ `referral_used`) — the north-star conversion.

**Before/after baselining (not an A/B):** the V2 redesign is a straight replacement, so
there is no concurrent control. Capture the pre-redesign north-star (signups attributable
to a tool/demo interaction, per market) on `main` over a stable window **before** the
merge, then compare the same metric over an equal post-merge window. Confounders (seasonality,
paid spend, PR) must be annotated when interpreting the delta.

---

## Event Details by Category

### Dream Mode Events

#### `dream_mode_started`

```typescript
analyticsService.track({
  name: 'dream_mode_started',
  parameters: { source: 'component' },
});
```

#### `dream_mode_screen_view`

```typescript
analyticsService.track({
  name: 'dream_mode_screen_view',
  parameters: {
    screen:
      'disclaimer' |
      'welcome' |
      'pathSelect' |
      'input' |
      'timeframe' |
      'simulation' |
      'results' |
      'share',
  },
});
```

#### `dream_disclaimer_accepted`

```typescript
analyticsService.track({
  name: DREAM_MODE_EVENTS.DISCLAIMER_ACCEPTED,
  parameters: { timestamp: new Date().toISOString() },
});
```

#### `dream_path_selected`

```typescript
analyticsService.track({
  name: DREAM_MODE_EVENTS.PATH_SELECTED,
  parameters: { path: 'safety' | 'balance' | 'growth' },
});
```

#### `dream_mode_simulation_started`

```typescript
analyticsService.track({
  name: 'dream_mode_simulation_started',
  parameters: {
    initialAmount: number,
    monthlyContribution: number,
    timeframe: '1week' | '1month' | '1year' | '5years',
    selectedPath: 'safety' | 'balance' | 'growth',
    pathApy: number,
  },
});
```

#### `dream_mode_share`

```typescript
analyticsService.track({
  name: 'dream_mode_share',
  parameters: {
    platform: string,
    initialAmount: number,
    defiResult: number,
    timeframe: string,
  },
});
```

### Waitlist Events

#### `waiting_list_form_submitted`

```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.FORM_SUBMITTED,
  parameters: {
    locale: string,
    timestamp: number,
  },
});
```

#### `waiting_list_submission_success`

```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.SUBMISSION_SUCCESS,
  parameters: {
    position: number,
    hasReferral: boolean,
    locale: string,
    timestamp: number,
  },
});
```

#### `waitlist_referral_link_copied`

```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.REFERRAL_LINK_COPIED,
  parameters: {
    referralCode: string,
    locale: string,
    timestamp: number,
  },
});
```

#### `waitlist_referral_link_shared`

```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.REFERRAL_LINK_SHARED,
  parameters: {
    platform: 'twitter' | 'whatsapp' | 'facebook' | 'telegram' | 'linkedin',
    referralCode: string,
    locale: string,
    timestamp: number,
  },
});
```

### Share Events

#### `share_card_generated`

```typescript
analyticsService.track({
  name: SHARE_EVENTS.CARD_GENERATED,
  parameters: {
    cardType: 'dream' | 'waitlist',
    locale: string,
  },
});
```

#### `share_completed`

```typescript
analyticsService.track({
  name: SHARE_EVENTS.SHARE_COMPLETED,
  parameters: {
    platform: string,
    cardType: string,
    locale: string,
  },
});
```

### Calculator Events

#### `calculator_input_changed`

```typescript
analyticsService.track({
  name: CALCULATOR_EVENTS.INPUT_CHANGED,
  parameters: {
    field: 'initialAmount' | 'monthlyContribution',
    value: number,
    locale: string,
  },
});
```

#### `calculator_timeframe_changed`

```typescript
analyticsService.track({
  name: CALCULATOR_EVENTS.TIMEFRAME_CHANGED,
  parameters: {
    timeframe: '5years' | '10years' | '20years',
    locale: string,
  },
});
```

#### `calculator_share_result`

```typescript
analyticsService.track({
  name: CALCULATOR_EVENTS.SHARE_RESULT,
  parameters: {
    timeframe: string,
    initialAmount: number,
    monthlyContribution: number,
    defiProjection: number,
    locale: string,
  },
});
```

---

## How to Add New Events

### Step 1: Define Event Constant

Add the event name to the appropriate constants file:

```typescript
// src/lib/{feature}/constants.ts
export const MY_FEATURE_EVENTS = {
  ACTION_STARTED: 'my_feature_action_started',
  ACTION_COMPLETED: 'my_feature_action_completed',
  // ... more events
} as const;
```

### Step 2: Track the Event

Import and use in your component or service:

```typescript
import { analyticsService } from '@/lib/analytics';
import { MY_FEATURE_EVENTS } from '@/lib/my-feature/constants';

// Track the event
analyticsService.track({
  name: MY_FEATURE_EVENTS.ACTION_STARTED,
  parameters: {
    locale: 'en',
    timestamp: Date.now(),
    // Add relevant parameters
  },
});
```

### Step 3: Add ApplicationEventBus Event (Optional)

For audit logging and server-side tracking:

```typescript
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

// 1. First, add the event type to ApplicationEventType enum if needed
// src/lib/events/ApplicationEventBus.ts

// 2. Emit the event
applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
  source: 'my-feature',
  timestamp: Date.now(),
  metadata: {
    feature: 'my_feature_action',
    // ... additional data
  },
});
```

### Step 4: Document the Event

Add the event to this documentation file:

1. Add to the "All Tracked Events" table
2. Add detailed parameters in "Event Details by Category"

### Best Practices

1. **Always include `locale`** - For internationalization analytics
2. **Always include `timestamp`** - For time-based analysis
3. **Use constants** - Never hardcode event names
4. **Keep parameters minimal** - Only include data needed for analysis
5. **Avoid PII** - Never include email, names, or personal data in analytics
6. **Pair with ApplicationEventBus** - For important actions, emit both analytics and audit events

---

## Dashboard Locations

### Google Analytics 4

The platform integrates with GA4 when configured via environment variables:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-custom-endpoint.com/events
```

**Reports to Monitor:**

| Report        | Path                               | Purpose                  |
| ------------- | ---------------------------------- | ------------------------ |
| Real-time     | Reports > Real-time                | Live user activity       |
| Events        | Reports > Engagement > Events      | All event counts         |
| Conversions   | Reports > Engagement > Conversions | Conversion funnel        |
| User Explorer | Explore > User Explorer            | Individual user journeys |

### Custom Event Dashboard (if configured)

Events are sent to `NEXT_PUBLIC_ANALYTICS_ENDPOINT` for custom analytics:

```json
{
  "events": [
    {
      "name": "dream_mode_started",
      "parameters": { ... },
      "timestamp": 1704067200000,
      "userId": "user_xxx",
      "sessionId": "session_xxx"
    }
  ]
}
```

### ApplicationEventBus History

For debugging, the event history is available in development:

```javascript
// Browser console (development only)
window.applicationEventBus.getEventHistory();
window.applicationEventBus.getEventHistory(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED);
```

---

## Privacy & Consent

### Consent Requirements

Analytics tracking respects user consent preferences:

1. **Cookie Consent** - Users must accept analytics cookies before tracking begins
2. **No PII** - Never include personally identifiable information in events
3. **Anonymization** - User IDs are session-based, not persistent

### Consent Check

Analytics service checks consent before tracking:

```typescript
// src/lib/analytics/service.ts
track(event: AnalyticsEvent): void {
  if (!this.config.enabled) return; // Respects consent
  // ... track event
}
```

### Data Retention

- **Client-side**: Event queue flushes every 30 seconds or when queue reaches 10 events
- **Server-side**: ApplicationEventBus keeps last 500 events in memory for debugging

---

## Appendix: Event Constants Source Files

> ⛔ **STALE — some paths/imports below no longer exist** (`src/lib/dream-mode/constants.ts` was removed, and `src/lib/share/constants.ts` no longer exports event constants — only `OG_DIMENSIONS`; `DREAM_MODE_EVENTS`/`SHARE_EVENTS` were superseded — see the drift notice at the top of this file). The authoritative current list is the drift notice's file paths plus the `SUPPORTED_NAMESPACES`-style registry in the source tree. Do not treat this table as current; it is retained only as a pre-Phase-6 record pending the Track 3 rewrite.

| Feature    | Constants File                           | Import                |
| ---------- | ---------------------------------------- | --------------------- |
| Dream Mode | `src/lib/dream-mode/constants.ts`        | `DREAM_MODE_EVENTS`   |
| Waitlist   | `src/lib/waitingList/constants.ts`       | `WAITING_LIST_EVENTS` |
| Share      | `src/lib/share/constants.ts`             | `SHARE_EVENTS`        |
| Calculator | `src/lib/compound-interest/constants.ts` | `CALCULATOR_EVENTS`   |
| Lesson     | `src/lib/learn/constants.ts`             | `LESSON_EVENTS`       |
| Market     | `src/lib/market/constants.ts`            | `MARKET_EVENTS`       |

---

_Last updated: May 2026_
