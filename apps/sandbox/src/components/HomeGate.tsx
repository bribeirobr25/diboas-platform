'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSandboxLocale, type SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useSettleToNow } from '@/hooks/useSettleToNow';
import { HomeScreen } from './HomeScreen';

/**
 * Client switch: an uninitialized ledger routes to the Claim ceremony (the ONE
 * canonical grant path, W-5a/decision F); once initialized, Home renders.
 *
 * The former MVP-0 `FirstRun` chain (old Welcome → SalaryStep → grantAndSplit,
 * which emitted the product-deprecated `JobsSplitSet`) was deleted in the R1
 * audit cleanup (2026-08-18): its function is superseded by Welcome/Consent/
 * Claim (D-8 — first-run's fn = the Home empty state, which is the redirect).
 *
 * Gates on ledger-`ready`, not React-hydrated (plan §7): the shared
 * `<LedgerReadyGate>` in `AppChrome` (P1.2 slice 1c) already holds every `(app)`
 * screen until `hydrate()` settles, so `HomeGate` only ever mounts against a
 * hydrated log — no redirect flash on a returning user.
 */
export function HomeGate({ locale }: { locale: string }) {
  const state = useLedger();
  const router = useRouter();
  // WS-F: settle real elapsed time to now (idempotent, fail-open) — side effect
  // only; the mockup Home no longer shows a "while you were away" beat.
  useSettleToNow();

  const safeLocale: SandboxLocale = isSandboxLocale(locale) ? locale : 'en';
  const initialized = state.initialized;

  useEffect(() => {
    if (!initialized) router.replace(`/${safeLocale}/claim`);
  }, [initialized, safeLocale, router]);

  if (!initialized) return null; // redirecting to the claim ceremony
  return <HomeScreen locale={safeLocale} state={state} />;
}
