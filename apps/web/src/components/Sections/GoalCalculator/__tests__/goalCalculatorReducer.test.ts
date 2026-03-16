import { describe, it, expect } from 'vitest';
import {
  goalCalculatorReducer,
  initialGoalCalculatorState,
  getNextScreen,
  getBackScreen,
  getStepNumber,
  getTotalSteps,
} from '../goalCalculatorReducer';
import type { GoalCalculatorState } from '../goalCalculatorTypes';

function stateWith(overrides: Partial<GoalCalculatorState>): GoalCalculatorState {
  return { ...initialGoalCalculatorState, ...overrides };
}

describe('goalCalculatorReducer', () => {
  describe('adaptive screen flow', () => {
    it('should advance Christmas from goalAmount directly to depositRisk (skip timeline)', () => {
      const state = stateWith({ screen: 'goalAmount', activeGoal: 'christmas' });
      const result = goalCalculatorReducer(state, { type: 'GO_NEXT' });
      expect(result.screen).toBe('depositRisk');
    });

    it('should advance Emergency from goalAmount to timeline', () => {
      const state = stateWith({ screen: 'goalAmount', activeGoal: 'emergency' });
      const result = goalCalculatorReducer(state, { type: 'GO_NEXT' });
      expect(result.screen).toBe('timeline');
    });

    it('should advance Vacation from goalAmount to timeline', () => {
      const state = stateWith({ screen: 'goalAmount', activeGoal: 'vacation' });
      const result = goalCalculatorReducer(state, { type: 'GO_NEXT' });
      expect(result.screen).toBe('timeline');
    });

    it('should go back from depositRisk to goalAmount for Christmas (skip timeline)', () => {
      const state = stateWith({ screen: 'depositRisk', activeGoal: 'christmas' });
      const result = goalCalculatorReducer(state, { type: 'GO_BACK' });
      expect(result.screen).toBe('goalAmount');
    });

    it('should go back from depositRisk to timeline for Emergency', () => {
      const state = stateWith({ screen: 'depositRisk', activeGoal: 'emergency' });
      const result = goalCalculatorReducer(state, { type: 'GO_BACK' });
      expect(result.screen).toBe('timeline');
    });

    it('should go back from depositRisk to timeline for Vacation', () => {
      const state = stateWith({ screen: 'depositRisk', activeGoal: 'vacation' });
      const result = goalCalculatorReducer(state, { type: 'GO_BACK' });
      expect(result.screen).toBe('timeline');
    });
  });

  describe('state transitions', () => {
    it('should reset all state on RESET action', () => {
      const dirtyState = stateWith({
        screen: 'results',
        activeGoal: 'christmas',
        field1Raw: '50000',
        initialDepositRaw: '1000',
        riskTierIndex: 2,
        isAnimating: true,
        result: { good: 100, expected: 90, bad: 80 },
        isStartSmaller: true,
      });
      const result = goalCalculatorReducer(dirtyState, { type: 'RESET' });
      expect(result).toEqual(initialGoalCalculatorState);
    });

    it('should toggle isStartSmaller on TOGGLE_START_SMALLER', () => {
      const state = stateWith({ isStartSmaller: false });
      const result = goalCalculatorReducer(state, { type: 'TOGGLE_START_SMALLER' });
      expect(result.isStartSmaller).toBe(true);

      const result2 = goalCalculatorReducer(result, { type: 'TOGGLE_START_SMALLER' });
      expect(result2.isStartSmaller).toBe(false);
    });

    it('should set isAnimating on START_SIMULATION', () => {
      const state = stateWith({ activeGoal: 'christmas' });
      const scenarios = { good: 100, expected: 90, bad: 80 };
      const result = goalCalculatorReducer(state, { type: 'START_SIMULATION', result: scenarios });
      expect(result.isAnimating).toBe(true);
      expect(result.result).toEqual(scenarios);
      expect(result.screen).toBe('simulation');
    });

    it('should clear isAnimating and advance to results on FINISH_SIMULATION', () => {
      const state = stateWith({ screen: 'simulation', isAnimating: true });
      const result = goalCalculatorReducer(state, { type: 'FINISH_SIMULATION' });
      expect(result.isAnimating).toBe(false);
      expect(result.screen).toBe('results');
    });
  });

  describe('input handling', () => {
    it('should sanitize field1 input (strip non-numeric characters)', () => {
      const state = stateWith({});
      const result = goalCalculatorReducer(state, { type: 'SET_FIELD1', value: '$50,000.00abc' });
      expect(result.field1Raw).toBe('50,000.00');
    });

    it('should clamp vacation date within bounds on SET_VACATION_DATE', () => {
      const state = stateWith({});
      const pastDate = new Date(2020, 0, 1);
      const result = goalCalculatorReducer(state, { type: 'SET_VACATION_DATE', date: pastDate });
      // Past date should not update state
      expect(result.vacationDate).toBe(state.vacationDate);
    });

    it('should set isMonthlyOverridden on SET_MONTHLY_DEPOSIT', () => {
      const state = stateWith({ isMonthlyOverridden: false });
      const result = goalCalculatorReducer(state, { type: 'SET_MONTHLY_DEPOSIT', value: '200' });
      expect(result.isMonthlyOverridden).toBe(true);
      expect(result.monthlyDepositRaw).toBe('200');
    });

    it('should set risk tier index on SET_RISK_TIER', () => {
      const state = stateWith({ riskTierIndex: 0 });
      const result = goalCalculatorReducer(state, { type: 'SET_RISK_TIER', index: 2 });
      expect(result.riskTierIndex).toBe(2);
    });
  });

  describe('goal selection', () => {
    it('should navigate to goalAmount and reset fields on SELECT_GOAL', () => {
      const state = stateWith({
        screen: 'goalSelection',
        field1Raw: '50000',
        isMonthlyOverridden: true,
        isStartSmaller: true,
      });
      const result = goalCalculatorReducer(state, { type: 'SELECT_GOAL', goal: 'emergency' });
      expect(result.screen).toBe('goalAmount');
      expect(result.activeGoal).toBe('emergency');
      expect(result.field1Raw).toBe('');
      expect(result.isMonthlyOverridden).toBe(false);
      expect(result.isStartSmaller).toBe(false);
    });
  });

  describe('default case', () => {
    it('should return current state for unknown actions', () => {
      const state = stateWith({ screen: 'goalAmount' });
      // @ts-expect-error testing unknown action
      const result = goalCalculatorReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });
  });
});

