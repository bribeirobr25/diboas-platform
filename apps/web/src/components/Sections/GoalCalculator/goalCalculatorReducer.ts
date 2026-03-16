/**
 * GoalCalculator reducer — pure state machine with adaptive screen flow.
 * Christmas skips timeline screen (5 steps). Emergency/Vacation use all 6.
 */

import type {
  GoalCalculatorState,
  GoalCalculatorAction,
  GoalCalculatorScreen,
  GoalTab,
} from './goalCalculatorTypes';

export const initialGoalCalculatorState: GoalCalculatorState = {
  screen: 'goalSelection',
  activeGoal: null,
  field1Raw: '',
  initialDepositRaw: '',
  monthlyDepositRaw: '',
  isMonthlyOverridden: false,
  riskTierIndex: 0,
  emergencyCoverage: 3,
  emergencyTimeline: 12,
  vacationDate: null,
  isAnimating: false,
  result: null,
  isStartSmaller: false,
};

export function getNextScreen(
  current: GoalCalculatorScreen,
  goal: GoalTab | null,
): GoalCalculatorScreen {
  switch (current) {
    case 'goalSelection':
      return 'goalAmount';
    case 'goalAmount':
      return goal === 'christmas' ? 'depositRisk' : 'timeline';
    case 'timeline':
      return 'depositRisk';
    case 'depositRisk':
      return 'simulation';
    case 'simulation':
      return 'results';
    default:
      return current;
  }
}

export function getBackScreen(
  current: GoalCalculatorScreen,
  goal: GoalTab | null,
): GoalCalculatorScreen {
  switch (current) {
    case 'goalAmount':
      return 'goalSelection';
    case 'timeline':
      return 'goalAmount';
    case 'depositRisk':
      return goal === 'christmas' ? 'goalAmount' : 'timeline';
    case 'results':
      return 'depositRisk';
    default:
      return current;
  }
}

export function getStepNumber(
  screen: GoalCalculatorScreen,
  goal: GoalTab | null,
): number {
  const steps: GoalCalculatorScreen[] =
    goal === 'christmas'
      ? ['goalSelection', 'goalAmount', 'depositRisk', 'simulation', 'results']
      : ['goalSelection', 'goalAmount', 'timeline', 'depositRisk', 'simulation', 'results'];
  const index = steps.indexOf(screen);
  return index >= 0 ? index + 1 : 1;
}

export function getTotalSteps(goal: GoalTab | null): number {
  return goal === 'christmas' ? 5 : 6;
}

function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9.,]/g, '');
}

export function goalCalculatorReducer(
  state: GoalCalculatorState,
  action: GoalCalculatorAction,
): GoalCalculatorState {
  switch (action.type) {
    case 'SELECT_GOAL':
      return {
        ...state,
        activeGoal: action.goal,
        screen: 'goalAmount',
        field1Raw: '',
        isMonthlyOverridden: false,
        monthlyDepositRaw: '',
        isStartSmaller: false,
        result: null,
      };

    case 'SET_FIELD1':
      return { ...state, field1Raw: sanitizeNumericInput(action.value) };

    case 'SET_INITIAL_DEPOSIT':
      return { ...state, initialDepositRaw: sanitizeNumericInput(action.value) };

    case 'SET_MONTHLY_DEPOSIT':
      return {
        ...state,
        monthlyDepositRaw: sanitizeNumericInput(action.value),
        isMonthlyOverridden: true,
      };

    case 'SET_RISK_TIER':
      return { ...state, riskTierIndex: action.index };

    case 'SET_COVERAGE':
      return { ...state, emergencyCoverage: action.coverage };

    case 'SET_TIMELINE':
      return { ...state, emergencyTimeline: action.timeline };

    case 'SET_VACATION_DATE': {
      const date = action.date;
      const now = new Date();
      const tenYears = new Date(now.getFullYear() + 10, now.getMonth(), 1);
      if (date < now || date > tenYears) return state;
      return { ...state, vacationDate: date };
    }

    case 'GO_NEXT':
      return { ...state, screen: getNextScreen(state.screen, state.activeGoal) };

    case 'GO_BACK':
      return { ...state, screen: getBackScreen(state.screen, state.activeGoal) };

    case 'START_SIMULATION':
      return {
        ...state,
        result: action.result,
        isAnimating: true,
        screen: 'simulation',
      };

    case 'FINISH_SIMULATION':
      return { ...state, isAnimating: false, screen: 'results' };

    case 'TOGGLE_START_SMALLER':
      return { ...state, isStartSmaller: !state.isStartSmaller };

    case 'RESET':
      return { ...initialGoalCalculatorState };

    default:
      return state;
  }
}
