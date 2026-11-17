import { describe, expect, it, vi } from 'vitest';

/**
 * `5.814` · THE CURRENT-FACING AGE FAILS CLOSED.
 *
 * `freshnessUnder` is declared to return any `TimeState`, HISTORICAL included,
 * though it never returns HISTORICAL today (replay is exempt, ruling §5). The
 * narrowing in `currentFacingTimeState` maps an impossible HISTORICAL to MISSING
 * — a refused age — rather than letting a rate line state an age the
 * current-facing path cannot vouch for. Isolated here because it needs the
 * freshness module replaced.
 */
vi.mock('../freshness', () => ({ freshnessUnder: () => 'HISTORICAL' }));

describe('5.814 · an impossible HISTORICAL state fails closed', () => {
  it('should state MISSING and refuse when the underlying state is HISTORICAL', async () => {
    const { currentFacingTimeState, isRefusedForCurrentFacingUse } =
      await import('../currentFacing');
    const { FIXTURE_STAMP } = await import('../fixtures');
    expect(currentFacingTimeState(FIXTURE_STAMP, '2026-07-19T00:00:00Z')).toBe('MISSING');
    expect(isRefusedForCurrentFacingUse(FIXTURE_STAMP, '2026-07-19T00:00:00Z')).toBe(true);
  });
});