describe('getNextScreen', () => {
  it('should skip timeline for christmas', () => {
    expect(getNextScreen('goalAmount', 'christmas')).toBe('depositRisk');
  });

  it('should go to timeline for emergency', () => {
    expect(getNextScreen('goalAmount', 'emergency')).toBe('timeline');
  });

  it('should go from depositRisk to simulation', () => {
    expect(getNextScreen('depositRisk', 'christmas')).toBe('simulation');
  });

  it('should go from simulation to results', () => {
    expect(getNextScreen('simulation', 'christmas')).toBe('results');
  });
});

describe('getBackScreen', () => {
  it('should go back from goalAmount to goalSelection', () => {
    expect(getBackScreen('goalAmount', 'christmas')).toBe('goalSelection');
  });

  it('should skip timeline for christmas when going back from depositRisk', () => {
    expect(getBackScreen('depositRisk', 'christmas')).toBe('goalAmount');
  });

  it('should go to timeline for emergency when going back from depositRisk', () => {
    expect(getBackScreen('depositRisk', 'emergency')).toBe('timeline');
  });
});

describe('getStepNumber', () => {
  it('should return 1 for goalSelection', () => {
    expect(getStepNumber('goalSelection', 'christmas')).toBe(1);
  });

  it('should return 3 for depositRisk in christmas (5-step flow)', () => {
    expect(getStepNumber('depositRisk', 'christmas')).toBe(3);
  });

  it('should return 4 for depositRisk in emergency (6-step flow)', () => {
    expect(getStepNumber('depositRisk', 'emergency')).toBe(4);
  });
});

describe('getTotalSteps', () => {
  it('should return 5 for christmas', () => {
    expect(getTotalSteps('christmas')).toBe(5);
  });

  it('should return 6 for emergency', () => {
    expect(getTotalSteps('emergency')).toBe(6);
  });

  it('should return 6 for vacation', () => {
    expect(getTotalSteps('vacation')).toBe(6);
  });
});
