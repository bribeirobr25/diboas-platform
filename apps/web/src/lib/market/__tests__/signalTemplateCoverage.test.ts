/**
 * Every state the engine can emit has its sentence ×4 locales (2026-10-18
 * compliance pass). Since then the generator THROWS on a signal whose state
 * has no template (it used to keep last cycle's sentence silently), so this is
 * the precondition that keeps a Monday run from stopping on a gap that was
 * there all along. The engine emits ACTIVE/INACTIVE for every signal and
 * UNAVAILABLE for ETF-01 only (warm-up, gapped, suspended, manual expiry).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const TEMPLATES = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../../../scripts/market-refresh/templates/signal-sentences.json'),
    'utf8'
  )
);
const LOCALES = ['en', 'pt-BR', 'es', 'de'];
const SIGNALS = [
  'BTC-01',
  'BTC-02',
  'BTC-03',
  'BTC-04',
  'MAC-01',
  'MAC-02',
  'MAC-03',
  'ETF-01',
  'REL-01',
  'REL-02',
  'REL-03',
];
const STATES = (id: string) =>
  id === 'ETF-01' ? ['ACTIVE', 'INACTIVE', 'UNAVAILABLE'] : ['ACTIVE', 'INACTIVE'];

describe('signal sentence templates', () => {
  it('should list exactly the eleven signals', () => {
    expect(
      Object.keys(TEMPLATES)
        .filter((k) => !k.startsWith('_'))
        .sort()
    ).toEqual([...SIGNALS].sort());
  });

  for (const id of SIGNALS) {
    for (const state of STATES(id)) {
      it(`should carry ${id} ${state} in all four locales`, () => {
        const set = TEMPLATES[id]?.[state];
        expect(set, `${id} has no ${state} template`).toBeTruthy();
        for (const locale of LOCALES) {
          expect(typeof set[locale], `${id} ${state} ${locale}`).toBe('string');
          expect(set[locale].trim().length, `${id} ${state} ${locale} is empty`).toBeGreaterThan(0);
        }
      });
    }
  }
});

describe('the states the engine can assign (5.628: derived, not only listed)', () => {
  const LIB = path.join(__dirname, '../../../../scripts/market-refresh/lib');
  const SOURCES = ['regime-engine.mjs', 'etf-flows.mjs', 'etf-suspension.mjs'];
  // Every state literal assigned in the engine's own source: `state: 'X'`,
  // `state = 'X'`, and both arms of `state… ? 'X' : 'Y'`.
  const assigned = new Set(
    SOURCES.flatMap((f) => {
      const src = fs.readFileSync(path.join(LIB, f), 'utf8');
      return [
        ...[...src.matchAll(/\bstate\s*[:=]\s*[^;,\n]*/g)].flatMap((m) =>
          [...m[0].matchAll(/'([A-Z][A-Z_]+)'/g)].map((x) => x[1])
        ),
      ];
    })
  );

  it('should find the states it guards (the extractor works)', () => {
    expect([...assigned]).toEqual(expect.arrayContaining(['ACTIVE', 'INACTIVE', 'UNAVAILABLE']));
  });

  it('should have a template for every state the engine assigns', () => {
    const covered = new Set(SIGNALS.flatMap((id) => STATES(id)));
    expect([...assigned].filter((s) => !covered.has(s))).toEqual([]);
  });
});
