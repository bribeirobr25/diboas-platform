# Analytics Integration Guide

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

| File | Purpose |
|------|---------|
| `src/lib/analytics/service.ts` | Main analytics service implementation |
| `src/lib/analytics/types.ts` | TypeScript interfaces for analytics |
| `src/lib/events/ApplicationEventBus.ts` | Server-side event bus for audit/monitoring |
| `src/lib/*/constants.ts` | Event name constants by feature |

---

## Event Naming Conventions

### Format

Events follow a `{feature}_{action}` naming pattern:

```
{feature_area}_{specific_action}
```

**Examples:**
- `dream_mode_started`
- `waitlist_form_submitted`
- `calculator_input_changed`
- `share_card_generated`

### Rules

1. **Lowercase with underscores** - All event names use `snake_case`
2. **Feature prefix** - Start with the feature area (`dream_`, `waitlist_`, `calculator_`, `share_`)
3. **Action suffix** - End with the action performed (`_started`, `_completed`, `_clicked`, `_changed`)
4. **Past tense for completed actions** - Use `submitted`, `completed`, `clicked` (not `submit`, `complete`, `click`)

### Common Action Suffixes

| Suffix | When to Use |
|--------|-------------|
| `_started` | User initiates a flow or process |
| `_completed` | User successfully finishes a flow |
| `_failed` | An error occurred |
| `_cancelled` | User explicitly cancelled an action |
| `_clicked` | User clicked a button/link |
| `_changed` | User modified an input value |
| `_viewed` | User viewed a screen/section |
| `_copied` | User copied content to clipboard |
| `_shared` | User shared content to a platform |
| `_downloaded` | User downloaded a file/image |

---

## All Tracked Events

### Dream Mode Events

| Event Name | Constant | Description |
|------------|----------|-------------|
| `dream_mode_started` | `DREAM_MODE_EVENTS.STARTED` | User enters Dream Mode |
| `dream_mode_screen_view` | - | User views a Dream Mode screen |
| `dream_disclaimer_accepted` | `DREAM_MODE_EVENTS.DISCLAIMER_ACCEPTED` | User accepts CLO disclaimer |
| `dream_path_selected` | `DREAM_MODE_EVENTS.PATH_SELECTED` | User selects investment path |
| `dream_amount_set` | `DREAM_MODE_EVENTS.AMOUNT_SET` | User sets investment amount |
| `dream_timeframe_changed` | `DREAM_MODE_EVENTS.TIMEFRAME_CHANGED` | User changes timeframe |
| `dream_simulation_started` | `DREAM_MODE_EVENTS.SIMULATION_STARTED` | Simulation begins |
| `dream_mode_simulation_started` | - | Alternative simulation start event |
| `dream_simulation_completed` | `DREAM_MODE_EVENTS.SIMULATION_COMPLETED` | Simulation completes |
| `dream_mode_share` | - | User initiates share from Dream Mode |
| `dream_mode_try_again` | - | User clicks "Try Again" |
| `dream_mode_completed` | `DREAM_MODE_EVENTS.COMPLETED` | User completes entire flow |

### Waitlist Events

| Event Name | Constant | Description |
|------------|----------|-------------|
| `waiting_list_modal_opened` | `WAITING_LIST_EVENTS.MODAL_OPENED` | Waitlist modal opens |
| `waiting_list_modal_closed` | `WAITING_LIST_EVENTS.MODAL_CLOSED` | Waitlist modal closes |
| `waiting_list_form_submitted` | `WAITING_LIST_EVENTS.FORM_SUBMITTED` | Form submission started |
| `waiting_list_submission_success` | `WAITING_LIST_EVENTS.SUBMISSION_SUCCESS` | Signup successful |
| `waiting_list_submission_failure` | `WAITING_LIST_EVENTS.SUBMISSION_FAILURE` | Signup failed |
| `waiting_list_signup_success` | - | Alternative success event |
| `waiting_list_signup_error` | - | Signup error occurred |
| `waitlist_referral_link_copied` | `WAITING_LIST_EVENTS.REFERRAL_LINK_COPIED` | User copies referral link |
| `waitlist_referral_link_shared` | `WAITING_LIST_EVENTS.REFERRAL_LINK_SHARED` | User shares referral link |
| `waitlist_share_modal_opened` | `WAITING_LIST_EVENTS.SHARE_MODAL_OPENED` | Share modal opens |

### Share Events

| Event Name | Constant | Description |
|------------|----------|-------------|
| `share_card_generated` | `SHARE_EVENTS.CARD_GENERATED` | Share card image generated |
| `share_initiated` | `SHARE_EVENTS.SHARE_INITIATED` | User initiates share action |
| `share_completed` | `SHARE_EVENTS.SHARE_COMPLETED` | Share completed successfully |
| `share_failed` | `SHARE_EVENTS.SHARE_FAILED` | Share action failed |
| `share_cancelled` | `SHARE_EVENTS.SHARE_CANCELLED` | User cancelled share |
| `share_link_copied` | `SHARE_EVENTS.LINK_COPIED` | Link copied to clipboard |
| `share_image_downloaded` | `SHARE_EVENTS.IMAGE_DOWNLOADED` | Image downloaded |

