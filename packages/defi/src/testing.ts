/**
 * TEST / FIXTURE helpers. **Not for production code.**
 *
 * The role is in the FILE NAME on purpose (Founder/Strategy 2026-09-18): the
 * prohibition below must be visible at the import site, not carried as tribal
 * knowledge. Anything here exists so tests can stay short — never so production
 * can skip stating a truth explicitly.
 *
 * ⚑ THE PROHIBITION, and why it has its own file and its own guard test:
 *
 *   EXTERNAL SOURCE ≠ OBSERVED
 *
 * `observedStamp` asserts OBSERVED by its own name, which is truthful for a
 * fixture that means exactly that. In production the same convenience would be
 * a semantic default — silence meaning "observed" — which is precisely the
 * failure the explicit-origin contract exists to prevent. Production therefore
 * uses `evidenceStamp`, where `origin` is a REQUIRED argument and omitting it
 * is a compile error.
 *
 * `evidenceOriginGuard.test.ts` fails the build if any file outside `__tests__`
 * references this module, so the rule is mechanical rather than remembered.
 */

import { evidenceStamp, type DataStamp } from './types';

/**
 * A fixture stamp for an OBSERVED provider reading.
 *
 * Explicit by name: a caller writing `observedStamp` is stating the origin, not
 * omitting it. Kept so ~26 existing fixtures need no churn — churn in test
 * files is where a real behavioural change hides.
 */
export function observedStamp(
  source: 'defillama' | 'coingecko',
  asOf: string,
  observedAt: string | null = null
): DataStamp {
  return evidenceStamp({ source, origin: 'OBSERVED', asOf, observedAt });
}
