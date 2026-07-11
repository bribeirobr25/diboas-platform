/**
 * M3 — prohibited-vocabulary gate for Money Jobs copy (CLO-light pass
 * 2026-07-11, condition C5; spec §9).
 *
 * Asserts the CLO kill-list AND the Phase-7 jargon list never appear in
 * `tools-money-jobs.json` across all 4 locales, NOR in the tool's OG/share
 * strings (C5 explicitly includes share surfaces — they travel furthest).
 *
 * Precedent: scripts/check-market-data-jargon.mjs (walk string leaves,
 * regex per banned term, fail with key path).
 *
 * Scope notes:
 * - "earn"-family verbs are banned on the FREE surface but the GATED plan
 *   may describe scenario outcomes ("could earn about X more than at your
 *   bank") — that phrasing was ruled acceptable because it is conditional,
 *   scenario-labeled, and behind the gate (C4 keeps Conservative leading).
 *   The gate here bans the unconditional forms (guarantee/promise/risk-free),
 *   which are prohibited everywhere, and jargon, which is prohibited
 *   everywhere including the plan.
 * - Disclaimer keys get NO carveout: this tool's disclaimer is one plain
 *   sentence and must itself stay jargon-free.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { OG_TRANSLATIONS } from '@/app/api/og/share/ogTranslations';
import { PAGE_CONFIGS } from '@/lib/og/templates';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

const TRANSLATIONS_DIR = join(__dirname, '../../../../../../packages/i18n/translations');

/** CLO kill-list — unconditional promise/safety vocabulary, all locales. */
const KILL_LIST: ReadonlyArray<RegExp> = [
  /\bguarantee[ds]?\b/i,
  /\bguaranteed returns?\b/i,
  /\bgarantid[oa]s?\b/i, // pt/es "garantido/garantizada"
  /\bgarantiert\b/i,
  /\brisk[- ]free\b/i,
  /\bsem risco\b/i,
  /\bsin riesgo\b/i,
  /\brisikofrei\b/i,
  /\bno risk\b/i,
  /\bFDIC\b/i,
  /\bFGC\b/, // BR deposit-insurance acronym — bank-protection phrasing
  /\binsured\b/i,
  /\bsegurad[oa]\b/i,
  /\bversichert\b/i,
  /\byou will earn\b/i,
  /\bvocê vai ganhar\b/i,
  /\bganarás\b/i,
  /\bwirst du verdienen\b/i,
  /\bwe recommend\b/i, // advice phrasing — the tool describes, never advises
  /\brecomendamos\b/i,
  /\bwir empfehlen\b/i,
  /\d+(?:[.,]\d+)?\s*%\s*(?:APY|a\.a\.|p\.a\.|yield)/i, // yield numbers attached to money
];

/** Phase-7 jargon list (check-market-data-jargon.mjs) — banned everywhere. */
const JARGON_LIST: ReadonlyArray<RegExp> = [
  /\bUSDC\b/,
  /\bstablecoins?\b/i,
  /\bDeFi\b/,
  /\btokenized\b/i,
  /\byield farming\b/i,
  /\bliquidity pools?\b/i,
  /\bblockchain\b/i,
];

function walkStrings(
  value: unknown,
  keyPath: string,
  fn: (leaf: string, path: string) => void
): void {
  if (typeof value === 'string') {
    fn(value, keyPath);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, `${keyPath}[${i}]`, fn));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      walkStrings(v, keyPath ? `${keyPath}.${k}` : k, fn);
    }
  }
}

function violationsIn(root: unknown, patterns: ReadonlyArray<RegExp>): string[] {
  const hits: string[] = [];
  walkStrings(root, '', (leaf, path) => {
    for (const re of patterns) {
      if (re.test(leaf)) hits.push(`${path}: "${leaf}" matches ${re}`);
    }
  });
  return hits;
}

describe('M3 — Money Jobs prohibited-vocabulary gate (C5)', () => {
  for (const locale of LOCALES) {
    const file = join(TRANSLATIONS_DIR, locale, 'tools-money-jobs.json');
    const messages = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

    it(`should contain no CLO kill-list vocabulary when scanning ${locale}`, () => {
      expect(violationsIn(messages, KILL_LIST)).toEqual([]);
    });

    it(`should contain no Phase-7 jargon when scanning ${locale}`, () => {
      expect(violationsIn(messages, JARGON_LIST)).toEqual([]);
    });
  }

  it('should keep the OG page template strings clean (C5 share surface)', () => {
    const template = PAGE_CONFIGS['tools-money-jobs'];
    expect(violationsIn(template, [...KILL_LIST, ...JARGON_LIST])).toEqual([]);
  });

  it('should keep the share-card toolName/headline strings clean in all locales', () => {
    for (const locale of LOCALES) {
      const t = OG_TRANSLATIONS[locale].toolResult;
      const strings = [t.toolName['money-jobs'], t.headlineByTool['money-jobs']];
      expect(strings.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
      expect(violationsIn(strings, [...KILL_LIST, ...JARGON_LIST])).toEqual([]);
    }
  });
});
