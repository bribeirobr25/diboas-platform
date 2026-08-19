/**
 * Bitcoin view data module (M2 — plan v3 D-M2-4, per the CTO board's
 * static-import finding). Each market view owns one of these: a module whose
 * ONLY job is to hold the view's STATIC JSON imports, preserving the
 * load-bearing build-time inlining (Turbopack resolveJsonModule constants —
 * editorial PRs reach production via Vercel rebuild, never runtime disk
 * reads) while `mock-client.server.ts` dispatches views lazily via a static
 * `import()` map. New market views add `loaders/<slug>.server.ts` with their
 * own imports from `apps/web/data/market/<slug>/ (or shared/)` (Bitcoin reads the data
 * root — the D-M2-3(ii) documented asymmetry until the post-2026-08-17
 * migration).
 */

import currentRegimeJson from '@/../data/market/shared/regime.json';
import dataStatusJson from '@/../data/market/shared/data-status.json';
import historicalJson from '@/../data/market/shared/historical.json';
import methodologyJson from '@/../data/market/shared/methodology.json';
import productDisclaimerJson from '@/../data/market/shared/product-disclaimer.json';
import signalsJson from '@/../data/market/shared/signals.json';

/** Raw (locale-keyed) editorial JSON for the view — the mock client owns
 *  localization/flattening so every view shares one transformation path. */
export const viewData = {
  regime: currentRegimeJson,
  dataStatus: dataStatusJson,
  historical: historicalJson,
  methodology: methodologyJson,
  productDisclaimer: productDisclaimerJson,
  signals: signalsJson,
} as const;

export type RawViewData = {
  [K in keyof typeof viewData]: unknown;
};
