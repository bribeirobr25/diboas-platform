/**
 * F-M6 (P1 guard, 2026-07-11) — regime.json#data_status ↔ data-status.json
 * byte-parity as a CI test instead of a playbook one-liner.
 *
 * The two files are hand-edited in the same refresh and MUST describe the
 * same source set with the same statuses — the page renders the regime-
 * embedded mirror while ops reads the standalone file, so silent divergence
 * means the user and the operator see different freshness truths.
 *
 * `_`-prefixed keys (`_comment`, `_translation_status`) are annotations,
 * not data — excluded from the comparison on both sides.
 *
 * Plan: docs/audit/MARKET_REFRESH_AUDIT_AND_AUTOMATION_PLAN_2026-07-11.md §P1.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const MARKET_DIR = join(__dirname, '../../../../data/market');

function stripAnnotations(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAnnotations);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => [k, stripAnnotations(v)])
    );
  }
  return value;
}

describe('data-status mirror parity (F-M6)', () => {
  const regime = JSON.parse(readFileSync(join(MARKET_DIR, 'regime.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  const standalone = JSON.parse(
    readFileSync(join(MARKET_DIR, 'data-status.json'), 'utf8')
  ) as Record<string, unknown>;

  it('should deep-equal the standalone data-status.json when comparing regime.json#data_status (annotations excluded)', () => {
    expect(stripAnnotations(regime.data_status)).toEqual(stripAnnotations(standalone));
  });

  it('should list at least the 7 known sources so an accidental truncation cannot pass parity', () => {
    const sources = (standalone.sources as Array<{ source: string }>).map((s) => s.source);
    expect(sources.length).toBeGreaterThanOrEqual(7);
    // The BTC monthlies source is the F-M2 guard's subject — it must never
    // drop out of the freshness map.
    expect(sources.some((s) => s.includes('monthlyPrices.json'))).toBe(true);
  });
});
