/**
 * Events Module - Public API
 *
 * Event-Driven Architecture: Centralized event system exports
 */

// Generic Event Bus base class
export { EventBus, type BaseEventPayload, type EventBusConfig } from './EventBus';

// Section Event Bus (UI/Section events)
export {
  SectionEventBus,
  sectionEventBus,
  SectionEventType,
  type SectionEventPayload,
  type CarouselEventPayload,
  type PerformanceEventPayload,
  type CTAEventPayload,
  type ErrorEventPayload,
  type EventPayload,
  type EventListener
} from './SectionEventBus';

// Event Subscribers
export { registerEventSubscribers } from './eventSubscribers';

// Application Event Bus (Service/Domain events)
export {
  ApplicationEventBus,
  applicationEventBus,
  ApplicationEventType,
  type ApplicationEventPayload,
  type WaitlistSignupEventPayload,
  type WaitlistDeletionEventPayload,
  type ShareEventPayload,
  type ConsentEventPayload,
  type ApplicationErrorEventPayload,
  type AppEventPayload,
  type AppEventListener
} from './ApplicationEventBus';
