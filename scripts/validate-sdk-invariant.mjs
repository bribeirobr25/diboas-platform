#!/usr/bin/env node
/**
 * validate-sdk-invariant.mjs
 *
 * Phase 4 §4.4 (2026-05-25): enforce the §6.10 SDK-consumer invariant from
 * `docs/tech/iter5-sdk-migration-map.md`. Every market-data read must flow
 * through `marketDataService.{getSync,get,getHistoricalAnchors,getMonthlySeries}`
 * — NOT a direct import from `lib/market-data/constants.ts` or
 * `lib/market-data/historical.ts`.
 *
 * Why: when the iter-5 SDK lands, only `marketDataService`'s provider gets
 * swapped. Code that imports `FALLBACK_MARKET_DATA` directly will keep
 * reading the stale hardcoded constants even after the SDK is live —
 * silently breaking provider-driven fields (bank rates, FX, inflation,
 * asset prices, network gas, TVL).
 *
 * Allowlist: `lib/market-data/` itself + tests (which fixture snapshots).
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const webSrc = resolve(repoRoot, 'apps/web/src');

const FORBIDDEN_IMPORTS = [
  // From lib/market-data/constants.ts
  'FALLBACK_MARKET_DATA',
  // From lib/market-data/historical.ts
  'HISTORICAL_ANCHORS_DATA',
];

const ALLOWED_PATHS = [
  /\/lib\/market-data\//,
  /__tests__\//,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
];

function isAllowed(path) {
  return ALLOWED_PATHS.some((re) => re.test(path));
}

let violations = 0;
for (const symbol of FORBIDDEN_IMPORTS) {
  const result = spawnSync('grep', ['-rn', '--include=*.ts', '--include=*.tsx', symbol, webSrc], {
    encoding: 'utf-8',
  });
  if (result.status !== 0 && result.status !== 1) {
    console.error(`grep failed: ${result.stderr}`);
    process.exit(2);
  }
  const lines = (result.stdout ?? '').split('\n').filter((l) => l.trim());
  for (const line of lines) {
    // Format: file:line:content
    const [filePath, lineNumStr, ...rest] = line.split(':');
    const content = rest.join(':');
    if (!filePath || isAllowed(filePath)) continue;
    // Only flag actual import statements (not comments mentioning the symbol).
    if (
      !/^\s*(import|from)\s/.test(content) &&
      !/(import|from)\s.*['"`]@?\/?lib\/market-data\/(constants|historical)/.test(content)
    ) {
      continue;
    }
    // Escape hatch: a `// SDK_INVARIANT_OK:` comment on the import line OR
    // line preceding it documents a justified exception (e.g. re-exporting
    // a Hardcoded field that the SDK does NOT populate per the iter5
    // migration map).
    if (/SDK_INVARIANT_OK/.test(content)) continue;
    // Check up to 5 preceding lines for the marker (allows the comment to
    // be a short paragraph, not just a single line).
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const fileLines = fileContent.split('\n');
      const lineNum = parseInt(lineNumStr, 10);
      let hasMarker = false;
      for (let i = lineNum - 2; i >= Math.max(0, lineNum - 6); i--) {
        if (/SDK_INVARIANT_OK/.test(fileLines[i] ?? '')) {
          hasMarker = true;
          break;
        }
      }
      if (hasMarker) continue;
    } catch {
      // Fall through — flag the violation
    }
    console.error(
      `✗ SDK invariant violation: ${filePath.replace(webSrc, 'apps/web/src')}:${lineNumStr}: ${content.trim()}`
    );
    violations++;
  }
}

if (violations > 0) {
  console.error(`\n${violations} violation(s) of the §6.10 SDK-consumer invariant.`);
  console.error(
    'Every market-data read must go through marketDataService.{getSync,get,getHistoricalAnchors,getMonthlySeries}.'
  );
  console.error(
    'See docs/tech/iter5-sdk-migration-map.md §"Consumer-side invariant (§6.10 lock)".'
  );
  process.exit(1);
}

console.log(
  '✓ SDK invariant clean: 0 direct constants/historical imports outside lib/market-data/.'
);
