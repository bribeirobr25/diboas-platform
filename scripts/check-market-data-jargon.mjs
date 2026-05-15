#!/usr/bin/env node
/**
 * Phase 7 jargon gate for editorial market data.
 *
 * Scans every JSON file under `apps/web/data/market/` for the 7 banned terms
 * (USDC, stablecoin, DeFi, tokenized, yield farming, liquidity pool, blockchain).
 *
 * Carveout (banned terms ALLOWED): two paths trigger the exemption per
 * CLAUDE.md Phase 7 §Q2a/Q4:
 *   1. The JSON key path contains `disclosure`, `disclaimer`, or
 *      `regulatoryFootnote` (e.g., `regime.disclosure.regulatory.en`).
 *   2. The FILE name contains `disclaimer` or `disclosure`
 *      (e.g., `product-disclaimer.json` — its top-level key is `text`, so
 *      the keyPath alone doesn't trip the carveout, but the file is
 *      definitionally disclaimer content).
 *
 * All other matches fail CI.
 *
 * Plan reference: docs/audit/MARKET_INTEGRATION_ITERATION_3_PLAN_2026-05-14.md §3.4.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve, join } from 'node:path';

const BANNED = [
  'USDC',
  'stablecoin',
  'DeFi',
  'tokenized',
  'yield farming',
  'liquidity pool',
  'blockchain',
];
const BANNED_REGEX = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'i');

const CARVEOUT_KEY_REGEX = /disclosure|disclaimer|regulatoryFootnote/i;
const CARVEOUT_FILENAME_REGEX = /disclosure|disclaimer/i;

const TARGET_DIR = resolve('apps/web/data/market');

/**
 * Recursively walk an object/array, calling fn(value, keyPath) for each
 * string leaf. keyPath is a "." joined path including array indices.
 */
function walkStrings(value, keyPath, fn) {
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

function* listJsonFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* listJsonFiles(full);
    } else if (entry.endsWith('.json')) {
      yield full;
    }
  }
}

const violations = [];

for (const file of listJsonFiles(TARGET_DIR)) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    violations.push({
      file,
      keyPath: '<root>',
      match: 'INVALID_JSON',
      message: err.message,
    });
    continue;
  }

  // File-level carveout: a file whose name says "disclaimer" or "disclosure"
  // is definitionally disclaimer content; skip the per-string walk.
  const filename = basename(file);
  if (CARVEOUT_FILENAME_REGEX.test(filename)) continue;

  walkStrings(parsed, '', (text, keyPath) => {
    const match = text.match(BANNED_REGEX);
    if (!match) return;
    // Key-level carveout: e.g., `regime.disclosure.regulatory.en`.
    if (CARVEOUT_KEY_REGEX.test(keyPath)) return;
    violations.push({ file, keyPath, match: match[0] });
  });
}

if (violations.length > 0) {
  console.error('Phase 7 jargon gate FAILED — banned terms found outside regulatory carveouts:\n');
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    key:   ${v.keyPath}`);
    console.error(`    match: ${v.match}${v.message ? ' — ' + v.message : ''}`);
  }
  console.error(`\nBanned terms: ${BANNED.join(', ')}`);
  console.error('Carveouts (banned terms ALLOWED):');
  console.error('  • keys matching /disclosure|disclaimer|regulatoryFootnote/i');
  console.error('  • file names matching /disclosure|disclaimer/i');
  process.exit(1);
}

console.log(`✓ Phase 7 jargon gate: 0 violations in ${TARGET_DIR}`);
