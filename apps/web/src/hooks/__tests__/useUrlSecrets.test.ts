// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

let params = new URLSearchParams();
vi.mock('next/navigation', () => ({ useSearchParams: () => params }));

import { useUrlSecrets } from '../useUrlSecrets';

/** 5.864 (founder ruling 2026-11-10): one-time secrets leave the address bar once read. */
describe('useUrlSecrets', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/en/delete-confirm?token=SECRET#frag');
    params = new URLSearchParams('token=SECRET');
  });

  it('should return the secret and remove the query and fragment from the address', () => {
    const { result } = renderHook(() => useUrlSecrets((p) => p.get('token')));
    expect(result.current).toBe('SECRET');
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/en/delete-confirm'
    );
  });

  it('should keep the secret after the address (and the live params) lose it', () => {
    const { result, rerender } = renderHook(() => useUrlSecrets((p) => p.get('token')));
    params = new URLSearchParams();
    rerender();
    expect(result.current).toBe('SECRET');
  });

  it('should leave a clean address alone', () => {
    window.history.replaceState(null, '', '/en/delete-confirm');
    const spy = vi.spyOn(window.history, 'replaceState');
    renderHook(() => useUrlSecrets((p) => p.get('token')));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
