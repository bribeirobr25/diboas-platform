// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectedLogs } from '@/test/expectedLogs';
import { clearProposalDecisions, getDeclinedWeeks, recordDecline } from '../proposalStore';

/**
 * REQUIREMENT (D-r §3, "credits stay in Available; no nag, ever"): a declined proposal stays
 * declined for the session even when the save fails. Lane audit 2026-10-20: on a quota or
 * private-mode write failure the decline went to the memory fallback, but the reader only
 * consulted that fallback when storage was ABSENT — so the decline vanished at once and the
 * proposal came straight back.
 */
expectedLogs({
  strict: true,
  error: ['proposal-decline store persist failed'],
  requiredIn: /save FAILS|failed-save/,
});

describe('a proposal decline survives a failed save', () => {
  beforeEach(() => {
    localStorage.clear();
    clearProposalDecisions();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('should keep the decline in this session when the save FAILS', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    });
    recordDecline([1, 2]);
    expect(getDeclinedWeeks()).toEqual([1, 2]);
    recordDecline([2, 3]);
    expect(getDeclinedWeeks()).toEqual([1, 2, 3]);
  });

  it('should read the stored declines and add nothing when the save works', () => {
    recordDecline([4]);
    expect(getDeclinedWeeks()).toEqual([4]);
    expect(JSON.parse(localStorage.getItem('diboas.sandbox.proposalDeclines.v1')!)).toEqual([4]);
  });

  it('should forget every decline on reset, the failed-save ones included', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    });
    recordDecline([7]);
    clearProposalDecisions();
    expect(getDeclinedWeeks()).toEqual([]);
  });
});
