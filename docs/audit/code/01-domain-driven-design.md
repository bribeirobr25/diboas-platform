# Principle 1: Domain-Driven Design -- Audit Report

**Date:** 2026-02-22
**Auditor:** Claude Code
**Status:** Overall: Partial

## Principle Requirements

From `docs/coding-standards.md`, Principle 1 (Domain-Driven Design):

1. Organize code around business domains (Banking, Investing, DeFi)
2. Each domain is self-contained with clear boundaries
3. Domain services don't directly call other domains
4. Use events for cross-domain communication

From Principle 2 (Event-Driven Architecture), which directly supports DDD:

5. All significant state changes emit events
6. Events include: `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`
7. Event naming: `[Domain][Entity][Action]Event`

## Identified Domains

The codebase currently has 14 logical domains under `apps/web/src/lib/`:

| Domain | Directory | Has `domain/` layer | Has `services/` layer | Has own types |
|--------|-----------|--------------------|-----------------------|---------------|
| WaitingList | `waitingList/` | Yes | Yes | Yes |
| Performance | `performance/` | Yes | Yes | Yes (in domain) |
| SEO | `seo/` | Yes | Yes | Yes (in domain) |
| Analytics | `analytics/` | No | Yes (flat) | Yes |
| Monitoring | `monitoring/` | No | Yes (flat) | Yes |
| Share | `share/` | No | No (ShareManager) | Yes |
| DreamMode | `dream-mode/` | No | No | Yes |
| Content | `content/` | No | Yes (flat) | Yes |
| Theme | `theme/` | No | No | Yes |
| Security | `security/` | No | No | Yes (implicit) |
| Calculator | `calculator/` | No | No | Yes |
| PreDemo | `pre-demo/` | No | No | Yes |
| PreDream | `pre-dream/` | No | No | Yes |
| Errors | `errors/` | No | Yes (flat) | Yes |

## Findings

### 1.1 Code Organized Around Business Domains

**Status:** Compliant

**Evidence:** Each domain has its own top-level directory under `apps/web/src/lib/`:

- `apps/web/src/lib/waitingList/` -- WaitingList domain
- `apps/web/src/lib/analytics/` -- Analytics domain
- `apps/web/src/lib/monitoring/` -- Monitoring domain
- `apps/web/src/lib/performance/` -- Performance domain
- `apps/web/src/lib/seo/` -- SEO domain
- `apps/web/src/lib/share/` -- Share domain
- `apps/web/src/lib/dream-mode/` -- DreamMode domain
- `apps/web/src/lib/content/` -- Content domain
- `apps/web/src/lib/theme/` -- Theme domain
- `apps/web/src/lib/security/` -- Security domain
- `apps/web/src/lib/calculator/` -- Calculator domain
- `apps/web/src/lib/pre-demo/` -- PreDemo domain
- `apps/web/src/lib/pre-dream/` -- PreDream domain
- `apps/web/src/lib/errors/` -- Error handling domain
- `apps/web/src/lib/events/` -- Shared events infrastructure

All domains are in separate directories, each with their own types, constants, and barrel exports (`index.ts`). The organization is clear and consistent.

**Note:** The coding standard references future Banking/Investing/DeFi domains. These are N/A at the pre-launch phase; the current domains (WaitingList, Analytics, Share, etc.) are the appropriate domains for this phase.

---

### 1.2 Domains Are Self-Contained with Clear Boundaries

**Status:** Partial

**Evidence:**

**Tier 1 -- Full DDD Structure (3 domains):**

These domains have formal `domain/`, `services/`, and types layers:

- **WaitingList** (`apps/web/src/lib/waitingList/`): Has `domain/WaitingListDomain.ts` (entities, value objects, domain service interface, repository interface, domain events, domain errors), `services/WaitingListService.ts` (implementation), `helpers.ts`, `constants.ts`, `types.ts` (presentation types), `store.ts` (persistence), `__tests__/`. This is the reference implementation.
- **Performance** (`apps/web/src/lib/performance/`): Has `domain/PerformanceDomain.ts` (entities, value objects, domain service interface, domain events, domain errors), `services/PerformanceService.ts` (implementation with factory pattern).
- **SEO** (`apps/web/src/lib/seo/`): Has `domain/SEODomain.ts` (entities, value objects, domain service interface, domain events, domain errors), `services/SEOService.ts` (implementation with factory pattern).

