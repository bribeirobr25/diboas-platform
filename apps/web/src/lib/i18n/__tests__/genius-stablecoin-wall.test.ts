/**
 * B2-5 — GENIUS-Act stablecoin/yield copy wall (regression guard).
 *
 * Rule (US GENIUS Act, signed 2025-07-18; CLO ruling in
 * docs/sandbox-app/CC_B1_B2_EXECUTION_LIST_2026-07-21.md §"CLO VERIFICATION"):
 * a payment stablecoin ("digital dollar" / USDC) must NEVER be described as
 * "earning" or "yielding." Returns come from the *strategy* (the DeFi position,
 * variable), never from *holding* the stablecoin. So an "earn/yield"-family word
 * must not sit within ~40 chars of a "digital dollar / USDC / stablecoin" token.
 *
 * The canonical wall phrasing (CLO-adopted): "the returns come from the
 * strategy, not from holding the dollars."
 *
 * This guard fails the build on any NEW pairing, EXCEPT the explicit allow-list
 * the CLO scoped from the 2026-07-21 inventory:
 *   - PERMANENT: protocol-mechanism labels in the transparency table (Cat 2 —
 *     they describe how a *protocol* works, not that the user's position earns)
 *     and disclaimers/tooltips (Cat 4 — they state returns are NOT guaranteed).
 *   - TRANSCREATION-PENDING: es/de strings whose fix rides the sandbox/web
 *     transcreation pass (Cat 1 safeHarbor es/de, Cat 3 es tool-notes). REMOVE
 *     these from the allow-list when transcreation lands.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const TRANSLATIONS_DIR = join(__dirname, '../../../../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/**
 * The patterns live in ONE file both walls read (this one and the apps/sandbox mirror), so
 * they cannot drift (register `5.749`). Widened 2026-11-04: hyphenated "digital-dollar",
 * pt-BR "dólares digitais" and German inflected forms ("digitalen Dollar", "Digital-Dollar"),
 * which the old `digital dollar` missed while live strings paired them with "yield"/"Rendite".
 */
const PATTERNS = JSON.parse(
  readFileSync(join(__dirname, '../../../../../../config/genius-wall-patterns.json'), 'utf8')
) as { earn: string; stable: string };
const EARN = PATTERNS.earn;
const STABLE = PATTERNS.stable;
const PAIRING = new RegExp(`(?:${EARN}).{0,40}(?:${STABLE})|(?:${STABLE}).{0,40}(?:${EARN})`, 'i');

/** `${locale}::${namespace}::${keyPath}` — CLO-scoped (2026-07-21 inventory). */
const ALLOW: ReadonlySet<string> = new Set([
  // --- PERMANENT · Cat 2 · protocol-mechanism (factual transparency table) ---
  'en::protocols::cards.ethena.description',
  'en::protocols::cards.sky.description',
  'en::strategies::protocols.items.skySsr.type',
  'es::protocols::cards.ethena.description',
  'es::strategies::protocols.items.aaveV3.summary',
  'es::strategies::protocols.items.compoundV3.summary',
  'es::strategies::protocols.items.skySsr.type',
  'de::protocols::cards.ethena.description',
  'de::protocols::cards.sky.description',
  'de::strategies::protocols.items.aaveV3.summary',
  'de::strategies::protocols.items.compoundV3.summary',
  'de::strategies::protocols.items.skySsr.type',
  'pt-BR::protocols::cards.ethena.description',
  'pt-BR::strategies::protocols.items.skySsr.type',
  // --- PERMANENT · Cat 4 · disclaimers / tooltips (state returns NOT guaranteed) ---
  'es::tools-shared::disclaimer',
  'pt-BR::learn-compound-interest::calculator.calibrationNote',
  'pt-BR::tools-shared::disclaimer',
  // --- TRANSCREATION-PENDING · remove when the es/de pass fixes these ---
  'de::strategies::strategies.safeHarbor.description2', // Cat 1
  'es::strategies::strategies.safeHarbor.description2', // Cat 1
  // NB: the investor-docs pitch-deck "USDC plus on-chain yield" bullets were
  // RULED out of consumer GENIUS scope (CLO final sign-off 2026-07-21) yet
  // reworded to "on-chain returns" for house-style hygiene — so they no longer
  // pair and are intentionally NOT allow-listed here.
]);