### Calculator Events

| Event Name | Constant | Description |
|------------|----------|-------------|
| `calculator_opened` | `CALCULATOR_EVENTS.CALCULATOR_OPENED` | Calculator component loads |
| `calculator_input_changed` | `CALCULATOR_EVENTS.INPUT_CHANGED` | User changes input value |
| `calculator_timeframe_changed` | `CALCULATOR_EVENTS.TIMEFRAME_CHANGED` | User changes timeframe |
| `calculator_share_result` | `CALCULATOR_EVENTS.SHARE_RESULT` | User shares calculator result |
| `calculator_cta_clicked` | `CALCULATOR_EVENTS.CTA_CLICKED` | User clicks CTA button |

### Navigation & System Events

| Event Name | Description |
|------------|-------------|
| `page_view` | User views a page |
| `page_performance` | Web Vitals metric recorded |
| `navigation_interaction` | User interacts with navigation |
| `navigation_error` | Navigation error occurred |
| `section_interaction` | User interacts with a page section |

---

## Event Details by Category

### Dream Mode Events

#### `dream_mode_started`
```typescript
analyticsService.track({
  name: 'dream_mode_started',
  parameters: { source: 'component' }
});
```

#### `dream_mode_screen_view`
```typescript
analyticsService.track({
  name: 'dream_mode_screen_view',
  parameters: { screen: 'disclaimer' | 'welcome' | 'pathSelect' | 'input' | 'timeframe' | 'simulation' | 'results' | 'share' }
});
```

#### `dream_disclaimer_accepted`
```typescript
analyticsService.track({
  name: DREAM_MODE_EVENTS.DISCLAIMER_ACCEPTED,
  parameters: { timestamp: new Date().toISOString() }
});
```

#### `dream_path_selected`
```typescript
analyticsService.track({
  name: DREAM_MODE_EVENTS.PATH_SELECTED,
  parameters: { path: 'safety' | 'balance' | 'growth' }
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
    pathApy: number
  }
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
    timeframe: string
  }
});
```

### Waitlist Events

#### `waiting_list_form_submitted`
```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.FORM_SUBMITTED,
  parameters: {
    locale: string,
    timestamp: number
  }
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
    timestamp: number
  }
});
```

#### `waitlist_referral_link_copied`
```typescript
analyticsService.track({
  name: WAITING_LIST_EVENTS.REFERRAL_LINK_COPIED,
  parameters: {
    referralCode: string,
    locale: string,
    timestamp: number
  }
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
    timestamp: number
  }
});
```

### Share Events

#### `share_card_generated`
```typescript
analyticsService.track({
  name: SHARE_EVENTS.CARD_GENERATED,
  parameters: {
    cardType: 'dream' | 'waitlist',
    locale: string
  }
});
```

#### `share_completed`
```typescript
analyticsService.track({
  name: SHARE_EVENTS.SHARE_COMPLETED,
  parameters: {
    platform: string,
    cardType: string,
    locale: string
  }
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
    locale: string
  }
});
```

#### `calculator_timeframe_changed`
```typescript
analyticsService.track({
  name: CALCULATOR_EVENTS.TIMEFRAME_CHANGED,
  parameters: {
    timeframe: '5years' | '10years' | '20years',
    locale: string
  }
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
    locale: string
  }
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
  }
});
```

### Step 3: Add ApplicationEventBus Event (Optional)

For audit logging and server-side tracking:

```typescript
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

// 1. First, add the event type to ApplicationEventType enum if needed
// src/lib/events/ApplicationEventBus.ts

// 2. Emit the event
applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
  source: 'my-feature',
  timestamp: Date.now(),
  metadata: {
    feature: 'my_feature_action',
    // ... additional data
  }
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

| Report | Path | Purpose |
|--------|------|---------|
| Real-time | Reports > Real-time | Live user activity |
| Events | Reports > Engagement > Events | All event counts |
| Conversions | Reports > Engagement > Conversions | Conversion funnel |
| User Explorer | Explore > User Explorer | Individual user journeys |

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

| Feature | Constants File | Import |
|---------|---------------|--------|
| Dream Mode | `src/lib/dream-mode/constants.ts` | `DREAM_MODE_EVENTS` |
| Waitlist | `src/lib/waitingList/constants.ts` | `WAITING_LIST_EVENTS` |
| Share | `src/lib/share/constants.ts` | `SHARE_EVENTS` |
| Calculator | `src/lib/calculator/constants.ts` | `CALCULATOR_EVENTS` |

---

*Last updated: January 2026*