**Tier 2 -- Partial DDD Structure (5 domains):**

These domains have types and services but lack formal `domain/` layers:

- **Analytics** (`apps/web/src/lib/analytics/`): Has `types.ts` with `AnalyticsService` interface and event types, `service.ts` implementation, `constants.ts`. Missing formal domain layer file.
- **Monitoring** (`apps/web/src/lib/monitoring/`): Has `types.ts` with `MonitoringService` interface, `service.ts` implementation. Missing formal domain layer.
- **Content** (`apps/web/src/lib/content/`): Has `types.ts` with `ContentService` interface. Missing formal domain layer.
- **Share** (`apps/web/src/lib/share/`): Has `types.ts` with comprehensive type definitions, `ShareManager.ts` as the main service. Missing formal domain layer and service interface abstraction.
- **Errors** (`apps/web/src/lib/errors/`): Has `types.ts`, `errorTypes.ts`, `ErrorReportingService.ts`. Functional but missing formal domain layer.

**Tier 3 -- Minimal Structure (6 domains):**

These domains have types and utility functions but no service interfaces or domain layers:

- **DreamMode** (`apps/web/src/lib/dream-mode/`): Has `types.ts`, `calculations.ts`, `constants.ts`. Pure calculation domain, no service interface.
- **Theme** (`apps/web/src/lib/theme/`): Has `themeTypes.ts`, `theme-manager.ts`, `themeUtils.ts`. No domain layer.
- **Security** (`apps/web/src/lib/security/`): Has standalone utilities (`cookies.ts`, `csrf.ts`, `encryption.ts`, `rateLimiter.ts`). No unified domain model or service interface.
- **Calculator** (`apps/web/src/lib/calculator/`): Has `types.ts`, `calculations.ts`, `constants.ts`. Pure calculation domain.
- **PreDemo** (`apps/web/src/lib/pre-demo/`): Has `types.ts`, `calculations.ts`, `constants.ts`, `format.ts`. Good type modeling but no domain or service layers.
- **PreDream** (`apps/web/src/lib/pre-dream/`): Has `types.ts`, `calculations.ts`, `constants.ts`, `format.ts`. Same as PreDemo.

**Gaps:**

- 11 out of 14 domains lack a formal `domain/` directory with domain model definitions (entities, value objects, domain service interfaces, repository interfaces, domain events, domain errors).
- Only WaitingList has a repository interface, which is the gold standard for service-agnostic persistence.
- Only WaitingList, Performance, and SEO have formal domain service interfaces that can be swapped.

---

### 1.3 Domain Services Don't Directly Call Other Domains

**Status:** Compliant (with minor observations)

**Evidence:**

Verified that no domain service imports from another domain's core logic:

- No domain under `lib/` imports types or services from another domain directly (e.g., `waitingList` does not import from `share`, `dream-mode` does not import from `waitingList`, etc.).
- Confirmed zero results for `from '@/lib/waitingList` inside other `lib/` domains.
- Confirmed zero results for `from '@/lib/share` inside other `lib/` domains.
- Confirmed zero results for `from '@/lib/dream-mode` inside other `lib/` domains.

**Allowed cross-cutting imports (infrastructure, not domain):**

The following imports exist and are acceptable as they represent shared infrastructure services, not domain-to-domain coupling:

- `Logger` from `@/lib/monitoring/Logger` -- Used by: analytics, performance, seo, content, security, theme, events. This is a cross-cutting concern (logging infrastructure), not a domain coupling violation.
- `errorReportingService` from `@/lib/errors/ErrorReportingService` -- Used by: monitoring, waitingList. This is a cross-cutting concern (error infrastructure).
- `applicationEventBus` from `@/lib/events/ApplicationEventBus` -- Used by: waitingList, share, dream-mode. This is the intended event bus for cross-domain communication.
- `analyticsService` from `@/lib/analytics` -- Used by: events (ApplicationEventBus, SectionEventBus). This is borderline; the event bus itself integrates analytics, which could be considered tight coupling.

