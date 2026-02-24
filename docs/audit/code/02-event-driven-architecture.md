# Principle 2: Event-Driven Architecture - Code Audit

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6 (Automated Code Audit)
**Scope:** All event-related code in `apps/web/src/`
**Phase:** Pre-launch / Waitlist

---

## Principle Requirements

From `docs/coding-standards.md` (Principle 2):

1. All significant state changes emit events
2. Events include: `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`
3. Event naming: `[Domain][Entity][Action]Event`
4. Example: `BankingTransactionCompletedEvent`, `InvestingOrderExecutedEvent`

---

## Findings

### 2.1 Event Bus Infrastructure

**Status:** Compliant

**Evidence:**

Two centralized event bus implementations exist:

- **ApplicationEventBus** (`apps/web/src/lib/events/ApplicationEventBus.ts`) -- Service/domain-level events (waitlist, consent, share, dream mode, webhooks, errors). Singleton exported as `applicationEventBus`. 35 event types defined in `ApplicationEventType` enum.
- **SectionEventBus** (`apps/web/src/lib/events/SectionEventBus.ts`) -- UI/section-level events (carousel, CTA clicks, performance, accessibility). Singleton exported as `sectionEventBus`. 11 event types defined in `SectionEventType` enum.

Both buses provide:
- Type-safe `on()` subscription with unsubscribe function return
- Async `emit()` with payload validation against per-event schemas
- Error isolation per listener (via `Promise.allSettled`)
- Event history for audit trail (500/1000 entry ring buffers)
- Debug logging in development mode
- Self-emitting error events when listeners fail (with infinite loop protection)
- Analytics integration (ApplicationEventBus maps events to analytics; SectionEventBus tracks user interactions)

Clean barrel export via `apps/web/src/lib/events/index.ts`.

**Gaps:** None for infrastructure.

**Recommendation:** None. The dual-bus architecture (application vs. section) is a sound separation of concerns.

---

### 2.2 Event Payload Structure

**Status:** Non-compliant

**Evidence:**

The coding standard requires events to include **7 fields**: `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`.

The actual `ApplicationEventPayload` base interface contains:
```typescript
interface ApplicationEventPayload {
  timestamp: number;
  source: string;        // maps roughly to "domain"
  metadata?: Record<string, unknown>;
}
```

