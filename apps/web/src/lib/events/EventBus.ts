/**
 * Generic Event Bus Base Class
 *
 * DRY: Shared event bus logic used by both SectionEventBus and ApplicationEventBus.
 * Event-Driven Architecture: Type-safe subscribe/emit with payload validation.
 * Monitoring & Observability: Event history audit trail, slow-event warnings.
 */

import { Logger } from '@/lib/monitoring/Logger';

/** Minimal base payload — every event must have a timestamp */
export interface BaseEventPayload {
  timestamp: number;
  eventId?: string;
}

/** Generic event listener */
export type GenericEventListener<T = BaseEventPayload> = (
  payload: T
) => void | Promise<void>;

/** Configuration for EventBus behavior */
export interface EventBusConfig {
  /** Name used in log messages (e.g. "SectionEventBus", "ApplicationEventBus") */
  name: string;
  /** Maximum event history size */
  maxHistorySize: number;
  /** Duration threshold (ms) for slow-event warnings */
  slowEventThresholdMs: number;
  /** Required fields validated on every payload */
  requiredFields: string[];
  /** Whether emit() should re-throw validation/processing errors */
  rethrowErrors: boolean;
  /** Whether removeAllListeners also clears history */
  clearHistoryOnRemoveAll: boolean;
}

/**
 * Generic, type-safe Event Bus.
 *
 * TEventType: string enum of event types
 * TPayload:   union of all possible payload types
 */
export class EventBus<
  TEventType extends string,
  TPayload extends { timestamp: number; eventId?: string },
> {
  private listeners = new Map<TEventType, Set<GenericEventListener<TPayload>>>();
  private eventHistory: Array<{ type: TEventType; payload: TPayload; timestamp: number }> = [];
  private isDebugMode = process.env.NODE_ENV === 'development';

  constructor(
    private config: EventBusConfig,
    private validationSchema: Partial<Record<TEventType, string[]>>,
    private onListenerError?: (eventType: TEventType, payload: TPayload, error: unknown) => void,
  ) {}

  /**
   * Subscribe to events. Returns an unsubscribe function.
   */
  on<T extends TPayload>(
    eventType: TEventType,
    listener: GenericEventListener<T>,
  ): () => void {
    if (typeof listener !== 'function') {
      throw new Error(`Invalid listener for event ${eventType}: must be a function`);
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const set = this.listeners.get(eventType)!;
    set.add(listener as GenericEventListener<TPayload>);

    if (this.isDebugMode) {
      Logger.debug(`${this.config.name}: Listener registered`, {
        eventType,
        listenerCount: set.size,
      });
    }

    return () => {
      set.delete(listener as GenericEventListener<TPayload>);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Emit an event, running all registered listeners with error isolation.
   */
  async emit<T extends TPayload>(eventType: TEventType, payload: T): Promise<void> {
    const startTime = performance.now();

    try {
      this.validatePayload(eventType, payload);

      const enriched = {
        ...payload,
        eventId: payload.eventId || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`),
        timestamp: payload.timestamp || Date.now(),
      };

      this.addToHistory(eventType, enriched as T);

      const set = this.listeners.get(eventType);
      if (!set || set.size === 0) {
        if (this.isDebugMode) {
          Logger.debug(`${this.config.name}: No listeners for event`, { eventType });
        }
        return;
      }

      const promises = Array.from(set).map(async (listener) => {
        try {
          await listener(enriched as T);
        } catch (error) {
          Logger.error(`${this.config.name}: Listener error`, { eventType, error });
          this.onListenerError?.(eventType, enriched as T, error);
        }
      });

      await Promise.allSettled(promises);

      const duration = performance.now() - startTime;
      if (duration > this.config.slowEventThresholdMs) {
        Logger.warn(`${this.config.name}: Slow event processing`, {
          eventType,
          duration: `${duration.toFixed(2)}ms`,
          listenerCount: set.size,
        });
      }

      if (this.isDebugMode) {
        Logger.debug(`${this.config.name}: Event emitted`, {
          eventType,
          listenerCount: set.size,
        });
      }
    } catch (error) {
      Logger.error(`${this.config.name}: Failed to emit event`, { eventType, error });
      if (this.config.rethrowErrors) {
        throw error;
      }
    }
  }

  /**
   * Validate a payload against required fields + per-event schema.
   */
  private validatePayload(eventType: TEventType, payload: TPayload): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Invalid payload for event ${eventType}: must be an object`);
    }

    for (const field of this.config.requiredFields) {
      if (!(field in payload)) {
        throw new Error(`Invalid payload for event ${eventType}: missing or invalid ${field}`);
      }
    }

    const schema = this.validationSchema[eventType];
    if (schema) {
      for (const field of schema) {
        if (!(field in payload)) {
          throw new Error(`Invalid payload for event ${eventType}: missing required field ${field}`);
        }
      }
    }
  }

  /** Add event to history, trimming if over max size */
  private addToHistory(eventType: TEventType, payload: TPayload): void {
    this.eventHistory.push({ type: eventType, payload, timestamp: Date.now() });
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxHistorySize);
    }
  }

  /** Get event history, optionally filtered by type */
  getEventHistory(
    eventType?: TEventType,
  ): Array<{ type: TEventType; payload: TPayload; timestamp: number }> {
    if (eventType) {
      return this.eventHistory.filter((e) => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /** Get total listener count, or count for a specific event type */
  getListenerCount(eventType?: TEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    return Array.from(this.listeners.values()).reduce((sum, s) => sum + s.size, 0);
  }

  /** Remove all listeners (and optionally clear history) */
  removeAllListeners(): void {
    this.listeners.clear();
    if (this.config.clearHistoryOnRemoveAll) {
      this.eventHistory = [];
    }
    if (this.isDebugMode) {
      Logger.debug(`${this.config.name}: All listeners removed`);
    }
  }
}
