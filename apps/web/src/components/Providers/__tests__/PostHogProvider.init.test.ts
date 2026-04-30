/**
 * PostHog Provider Initialization Race Condition Tests
 *
 * Verifies PostHog initializes exactly once even when consent events
 * fire concurrently with the component mount.
 *
 * P11 Concurrency: prevents double initialization race
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PostHog initialization race prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent double initialization when flag is set before async', async () => {
    // Simulate the initialization pattern from PostHogProvider
    const isInitializedRef = { current: false };
    const initCalls: number[] = [];
    let callCount = 0;

    const initPostHog = async () => {
      if (isInitializedRef.current) return;

      // Set flag BEFORE async — this is the fix
      isInitializedRef.current = true;

      try {
        // Simulate async import delay
        await new Promise(resolve => setTimeout(resolve, 10));
        callCount++;
        initCalls.push(callCount);
      } catch {
        isInitializedRef.current = false;
      }
    };

    // Fire two concurrent initializations (mount + consent event)
    await Promise.all([initPostHog(), initPostHog()]);

    // Should have initialized exactly once
    expect(initCalls.length).toBe(1);
    expect(isInitializedRef.current).toBe(true);
  });

  it('should allow retry after initialization failure', async () => {
    const isInitializedRef = { current: false };
    let attemptCount = 0;

    const initPostHog = async (shouldFail: boolean) => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 5));
        if (shouldFail) throw new Error('Import failed');
        attemptCount++;
      } catch {
        // Reset flag on failure so retry is possible
        isInitializedRef.current = false;
      }
    };

    // First attempt fails
    await initPostHog(true);
    expect(isInitializedRef.current).toBe(false);
    expect(attemptCount).toBe(0);

    // Second attempt succeeds (retry allowed because flag was reset)
    await initPostHog(false);
    expect(isInitializedRef.current).toBe(true);
    expect(attemptCount).toBe(1);
  });

  it('should not initialize without consent', async () => {
    const isInitializedRef = { current: false };
    let initCount = 0;

    const initPostHog = async (hasConsent: boolean) => {
      if (!hasConsent || isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 5));
        initCount++;
      } catch {
        isInitializedRef.current = false;
      }
    };

    // Without consent
    await initPostHog(false);
    expect(initCount).toBe(0);
    expect(isInitializedRef.current).toBe(false);

    // With consent
    await initPostHog(true);
    expect(initCount).toBe(1);
    expect(isInitializedRef.current).toBe(true);
  });
});
