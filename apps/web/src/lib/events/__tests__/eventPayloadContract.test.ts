/**
 * Contract tests for the application event payload (Phase 2 M1).
 *
 * Pin the new requirements introduced 2026-05-08:
 *   - `domain` is required on every emission
 *   - `eventId` and `correlationId` are auto-filled by EventBus.emit
 *     when absent at the call site
 *   - `EVENT_VALIDATION_SCHEMA` requires `domain` for every event type
 */

import { describe, it, expect } from 'vitest';
import {
  applicationEventBus,
  ApplicationEventType,
  EVENT_VALIDATION_SCHEMA,
  type AppEventPayload,
} from '../ApplicationEventBus';

describe('EVENT_VALIDATION_SCHEMA — Phase 2 M1 contract', () => {
  it('should require `domain` on every event type', () => {
    for (const eventType of Object.values(ApplicationEventType)) {
      const required = EVENT_VALIDATION_SCHEMA[eventType];
      expect(required, `${eventType} schema should be defined`).toBeDefined();
      expect(required, `${eventType} should require domain`).toContain('domain');
    }
  });

  it('should require `source` on every event type', () => {
    for (const eventType of Object.values(ApplicationEventType)) {
      expect(EVENT_VALIDATION_SCHEMA[eventType]).toContain('source');
    }
  });
});

describe('EventBus.emit — auto-fill', () => {
  it('should auto-fill eventId, correlationId, timestamp when absent', async () => {
    let received: AppEventPayload | undefined;
    const off = applicationEventBus.on<AppEventPayload>(
      ApplicationEventType.FEATURE_USED,
      (payload) => {
        received = payload;
      }
    );

    await applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      domain: 'application',
      source: 'test',
      timestamp: 0,
    } as AppEventPayload);

    off();

    expect(received).toBeDefined();
    expect(received!.eventId).toBeDefined();
    expect(received!.eventId!.length).toBeGreaterThan(0);
    expect(received!.correlationId).toBeDefined();
    expect(received!.correlationId!.length).toBeGreaterThan(0);
    // timestamp 0 is falsy, so EventBus should fill in Date.now()
    expect(received!.timestamp).toBeGreaterThan(0);
  });

  it('should preserve caller-provided correlationId', async () => {
    const givenCorrelationId = 'test-correlation-abc123';
    let received: AppEventPayload | undefined;
    const off = applicationEventBus.on<AppEventPayload>(
      ApplicationEventType.FEATURE_USED,
      (payload) => {
        received = payload;
      }
    );

    await applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      domain: 'application',
      source: 'test',
      correlationId: givenCorrelationId,
      timestamp: Date.now(),
    } as AppEventPayload);

    off();
    expect(received!.correlationId).toBe(givenCorrelationId);
  });

  it('should preserve caller-provided eventId', async () => {
    const givenEventId = 'evt-test-xyz789';
    let received: AppEventPayload | undefined;
    const off = applicationEventBus.on<AppEventPayload>(
      ApplicationEventType.FEATURE_USED,
      (payload) => {
        received = payload;
      }
    );

    await applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      domain: 'application',
      source: 'test',
      eventId: givenEventId,
      timestamp: Date.now(),
    } as AppEventPayload);

    off();
    expect(received!.eventId).toBe(givenEventId);
  });
});
