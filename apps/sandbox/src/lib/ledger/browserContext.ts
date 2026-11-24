/**
 * S1a (plan P12, D3, D10): the browser's decision context — today's state reader, id generator
 * and clock, the same functions the commands called before the split. The one place a decision's
 * `ctx` is built for the browser; a server builds its own (S2b).
 */
import { generateId } from '../ids';
import { getLedgerState } from './core';
import type { DecisionContext } from './decide/types';

export const browserContext: DecisionContext = {
  readState: getLedgerState,
  newId: generateId,
  clock: () => new Date().toISOString(),
};
