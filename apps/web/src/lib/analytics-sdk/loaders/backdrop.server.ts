/**
 * Macro Backdrop view data module (M3 — plan v3 §1). The backdrop is a
 * PRESENTATION of the shared weekly run's macro slice, so this module imports
 * the SAME editorial JSONs as `bitcoin.server.ts` — **intentional per-module
 * duplication** (CTO R-4): build-time inlining is per-module by design, and
 * sharing one module would couple two views' data lifetimes. The 5.92
 * migration updates BOTH loaders' import paths and must not "simplify" this
 * away.
 */

import currentRegimeJson from '@/../data/market/regime.json';
import dataStatusJson from '@/../data/market/data-status.json';
import historicalJson from '@/../data/market/historical.json';
import methodologyJson from '@/../data/market/methodology.json';
import productDisclaimerJson from '@/../data/market/product-disclaimer.json';
import signalsJson from '@/../data/market/signals.json';

export const viewData = {
  regime: currentRegimeJson,
  dataStatus: dataStatusJson,
  historical: historicalJson,
  methodology: methodologyJson,
  productDisclaimer: productDisclaimerJson,
  signals: signalsJson,
} as const;
