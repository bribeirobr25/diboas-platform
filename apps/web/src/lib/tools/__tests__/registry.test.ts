/**
 * Phase 4 §4.2 — `SHIPPED_TOOLS` ↔ `TOOL_DESCRIPTORS` parity (C40 close).
 *
 * Pre-fix, `SHIPPED_TOOLS` lived in `app/[locale]/(landing)/tools/page.tsx`
 * and `TOOL_DESCRIPTORS` in `lib/tools/constants.ts`. There was no
 * compile-time guarantee the two stayed in sync — adding a tool to one but
 * not the other would silently break the landing card list. Phase 4
 * consolidated `SHIPPED_TOOLS` into `lib/tools/constants.ts` and adds these
 * tests as the merge gate.
 */

import { describe, it, expect } from 'vitest';
import { SHIPPED_TOOLS, TOOL_DESCRIPTORS } from '../constants';
import type { ToolKey } from '../types';

describe('SHIPPED_TOOLS ↔ TOOL_DESCRIPTORS sync (C40)', () => {
  it('every SHIPPED_TOOLS key has a TOOL_DESCRIPTORS entry', () => {
    const missing = SHIPPED_TOOLS.filter((k) => !(k in TOOL_DESCRIPTORS));
    expect(missing).toEqual([]);
  });

  it('every TOOL_DESCRIPTORS key appears in SHIPPED_TOOLS', () => {
    const descriptorKeys = Object.keys(TOOL_DESCRIPTORS) as ToolKey[];
    const missingFromShipped = descriptorKeys.filter((k) => !SHIPPED_TOOLS.includes(k));
    expect(missingFromShipped).toEqual([]);
  });

  it('the sets are identical in cardinality (10 tools)', () => {
    expect(SHIPPED_TOOLS.length).toBe(Object.keys(TOOL_DESCRIPTORS).length);
    expect(SHIPPED_TOOLS.length).toBe(10);
  });

  it('every TOOL_DESCRIPTORS entry has matching `key` to its record key (no copy-paste drift)', () => {
    for (const [key, descriptor] of Object.entries(TOOL_DESCRIPTORS)) {
      expect(descriptor.key).toBe(key);
    }
  });
});
