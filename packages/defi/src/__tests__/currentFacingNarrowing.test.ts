import { describe, expect, it, vi } from 'vitest';

/**
 * `5.814` · THE CURRENT-FACING AGE FAILS CLOSED.
 *
 * `freshnessUnder` is declared to return any `TimeState`, HISTORICAL included,
 * though it never returns HISTORICAL today (replay is exempt, ruling §5). The
 * switch in `currentFacingTimeState` maps an impossible HISTORICAL — and any
 * state not yet known to it — to MISSING, a refused age, rather than letting a
 * rate line state an age the current-facing path cannot vouch for. Isolated here
 * because it needs the freshness module replaced.
 */
const answer = vi.hoisted(() => ({ state: 'HISTORICAL' as string }));
vi.mock('../freshness', () => ({ freshnessUnder: () => answer.state }));

describe('5.814 · an age state the current-facing path cannot vouch for fails closed', () => {
  it.each(['HISTORICAL', 'EXPIRED'])(
    'should state MISSING and refuse when the underlying state is %s',
    async (state) => {
      answer.state = state;
      const { currentFacingTimeState, isRefusedForCurrentFacingUse } =
        await import('../currentFacing');
      const { FIXTURE_STAMP } = await import('../fixtures');
      expect(currentFacingTimeState(FIXTURE_STAMP, '2026-07-19T00:00:00Z')).toBe('MISSING');
      expect(isRefusedForCurrentFacingUse(FIXTURE_STAMP, '2026-07-19T00:00:00Z')).toBe(true);
    }
  );

  it('should pass a known state through unchanged (the control)', async () => {
    answer.state = 'STALE';
    const { currentFacingTimeState } = await import('../currentFacing');
    const { FIXTURE_STAMP } = await import('../fixtures');
    expect(currentFacingTimeState(FIXTURE_STAMP, '2026-07-19T00:00:00Z')).toBe('STALE');
  });
});
