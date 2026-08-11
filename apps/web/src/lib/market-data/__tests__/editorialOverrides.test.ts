/**
 * Cycle-scoped editorial overrides (B2, 2026-08-11) — an override replaces a
 * generated string for ONE cycle only. A stale or missing `_cycle` stamp
 * ignores the whole file with a loud warning, killing the stale-override trap
 * (before this guard, applyOverride was unconditional and a forgotten file
 * would silently pin last week's judgment onto every future cycle).
 */

import { describe, it, expect, vi } from 'vitest';
import { activeOverrides } from '../../../../scripts/market-refresh/lib/editorial-overrides.mjs';

const COMPUTED_AT = '2026-08-10T07:55:30.136Z';

describe('activeOverrides (B2 cycle scoping)', () => {
  it('should return empty when the override file is absent', () => {
    const warn = vi.fn();
    expect(activeOverrides(null, COMPUTED_AT, warn)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('should return empty without warning when the file has only annotation keys', () => {
    const warn = vi.fn();
    expect(activeOverrides({ _comment: 'x', _cycle: '2026-08-03' }, COMPUTED_AT, warn)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('should apply the overrides when _cycle matches the computed cycle date', () => {
    const warn = vi.fn();
    const raw = { _cycle: '2026-08-10', 'group.relative_strength.en': 'reviewed copy' };
    expect(activeOverrides(raw, COMPUTED_AT, warn)).toBe(raw);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should ignore all overrides and warn when _cycle is stale', () => {
    const warn = vi.fn();
    const raw = { _cycle: '2026-08-03', 'group.relative_strength.en': 'last week' };
    expect(activeOverrides(raw, COMPUTED_AT, warn)).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toContain('2026-08-03');
    expect(String(warn.mock.calls[0][0])).toContain('2026-08-10');
  });

  it('should ignore all overrides and warn when _cycle is missing', () => {
    const warn = vi.fn();
    const raw = { 'group.relative_strength.en': 'unstamped' };
    expect(activeOverrides(raw, COMPUTED_AT, warn)).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toContain('missing');
  });
});
