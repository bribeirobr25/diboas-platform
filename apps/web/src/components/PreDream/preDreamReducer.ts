/**
 * PreDream Reducer
 *
 * State management for PreDream navigation and data
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results
 */

import type { PreDreamState, PreDreamAction } from './types';

export const initialPreDreamState: PreDreamState = {
  screen: 'disclaimer',
  disclaimerAccepted: false,
  selectedPath: null,
  initialAmount: 1000,
  monthlyContribution: 100,
  selectedTimeframe: '1year',
  result: null,
  isAnimating: false,
};

export function preDreamReducer(state: PreDreamState, action: PreDreamAction): PreDreamState {
  switch (action.type) {
    case 'ACCEPT_DISCLAIMER':
      return { ...state, disclaimerAccepted: true, screen: 'welcome' };

    case 'GO_TO_WELCOME':
      return { ...state, screen: 'welcome' };

    case 'SELECT_PATH':
      return { ...state, selectedPath: action.path, screen: 'input' };

    case 'SET_INITIAL_AMOUNT':
      return { ...state, initialAmount: action.amount };

    case 'SET_MONTHLY_CONTRIBUTION':
      return { ...state, monthlyContribution: action.amount };

    case 'GO_TO_TIMEFRAME':
      return { ...state, screen: 'timeframe' };

    case 'SELECT_TIMEFRAME':
      return { ...state, selectedTimeframe: action.timeframe };

    case 'START_SIMULATION':
      return {
        ...state,
        result: action.result,
        isAnimating: true,
        screen: 'simulation',
      };

    case 'COMPLETE_SIMULATION':
      return { ...state, isAnimating: false, screen: 'results' };

    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };

    case 'RESET':
      return {
        ...initialPreDreamState,
        disclaimerAccepted: state.disclaimerAccepted,
        screen: state.disclaimerAccepted ? 'pathSelect' : 'disclaimer',
      };

    default:
      return state;
  }
}
