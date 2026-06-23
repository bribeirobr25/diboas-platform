/**
 * useInView — DOM behaviour tests
 *
 * Validates that:
 *   - With motion allowed, `inView` starts false and flips to true on first
 *     intersection (the draw-on trigger)
 *   - Under prefers-reduced-motion `inView` is true immediately (final state)
 *   - `enabled: false` short-circuits to true without creating an observer
 *   - The observer is disconnected after the first intersection (ran guard)
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInView } from '../useInView';

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

function renderInView(opts?: Parameters<typeof useInView>[0]) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const view = renderHook(() => {
    const r = useInView<HTMLDivElement>(opts);
    (r.ref as { current: HTMLDivElement | null }).current = target;
    return r;
  });
  return { target, view };
}

beforeEach(() => {
  installIntersectionObserverMock();
  mockReducedMotion(false);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('useInView', () => {
  it('should start not-in-view when motion is allowed', () => {
    const { view } = renderInView({ threshold: 0.4 });
    expect(view.result.current.inView).toBe(false);
  });

  it('should be in-view immediately under prefers-reduced-motion', () => {
    mockReducedMotion(true);
    const { view } = renderInView();
    expect(view.result.current.inView).toBe(true);
  });

  it('should be in-view immediately when disabled (no observer)', () => {
    const { view } = renderInView({ enabled: false });
    expect(view.result.current.inView).toBe(true);
    expect(lastObserver).toBeNull();
  });

  it('should flip to in-view on first intersection and disconnect', () => {
    const { view } = renderInView();
    expect(view.result.current.inView).toBe(false);
    act(() => lastObserver?.fire(true));
    expect(view.result.current.inView).toBe(true);
    expect(lastObserver?.disconnect).toHaveBeenCalled();
  });
});
