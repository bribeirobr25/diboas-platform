/**
 * ANALYTICS-FLUSH-1 (PostHog half). An unloading send asks for a beacon and immediate delivery,
 * even when it is the first send of the page (the client not yet cached); once `warm()` has
 * cached the client a send is synchronous; every capture carries the event's own timestamp, so
 * PostHog does not stamp the send time (2026-11-12 audit).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.hoisted(() => vi.fn());
vi.mock('posthog-js', () => ({ default: { __loaded: true, capture } }));

import { PostHogBackend } from '../backends';

beforeEach(() => capture.mockClear());

const BEACON = { transport: 'sendBeacon', send_instantly: true };

describe('PostHogBackend', () => {
  it('should send the first-ever send of a page by beacon when the page is unloading', async () => {
    const backend = new PostHogBackend();
    await backend.sendEvents([{ name: 'leaving', timestamp: 1_000 }], { unloading: true });
    expect(capture).toHaveBeenCalledWith('leaving', undefined, {
      timestamp: new Date(1_000),
      ...BEACON,
    });
  });

  it('should capture synchronously once warm() has cached the client', async () => {
    const backend = new PostHogBackend();
    backend.warm();
    await vi.waitFor(() =>
      expect((backend as unknown as { client: unknown }).client).not.toBeNull()
    );
    void backend.sendEvents([{ name: 'memo', parameters: { view: 'bitcoin' }, timestamp: 2_000 }], {
      unloading: true,
    });
    // No await: the capture has already happened.
    expect(capture).toHaveBeenCalledWith(
      'memo',
      { view: 'bitcoin' },
      { timestamp: new Date(2_000), ...BEACON }
    );
  });

  it('should send a normal batch without the beacon options, with the event timestamp', async () => {
    const backend = new PostHogBackend();
    await backend.sendEvents([{ name: 'normal', timestamp: 3_000 }]);
    expect(capture).toHaveBeenCalledWith('normal', undefined, { timestamp: new Date(3_000) });
  });
});
