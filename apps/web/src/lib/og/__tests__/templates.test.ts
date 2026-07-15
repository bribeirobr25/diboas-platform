/**
 * OG template registry drift guard (learn redesign Phase 2, 2026-07-15).
 *
 * `isValidPageType` is a hand-maintained allowlist next to the PAGE_CONFIGS
 * record: Phase 1 added the 'learn' config but missed the allowlist, so
 * /api/og/learn silently served the default template (HTTP 200, wrong image;
 * invisible to status-code smokes). This guard makes the two sync points one:
 * every configured page type must validate, and validation must reject
 * unknown types.
 */

import { describe, it, expect } from 'vitest';
import { PAGE_CONFIGS, isValidPageType } from '../templates';

describe('OG page-type registry', () => {
  it.each(Object.keys(PAGE_CONFIGS))(
    'isValidPageType accepts configured page type "%s"',
    (pageType) => {
      expect(isValidPageType(pageType)).toBe(true);
    }
  );

  it('should reject unknown page types (default-template fallback stays intentional)', () => {
    expect(isValidPageType('not-a-page')).toBe(false);
    expect(isValidPageType('')).toBe(false);
  });
});
