/**
 * useCountUp — DOM behaviour tests
 *
 * Validates that:
 *   - The initial (SSR / pre-scroll) value is the FINAL `end` value (no flash)
 *   - `formatter` is applied to the displayed value
 *   - Under prefers-reduced-motion the value stays at `end` (no animation)
 *   - `enabled: false` short-circuits before the observer is created
 *   - On first scroll-in the value animates and LANDS exactly on `end`
 *   - It does not re-run if the element scrolls out and back in (ran guard)
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../useCountUp';

// ---- IntersectionObserver test double ------------------------------------

type IOCallback = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

interface FakeIO {
  callback: IOCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  fire: (isIntersecting: boolean) => void;
}

let lastObserver: FakeIO | null = null;

function installIntersectionObserverMock(): void {
  lastObserver = null;
  class MockIntersectionObserver implements FakeIO {
    callback: IOCallback;
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
    root = null;
    rootMargin = '';
    thresholds = [];
    constructor(callback: IOCallback) {
      this.callback = callback;
      lastObserver = this;
    }
    fire(isIntersecting: boolean): void {
      this.callback([{ isIntersecting }]);
    }
  }
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

function mockReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }) as unknown as MediaQueryList
  );
}

// Deterministic rAF: each frame jumps far past the duration so the animation
// completes in a single tick and lands on the final value.
function mockDeterministicRaf(): void {
  let now = 0;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    now += 100000;
    cb(now);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

function renderCountUp(opts: Parameters<typeof useCountUp>[0]) {
  const target = document.createElement('span');
  document.body.appendChild(target);
  const view = renderHook(() => {
    const r = useCountUp<HTMLSpanElement>(opts);
    (r.ref as { current: HTMLSpanElement | null }).current = target;
    return r;
  });
  return { target, view };
}

beforeEach(() => {
  installIntersectionObserverMock();
  mockReducedMotion(false);
  mockDeterministicRaf();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('useCountUp', () => {
  it('initial value is the final end value (no flash on SSR / pre-scroll)', () => {
    const { view } = renderCountUp({ end: 42 });
    expect(view.result.current.value).toBe(42);
    expect(view.result.current.display).toBe(42);
  });

  it('applies the formatter to the displayed value', () => {
    const { view } = renderCountUp({ end: 1234, formatter: (n) => `$${Math.round(n)}` });
    expect(view.result.current.display).toBe('$1234');
  });

  it('stays at end under prefers-reduced-motion (no animation)', () => {
    mockReducedMotion(true);
    const { view } = renderCountUp({ end: 99 });
    act(() => lastObserver?.fire(true));
    expect(view.result.current.value).toBe(99);
  });

  it('does not create an observer when enabled=false', () => {
    const { view } = renderCountUp({ end: 7, enabled: false });
    expect(lastObserver).toBeNull();
    expect(view.result.current.value).toBe(7);
  });

  it('animates on first scroll-in and lands exactly on end', () => {
    const { view } = renderCountUp({ end: 500, start: 0, duration: 1400 });
    act(() => lastObserver?.fire(true));
    expect(view.result.current.value).toBe(500);
    expect(lastObserver?.disconnect).toHaveBeenCalled();
  });

  it('does not re-run when the element scrolls out and back in', () => {
    const { view } = renderCountUp({ end: 10 });
    act(() => {
      lastObserver?.fire(true);
      lastObserver?.fire(false);
      lastObserver?.fire(true);
    });
    expect(view.result.current.value).toBe(10);
  });
});