function walkStrings(
  value: unknown,
  keyPath: string,
  fn: (leaf: string, path: string) => void
): void {
  if (typeof value === 'string') return fn(value, keyPath);
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, `${keyPath}[${i}]`, fn));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, keyPath ? `${keyPath}.${k}` : k, fn);
  }
}

/**
 * Every translation file of a locale, subfolders included (`legal/*.json` were never scanned
 * before 2026-10-30, register `5.725`: a strengthening of the wall, never a relaxation).
 */
function translationFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.json'))
    .sort();
}

describe('B2-5 — GENIUS-Act stablecoin/yield copy wall', () => {
  it('should scan every translation file, the legal pages included, in every locale', () => {
    for (const locale of LOCALES) {
      const files = translationFiles(join(TRANSLATIONS_DIR, locale));
      expect(files, locale).toContain('legal/privacy.json');
      expect(files, locale).toContain('common.json');
    }
  });

  for (const locale of LOCALES) {
    it(`should not pair earn/yield with a stablecoin token outside the allow-list (${locale})`, () => {
      const dir = join(TRANSLATIONS_DIR, locale);
      const unlisted: string[] = [];
      for (const file of translationFiles(dir)) {
        const ns = file.replace(/\.json$/, '');
        const json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
        walkStrings(json, '', (leaf, path) => {
          if (PAIRING.test(leaf) && !ALLOW.has(`${locale}::${ns}::${path}`)) {
            unlisted.push(`${locale}::${ns}::${path} — "${leaf}"`);
          }
        });
      }
      expect(unlisted, 'new stablecoin-earns pairing (see the GENIUS wall guard)').toEqual([]);
    });
  }

  /**
   * Code literals too (`5.749`): user-facing text also lives in TS/TSX (SEO constants, JSON-LD
   * fallbacks), and the catalogue scan never saw it. Exceptions are named by file and the
   * literal's opening words, never by pattern.
   */
  const CODE_ALLOW: ReadonlySet<string> = new Set([
    // Cat 2 · protocol mechanism, and NOT RENDERED: the page reads every card text from the
    // catalogue (`cards.<id>.description`, itself Cat 2-listed above). The dead text fields of
    // this file are registered for deletion in their own increment.
    'components/Pages/Protocols/protocolsData.ts::The original DeFi system. Running since 2014.',
    'components/Pages/Protocols/protocolsData.ts::Creates a synthetic dollar (USDe) through hedged',
  ]);
  const WEB_SRC = join(__dirname, '../../..');
  const LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

  it('should not pair earn/yield with a stablecoin token in any TS/TSX string literal under apps/web/src', () => {
    const found: string[] = [];
    const files = (readdirSync(WEB_SRC, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.test\.|\.stories\.)/.test(f));
    expect(files.length).toBeGreaterThan(300);
    for (const file of files) {
      for (const m of readFileSync(join(WEB_SRC, file), 'utf8').matchAll(LITERAL)) {
        const text = m[0].slice(1, -1);
        if (!PAIRING.test(text)) continue;
        const listed = [...CODE_ALLOW].some((id) => {
          const [f, opening] = id.split('::');
          return f === file && text.startsWith(opening as string);
        });
        if (!listed) found.push(`${file} — "${text.slice(0, 120)}"`);
      }
    }
    expect(found, 'a code literal pairs earn/yield with a stablecoin token').toEqual([]);
  });

  it('allow-list has no stale entries (every entry still matches the pairing)', () => {
    const stale: string[] = [];
    const seen = new Set<string>();
    for (const locale of LOCALES) {
      const dir = join(TRANSLATIONS_DIR, locale);
      for (const file of translationFiles(dir)) {
        const ns = file.replace(/\.json$/, '');
        const json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
        walkStrings(json, '', (leaf, path) => {
          const id = `${locale}::${ns}::${path}`;
          if (ALLOW.has(id) && PAIRING.test(leaf)) seen.add(id);
        });
      }
    }
    for (const id of ALLOW) if (!seen.has(id)) stale.push(id);
    expect(stale, 'allow-list entry no longer pairs — remove it').toEqual([]);
  });
});
