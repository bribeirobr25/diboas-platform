/**
 * PreDream Component Types
 *
 * State management types for the PreDream simulation flow
 */

import type { PreDreamPath, PreDreamTimeframe, PreDreamScreen, PreDreamResult } from '@/lib/pre-dream';

/** PreDream component state */
export interface PreDreamState {
  screen: PreDreamScreen;
  disclaimerAccepted: boolean;
  selectedPath: PreDreamPath | null;
  initialAmount: number;
  monthlyContribution: number;
  selectedTimeframe: PreDreamTimeframe;
  result: PreDreamResult | null;
  isAnimating: boolean;
}

/** PreDream reducer actions */
export type PreDreamAction =
  | { type: 'ACCEPT_DISCLAIMER' }
  | { type: 'GO_TO_WELCOME' }
  | { type: 'SELECT_PATH'; path: PreDreamPath }
  | { type: 'SET_INITIAL_AMOUNT'; amount: number }
  | { type: 'SET_MONTHLY_CONTRIBUTION'; amount: number }
  | { type: 'GO_TO_TIMEFRAME' }
  | { type: 'SELECT_TIMEFRAME'; timeframe: PreDreamTimeframe }
  | { type: 'START_SIMULATION'; result: PreDreamResult }
  | { type: 'COMPLETE_SIMULATION' }
  | { type: 'GO_TO_SCREEN'; screen: PreDreamScreen }
  | { type: 'RESET' };

/** PreDream context value */
export interface PreDreamContextValue {
  state: PreDreamState;
  acceptDisclaimer: () => void;
  selectPath: (path: PreDreamPath) => void;
  setInitialAmount: (amount: number) => void;
  setMonthlyContribution: (amount: number) => void;
  goToTimeframe: () => void;
  selectTimeframe: (timeframe: PreDreamTimeframe) => void;
  startSimulation: () => void;
  goToScreen: (screen: PreDreamScreen) => void;
  reset: () => void;
}
