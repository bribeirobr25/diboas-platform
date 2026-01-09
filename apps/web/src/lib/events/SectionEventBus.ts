/**
 * Section Event Bus
 * 
 * Event-Driven Architecture: Centralized event system for section interactions
 * Domain-Driven Design: Section domain events with proper boundaries
 * Service Agnostic Abstraction: Platform-independent event system
 * Code Reusability & DRY: Shared event patterns across all sections
 * Error Handling & System Recovery: Event error handling and recovery
 * Monitoring & Observability: Event tracking and metrics
 * Security & Audit Standards: Event validation and audit trail
 * No Hard Coded Values: Event types from configuration
 */

import { analyticsService } from '@/lib/analytics';
import { Logger } from '@/lib/monitoring/Logger';

// Event types following Domain-Driven Design
export enum SectionEventType {
  // Navigation Events
  CAROUSEL_SLIDE_CHANGED = 'carousel:slideChanged',
  CAROUSEL_AUTO_PLAY_STARTED = 'carousel:autoPlayStarted',
  CAROUSEL_AUTO_PLAY_STOPPED = 'carousel:autoPlayStopped',
  CAROUSEL_USER_INTERACTION = 'carousel:userInteraction',
  
  // Performance Events
  SECTION_LOADED = 'section:loaded',
  SECTION_ERROR = 'section:error',
  SECTION_PERFORMANCE_METRIC = 'section:performanceMetric',
  
  // User Interaction Events
  CTA_CLICKED = 'cta:clicked',
  IMAGE_LOADED = 'image:loaded',
  IMAGE_ERROR = 'image:error',
  
  // Accessibility Events
  KEYBOARD_NAVIGATION = 'accessibility:keyboardNavigation',
  SCREEN_READER_ANNOUNCEMENT = 'accessibility:screenReaderAnnouncement'
}

// Event payload interfaces with strict typing
export interface SectionEventPayload {
  sectionId: string;
  sectionType: string;
  timestamp: number;
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
export type EventListener<T extends EventPayload = EventPayload> = (payload: T) => void | Promise<void>;

// Event validation schema
const EVENT_VALIDATION_SCHEMA = {
  [SectionEventType.CAROUSEL_SLIDE_CHANGED]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.CAROUSEL_AUTO_PLAY_STARTED]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.CAROUSEL_AUTO_PLAY_STOPPED]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.CAROUSEL_USER_INTERACTION]: ['sectionId', 'slideIndex', 'totalSlides'],
  [SectionEventType.SECTION_PERFORMANCE_METRIC]: ['sectionId', 'metric', 'value', 'unit'],
  [SectionEventType.CTA_CLICKED]: ['sectionId', 'ctaLabel', 'ctaUrl'],
  [SectionEventType.SECTION_ERROR]: ['sectionId', 'error', 'severity'],
  [SectionEventType.SECTION_LOADED]: ['sectionId'],
  [SectionEventType.IMAGE_LOADED]: ['sectionId'],
  [SectionEventType.IMAGE_ERROR]: ['sectionId'],
  [SectionEventType.KEYBOARD_NAVIGATION]: ['sectionId'],
  [SectionEventType.SCREEN_READER_ANNOUNCEMENT]: ['sectionId']
} as const;

/**
 * Centralized Event Bus for Section Domain
 * Event-Driven Architecture: Decoupled communication between sections
 * Error Handling: Comprehensive error handling for event processing
 * Monitoring: Event metrics and observability
 */
