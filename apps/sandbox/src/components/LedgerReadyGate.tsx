'use client';

import type { ReactNode } from 'react';
import { useLedgerReady } from '@/hooks/useLedgerReady';

/**
 * Holds the ledger-reading content until the ledger has hydrated (P1.2 slice
 * 1c, plan §7). Rendered inside `AppChrome` AROUND `{children}` — so the app
 * bar, tab bar, and the persistent PLAY MONEY badge stay visible during the
 * wait (R-4: every screen stays labeled play money), and only the main content
 * area holds. Covers all four `(app)` ledger screens through the one shell, so a
 * deep-link/refresh straight to a sub-route can never render something FALSE
 * about the user's money (HomeGate→claim-redirect flash, HistoryScreen→"nothing
 * happened", etc. — the R-4 dishonest-degradation the gate exists to prevent).
 *
 * Renders nothing while hydrating. In P1.2 (LocalStorage) that window is one
 * microtask — invisible. Phase 2 (Neon cold-start, seconds) is where a real
 * loading affordance belongs; it lands with the Phase-2 hydration work, not
 * here (adding onboarding-grade loading copy for a one-frame P1.2 window would
 * flash worse than a blank main).
 */
export function LedgerReadyGate({ children }: { children: ReactNode }) {
  const ready = useLedgerReady();
  if (!ready) return null;
  return <>{children}</>;
}
