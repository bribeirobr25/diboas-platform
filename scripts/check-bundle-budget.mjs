#!/usr/bin/env node
/**
 * Bundle-budget gate. Run after `pnpm --filter web build`.
 *
 * Phase 5.2 (audit/2026-05-09): replaces the original webpack-based
 * `WebpackPerformancePlugin` budget enforcement, which was inert under
 * Turbopack (removed in F1 audit, 2026-05-08). This Turbopack-aware variant
 * walks the actual built artifacts under `apps/web/.next/static/chunks` and
 * fails CI with a non-zero exit if peak asset, total size, or asset count
 * exceed the recorded baseline + headroom.
 *
 * Baselines from 2026-05-09 build (post-W2 + post-F1 + post-W7 + post-lint
 * + post-5.5 carousel-fill + post-5.1 Sentry tunnel handler):
 *
 *   files:  133  (was 132 pre-5.1 — added /api/monitoring route handler)
 *   total: ~3070 KB
 *   peak:   529 KB  (Turbopack runtime + Next.js client framework — framework-
 *                    level, can't reduce without React 19 / Turbopack tuning)
 *
 * Budget caps below = baseline + ~15-25% headroom. Goal: catch accidental
 * 500-KB-library imports, accidental de-optimization of optimizePackageImports,
 * or 100+ new chunks from a careless dynamic-import — NOT model real-world
 * First Load JS per route (that's a Phase 6 nice-to-have requiring Turbopack
 * manifest parsing).
 *
 * To recalibrate: update BUDGETS below + document the change in
 * docs/audit/PENDING_ALL.md (note current baseline + reason for new ceiling).
 *
 * Usage:
 *   pnpm --filter web build && pnpm check:budget
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CHUNKS_DIR = path.resolve(REPO_ROOT, 'apps/web/.next/static/chunks');

const BUDGETS = {
  // Peak single asset (.js OR .css). Baseline 529 KB (Turbopack runtime).
  // Anything above 650 KB likely means a heavy library landed in framework.
  maxAssetKB: 650,

  // Total bytes across all .js chunks. Baseline ~3000 KB. 3700 KB ceiling
  // = ~23% headroom. Catches accidental 500-KB+ library imports.
  maxTotalJsKB: 3700,

  // Total bytes across all .css chunks. Baseline ~384 KB across 10 files
  // (Tailwind base + design tokens + all CSS modules; Turbopack doesn't
  // tree-shake CSS as aggressively as @next/bundle-analyzer might in
  // webpack mode). 500 KB ceiling = ~30% headroom. Catches accidental
  // bundling of Tailwind's full unminified output (~3 MB) or large
  // unintended CSS imports.
  maxTotalCssKB: 500,

  // Number of .js chunks. Baseline 132. Turbopack splits organically per
  // dynamic import; 200 ceiling = ~50% headroom. Catches accidental
  // dynamic()-everything regressions.
  maxAssetCount: 200,
};

if (!fs.existsSync(CHUNKS_DIR)) {
  console.error(`✖ Build artifacts not found at ${CHUNKS_DIR}.`);
  console.error('  Run `pnpm --filter web build` before `pnpm check:budget`.');
  process.exit(2);
}

const allFiles = fs.readdirSync(CHUNKS_DIR);
const jsFiles = allFiles.filter((f) => f.endsWith('.js'));
const cssFiles = allFiles.filter((f) => f.endsWith('.css'));

let totalJs = 0;
let totalCss = 0;
let peak = 0;
let peakName = '';
for (const f of [...jsFiles, ...cssFiles]) {
  const size = fs.statSync(path.join(CHUNKS_DIR, f)).size;
  if (f.endsWith('.js')) totalJs += size;
  else if (f.endsWith('.css')) totalCss += size;
  if (size > peak) {
    peak = size;
    peakName = f;
  }
}

const totalJsKB = totalJs / 1024;
const totalCssKB = totalCss / 1024;
const peakKB = peak / 1024;

const failures = [];
if (peakKB > BUDGETS.maxAssetKB) {
  failures.push(
    `peak asset ${peakKB.toFixed(0)} KB > ${BUDGETS.maxAssetKB} KB cap (${peakName})`,
  );
}
if (totalJsKB > BUDGETS.maxTotalJsKB) {
  failures.push(
    `total JS ${totalJsKB.toFixed(0)} KB > ${BUDGETS.maxTotalJsKB} KB cap`,
  );
}
if (totalCssKB > BUDGETS.maxTotalCssKB) {
  failures.push(
    `total CSS ${totalCssKB.toFixed(0)} KB > ${BUDGETS.maxTotalCssKB} KB cap`,
  );
}
if (jsFiles.length > BUDGETS.maxAssetCount) {
  failures.push(
    `JS chunk count ${jsFiles.length} > ${BUDGETS.maxAssetCount} cap`,
  );
}

const summary =
  `bundle: ${jsFiles.length} JS (${totalJsKB.toFixed(0)} KB) + ` +
  `${cssFiles.length} CSS (${totalCssKB.toFixed(0)} KB), ` +
  `peak ${peakKB.toFixed(0)} KB (${peakName})`;

if (failures.length) {
  console.error(`✖ Bundle budget exceeded — ${summary}`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  console.error('To recalibrate, update BUDGETS in scripts/check-bundle-budget.mjs');
  console.error('and document the new baseline + reason in docs/audit/PENDING_ALL.md.');
  process.exit(1);
}

console.log(`✓ ${summary} (within budget)`);
