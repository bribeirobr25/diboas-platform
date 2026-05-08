/**
 * useImpressionTracking — DOM behaviour tests
 *
 * Validates that:
 *   - The analytics event fires once when the element becomes visible
 *   - The event does NOT fire on initial mount (visibility-gated)
 *   - The event does NOT fire twice if the element scrolls out and back in
 *   - `enabled: false` short-circuits before the observer is created
 *   - The observer is disconnected on unmount
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImpressionTracking } from '../useImpressionTracking';

// ---- Mocks ---------------------------------------------------------------

const trackMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
  analyticsService: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

// ---- IntersectionObserver test double -----------------------------------

type IOCallback = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

interface FakeIO {
  callback: IOCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  /** Simulate the observed element crossing the visibility threshold. */
  fire: (isIntersecting: boolean) => void;
}

let lastObserver: FakeIO | null = null;

function installIntersectionObserverMock(): void {
  lastObserver = null;
  class MockIntersectionObserver implements FakeIO {
    callback: IOCallback;
    observe = vi.fn();
    disconnect = vi.fn();

    constructor(callback: IOCallback) {
      this.callback = callback;
      lastObserver = this;
    }

    fire(isIntersecting: boolean): void {
      this.callback([{ isIntersecting }]);
    }

    unobserve = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    root = null;
    rootMargin = '';
    thresholds = [];
  }

  // Cast through unknown to satisfy strict structural matching of the
  // browser's IntersectionObserver type.
  (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// ---- Helper to render the hook with a real DOM target -------------------

function renderImpressionHook(options: {
  enabled?: boolean;
  parameters?: Record<string, unknown>;
} = {}) {
  const target = document.createElement('section');
  document.body.appendChild(target);

  const result = renderHook(() => {
    const ref = useImpressionTracking<HTMLElement>({
      eventName: 'test_section_impression',
      parameters: options.parameters,
      enabled: options.enabled,
    });
    // In a real component, React assigns ref via JSX. Here we assign manually.
    (ref as { current: HTMLElement | null }).current = target;
    return ref;
  });

  return { target, result };
}

beforeEach(() => {
  trackMock.mockClear();
  installIntersectionObserverMock();
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ---- Tests ---------------------------------------------------------------

describe('useImpressionTracking', () => {
  it('does NOT fire the event before the element becomes visible', () => {
    renderImpressionHook();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it('fires the analytics event the first time the element becomes visible', () => {
    renderImpressionHook({ parameters: { variant: 'A' } });

    expect(lastObserver).not.toBeNull();
    lastObserver?.fire(true);

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      name: 'test_section_impression',
      parameters: expect.objectContaining({
        variant: 'A',
        timestamp: expect.any(Number),
      }),
    });
  });

  it('does NOT fire twice when the element scrolls out and back in', () => {
    renderImpressionHook();

    lastObserver?.fire(true);
    lastObserver?.fire(false); // scroll out
    lastObserver?.fire(true);  // scroll back in

    expect(trackMock).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer after firing', () => {
    renderImpressionHook();

    const disconnectSpy = lastObserver?.disconnect;
    lastObserver?.fire(true);

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('disconnects the observer on unmount even if the event never fired', () => {
    const { result } = renderImpressionHook();
    const disconnectSpy = lastObserver?.disconnect;

    result.unmount();

    expect(disconnectSpy).toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it('does not create an observer when enabled=false', () => {
    renderImpressionHook({ enabled: false });

    expect(lastObserver).toBeNull();
    expect(trackMock).not.toHaveBeenCalled();
  });
});
