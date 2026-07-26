'use client';

import { isSandboxLocale, type SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useSettleToNow } from '@/hooks/useSettleToNow';
import { FirstRun } from './FirstRun';
import { HomeScreen } from './HomeScreen';

/**
 * Client switch: first-run split until the ledger is initialized, then home.
 *
 * Gates on ledger-`ready`, not React-hydrated (plan §7): the shared
 * `<LedgerReadyGate>` in `AppChrome` (P1.2 slice 1c) already holds every `(app)`
 * screen until `hydrate()` settles, so `HomeGate` only ever mounts against a
 * hydrated log — no `FirstRun` flash on a returning user. The former
 * `useHydrated()` (React-hydration, ledger-blind) guard is therefore gone: it
 * was dead here and contradicted §7 (CTO §17 F1).
 */
export function HomeGate({ locale }: { locale: string }) {
  const state = useLedger();
  // WS-F: settle real elapsed time to now (idempotent, fail-open). Runs on
  // every app entry; harmless (0 days) before the ledger is initialized.
  const settledDays = useSettleToNow();

  const safeLocale: SandboxLocale = isSandboxLocale(locale) ? locale : 'en';
  if (!state.initialized) return <FirstRun locale={safeLocale} />;
  return <HomeScreen locale={safeLocale} state={state} settledDays={settledDays} />;
}
