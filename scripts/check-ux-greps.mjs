#!/usr/bin/env node
/**
 * check-ux-greps.mjs — portable replacement for the anti-slop checklist Part 4
 * grep commands (CC-4, UX_GOVERNANCE_FIX_PLAN_2026-07-10).
 *
 * Why this exists instead of the raw greps:
 *  - `grep -P` fails on stock macOS/BSD grep (the old commands only worked on
 *    boxes where grep is aliased to ugrep/GNU grep);
 *  - the old \x{1F300}-\x{1F9FF} ranges missed whole emoji blocks (⭐ U+2B50,
 *    🪙 U+1FA99 and the U+1FA00–1FAFF block, flags U+1F1E6–1F1FF, ⏰ U+23F0);
 *    this script uses the Unicode `Extended_Pictographic` property instead of
 *    hand-rolled ranges, so future emoji are covered automatically;
 *  - `.stories.` fixtures are excluded from the emoji checks (Storybook demo
 *    content was the only hit of the old command — a permanent false positive).
 *
 * Checks (severity per docs/tech/ux-governance/anti-slop-checklist.md Part 4):
 *   1. Emoji in component files (hard FAIL)          — apps/web/src/components/ *.tsx
 *   2. Emoji in translation strings (hard FAIL)      — packages/i18n/translations/ *.json
 *   3. Em-dash density per locale (report-only)      — hot-spot review, never fails
 *   4. Hardcoded English in components (report-only) — heuristic hot-spot finder:
 *      only sees JSX text on lines that also carry className, and drops any line
 *      mentioning intl helpers; treat hits as leads, absence as no signal.
 *
 * Exit code: 1 if check 1 or 2 has hits, else 0.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Two severity tiers, split by Unicode property:
//  - HARD FAIL: characters that render as emoji BY DEFAULT (Emoji_Presentation,
//    e.g. 😀 ⭐ ⏰ 🪙, flags) or any char forced into emoji form via VS16 —
//    these are unambiguously "emoji as UI".
//  - REPORT-ONLY: text-default pictographs (Extended_Pictographic without
//    Emoji_Presentation, e.g. ↗ ▶ ▼ ☺) used as glyph-icons — real
//    design-system findings (should be LucideIcon) but pre-existing usage
//    must not brick the build; they surface as leads for review.
// '©®™' are excluded entirely (legitimate in copy).
const EMOJI_HARD = /\p{Emoji_Presentation}|️/u;
const EMOJI_SOFT = /\p{Extended_Pictographic}/u;
const EMOJI_ALLOW = /^[©®™]$/u;

// Escaped forms ('▼', '\u{1F600}') evade literal-char scanning — the
// 2026-07-10 glyph fix found one this way (StrategiesProtocolTable's mobile
// chevron). Decode escapes in source files and run them through the same tiers.
const ESCAPE_RE = /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})/g;
function decodeEscapes(line) {
  const out = [];
  for (const m of line.matchAll(ESCAPE_RE)) {
    const cp = parseInt(m[1] ?? m[2], 16);
    if (cp >= 0x20 && cp <= 0x10ffff) out.push(String.fromCodePoint(cp));
  }
  return out.join('');
}

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

function emojiHits(files, { excludeStories }) {
  const hard = [];
  const soft = [];
  for (const f of files) {
    if (excludeStories && /\.stories\./.test(f)) continue;
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      let isHard = false;
      let isSoft = false;
      for (const ch of line + decodeEscapes(line)) {
        if (EMOJI_ALLOW.test(ch)) continue;
        if (EMOJI_HARD.test(ch)) isHard = true;
        else if (EMOJI_SOFT.test(ch)) isSoft = true;
      }
      const loc = `${relative(ROOT, f)}:${i + 1}: …${line.trim().slice(0, 80)}`;
      if (isHard) hard.push(loc);
      else if (isSoft) soft.push(loc);
    });
  }
  return { hard, soft };
}

let failed = false;

// 1. Emoji in components (default-emoji chars = hard fail; text-default glyphs = leads)
//    Covers BOTH apps — the sandbox is a real growing UI (P2BD-7, founder 2026-08-18);
//    the GENIUS wall + emoji-in-strings are already guarded in the sandbox's own
//    messages.test.ts, so this closes the last emoji gap (component TSX files).
{
  const files = [
    ...walk(join(ROOT, 'apps/web/src/components'), ['.tsx']),
    ...walk(join(ROOT, 'apps/sandbox/src/components'), ['.tsx']),
  ];
  const { hard, soft } = emojiHits(files, { excludeStories: true });
  if (hard.length) {
    failed = true;
    console.error(`✗ [1] Emoji in component files (${hard.length}):`);
    hard.slice(0, 20).forEach((h) => console.error('    ' + h));
  } else {
    console.log('✓ [1] No emoji in component files (.stories. excluded)');
  }
  if (soft.length) {
    console.log(
      `ℹ [1b] Text-default pictographs used as glyph-icons (leads — should be LucideIcon, not a build fail): ${soft.length}` +
        '\n    ' +
        soft.slice(0, 10).join('\n    ')
    );
  }
}

// 2. Emoji in translation strings (default-emoji chars = hard fail)
{
  const files = walk(join(ROOT, 'packages/i18n/translations'), ['.json']);
  const { hard, soft } = emojiHits(files, { excludeStories: false });
  if (hard.length) {
    failed = true;
    console.error(`✗ [2] Emoji in translation strings (${hard.length}):`);
    hard.slice(0, 20).forEach((h) => console.error('    ' + h));
  } else {
    console.log('✓ [2] No emoji in translation strings');
  }
  if (soft.length)
    console.log(
      `ℹ [2b] Text-default pictographs in translations (leads): ${soft.length}\n    ` +
        soft.slice(0, 10).join('\n    ')
    );
}

// 3. Em-dash density per locale (report-only)
{
  const base = join(ROOT, 'packages/i18n/translations');
  const perLocale = {};
  for (const loc of readdirSync(base)) {
    const dir = join(base, loc);
    if (!statSync(dir).isDirectory()) continue;
    let n = 0;
    for (const f of walk(dir, ['.json'])) n += (readFileSync(f, 'utf8').match(/—/g) || []).length;
    perLocale[loc] = n;
  }
  const total = Object.values(perLocale).reduce((a, b) => a + b, 0);
  console.log(
    `ℹ [3] Em-dash density (hot-spot review, not a fail): total ${total} — ` +
      Object.entries(perLocale)
        .map(([l, n]) => `${l}:${n}`)
        .join(' · ')
  );

  // 3b. The /market template library (5.132e, audit 2026-08-24).
  //     These templates are the SOURCE of published weekly editorial in all
  //     four locales, so their em-dashes reappear every Monday by construction
  //     — but they live outside packages/i18n and so were invisible to the
  //     count above. Report-only, like [3]: the density is a copy decision,
  //     not a build failure.
  const tplDir = join(ROOT, 'apps/web/scripts/market-refresh/templates');
  const perTemplate = {};
  for (const f of walk(tplDir, ['.json'])) {
    const n = (readFileSync(f, 'utf8').match(/—/g) || []).length;
    if (n) perTemplate[f.slice(tplDir.length + 1)] = n;
  }
  const tplTotal = Object.values(perTemplate).reduce((a, b) => a + b, 0);
  console.log(
    `ℹ [3b] Em-dash density, /market templates (regenerates weekly): total ${tplTotal} — ` +
      Object.entries(perTemplate)
        .sort((a, b) => b[1] - a[1])
        .map(([f, n]) => `${f}:${n}`)
        .join(' · ')
  );
}

// 4. Hardcoded English heuristic (report-only)
{
  const files = walk(join(ROOT, 'apps/web/src/components'), ['.tsx']);
  const hits = [];
  for (const f of files) {
    if (/\.stories\./.test(f)) continue;
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (
          /className.*>[A-Z][a-z]/.test(line) &&
          !/intl|FormattedMessage|formatMessage|translation/.test(line)
        ) {
          hits.push(`${relative(ROOT, f)}:${i + 1}`);
        }
      });
  }
  console.log(
    `ℹ [4] Hardcoded-English heuristic (leads, not verdicts): ${hits.length} line(s)` +
      (hits.length ? '\n    ' + hits.slice(0, 10).join('\n    ') : '')
  );
}

process.exit(failed ? 1 : 0);
