/**
 * The client-side application service over the play ledger — the ONE public
 * surface screens, hooks, and tests import from. Since the P2BD-4 extraction
 * (2026-08-19) this is a barrel over `ledger/`:
 *
 *   core.ts      — in-memory log, hydration gate, append/persist seam, reset
 *   journey.ts   — grant · goals · strategy entry/exit · time machine · recurring
 *   rules.ts     — D-r rule CRUD + the W-8 approval ceremony
 *   credits.ts   — the WG-1 Collect tap + the W-5c comparison credit
 *   simEvents.ts — the D-s resolve commit
 *
 * All money math happens in the domain packages (Decimal.js); the modules only
 * compose events and publish state to React via a tiny external store. The
 * append seam (`appendAll`/`base`) stays INTERNAL to `ledger/` — every append
 * goes through a guarded action, never raw from a screen.
 */

export { flush, getLedgerState, getReady, resetSandbox, subscribe } from './ledger/core';
export {
  advanceTime,
  createGoal,
  enterStrategy,
  exitPosition,
  grantPlayMoney,
  previewExit,
  setRecurring,
  splitEntry,
} from './ledger/journey';
export {
  applyRuleProposal,
  createRule,
  declineProposal,
  updateRule,
  type ApplyProposalResult,
} from './ledger/rules';
export { collectWeeklyCredits, grantComparisonCredit } from './ledger/credits';
export { resolveSimulatedExpense, type ResolveExpenseResult } from './ledger/simEvents';