The actual `SectionEventPayload` base interface contains:
```typescript
interface SectionEventPayload {
  sectionId: string;
  sectionType: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

**Missing required fields:**

| Required Field | ApplicationEventBus | SectionEventBus |
|---------------|-------------------|----------------|
| `eventId` | Missing | Missing |
| `eventType` | Passed as argument to `emit()`, not in payload | Passed as argument to `emit()`, not in payload |
| `timestamp` | Present | Present |
| `correlationId` | Missing | Missing |
| `domain` | Partially covered by `source` field | Partially covered by `sectionType` |
| `payload` | Merged into top-level (no nested `payload` key) | Merged into top-level |
| `metadata` | Present (optional) | Present (optional) |

The `eventType` is passed as the first argument to `emit()` and stored in the history alongside the payload, but it is not embedded in the payload object itself. This is a minor structural deviation.

The `eventId` field is entirely absent. No UUID or unique identifier is generated for individual event instances. This prevents:
- Precise deduplication of events
- Reference from downstream consumers back to a specific event
- Audit trail granularity

The `correlationId` field is entirely absent. No mechanism exists to correlate related events across a workflow (e.g., linking `WAITLIST_SIGNUP_COMPLETED` with the preceding `FEATURE_USED` event from the same form submission).

**Gaps:**
- No `eventId` generation or inclusion in any event payload
- No `correlationId` propagation across related events
- `domain` is approximated by `source` but not a formal field
- Payload structure is flat rather than nested under a `payload` key

**Recommendation:**
1. Add `eventId` (UUID v4) generation in the `emit()` method, either auto-injected or required in payload.
2. Add optional `correlationId` to `ApplicationEventPayload` and propagate it through related event chains (e.g., a single form submission generates multiple events that should share a correlationId).
3. Consider renaming `source` to `domain` for consistency with the standard, or add `domain` as an alias.
4. The flat payload structure (vs. nested `payload` key) is acceptable for a pre-launch app and can be addressed when full event sourcing is implemented.

---

### 2.3 Event Naming Convention

**Status:** Non-compliant

**Evidence:**

The standard requires: `[Domain][Entity][Action]Event`
Examples: `BankingTransactionCompletedEvent`, `InvestingOrderExecutedEvent`

Actual naming in `ApplicationEventType` enum uses colon-separated lowercase format:
```
waitlist:signupCompleted
waitlist:signupFailed
share:initiated
dreamMode:calculationStarted
consent:given
webhook:received
application:error
```

This is `[domain]:[action]` or `[domain]:[entityAction]` -- not PascalCase `[Domain][Entity][Action]Event`.

Similarly, `SectionEventType` uses:
```
carousel:slideChanged
section:error
cta:clicked
accessibility:keyboardNavigation
```

**Analysis of deviation:**

The enum values use a pragmatic `domain:camelCase` format that is actually well-suited for runtime string matching and analytics integration. The PascalCase convention in the standard (`BankingTransactionCompletedEvent`) is designed for future production domains (Banking, Investing, DeFi) that do not yet exist.

For the current waitlist/marketing phase, the naming is internally consistent and follows a clear `[domain]:[entityAction]` pattern. However, it does not match the documented standard.

**Gaps:**
- Naming format is `domain:camelCaseAction` instead of `[Domain][Entity][Action]Event`
- No "Event" suffix
- No PascalCase
- Entity is sometimes omitted (e.g., `consent:given` vs. `ConsentPreferenceGivenEvent`)

**Recommendation:**
1. For now (pre-launch), document the current naming convention as the accepted pre-launch standard.
2. When production banking/investing features launch, migrate to the `[Domain][Entity][Action]Event` convention.
3. Consider creating a mapping layer or type alias system to ease the transition.

---

### 2.4 Event Coverage - Waitlist Domain

**Status:** Compliant

**Evidence:**

All significant waitlist state changes emit events:

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Signup success (API) | `WAITLIST_SIGNUP_COMPLETED` | `apps/web/src/app/api/waitlist/signup/route.ts:236` |
| Signup success (Service) | `WAITLIST_SIGNUP_COMPLETED` | `apps/web/src/lib/waitingList/services/WaitingListService.ts:204` |
| Signup success (UI) | `WAITLIST_SIGNUP_SUCCESS` | `apps/web/src/components/Sections/WaitlistSection/index.tsx:45` |
| Signup failure (API) | `WAITLIST_SIGNUP_FAILED` | `apps/web/src/app/api/waitlist/signup/route.ts:262` |
| Signup failure (Service) | `WAITLIST_SIGNUP_FAILED` | `apps/web/src/lib/waitingList/services/WaitingListService.ts:221` |
| Form submission start | `FEATURE_USED` | `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts:120` |
| Deletion requested | `WAITLIST_DELETION_REQUESTED` | `apps/web/src/app/api/waitlist/delete/route.ts:131` |
| Deletion completed | `WAITLIST_DELETION_COMPLETED` | `apps/web/src/app/api/waitlist/delete/route.ts:268` |
| Position checked | `WAITLIST_POSITION_CHECKED` | `apps/web/src/app/api/waitlist/position/route.ts:106` |
| Referral used | `WAITLIST_REFERRAL_USED` | `apps/web/src/app/api/waitlist/referral/route.ts:228` |

**Gaps:**
- `WAITLIST_SIGNUP_COMPLETED` is emitted in both the API route and the WaitingListService. If both code paths execute for the same signup, this results in duplicate events. The service layer uses localStorage (client-side), while the API route handles server-side signups. In practice, the form uses the API route, so the service layer is a fallback. This is not a bug but could cause confusion.

**Recommendation:** Document which layer is authoritative for event emission (API route for server, Service for client-side fallback).

---

### 2.5 Event Coverage - Consent Domain

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Consent given (API) | `CONSENT_GIVEN` | `apps/web/src/app/api/consent/route.ts:107` |
| Consent given (UI) | `CONSENT_GIVEN` | `apps/web/src/components/CookieConsent/CookieConsent.tsx:94` |
| Consent withdrawn (API POST) | `CONSENT_WITHDRAWN` | `apps/web/src/app/api/consent/route.ts` (via eventType variable) |
| Consent withdrawn (API DELETE) | `CONSENT_WITHDRAWN` | `apps/web/src/app/api/consent/route.ts:237` |
| Consent withdrawn (UI) | `CONSENT_WITHDRAWN` | `apps/web/src/components/CookieConsent/CookieConsent.tsx:115` |
| Consent API errors | `APPLICATION_ERROR` | `apps/web/src/app/api/consent/route.ts:121,180,251` |
| Consent sync errors | `APPLICATION_ERROR` | `apps/web/src/components/CookieConsent/consentUtils.ts:36,62` |

**Gaps:**
- Similar to waitlist, consent events are emitted from both the UI component (optimistic) and the API route (authoritative). The UI comment says "local fallback -- API also emits on success". This could result in duplicate events for the same user action.

**Recommendation:** Add a deduplication mechanism or clearly designate one layer as the authoritative emitter.

---

### 2.6 Event Coverage - Share Domain

**Status:** Compliant

**Evidence:**

`ShareManager` (`apps/web/src/lib/share/ShareManager.ts`) emits events for the full lifecycle:

| State Change | Event Type | Line |
|-------------|-----------|------|
| Share initiated | `SHARE_INITIATED` | 240 |
| Feature tracking | `FEATURE_USED` | 250 |
| Share completed | `SHARE_COMPLETED` | 309 |
| Share cancelled | `SHARE_CANCELLED` | 319 |
| Share failed | `SHARE_FAILED` | 329 |

All share operations flow through the `share()` method, ensuring consistent event emission regardless of platform.

**Gaps:** None.

**Recommendation:** None.

---

### 2.7 Event Coverage - Dream Mode Domain

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Disclaimer accepted | `DREAM_MODE_DISCLAIMER_ACCEPTED` | `DreamModeProvider.tsx:114` |
| Path selected | `DREAM_MODE_PATH_SELECTED` | `DreamModeProvider.tsx:130` |
| Simulation feature used | `FEATURE_USED` | `DreamModeProvider.tsx:152` |
| Calculation started | `DREAM_MODE_CALCULATION_STARTED` | `DreamModeProvider.tsx:163` |
| Calculation completed | `DREAM_MODE_CALCULATION_COMPLETED` | `DreamModeProvider.tsx:190` |
| Calculation completed (lib) | `DREAM_MODE_CALCULATION_COMPLETED` | `calculations.ts:95` |
| Amount changed | `DREAM_MODE_AMOUNT_CHANGED` | `InputScreen.tsx:33,47` |
| Timeframe changed | `DREAM_MODE_TIMEFRAME_CHANGED` | `TimeframeScreen.tsx:48` |

**Gaps:**
- `DREAM_MODE_CALCULATION_COMPLETED` is emitted from both `DreamModeProvider.tsx:190` and `calculations.ts:95` (with a guard `if (emitEvent)`). Potential for double emission if both code paths execute.

**Recommendation:** Ensure only one code path emits the calculation completed event per simulation.

---

### 2.8 Event Coverage - PreDemo Domain

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Demo started | `PRE_DEMO_STARTED` | `PreDemoProvider.tsx:38` |
| Deposit completed | `PRE_DEMO_DEPOSIT_COMPLETED` | `ConfirmationScreen.tsx:99` |
| Send completed | `PRE_DEMO_SEND_COMPLETED` | `ConfirmationScreen.tsx:134` |
| Buy completed | `PRE_DEMO_BUY_COMPLETED` | `ConfirmationScreen.tsx:172` |

**Gaps:** None.

**Recommendation:** None.

---

### 2.9 Event Coverage - PreDream Domain

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Simulation started | `PRE_DREAM_STARTED` | `PreDreamProvider.tsx:72` |
| Share initiated | `PRE_DREAM_SHARE_INITIATED` | `ShareDreamSection.tsx:56` |
| Share completed | `PRE_DREAM_SHARE_COMPLETED` | `ShareDreamSection.tsx:107` |

**Gaps:** None.

**Recommendation:** None.

---

### 2.10 Event Coverage - Webhook Domain

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Webhook received | `WEBHOOK_RECEIVED` | `route.ts:152` (kit webhook handler) |
| Webhook processed | `WEBHOOK_PROCESSED` | `route.ts:189` |
| Webhook failed | `WEBHOOK_FAILED` | `route.ts:203` |
| Application error | `APPLICATION_ERROR` | `route.ts:213` |

Full lifecycle coverage: received -> processed/failed.

**Gaps:** None.

**Recommendation:** None.

---

### 2.11 Event Coverage - Error Events

**Status:** Compliant

**Evidence:**

`APPLICATION_ERROR` events are emitted from 13 locations across the codebase:

- API routes: `signup/route.ts`, `delete/route.ts`, `position/route.ts`, `referral/route.ts`, `consent/route.ts`, `webhooks/kit/route.ts`
- Components: `useWaitlistForm.ts`
- Utilities: `consentUtils.ts`
- Event bus self-emission on listener failure: `ApplicationEventBus.ts:296`

Section-level errors use `SectionEventType.SECTION_ERROR`:
- `SectionErrorBoundary.tsx:111` -- React error boundary
- `SectionEventBus.ts:210` -- Self-emission on listener failure

`ErrorReportingService` subscribes to `SECTION_ERROR` events at `ErrorReportingService.ts:86`.

**Gaps:** None for the current scope.

**Recommendation:** None.

---

### 2.12 Event Coverage - Section/UI Events

**Status:** Compliant

**Evidence:**

| State Change | Event Type | Emitter Location |
|-------------|-----------|-----------------|
| Carousel slide change | `CAROUSEL_SLIDE_CHANGED` | `ProductCarouselDefault.tsx:119` |
| Performance metric | `SECTION_PERFORMANCE_METRIC` | `usePerformanceMonitor.ts:169` |
| Section error | `SECTION_ERROR` | `SectionErrorBoundary.tsx:111` |

**Gaps:**
- Defined event types `CAROUSEL_AUTO_PLAY_STARTED`, `CAROUSEL_AUTO_PLAY_STOPPED`, `CAROUSEL_USER_INTERACTION`, `CTA_CLICKED`, `IMAGE_LOADED`, `IMAGE_ERROR`, `KEYBOARD_NAVIGATION`, `SCREEN_READER_ANNOUNCEMENT`, `SECTION_LOADED` are declared in the enum but have no emitters in the codebase.

**Recommendation:** Either implement emission for declared event types or remove unused types from the enum to avoid confusion. The unused types may be planned for future use, in which case document them as such.

---

### 2.13 Event Coverage - Navigation / Page Views

**Status:** Partial (N/A for event bus scope)

**Evidence:**

Page views are tracked via the analytics layer (GA4 `page_view`, PostHog `capture_pageview: true`) rather than the ApplicationEventBus. No `NAVIGATION` or `PAGE_VIEW` event type exists in either event bus.

Navigation within interactive components (DreamMode screen transitions, PreDemo screen transitions) is tracked via `analyticsService.track()` calls rather than event bus emissions.

**Gaps:**
- No event bus events for page navigation or route changes.

**Recommendation:** Page navigation tracking is adequately handled by the analytics layer (GA4 + PostHog). Adding event bus events for navigation would be redundant unless cross-domain event correlation is needed. Mark as acceptable for pre-launch.

---

### 2.14 Event Consumers / Listeners

**Status:** Partial

**Evidence:**

Only **one** explicit event listener registration was found:

```typescript
// apps/web/src/lib/errors/ErrorReportingService.ts:86
sectionEventBus.on(SectionEventType.SECTION_ERROR, this.handleSectionError.bind(this));
```

The ApplicationEventBus has **zero** registered listeners beyond its internal analytics tracking (which is built into the `emit()` method, not registered via `on()`).

This means:
- All ApplicationEventBus events are emitted, validated, stored in history, and tracked via analytics -- but no external consumers subscribe to them.
- The event bus serves primarily as an analytics/audit pipeline rather than a decoupled communication mechanism.
- No cross-domain event handlers exist (e.g., no handler that listens for `WAITLIST_SIGNUP_COMPLETED` to trigger follow-up actions).

**Gaps:**
- Effectively zero consumer-side usage of `ApplicationEventBus.on()`.
- No event-driven workflows where one domain reacts to another domain's events.

**Recommendation:** For the current pre-launch phase, the event bus serves its purpose as an analytics and audit trail mechanism. When production features launch, implement consumer-side listeners for cross-domain workflows (e.g., signup triggers welcome email, referral triggers position update notification).

---

### 2.15 correlationId Propagation

**Status:** Non-compliant

**Evidence:**

The `correlationId` field does not exist in any event payload interface. A grep for `correlationId` across the entire codebase returns only references in documentation files (`CLAUDE.md`, `docs/coding-standards.md`, `docs/api.md`), not in source code.

Related events that should share a correlationId:
1. Waitlist signup flow: `FEATURE_USED` -> `WAITLIST_SIGNUP_COMPLETED` (or `WAITLIST_SIGNUP_FAILED`) -> `APPLICATION_ERROR`
2. Consent flow: `CONSENT_GIVEN` (UI) -> `CONSENT_GIVEN` (API) or `APPLICATION_ERROR`
3. Share flow: `SHARE_INITIATED` -> `FEATURE_USED` -> `SHARE_COMPLETED` / `SHARE_CANCELLED` / `SHARE_FAILED`
4. Dream mode flow: `DREAM_MODE_CALCULATION_STARTED` -> `DREAM_MODE_CALCULATION_COMPLETED`
5. Webhook flow: `WEBHOOK_RECEIVED` -> `WEBHOOK_PROCESSED` / `WEBHOOK_FAILED`

None of these related event chains share a common identifier.

**Gaps:**
- `correlationId` is completely unimplemented.
- No mechanism to trace a user action across multiple event emissions.

**Recommendation:**
1. Add `correlationId?: string` to both `ApplicationEventPayload` and `SectionEventPayload`.
2. Generate a correlationId at the start of each user workflow (e.g., form submission, share action) and pass it through all related event emissions.
3. For server-side API routes, accept and propagate a correlationId from the request (e.g., via `X-Correlation-ID` header).

---

### 2.16 Event Validation

**Status:** Compliant

**Evidence:**

Both event buses implement payload validation:

- `ApplicationEventBus.validateEventPayload()` checks:
  - Payload is a non-null object
  - `source` field exists and is a string
  - Event-specific required fields per `EVENT_VALIDATION_SCHEMA` (all 35 event types have schemas)

- `SectionEventBus.validateEventPayload()` checks:
  - Payload is a non-null object
  - `sectionId` and `sectionType` are present strings
  - Event-specific required fields per `EVENT_VALIDATION_SCHEMA` (all 11 event types have schemas)

**Gaps:** None. Validation is thorough and consistent.

**Recommendation:** None.

---

### 2.17 Event Testing

**Status:** Partial

**Evidence:**

Four test files reference event bus:
- `apps/web/src/lib/errors/__tests__/ErrorReportingService.test.ts`
- `apps/web/src/components/CookieConsent/__tests__/CookieConsent.test.ts`
- `apps/web/src/components/WaitingList/hooks/__tests__/useWaitlistForm.test.ts`
- `apps/web/src/app/api/waitlist/__tests__/signup.test.ts`

These tests mock the event bus imports but do not appear to have dedicated test suites for:
- Event bus emit/subscribe behavior
- Payload validation rejection
- Event history ring buffer behavior
- Listener error isolation
- Analytics integration

**Gaps:**
- No dedicated unit tests for `ApplicationEventBus` class
- No dedicated unit tests for `SectionEventBus` class
- No integration tests verifying that specific state changes produce expected events

**Recommendation:** Add dedicated test suites for both event bus classes covering: emit/on lifecycle, validation rejection, error isolation, history management, and analytics mapping.

---

## Summary

| Sub-section | Requirement | Status |
|------------|------------|--------|
| 2.1 | Event Bus Infrastructure | Compliant |
| 2.2 | Event Payload Structure (7 fields) | Non-compliant |
| 2.3 | Event Naming Convention | Non-compliant |
| 2.4 | Waitlist Event Coverage | Compliant |
| 2.5 | Consent Event Coverage | Compliant |
| 2.6 | Share Event Coverage | Compliant |
| 2.7 | Dream Mode Event Coverage | Compliant |
| 2.8 | PreDemo Event Coverage | Compliant |
| 2.9 | PreDream Event Coverage | Compliant |
| 2.10 | Webhook Event Coverage | Compliant |
| 2.11 | Error Event Coverage | Compliant |
| 2.12 | Section/UI Event Coverage | Compliant |
| 2.13 | Navigation / Page View Events | Partial (N/A) |
| 2.14 | Event Consumers / Listeners | Partial |
| 2.15 | correlationId Propagation | Non-compliant |
| 2.16 | Event Validation | Compliant |
| 2.17 | Event Testing | Partial |

**Overall Assessment:** Partial compliance. The event infrastructure is solid, event coverage across all current domains is thorough, and validation is comprehensive. However, three structural requirements from the coding standard are unimplemented: `eventId`, `correlationId`, and the `[Domain][Entity][Action]Event` naming convention. These gaps are acceptable for the pre-launch waitlist phase but must be addressed before production banking/investing features go live.

---

## Action Items

| Priority | Item | Effort | Description |
|----------|------|--------|-------------|
| P1 (Pre-launch) | Add `eventId` to event payloads | Low | Auto-generate UUID v4 in `emit()` and include in enriched payload. Required for audit trail precision. |
| P1 (Pre-launch) | Add `correlationId` to event payloads | Medium | Add optional field to base interfaces. Generate at workflow entry points (form submit, share, calculation). Propagate through related events. |
| P2 (Post-launch) | Migrate event naming to PascalCase convention | Medium | When production domains launch, rename event types to `[Domain][Entity][Action]Event` format. Keep colon-separated values as runtime string aliases if needed. |
| P2 (Post-launch) | Implement event consumers | Medium | Register listeners on `ApplicationEventBus` for cross-domain workflows (signup -> welcome flow, referral -> position update notification). |
| P2 (Post-launch) | Add dedicated event bus tests | Medium | Unit tests for both `ApplicationEventBus` and `SectionEventBus` classes covering full API surface. |
| P3 (Housekeeping) | Remove or implement unused `SectionEventType` entries | Low | 9 of 11 `SectionEventType` values have no emitters. Either implement or remove: `CAROUSEL_AUTO_PLAY_STARTED`, `CAROUSEL_AUTO_PLAY_STOPPED`, `CAROUSEL_USER_INTERACTION`, `CTA_CLICKED`, `IMAGE_LOADED`, `IMAGE_ERROR`, `KEYBOARD_NAVIGATION`, `SCREEN_READER_ANNOUNCEMENT`, `SECTION_LOADED`. |
| P3 (Housekeeping) | Deduplicate event emissions | Low | Document which layer (API route vs. Service vs. UI component) is authoritative for each event type to prevent double emissions. |
| P3 (Housekeeping) | Add `domain` field to payloads | Low | Rename `source` to `domain` or add it as an explicit field for standard compliance. |

---

## Files Audited

### Event Infrastructure
- `apps/web/src/lib/events/ApplicationEventBus.ts`
- `apps/web/src/lib/events/SectionEventBus.ts`
- `apps/web/src/lib/events/index.ts`

### Event Emitters (ApplicationEventBus)
- `apps/web/src/app/api/waitlist/signup/route.ts`
- `apps/web/src/app/api/waitlist/delete/route.ts`
- `apps/web/src/app/api/waitlist/position/route.ts`
- `apps/web/src/app/api/waitlist/referral/route.ts`
- `apps/web/src/app/api/consent/route.ts`
- `apps/web/src/app/api/webhooks/kit/route.ts`
- `apps/web/src/lib/waitingList/services/WaitingListService.ts`
- `apps/web/src/lib/share/ShareManager.ts`
- `apps/web/src/lib/dream-mode/calculations.ts`
- `apps/web/src/components/DreamMode/DreamModeProvider.tsx`
- `apps/web/src/components/DreamMode/screens/InputScreen.tsx`
- `apps/web/src/components/DreamMode/screens/TimeframeScreen.tsx`
- `apps/web/src/components/PreDemo/PreDemoProvider.tsx`
- `apps/web/src/components/PreDemo/screens/ConfirmationScreen.tsx`
- `apps/web/src/components/PreDream/PreDreamProvider.tsx`
- `apps/web/src/components/PreDream/components/ShareDreamSection.tsx`
- `apps/web/src/components/CookieConsent/CookieConsent.tsx`
- `apps/web/src/components/CookieConsent/consentUtils.ts`
- `apps/web/src/components/Sections/WaitlistSection/index.tsx`
- `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts`

### Event Emitters (SectionEventBus)
- `apps/web/src/components/Sections/ProductCarousel/variants/ProductCarouselDefault/ProductCarouselDefault.tsx`
- `apps/web/src/lib/monitoring/performance/usePerformanceMonitor.ts`
- `apps/web/src/lib/errors/SectionErrorBoundary.tsx`

### Event Consumers
- `apps/web/src/lib/errors/ErrorReportingService.ts`

### Test Files
- `apps/web/src/lib/errors/__tests__/ErrorReportingService.test.ts`
- `apps/web/src/components/CookieConsent/__tests__/CookieConsent.test.ts`
- `apps/web/src/components/WaitingList/hooks/__tests__/useWaitlistForm.test.ts`
- `apps/web/src/app/api/waitlist/__tests__/signup.test.ts`
