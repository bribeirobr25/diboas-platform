'use client';

import { useSyncExternalStore } from 'react';
import { isSandboxLocale, type SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useSettleToNow } from '@/hooks/useSettleToNow';
import { FirstRun } from './FirstRun';
import { HomeScreen } from './HomeScreen';

const noopSubscribe = () => () => {};

/** True after hydration, false during SSR — the store-based mounted idiom. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * Client switch: first-run split until the ledger is initialized, then home.
 * Hydration note: the ledger lives in localStorage, so the server render is
 * always the empty state; we only decide after hydration (no SSR mismatch).
 */
export function HomeGate({ locale }: { locale: string }) {
  const state = useLedger();
  const hydrated = useHydrated();
  // WS-F: settle real elapsed time to now (idempotent, fail-open). Runs on
  // every app entry; harmless (0 days) before the ledger is initialized.
  const settledDays = useSettleToNow();

  const safeLocale: SandboxLocale = isSandboxLocale(locale) ? locale : 'en';
  if (!hydrated) return null;
  if (!state.initialized) return <FirstRun locale={safeLocale} />;
  return <HomeScreen locale={safeLocale} state={state} settledDays={settledDays} />;
}
