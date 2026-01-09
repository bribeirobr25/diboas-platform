/**
 * Events Module - Public API
 *
 * Event-Driven Architecture: Centralized event system exports
 */

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

// Application Event Bus (Service/Domain events)
export {
  ApplicationEventBus,
  applicationEventBus,
  ApplicationEventType,
  type ApplicationEventPayload,
  type WaitlistSignupEventPayload,
  type WaitlistDeletionEventPayload,
  type WaitlistReferralEventPayload,
  type ShareEventPayload,
  type DreamModeEventPayload,
  type ApplicationErrorEventPayload,
  type AppEventPayload,
  type AppEventListener
} from './ApplicationEventBus';
