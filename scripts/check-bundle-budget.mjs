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

  // Total bytes across all .js chunks. Baseline ~3000 KB.
  // Recalibrated 2026-06-17 (cinematic redesign): 3700 → 3950 KB. The GSAP +
  // Three.js cinematic hero adds one DELIBERATE, SHARED, LAZY async chunk
  // (~547 KB raw / ~147 KB gzip — `three` core, named-export tree-shaken, no
  // examples/loaders) reached only via dynamic import() in useWebGLScene, so it
  // is NOT in the initial/critical JS (peak single asset stays 547 KB < 650 KB
  // cap; LCP unaffected). The total-JS sum counts it regardless. New ceiling
  // ~3950 KB keeps the guard's purpose (catch ACCIDENTAL heavy imports) while
  // admitting the one approved library. See docs/audit/PENDING_ALL.md.
  //
  // Recalibrated 2026-06-19 (redesign-v2, additive phases): 3950 → 4096 KB.
  // FINALIZED 2026-06-20 (redesign-v2 Phase 8): kept at 4096 KB. The
  // "Adelaide's World" redesign modernized surfaces IN-PLACE (motion
  // primitives, DivergenceChart/GoalRing, ResultMoment, wedge + Market CTA
  // band) rather than duplicating the old design, so it left NO superseded
  // dead code for a sweep to remove (knip stays at the pre-redesign baseline).
  // The expected "net JS drops at the end" therefore did not materialize: the
  // new primitives are permanent product, and the bundle settled at ~4083 KB.
  // 4096 KB was the snug FINALIZED ceiling (~13 KB / 0.3% headroom over actual)
  // — tight enough to still catch accidental heavy imports (peak/chunk caps
  // unchanged). See REDESIGN_BUILD_PLAN.md §2 + docs/audit/PENDING_ALL.md.
  // Recalibrated 2026-06-30 (investor vertical PR1): 4096 → 4140 KB. The new
  // /investors + gated /investor-room routes add ~54 KB of permanent product
  // JS (two small client forms + the room error boundary; no new heavy library
  // — peak chunk + asset count unchanged). 4140 KB restores ~40 KB / 1%
  // headroom over the ~4099 KB actual while keeping the accidental-heavy-import
  // guard intact. See INVESTOR_VERTICAL_PLAN.md.
  // CORRECTED 2026-07-01 → 4200 KB. The ~4099 KB above was an INCREMENTAL-build
  // undercount; a CLEAN `rm -rf .next && build` of the same investor PR1 commit
  // totals ~4157 KB (all investor-route client chunks present), so 4140 would
  // fail clean CI. 4200 KB = ~43 KB / ~1% headroom over the clean-build truth.
  // (The "How it works" visual scaffold added 0 — not imported by any page, so
  // it is correctly tree-shaken; verified by stashing it: total unchanged.)
  // Recalibrated 2026-07-02 (investor-room document content, PR3): 4200 → 4800 KB.
  // The gated /investor-room/[doc] pages render the full investor documents,
  // stored as the `investor-docs` i18n namespace (generated blocks[] mirroring the
  // source MD). Because i18n namespaces load via the client-reachable dynamic-
  // import context, the ~178 KB/locale × 4 content lands as DELIBERATE, LAZY,
  // per-namespace chunks (~+444 KB EN; ~4625 KB total). These chunks download
  // ONLY for authenticated investors opening a document — never on any public
  // marketing route — so there is ZERO public-user runtime/LCP impact; only the
  // on-disk total (this metric) grows. 4800 KB covers all 4 locales incl. the
  // Phase-2 native-translation expansion (German ~+30% text), with ~1% headroom,
  // while the peak-asset (650 KB) + chunk-count guards stay unchanged to still
  // catch accidental heavy imports. See INVESTOR_ROOM_DOCS_PLAN_2026-07-02.md §7.
  maxTotalJsKB: 4800,

  // Total bytes across all .css chunks. Baseline ~384 KB across 10 files
  // (Tailwind base + design tokens + all CSS modules; Turbopack doesn't
  // tree-shake CSS as aggressively as @next/bundle-analyzer might in
  // webpack mode). 500 KB ceiling = ~30% headroom. Catches accidental
  // bundling of Tailwind's full unminified output (~3 MB) or large
  // unintended CSS imports.
  maxTotalCssKB: 500,

  // Number of .js chunks. Baseline 132. Turbopack splits organically per
  // dynamic import; ceiling = headroom to catch accidental dynamic()-everything
  // regressions.
  // CORRECTED 2026-07-01 → 210. The investor vertical PR1 (3 new routes + the
  // page/room/[doc]/access/api client chunks) raised the clean-build JS chunk
  // count to 203; the PR1 pass measured against an incremental build that
  // undercounted, so the 200 cap was left and would fail clean CI. 210 = ~3%
  // headroom over the 203 clean-build actual. (The "How it works" scaffold adds
  // 0 chunks — not page-imported, tree-shaken.)
  maxAssetCount: 210,
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
  failures.push(`peak asset ${peakKB.toFixed(0)} KB > ${BUDGETS.maxAssetKB} KB cap (${peakName})`);
}
if (totalJsKB > BUDGETS.maxTotalJsKB) {
  failures.push(`total JS ${totalJsKB.toFixed(0)} KB > ${BUDGETS.maxTotalJsKB} KB cap`);
}
if (totalCssKB > BUDGETS.maxTotalCssKB) {
  failures.push(`total CSS ${totalCssKB.toFixed(0)} KB > ${BUDGETS.maxTotalCssKB} KB cap`);
}
if (jsFiles.length > BUDGETS.maxAssetCount) {
  failures.push(`JS chunk count ${jsFiles.length} > ${BUDGETS.maxAssetCount} cap`);
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
