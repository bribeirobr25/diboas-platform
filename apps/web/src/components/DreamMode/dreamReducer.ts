/**
 * Dream Mode Reducer
 *
 * State management for Dream Mode navigation and data
 * Extracted from DreamModeProvider for better separation of concerns
 *
 * Domain-Driven Design: State logic isolated in reducer
 * Code Reusability: Reducer can be tested independently
 */

import type { DreamState, DreamAction, DreamScreen } from './types';
import { STORAGE_KEYS } from '@/lib/dream-mode';

/**
 * Screen order for navigation
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */
export const SCREEN_ORDER: DreamScreen[] = [
  'disclaimer',
  'welcome',
  'pathSelect',
  'input',
  'timeframe',
  'simulation',
  'results',
  'share',
];

/**
 * Initial state
 */
export const initialState: DreamState = {
  screen: 'disclaimer',
  disclaimerAccepted: false,
  selectedPath: null,
  input: {
    initialAmount: 1000,
    monthlyContribution: 100,
    currency: 'USD',
    timeframe: '1year',
  },
  result: null,
  animationProgress: 0,
  isPlaying: false,
};

/**
 * State reducer for Dream Mode
 */
export function dreamReducer(state: DreamState, action: DreamAction): DreamState {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };

    case 'NEXT_SCREEN': {
      const currentIndex = SCREEN_ORDER.indexOf(state.screen);
      const nextIndex = Math.min(currentIndex + 1, SCREEN_ORDER.length - 1);
      return { ...state, screen: SCREEN_ORDER[nextIndex] };
    }

    case 'PREVIOUS_SCREEN': {
      const currentIndex = SCREEN_ORDER.indexOf(state.screen);
      // Don't go back past disclaimer if it's been accepted
      const minIndex = state.disclaimerAccepted ? 1 : 0;
      const prevIndex = Math.max(currentIndex - 1, minIndex);
      return { ...state, screen: SCREEN_ORDER[prevIndex] };
    }

    case 'ACCEPT_DISCLAIMER': {
      // Store acceptance timestamp in sessionStorage for CLO compliance
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED, 'true');
        sessionStorage.setItem(STORAGE_KEYS.DISCLAIMER_TIMESTAMP, new Date().toISOString());
      }
      return {
        ...state,
        disclaimerAccepted: true,
        screen: 'welcome',
      };
    }

    case 'SELECT_PATH': {
      // Store selected path for analytics
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.SELECTED_PATH, action.path);
      }
      return {
        ...state,
        selectedPath: action.path,
        screen: 'input',
      };
    }

    case 'SET_INPUT':
      return {
        ...state,
        input: { ...state.input, ...action.input },
      };

    case 'SET_RESULT':
      return { ...state, result: action.result };

    case 'SET_ANIMATION_PROGRESS':
      return { ...state, animationProgress: action.progress };

    case 'START_SIMULATION':
      return { ...state, isPlaying: true, animationProgress: 0 };

    case 'COMPLETE_SIMULATION':
      return { ...state, isPlaying: false, animationProgress: 100 };

    case 'RESET':
      // Reset to path selection (keep disclaimer accepted)
      return {
        ...initialState,
        disclaimerAccepted: state.disclaimerAccepted,
        screen: state.disclaimerAccepted ? 'pathSelect' : 'disclaimer',
      };

    default:
      return state;
  }
}
