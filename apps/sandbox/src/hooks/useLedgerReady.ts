'use client';

import { useSyncExternalStore } from 'react';
import { getReady, subscribe } from '@/lib/ledgerClient';

/**
 * True once the ledger has hydrated from its store (P1.2 slice 1c). The server
 * snapshot is always false (the store is browser-only, G-2), and the client
 * flips to true when `hydrate()` settles — so `<LedgerReadyGate>` can hold the
 * ledger-reading screens until the in-memory log reflects the persisted one.
 */
export function useLedgerReady(): boolean {
  return useSyncExternalStore(subscribe, getReady, () => false);
}
