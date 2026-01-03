/**
 * Dream Mode - Types
 *
 * Types for the dream simulation flow with CLO compliance
 */

import type { DreamPath } from '@/lib/dream-mode';

/**
 * Dream Mode screen identifiers
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */
export type DreamScreen =
  | 'disclaimer'  // Screen 0: CLO-required disclaimer gate
  | 'welcome'     // Screen 1: Introduction
  | 'pathSelect'  // Screen 2: Path selection (Safety/Balance/Growth)
  | 'input'       // Screen 3: Amount input
  | 'timeframe'   // Screen 4: Timeframe selection
  | 'simulation'  // Screen 5: Growth animation
  | 'results'     // Screen 6: Results with bank comparison
  | 'share';      // Screen 7: Share and CTA

/**
 * User input state for dream simulation
 */
export interface DreamInput {
  /** Initial investment amount */
  initialAmount: number;
  /** Monthly contribution */
  monthlyContribution: number;
  /** Currency code */
  currency: string;
  /** Selected timeframe */
  timeframe: '1week' | '1month' | '1year' | '5years';
}

/**
 * Simulation result state
 */
export interface DreamResult {
  /** DeFi final balance */
  defiBalance: number;
  /** Bank final balance */
  bankBalance: number;
  /** Interest earned with DeFi */
  defiInterest: number;
  /** Interest earned with bank */
  bankInterest: number;
  /** Difference between DeFi and bank */
  difference: number;
  /** Growth percentage with DeFi */
  growthPercentage: number;
  /** Total investment (initial + monthly contributions) */
  totalInvestment?: number;
  /** APY rate used for calculation based on selected path */
  pathApy?: number;
}

/**
 * Dream Mode state
 */
export interface DreamState {
  /** Current screen */
  screen: DreamScreen;
  /** Whether CLO disclaimer has been accepted */
  disclaimerAccepted: boolean;
  /** Selected investment path (Safety/Balance/Growth) */
  selectedPath: DreamPath | null;
  /** User inputs */
  input: DreamInput;
  /** Calculation results */
  result: DreamResult | null;
  /** Animation progress (0-100) */
  animationProgress: number;
  /** Whether simulation is playing */
  isPlaying: boolean;
}

/**
 * Dream Mode actions
 */
export type DreamAction =
  | { type: 'GO_TO_SCREEN'; screen: DreamScreen }
  | { type: 'NEXT_SCREEN' }
  | { type: 'PREVIOUS_SCREEN' }
  | { type: 'ACCEPT_DISCLAIMER' }
  | { type: 'SELECT_PATH'; path: DreamPath }
  | { type: 'SET_INPUT'; input: Partial<DreamInput> }
  | { type: 'SET_RESULT'; result: DreamResult }
  | { type: 'SET_ANIMATION_PROGRESS'; progress: number }
  | { type: 'START_SIMULATION' }
  | { type: 'COMPLETE_SIMULATION' }
  | { type: 'RESET' };

/**
 * Dream Mode context value
 */
export interface DreamContextValue {
  state: DreamState;
  dispatch: React.Dispatch<DreamAction>;
  goToScreen: (screen: DreamScreen) => void;
  nextScreen: () => void;
  previousScreen: () => void;
  acceptDisclaimer: () => void;
  selectPath: (path: DreamPath) => void;
  setInput: (input: Partial<DreamInput>) => void;
  startSimulation: () => void;
  reset: () => void;
}
