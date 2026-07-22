'use client';

import { useSyncExternalStore } from 'react';
import { emptyState, type LedgerState } from '@diboas/banking';
import { getLedgerState, subscribe } from '@/lib/ledgerClient';

const SERVER_SNAPSHOT = emptyState();

/**
 * React binding for the play ledger. Server snapshot is the empty state
 * (the store is browser-only, G-2); the client snapshot projects the log.
 */
export function useLedger(): LedgerState {
  return useSyncExternalStore(subscribe, getLedgerState, () => SERVER_SNAPSHOT);
}
