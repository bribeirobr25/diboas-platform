/**
 * FAQ Registry drift + selector guards (2026-07-13 SSOT consolidation).
 *
 * The canonical FAQ content store is `packages/i18n/translations/{locale}/faq.json`.
 * These tests fail if:
 *   - a registry id (topic or surface) has no entry in `faq.json` (drift);
 *   - a surface's item count/order changes (visible-regression guard, R3);
 *   - the `safeStrategy` A/B answer stops resolving per wallet architecture (R4);
 *   - the /help FAQPage JSON-LD `mainEntity` goes empty again (E10 regression);
 *   - the migrated `strategies.json#faq` / `protocols.json#faq` content stores
 *     reappear (kill-list — the fragmentation the consolidation removed).
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import {
  FAQ_TOPICS,
  FAQ_SURFACES,
  ALL_FAQ_IDS,
  getFAQForSurface,
  buildFAQStructuredData,
} from '../faqRegistry';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

function findTranslationsRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'packages/i18n/translations/en'))) {
      return join(dir, 'packages/i18n/translations');
    }
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations');
}

const ROOT = findTranslationsRoot();
const loadJson = (locale: string, ns: string) =>
  JSON.parse(readFileSync(join(ROOT, locale, `${ns}.json`), 'utf8'));

describe('faqRegistry — drift anchor', () => {
  it('every registry id exists in faq.json for all 4 locales', () => {
    for (const locale of LOCALES) {
      const items = loadJson(locale, 'faq').items as Record<string, unknown>;
      for (const id of ALL_FAQ_IDS) {
        expect(items[id], `${locale}/faq.json missing item "${id}"`).toBeTruthy();
      }
    }
  });

  it('safeStrategy carries the A/B answer pair (question + answerA + answerB) in every locale', () => {
    for (const locale of LOCALES) {
      const ss = (loadJson(locale, 'faq').items as Record<string, Record<string, string>>)
        .safeStrategy;
      expect(ss?.question, `${locale} safeStrategy.question`).toBeTruthy();
      expect(ss?.answerA, `${locale} safeStrategy.answerA`).toBeTruthy();
      expect(ss?.answerB, `${locale} safeStrategy.answerB`).toBeTruthy();
    }
  });
});

describe('faqRegistry — per-surface selection', () => {
  const expected: Record<keyof typeof FAQ_SURFACES, number> = {
    landing: 5,
    business: 5,
    strategies: 5,
    protocols: 5,
  };

  for (const [surface, count] of Object.entries(expected)) {
    it(`getFAQForSurface('${surface}') returns ${count} items in declared order`, () => {
      const items = getFAQForSurface(surface as keyof typeof FAQ_SURFACES);
      expect(items).toHaveLength(count);
      const ids = FAQ_SURFACES[surface as keyof typeof FAQ_SURFACES].items.map((i) => i.id);
      expect(items.map((i) => i.id)).toEqual(ids);
      // Every question/answer is a resolvable faq.items.<id>.* key.
      for (const item of items) {
        expect(item.question).toMatch(/^faq\.items\.[A-Za-z]+\.question$/);
        expect(item.answer).toMatch(/^faq\.items\.[A-Za-z]+\.(answer|answerA|answerB)$/);
      }
    });
  }

  it('safeStrategy A/B resolves per wallet architecture', () => {
    const nonCustodial = getFAQForSurface('strategies', { walletArchitecture: 'non-custodial' });
    const mpc = getFAQForSurface('strategies', { walletArchitecture: 'mpc' });
    const safeA = nonCustodial.find((i) => i.id === 'faq-safe')!;
    const safeB = mpc.find((i) => i.id === 'faq-safe')!;
    expect(safeA.answer).toBe('faq.items.safeStrategy.answerA');
    expect(safeB.answer).toBe('faq.items.safeStrategy.answerB');
  });
});

describe('faqRegistry — /help JSON-LD (E10 regression guard)', () => {
  it('buildFAQStructuredData yields a non-empty, valid FAQPage for every locale', () => {
    const helpIds = Object.values(FAQ_TOPICS).flat();
    for (const locale of LOCALES) {
      const items = loadJson(locale, 'faq').items as Record<
        string,
        { question?: string; answer?: string }
      >;
      const mainEntitySource = helpIds
        .map((id) => items[id])
        .filter((q): q is { question: string; answer: string } => !!q?.question && !!q?.answer)
        .map((q) => ({ question: q.question, answer: q.answer }));

      // Every help id must resolve — no silent shortfall in any locale (R7).
      expect(mainEntitySource, `${locale} help FAQ shortfall`).toHaveLength(helpIds.length);

      const jsonLd = buildFAQStructuredData(mainEntitySource);
      expect(jsonLd['@type']).toBe('FAQPage');
      expect(jsonLd.mainEntity.length).toBeGreaterThan(0);
      expect(jsonLd.mainEntity[0]).toMatchObject({
        '@type': 'Question',
        acceptedAnswer: { '@type': 'Answer' },
      });
      expect(jsonLd.mainEntity[0].name).toBeTruthy();
      expect(jsonLd.mainEntity[0].acceptedAnswer.text).toBeTruthy();
    }
  });
});

describe('faqRegistry — kill-list (retired content stores stay retired)', () => {
  it('strategies.json and protocols.json no longer hold FAQ items', () => {
    for (const locale of LOCALES) {
      const strFaq = loadJson(locale, 'strategies').faq;
      const proFaq = loadJson(locale, 'protocols').faq;
      // Only the section headers survive; the Q&A content moved to faq.json.
      expect(strFaq.items, `${locale} strategies.json#faq.items should be gone`).toBeUndefined();
      expect(proFaq.q1, `${locale} protocols.json#faq.q1 should be gone`).toBeUndefined();
    }
  });
});