**Observations:**

1. The `ApplicationEventBus` (`apps/web/src/lib/events/ApplicationEventBus.ts`) directly imports `analyticsService` from `@/lib/analytics` (line 12). This creates a compile-time dependency from the events infrastructure to the analytics domain. Ideally, analytics tracking should be a listener on the event bus, not hardwired into the bus itself.
2. The `SectionEventBus` (`apps/web/src/lib/events/SectionEventBus.ts`) also directly imports `analyticsService` (line 14). Same concern.
3. `monitoring/constants.ts` imports `ANALYTICS_CONSTANTS` from `@/lib/analytics/constants` (line 11) to share a `MAX_QUEUE_SIZE` value. This creates a dependency from monitoring to analytics configuration.

---

### 1.4 Cross-Domain Communication Uses Events

**Status:** Compliant

**Evidence:**

The codebase has two well-implemented event buses:

1. **`ApplicationEventBus`** (`apps/web/src/lib/events/ApplicationEventBus.ts`): Handles domain/service-level events for cross-domain communication.
   - 33 event types covering: Waitlist (7), Share (4), DreamMode (6), Consent (3), Webhook (3), PreDemo (4), PreDream (3), General (2)
   - Strongly-typed payloads for each domain: `WaitlistSignupEventPayload`, `ShareEventPayload`, `DreamModeEventPayload`, `ConsentEventPayload`, `WebhookEventPayload`
   - Event validation schema for all event types
   - Audit trail with 500-event history
   - Error isolation (failed listeners don't cascade)
   - Singleton pattern with development debugging

2. **`SectionEventBus`** (`apps/web/src/lib/events/SectionEventBus.ts`): Handles UI/section-level events.
   - 10 event types covering: Carousel (4), Section lifecycle (3), User interaction (2), Accessibility (2)
   - Strongly-typed payloads: `CarouselEventPayload`, `PerformanceEventPayload`, `CTAEventPayload`, `ErrorEventPayload`
   - Same architecture as ApplicationEventBus (validation, history, error isolation)

**Domains emitting events via ApplicationEventBus:**

- **WaitingList**: Emits `WAITLIST_SIGNUP_COMPLETED`, `WAITLIST_SIGNUP_FAILED` in `WaitingListService.ts`
- **Share**: Emits `SHARE_INITIATED`, `SHARE_COMPLETED`, `SHARE_FAILED`, `SHARE_CANCELLED`, `FEATURE_USED` in `ShareManager.ts`
- **DreamMode**: Emits `DREAM_MODE_CALCULATION_COMPLETED` in `calculations.ts`

---

### 1.5 Domain Events Emit on All Significant State Changes

**Status:** Partial

**Evidence:**

Events are emitted for the most important state changes:

- Waitlist signup success/failure: Covered
- Share initiation/completion/failure/cancellation: Covered
- DreamMode calculation completion: Covered

**Gaps:**

- **PreDemo** domain does not emit events from its `lib/` layer. Events are emitted in components (`PreDemoProvider.tsx`) instead of the domain service. The `PRE_DEMO_STARTED`, `PRE_DEMO_DEPOSIT_COMPLETED`, etc. events exist in the ApplicationEventType enum but are only emitted from the presentation layer.
- **PreDream** domain does not emit events from its `lib/` layer. Same pattern as PreDemo.
- **Theme** domain does not emit any events when themes change.
- **Content** domain does not emit events when content is loaded or updated.
- **Calculator** domain does not emit events on calculation completion.
- **Security** domain does not emit domain events (CSP violations are tracked via MonitoringService, not the event bus).

---

### 1.6 Event Structure Matches Specification

**Status:** Non-compliant

**Evidence:**

The coding standard (Principle 2) specifies that events must include:
- `eventId`
- `eventType`
- `timestamp`
- `correlationId`
- `domain`
- `payload`
- `metadata`

Searching the codebase for `eventId` and `correlationId` returned zero results.

**What exists:**

The `ApplicationEventPayload` base interface includes:
```typescript
interface ApplicationEventPayload {
  timestamp: number;
  source: string;        // maps loosely to "domain"
  metadata?: Record<string, unknown>;
}
```

The domain-specific event interfaces (`WaitingListEvent`, `PerformanceEvent`, `SEOEvent`) have:
```typescript
interface WaitingListEvent {
  readonly type: WaitingListEventType;
  readonly timestamp: Date;
  readonly data: Record<string, unknown>;
}
```

**Missing fields:**

| Required Field | Status | Notes |
|---------------|--------|-------|
| `eventId` | Missing | No unique event identifier for deduplication or audit trail lookup |
| `eventType` | Present | As `type` in domain events, as enum in ApplicationEventBus |
| `timestamp` | Present | In all event payloads |
| `correlationId` | Missing | No request/flow correlation. Critical for tracing multi-step flows (e.g., waitlist signup -> referral -> position update) |
| `domain` | Partial | Present as `source` field in ApplicationEventPayload, but not in domain-level events |
| `payload` | Present | As `data` in domain events, as typed fields in ApplicationEventBus payloads |
| `metadata` | Partial | Present as optional `metadata` in ApplicationEventPayload, not in domain events |

**Event naming convention:**

The standard specifies `[Domain][Entity][Action]Event` (e.g., `BankingTransactionCompletedEvent`). The actual naming uses `domain:action` format (e.g., `waitlist:signupCompleted`, `share:initiated`). While this is a reasonable convention, it differs from the specification.

---

### 1.7 Component-Domain Boundary Alignment

**Status:** Compliant

**Evidence:**

Components are organized to align with domain boundaries:

- `components/WaitingList/` -- Imports only from `lib/waitingList`, `lib/analytics`, `lib/events`
- `components/DreamMode/` -- Imports only from `lib/dream-mode`, `lib/calculator`, `lib/analytics`
- `components/Share/` -- Imports only from `lib/share`, `lib/analytics`
- `components/PreDemo/` -- Imports only from `lib/pre-demo`, `lib/analytics`
- `components/PreDream/` -- Imports only from `lib/pre-dream`, `lib/analytics`, `lib/share`
- `components/Performance/` -- Imports only from `lib/performance`, `lib/monitoring`

Components do not bypass domain boundaries. They import from the corresponding `lib/` domain and cross-cutting infrastructure (analytics, monitoring, events) only.

**Note:** Components frequently import `analyticsService` directly from `@/lib/analytics`. This is acceptable for tracking user interactions at the presentation layer, though it could be more consistent if done exclusively through the event bus.

---

### 1.8 WaitingList Domain as Reference Implementation

**Status:** Compliant

**Evidence:** The WaitingList domain (`apps/web/src/lib/waitingList/`) demonstrates exemplary DDD practices:

**Domain Layer** (`domain/WaitingListDomain.ts`):
- Entities: `WaitingListSubmission`, `WaitlistPosition`, `ReferralInfo`, `KitSubscriber`
- Value Objects: `ConsentRecord`, `SubmissionInput`, `SubmissionResult`, `ValidationResult`, `ValidationError`
- Domain Service Interface: `WaitingListDomainService` (4 methods)
- Repository Interface: `WaitingListRepository` (8 methods, easily swappable)
- Kit API Service Interface: `KitApiService` (5 methods, provider-agnostic)
- Domain Events: `WaitingListEvent` with 9 event types
- Domain Errors: Hierarchy of 4 error classes (`WaitingListDomainError` > `ValidationError`, `SubmissionError`, `DuplicateError`, `StorageError`)
- Configuration Interface: `WaitingListConfiguration`

**Service Layer** (`services/WaitingListService.ts`):
- Implements `WaitingListDomainService` interface
- Uses constructor injection for `WaitingListRepository` (dependency inversion)
- LocalStorage repository implementation as a concrete provider (swappable to API)
- Emits domain events via `applicationEventBus`
- Reports errors via `errorReportingService`

**Supporting Files:**
- `helpers.ts` -- Pure utility functions (validation, formatting, referral management)
- `constants.ts` -- Centralized configuration values
- `types.ts` -- Re-exports domain types + presentation-layer types
- `store.ts` -- Server-side persistence with encrypted PII
- `index.ts` -- Clean barrel exports
- `__tests__/store.test.ts` -- Test coverage

This is a well-structured bounded context that other domains should follow.

## Summary

The diBoaS platform demonstrates strong domain organization at the directory/boundary level. Code is cleanly separated into domain directories, and there are no direct cross-domain service calls. The event-driven architecture is well-implemented with two event buses (ApplicationEventBus and SectionEventBus) supporting 43 total event types with typed payloads, validation, and audit trails.

However, significant gaps remain:

1. **Inconsistent domain layering**: Only 3 of 14 domains (WaitingList, Performance, SEO) have formal `domain/` layers with entities, value objects, service interfaces, and domain errors. The remaining 11 domains have varying levels of structure.
2. **Missing event fields**: The `eventId` and `correlationId` fields required by the coding standard are completely absent from all event implementations. This limits audit trail granularity and cross-flow tracing.
3. **Event emission gaps**: Several domains (PreDemo, PreDream, Theme, Content, Calculator, Security) do not emit domain events from their `lib/` layers. Some emit events only from the component/presentation layer.
4. **Event bus coupling**: The ApplicationEventBus and SectionEventBus directly import `analyticsService`, creating a compile-time dependency from infrastructure to a domain.

## Action Items

1. **[High] Add `eventId` and `correlationId` to event payloads**
   - File: `apps/web/src/lib/events/ApplicationEventBus.ts` -- Add `eventId: string` (UUID) and `correlationId?: string` to `ApplicationEventPayload`
   - File: `apps/web/src/lib/events/SectionEventBus.ts` -- Add `eventId: string` to `SectionEventPayload`
   - Auto-generate `eventId` in `emit()` if not provided
   - Pass `correlationId` through multi-step flows (e.g., waitlist signup -> referral processing)

2. **[High] Decouple event bus from analytics domain**
   - File: `apps/web/src/lib/events/ApplicationEventBus.ts` -- Remove direct import of `analyticsService` (line 12). Instead, register analytics as an event listener during application initialization.
   - File: `apps/web/src/lib/events/SectionEventBus.ts` -- Same change (line 14).
   - This removes the analytics domain from being a compile-time dependency of the events infrastructure.

3. **[Medium] Remove cross-domain constant import in monitoring**
   - File: `apps/web/src/lib/monitoring/constants.ts` -- Remove `import { ANALYTICS_CONSTANTS } from '@/lib/analytics/constants'` (line 11). Define `MAX_QUEUE_SIZE` locally or extract to shared `lib/constants/`.

4. **[Medium] Add formal `domain/` layers to Tier 2 domains**
   - Create `apps/web/src/lib/analytics/domain/AnalyticsDomain.ts` -- Extract `AnalyticsService` interface and `AnalyticsEvent` types
   - Create `apps/web/src/lib/share/domain/ShareDomain.ts` -- Extract entities, service interface, domain events
   - Create `apps/web/src/lib/monitoring/domain/MonitoringDomain.ts` -- Extract `MonitoringService` interface, entities, domain errors
   - Create `apps/web/src/lib/content/domain/ContentDomain.ts` -- Extract `ContentService` interface, entities
   - Create `apps/web/src/lib/errors/domain/ErrorDomain.ts` -- Extract error reporting interface, types

5. **[Low] Emit domain events from PreDemo and PreDream `lib/` layers**
   - File: `apps/web/src/lib/pre-demo/calculations.ts` -- Emit events for deposit/send/buy calculations (currently only emitted in components)
   - File: `apps/web/src/lib/pre-dream/calculations.ts` -- Emit events for dream result calculations

6. **[Low] Add domain layers to Tier 3 domains (post-launch)**
   - These are pure calculation/utility domains (Calculator, DreamMode, PreDemo, PreDream) and infrastructure domains (Theme, Security). Formal domain layers are less critical here but would improve consistency.
   - Prioritize Security domain formalization as it will grow significantly post-launch.

7. **[Low] Standardize event naming convention**
   - Current: `waitlist:signupCompleted` (colon-separated, camelCase)
   - Standard: `[Domain][Entity][Action]Event` (PascalCase)
   - This is a cosmetic change with breaking impact. Consider documenting the current convention as the accepted pattern for this project.
