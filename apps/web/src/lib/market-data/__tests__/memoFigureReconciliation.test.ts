/**
 * Memo prose-figure reconciliation (audit remediation 2026-08-24, PENDING_ALL 5.128).
 *
 * WHY THIS EXISTS — the 2026-08-24 cycle shipped, in all four locales:
 *   "US 10-year yields firmed to 4.75%"      engine MAC-02.close  = 4.68
 *   "The Nasdaq holds about 5.8% above…"     engine REL-03.gapPct = 2.913
 * Both were the previous cycle's values, carried for two weeks inside sentences
 * that were otherwise still true. F-M4 reconciles SCORES and POINTS; nothing
 * reconciled the NUMERALS quoted in prose, and the analyst memo is the one
 * field the generator does not own (it is hand/AI-authored per 5.99).
 *
 * WHAT THIS DOES — extracts every measurement-looking number from the memo and
 * the supportive/headwind lists, in every locale, and asserts each one is either
 *   (a) within rounding distance of a value the engine actually published, or
 *   (b) a STRUCTURAL constant (a window length, a threshold, a count).
 * A figure that matches neither is a claim the engine never made.
 *
 * It cannot prove a number is used in the RIGHT sentence — only that no number
 * is invented or stale. That is exactly the class that shipped twice.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const MARKET_DIR = join(__dirname, '../../../../data/market/shared');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/** Windows, thresholds, counts and denominators that legitimately appear in prose. */
const STRUCTURAL = new Set([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14, // scores, points, counts, band edges
  20,
  50, // EMA/SMA window lengths ("20-week", "50-month")
  2026,
  2025,
  31, // years and the month-close day
  100,
]);

/** Every number the engine published this cycle, plus common roundings. */
function engineValues(): Set<number> {
  const computed = JSON.parse(readFileSync(join(MARKET_DIR, 'computed.json'), 'utf8'));
  const out = new Set<number>();
  const add = (n: unknown) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return;
    const a = Math.abs(n);
    out.add(a);
    // prices are quoted in thousands ("$62.8k" from 62813.75)
    out.add(a / 1000);
  };
  const walk = (o: unknown) => {
    if (o && typeof o === 'object') {
      for (const v of Object.values(o as Record<string, unknown>)) {
        if (typeof v === 'number') add(v);
        // The engine also states figures inside its own `detail` strings
        // (e.g. the ETF weekly aggregates "[-$379M, +$540M, +$107M, +$483M]").
        // Those are engine-published too, so the memo may quote them.
        else if (typeof v === 'string') {
          for (const m of v.match(/\d[\d.,]*/g) ?? []) {
            add(Number.parseFloat(m.replace(/,/g, '')));
          }
        } else walk(v);
      }
    }
  };
  walk(computed);
  return out;
}

/** Pull measurement-looking numbers out of prose (handles , and . decimals). */
function figuresIn(text: string): { value: number; decimals: number }[] {
  const cleaned = text.replace(/\$\s?([\d.,]+)/g, ' $1 ');
  const matches = cleaned.match(/\d[\d.,]*/g) ?? [];
  return matches
    .map((raw) => {
      const t = raw.replace(/[.,]$/, '');
      // 1.234,56 (de/pt/es) vs 1,234.56 (en)
      const normalized =
        /,\d{1,2}$/.test(t) && !/\.\d/.test(t)
          ? t.replace(/\./g, '').replace(',', '.')
          : t.replace(/,/g, '');
      const value = Number.parseFloat(normalized);
      const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
      return { value, decimals };
    })
    .filter((f) => Number.isFinite(f.value));
}

describe('memo figures reconcile with the engine (5.128)', () => {
  const regime = JSON.parse(readFileSync(join(MARKET_DIR, 'regime.json'), 'utf8'));
  const known = engineValues();

  /**
   * Match at the SAME PRECISION the prose quotes. A memo that says "4.7%" may
   * round an engine 4.68; a memo that says "4.75%" may not — 4.68 does not round
   * to 4.75 at two decimals. Matching by tolerance instead of by precision is
   * what let the original 4.75-vs-4.68 defect slip past an earlier draft of
   * this gate: a +/-0.06 window silently accepted a figure the engine never made.
   */
  const matches = (n: number, decimals: number) => {
    const a = Math.abs(n);
    if (STRUCTURAL.has(a)) return true;
    const quoted = Number(a.toFixed(decimals));
    for (const k of known) {
      if (k === 0) continue;
      if (Number(k.toFixed(decimals)) === quoted) return true;
    }
    return false;
  };

  for (const locale of LOCALES) {
    it(`should quote only engine-published figures in ${locale}`, () => {
      const s = regime.summary[locale];
      const fields: [string, string][] = [
        ['detailed', s.detailed],
        ...(s.key_supportive_factors as string[]).map(
          (t, i) => [`key_supportive_factors[${i}]`, t] as [string, string]
        ),
        ...(s.key_headwinds as string[]).map(
          (t, i) => [`key_headwinds[${i}]`, t] as [string, string]
        ),
      ];
      const orphans: string[] = [];
      for (const [field, text] of fields) {
        for (const { value, decimals } of figuresIn(text)) {
          if (!matches(value, decimals)) orphans.push(`${field}: ${value}`);
        }
      }
      expect(
        orphans,
        `figures with no engine value behind them (stale or invented) — ${orphans.join(' | ')}`
      ).toEqual([]);
    });
  }
});
