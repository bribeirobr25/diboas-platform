/**
 * The unit-test network guard is installed and records what it refuses (5.942).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { refusingFetch, takeUnmockedRequests } from '../networkGuard';

describe('the unit-test network guard (5.942)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be the fetch every test starts with', () => {
    expect(globalThis.fetch).toBe(refusingFetch);
  });

  it('should refuse an unmocked request and record it', async () => {
    await expect(fetch('/api/market/rate-ranges')).rejects.toThrow(/unmocked network request/);
    expect(takeUnmockedRequests()).toEqual(['/api/market/rate-ranges']);
  });

  it('should step aside for a test that stubs fetch', async () => {
    const stub = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', stub);
    await fetch('/api/anything');
    expect(stub).toHaveBeenCalledTimes(1);
    expect(takeUnmockedRequests()).toEqual([]);
  });
});