export class SectionEventBus {
  private listeners = new Map<SectionEventType, Set<EventListener>>();
  private eventHistory: Array<{ type: SectionEventType; payload: EventPayload; timestamp: number }> = [];
  private maxHistorySize = 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  /**
   * Subscribe to section events
   * Error Handling: Validates listener function
   * Monitoring: Tracks listener registrations
   */
  on<T extends EventPayload>(
    eventType: SectionEventType, 
    listener: EventListener<T>
  ): () => void {
    try {
      // Validate listener
      if (typeof listener !== 'function') {
        throw new Error(`Invalid listener for event ${eventType}: must be a function`);
      }

      // Initialize listener set if needed
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }

      // Add listener
      const listenersSet = this.listeners.get(eventType)!;
      listenersSet.add(listener as EventListener);

      // Debug logging
      if (this.isDebugMode) {
        Logger.debug('SectionEventBus: Listener registered', {
          eventType,
          listenerCount: listenersSet.size
        });
      }

      // Return unsubscribe function
      return () => {
        listenersSet.delete(listener as EventListener);
        if (listenersSet.size === 0) {
          this.listeners.delete(eventType);
        }
        
        if (this.isDebugMode) {
          Logger.debug('SectionEventBus: Listener unregistered', { eventType });
        }
      };

    } catch (error) {
      Logger.error('Failed to register event listener', { eventType, error });
      throw error;
    }
  }

  /**
   * Emit section events
   * Error Handling: Validates payload and handles listener errors
   * Security: Validates event payload structure
   * Monitoring: Tracks event emissions and performance
   */
  async emit<T extends EventPayload>(
    eventType: SectionEventType, 
    payload: T
  ): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate payload
      this.validateEventPayload(eventType, payload);

      // Add timestamp if not present
      const enrichedPayload = {
        ...payload,
        timestamp: payload.timestamp || Date.now()
      };

      // Store in history for debugging/monitoring
      this.addToHistory(eventType, enrichedPayload);

      // Get listeners
      const listeners = this.listeners.get(eventType);
      if (!listeners || listeners.size === 0) {
        if (this.isDebugMode) {
          Logger.debug('No listeners for event', { eventType });
        }
        return;
      }

      // Execute listeners with error isolation
      const listenerPromises = Array.from(listeners).map(async (listener) => {
        try {
          await listener(enrichedPayload);
        } catch (error) {
          // Isolate listener errors to prevent cascade failures
          Logger.error('Event listener error', {
            eventType,
            error,
            sectionId: payload.sectionId
          });

          // Emit error event for monitoring
          if (eventType !== SectionEventType.SECTION_ERROR) {
            this.emit(SectionEventType.SECTION_ERROR, {
              sectionId: payload.sectionId,
              sectionType: 'eventBus',
              timestamp: Date.now(),
              error: error as Error,
              severity: 'medium',
              recoverable: true
            });
          }
        }
      });

      // Wait for all listeners to complete
      await Promise.allSettled(listenerPromises);

      // Performance monitoring
      const duration = performance.now() - startTime;
      if (duration > 10) { // Log slow events
        Logger.warn('Slow event processing', {
          eventType,
          duration: `${duration.toFixed(2)}ms`,
          listenerCount: listeners.size
        });
      }

      // Analytics tracking for user interactions
      if (this.isUserInteractionEvent(eventType)) {
        analyticsService.track({
          name: 'section_interaction',
          parameters: {
            event_type: eventType,
            section_id: payload.sectionId,
            section_type: payload.sectionType
          }
        });
      }

    } catch (error) {
      Logger.error('Failed to emit event', { eventType, error });
      throw error;
    }
  }

  /**
   * Validate event payload structure
   * Security: Prevents malformed or malicious payloads
   * Error Handling: Validates required fields
   */
  private validateEventPayload(eventType: SectionEventType, payload: EventPayload): void {
    // Basic validation
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Invalid payload for event ${eventType}: must be an object`);
    }

    // Required fields validation
    const requiredFields = ['sectionId', 'sectionType'] as const;
    for (const field of requiredFields) {
      const payloadRecord = payload as unknown as Record<string, unknown>;
      if (!(field in payload) || typeof payloadRecord[field] !== 'string') {
        throw new Error(`Invalid payload for event ${eventType}: missing or invalid ${field}`);
      }
    }

    // Event-specific validation
    const schema = EVENT_VALIDATION_SCHEMA[eventType];
    if (schema) {
      for (const field of schema) {
        if (!(field in payload)) {
          throw new Error(`Invalid payload for event ${eventType}: missing required field ${field}`);
        }
      }
    }
  }

  /**
   * Add event to history for debugging and monitoring
   * Monitoring: Maintains event audit trail
   */
  private addToHistory(eventType: SectionEventType, payload: EventPayload): void {
    this.eventHistory.push({
      type: eventType,
      payload,
      timestamp: Date.now()
    });

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Check if event is user interaction for analytics
   */
  private isUserInteractionEvent(eventType: SectionEventType): boolean {
    return [
      SectionEventType.CAROUSEL_USER_INTERACTION,
      SectionEventType.CTA_CLICKED,
      SectionEventType.KEYBOARD_NAVIGATION
    ].includes(eventType);
  }

  /**
   * Get event history for debugging
   * Monitoring: Provides event audit trail
   */
  getEventHistory(eventType?: SectionEventType): typeof this.eventHistory {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Get listener count for monitoring
   */
  getListenerCount(eventType?: SectionEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    return Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0);
  }

  /**
   * Clear all listeners (for cleanup)
   */
  removeAllListeners(): void {
    this.listeners.clear();
    this.eventHistory = [];
    
    if (this.isDebugMode) {
      Logger.debug('SectionEventBus: All listeners removed');
    }
  }
}

// Singleton instance following Service Agnostic Abstraction
export const sectionEventBus = new SectionEventBus();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Make event bus available in browser console for debugging
  if (typeof window !== 'undefined') {
    (window as Window & { sectionEventBus?: SectionEventBus }).sectionEventBus = sectionEventBus;
  }
}