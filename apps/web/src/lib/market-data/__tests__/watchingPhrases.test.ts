/**
 * The "what we're watching" clause must match the state the signal is IN
 * (PENDING_ALL 5.192, founder-ruled option (a), authorised 2026-09-15).
 *
 * THE DEFECT. `plain-phrases.json#watching` was keyed by signal id ALONE, while
 * `generate.mjs#watchingIds()` picks the two signals nearest a flip REGARDLESS
 * of state. Ten of the eleven phrases presuppose a state, so a phrase written
 * for one was routinely emitted in the other.
 *
 * It was live on production on 2026-09-15:
 *
 *   "The monthly read is very favorable — nearly all of what we track is
 *    aligned toward the price. What we're watching: whether the price can climb
 *    back above its long middle line, and whether the dollar loosens its grip."
 *
 * BTC-01 was ACTIVE with gapPct +0.067 — the price was ALREADY above that line,
 * and was selected first precisely because it sat nearest the flip. The sentence
 * said everything was aligned and then watched for something that had happened.
 *
 * Keyed by (id x state) now, both states required for all eleven. ACTIVE phrases
 * watch a supportive condition PERSISTING; INACTIVE phrases watch it TURNING.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHRASES = JSON.parse(
  readFileSync(
    join(__dirname, '../../../../scripts/market-refresh/templates/plain-phrases.json'),
    'utf8'
  )
).watching as Record<string, Record<string, Record<string, string>>>;

const GENERATE = readFileSync(
  join(__dirname, '../../../../scripts/market-refresh/generate.mjs'),
  'utf8'
);

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const SIGNALS = Object.keys(PHRASES).filter((k) => !k.startsWith('_'));

describe('watching phrases are keyed by (signal x state)', () => {
  it('should cover all eleven signals', () => {
    expect(SIGNALS).toHaveLength(11);
  });

  it.each(SIGNALS)('%s should have BOTH states in all four locales', (id) => {
    for (const state of ['ACTIVE', 'INACTIVE']) {
      for (const l of LOCALES) {
        expect(PHRASES[id]?.[state]?.[l], `${id}/${state}/${l} missing`).toBeTruthy();
      }
    }
  });

  it('should never use the same wording for both states', () => {
    // The whole defect was one phrase serving two states. Identical text would
    // reinstate it while passing the presence check above.
    for (const id of SIGNALS) {
      for (const l of LOCALES) {
        expect(PHRASES[id].ACTIVE[l], `${id}/${l}: ACTIVE and INACTIVE read identically`).not.toBe(
          PHRASES[id].INACTIVE[l]
        );
      }
    }
  });
});

describe('the ACTIVE phrasing cannot presuppose the condition is absent', () => {
  // The words that made the live sentence self-contradicting: each implies the
  // supportive condition has NOT happened yet. They belong only to INACTIVE.
  const TURN_WORDS: Record<string, RegExp> = {
    en: /\b(back above|reclaim|again|finally|starts?|stops?|regains?)\b/i,
    'pt-BR': /\b(volta|voltar|retoma|retomar|finalmente|firma)\b/i,
    es: /\b(volver|vuelve|recupera|por fin|afirma)\b/i,
    de: /\b(wieder|zurückerobern|endlich)\b/i,
  };

  it.each(SIGNALS)('%s ACTIVE should read as persistence, not as a turn', (id) => {
    for (const l of LOCALES) {
      const text = PHRASES[id].ACTIVE[l];
      expect(text, `${id}/${l} ACTIVE uses turn-language: "${text}"`).not.toMatch(TURN_WORDS[l]);
    }
  });
});

describe('the selector reads the state, not just the id', () => {
  it('should look the phrase up by state IN plainSummary, not just somewhere in the file', () => {
    // My first version of this test matched the pattern ANYWHERE in
    // generate.mjs, so the state-aware FALLBACK line satisfied it while the
    // main lookup was sabotaged back to a fixed state — a guard that could not
    // fail. Scope it to the function that actually composes the sentence.
    const body = GENERATE.slice(
      GENERATE.indexOf('function plainSummary'),
      GENERATE.indexOf('function applyOverride')
    );
    expect(body.length, 'plainSummary not found — the instrument, not the finding').toBeGreaterThan(
      200
    );
    expect(body, "plainSummary must resolve the phrase by the signal's own state").toMatch(
      /phrases\.watching\[[^\]]+\]\?\.\[[^\]]*\.state\]/
    );
    expect(body, 'a hardcoded state here is the original defect').not.toMatch(
      /phrases\.watching\[[^\]]+\]\?\.(ACTIVE|INACTIVE)/
    );
    expect(GENERATE, 'watchingIds must emit the state alongside the id').toMatch(
      /\{\s*id:\s*s\.id,\s*state:\s*s\.state/
    );
  });

  it('should not fall back to a signal that has no phrase for its state', () => {
    // ETF-01 while the ledger warms up is UNAVAILABLE and has no phrase; the
    // old fallback tested only `phrases.watching[s.id]`, which still exists.
    expect(GENERATE).toMatch(/phrases\.watching\[s\.id\]\?\.\[s\.state\]/);
  });
});

describe('the published sentence is coherent with the states behind it', () => {
  it('should not watch for a turn in a condition that already holds', () => {
    const regime = JSON.parse(
      readFileSync(join(__dirname, '../../../../data/market/shared/regime.json'), 'utf8')
    );
    const computed = JSON.parse(
      readFileSync(join(__dirname, '../../../../data/market/shared/computed.json'), 'utf8')
    );
    // For every ACTIVE signal, its INACTIVE phrase must not appear in the
    // published plain summary. Derived from the data, so it stays true as the
    // selection changes week to week.
    for (const s of computed.signals) {
      if (s.state !== 'ACTIVE') continue;
      const wrong = PHRASES[s.id]?.INACTIVE;
      if (!wrong) continue;
      for (const l of LOCALES) {
        expect(
          regime.summary[l].plain,
          `${s.id} is ACTIVE but the ${l} summary carries its INACTIVE phrase`
        ).not.toContain(wrong[l]);
      }
    }
  });
});
