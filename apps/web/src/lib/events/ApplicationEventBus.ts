/**
 * Application Event Bus
 *
 * Event-Driven Architecture: Application/service-level domain events.
 * DRY: Extends generic EventBus base class for shared subscribe/emit/history logic.
 * Types & validation schema imported from applicationEventTypes.ts.
 */

import { EventBus } from './EventBus';
import {
  ApplicationEventType,
  EVENT_VALIDATION_SCHEMA,
  type AppEventPayload,
  type ApplicationErrorEventPayload,
} from './applicationEventTypes';

// Re-export everything from applicationEventTypes for backward-compatible imports
export {
  ApplicationEventType,
  EVENT_VALIDATION_SCHEMA,
  type ApplicationEventPayload,
  type WaitlistSignupEventPayload,
  type WaitlistDeletionEventPayload,
  type ShareEventPayload,
  type ConsentEventPayload,
  type ApplicationErrorEventPayload,
  type AppEventPayload,
  type AppEventListener,
} from './applicationEventTypes';

/**
 * Application Event Bus — wraps generic EventBus with application-specific config.
 *
 * Delegates on/emit/getEventHistory/getListenerCount/removeAllListeners to base.
 */
export class ApplicationEventBus extends EventBus<ApplicationEventType, AppEventPayload> {
  constructor() {
    super(
      {
        name: 'ApplicationEventBus',
        maxHistorySize: 500,
        slowEventThresholdMs: 50,
        requiredFields: ['source'],
        rethrowErrors: false,
        clearHistoryOnRemoveAll: false,
      },
      EVENT_VALIDATION_SCHEMA,
      // On listener error: emit APPLICATION_ERROR (avoiding infinite loop)
      (eventType, payload, error) => {
        if (eventType !== ApplicationEventType.APPLICATION_ERROR) {
          this.emit(ApplicationEventType.APPLICATION_ERROR, {
            source: payload.source ?? 'eventBus',
            timestamp: Date.now(),
            error: error as Error,
            severity: 'medium',
            context: { eventType },
          } as unknown as ApplicationErrorEventPayload);
        }
      },
    );
  }
}

// Singleton instance
export const applicationEventBus = new ApplicationEventBus();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & { applicationEventBus?: ApplicationEventBus }).applicationEventBus =
      applicationEventBus;
  }
}
