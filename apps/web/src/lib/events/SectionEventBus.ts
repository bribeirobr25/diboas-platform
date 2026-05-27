/**
 * Section Event Bus
 *
 * Event-Driven Architecture: Section-scoped events (carousel, CTA, errors, a11y).
 * DRY: Extends generic EventBus base class for shared subscribe/emit/history logic.
 */

import { EventBus } from './EventBus';

// Event types following Domain-Driven Design
export enum SectionEventType {
  CAROUSEL_SLIDE_CHANGED = 'carousel:slideChanged',
  CAROUSEL_USER_INTERACTION = 'carousel:userInteraction',
  SECTION_ERROR = 'section:error',
  SECTION_PERFORMANCE_METRIC = 'section:performanceMetric',
  CTA_CLICKED = 'cta:clicked',
  KEYBOARD_NAVIGATION = 'accessibility:keyboardNavigation',
}

// Event payload interfaces
export interface SectionEventPayload {
  sectionId: string;
  sectionType: string;
  timestamp: number;
  eventId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CarouselEventPayload extends SectionEventPayload {
  slideIndex: number;
  totalSlides: number;
  autoPlay: boolean;
  userInitiated: boolean;
}

export interface PerformanceEventPayload extends SectionEventPayload {
  metric: string;
  value: number;
  unit: string;
}

export interface CTAEventPayload extends SectionEventPayload {
  ctaLabel: string;
  ctaUrl: string;
  position: string;
}

export interface ErrorEventPayload extends SectionEventPayload {
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

// Union type for all event payloads
export type EventPayload =
  | SectionEventPayload
  | CarouselEventPayload
  | PerformanceEventPayload
  | CTAEventPayload
  | ErrorEventPayload;

// Event listener function type
export type EventListener<T extends EventPayload = EventPayload> = (
  payload: T
) => void | Promise<void>;

// Event validation schema
const SECTION_VALIDATION_SCHEMA: Partial<Record<SectionEventType, string[]>> = {
  [SectionEventType.CAROUSEL_SLIDE_CHANGED]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.CAROUSEL_USER_INTERACTION]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.SECTION_PERFORMANCE_METRIC]: ['sectionId', 'metric', 'value', 'unit'],
  [SectionEventType.CTA_CLICKED]: ['sectionId', 'ctaLabel', 'ctaUrl'],
  [SectionEventType.SECTION_ERROR]: ['sectionId', 'error', 'severity'],
  [SectionEventType.KEYBOARD_NAVIGATION]: ['sectionId'],
};

/**
 * Section Event Bus — wraps generic EventBus with section-specific config.
 *
 * Delegates on/emit/getEventHistory/getListenerCount/removeAllListeners to base.
 */
export class SectionEventBus extends EventBus<SectionEventType, EventPayload> {
  constructor() {
    super(
      {
        name: 'SectionEventBus',
        maxHistorySize: 1000,
        slowEventThresholdMs: 10,
        requiredFields: ['sectionId', 'sectionType'],
        rethrowErrors: true,
        clearHistoryOnRemoveAll: true,
      },
      SECTION_VALIDATION_SCHEMA,
      // On listener error: emit SECTION_ERROR (avoiding infinite loop)
      (eventType, payload, error) => {
        if (eventType !== SectionEventType.SECTION_ERROR) {
          this.emit(SectionEventType.SECTION_ERROR, {
            sectionId: payload.sectionId ?? 'eventBus',
            sectionType: 'eventBus',
            timestamp: Date.now(),
            error: error as Error,
            severity: 'medium',
            recoverable: true,
          } as ErrorEventPayload);
        }
      }
    );
  }
}

// Singleton instance
export const sectionEventBus = new SectionEventBus();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & { sectionEventBus?: SectionEventBus }).sectionEventBus = sectionEventBus;
  }
}
