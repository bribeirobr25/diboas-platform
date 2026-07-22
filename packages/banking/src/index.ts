/**
 * @diboas/banking — Banking domain package.
 *
 * MVP-0 (Sandbox) activation, 2026-07-18: canonical fee math (FEES.md
 * parameterization, Decimal.js mandate) and the event-sourced play ledger
 * (events, stores, projection, reconciliation invariant).
 * See docs/sandbox-app/ for the governing rules.
 */

export const BANKING_PACKAGE_VERSION = '0.2.0';

export * from './fees';
export * from './ledger/events';
export * from './ledger/store';
export * from './ledger/engine';
