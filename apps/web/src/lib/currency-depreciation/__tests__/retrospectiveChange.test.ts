/**
 * 5.848 · the retrospective card's figure is signed by its value.
 * Requirement: a loss in USD purchasing power reads with one minus sign, a gain with one
 * plus sign, and the sign never doubles (production showed "−-22%" for the euro while its
 * anchors were inverted).
 */
import { describe, expect, it } from 'vitest';
import {
  EUR_ANCHOR_CORRECTION,
  formatRetrospectiveChange,
  formatRetrospectiveNumber,
  showsAnchorCorrection,
} from '../calculator';

describe('formatRetrospectiveChange', () => {
  it('should read as one minus sign and a whole percent when the currency lost value', () => {
    expect(formatRetrospectiveChange(17.979, 'en')).toBe('−18%');
  });

  it('should read as one plus sign when the currency gained value', () => {
    expect(formatRetrospectiveChange(-21.92, 'en')).toBe('+22%');
  });

  it('should never contain two signs when the value is negative', () => {
    for (const v of [-0.6, -5, -21.92, -99.4]) {
      expect(formatRetrospectiveChange(v, 'en')).not.toMatch(/[−-].*[−-]|[+].*[−-]/);
    }
  });

  it('should read 0% with no sign when the change rounds to zero', () => {
    expect(formatRetrospectiveChange(0.4, 'en')).toBe('0%');
    expect(formatRetrospectiveChange(-0.4, 'en')).toBe('0%');
  });
});

describe("the retrospective figures follow the reader's locale (5.848, 5.820 carve-out)", () => {
  it('should write the change as "18%" with no space when the reader is German (PCT-1)', () => {
    expect(formatRetrospectiveChange(17.979, 'de')).toBe('−18%');
    expect(formatRetrospectiveChange(17.979, 'pt-BR')).toBe('−18%');
  });

  it('should write a rate with a decimal comma when the reader is German or Brazilian', () => {
    expect(formatRetrospectiveNumber(0.70067, 'de')).toBe('0,70');
    expect(formatRetrospectiveNumber(1.2345, 'pt-BR')).toBe('1,23');
    expect(formatRetrospectiveNumber(1.2345, 'en')).toBe('1.23');
  });
});

describe('the euro correction note (5.848, B-13)', () => {
  it('should show only for the euro and only until its end date', () => {
    expect(showsAnchorCorrection('EUR', '2026-11-16')).toBe(true);
    expect(showsAnchorCorrection('EUR', EUR_ANCHOR_CORRECTION.showUntil)).toBe(true);
    expect(showsAnchorCorrection('EUR', '2026-12-15')).toBe(false);
    expect(showsAnchorCorrection('BRL', '2026-11-16')).toBe(false);
  });

  it('should end about four weeks after the correction', () => {
    const days =
      (Date.parse(EUR_ANCHOR_CORRECTION.showUntil) -
        Date.parse(EUR_ANCHOR_CORRECTION.correctedOn)) /
      86_400_000;
    expect(days).toBeGreaterThanOrEqual(28);
    expect(days).toBeLessThanOrEqual(42);
  });
});
