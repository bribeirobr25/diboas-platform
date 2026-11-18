import { describe, expect, it, vi } from 'vitest';

/* The counter module reaches the database client at import; the audience map does not. */
vi.mock('@/lib/database/client', () => ({ sql: vi.fn() }));

import { sourceToAudience } from '../counterManager';
import { WAITLIST_SOURCES } from '../store/types';

/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 6: each source's audience, pinned (plan P11, D4).
 *
 * The audience picks which founding-member counter a signup counts against. It is a
 * `Record` over the one list, so a new source cannot compile without a decision; this
 * pins the decisions: only the B2B landing is business, and no source is consumer.
 */
describe('5.979 · each waitlist source counts against the right audience', () => {
  it('should count only the B2B landing as business', () => {
    for (const source of WAITLIST_SOURCES) {
      expect(sourceToAudience(source), source).toBe(source === 'landing_b2b' ? 'b2b' : 'b2c');
    }
  });

  it('should count a signup with no source as consumer', () => {
    expect(sourceToAudience(undefined)).toBe('b2c');
  });
});
